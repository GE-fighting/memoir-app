import axios from 'axios';
import OSS from 'ali-oss';
import { getAuthToken } from '../auth';

/**
 * Upload file to OSS with progress tracking
 */
export async function uploadFileToOSS(
  client: OSS,
  file: File,
  objectKey: string,
  onProgress?: (p: number) => void
): Promise<string> {
  try {
    // 设置 headers
    const headers = {
      'Cache-Control': 'max-age=31536000',
    };
    
    // Use multipart upload for better performance and progress tracking
    const result = await client.multipartUpload(objectKey, file, {
      progress: (p) => {
        // Progress percentage
        const percent = Math.floor(p * 100);
        onProgress?.(percent);
      },
      headers,
    });
    
    // Return the URL of the uploaded file
    return client.signatureUrl(objectKey);
  } catch (error) {
    console.error('Error uploading file to OSS:', error);
    throw error;
  }
}

/**
 * Generate a unique object key for the file
 */
export function generateObjectKey(file: File, userId: string): string {
  const extension = file.name.split('.').pop() || '';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  
  // 添加年/月/日的路径结构
  const now = validateDate(new Date());
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Format: users/{userId}/{year}/{month}/{day}/{timestamp}-{randomString}.{extension}
  return `users/${userId}/${year}/${month}/${day}/${timestamp}-${randomString}.${extension}`;
}

/**
 * Delete file from OSS
 */
export async function deleteFileFromOSS(client: OSS, objectKey: string): Promise<void> {
  try {
    await client.delete(objectKey);
  } catch (error) {
    console.error('Error deleting file from OSS:', error);
    throw error;
  }
}

/**
 * List files by category (已废弃，为了兼容性保留)
 */
export async function listFilesByCategory(
  client: OSS,
  userId: string
): Promise<OSS.ListObjectResult> {
  const prefix = `users/${userId}/`;
    
  try {
    // @ts-ignore - ali-oss类型定义可能不准确，实际只需要一个参数
    return await client.list({
      prefix,
      'max-keys': 1000,
    });
  } catch (error) {
    console.error('Error listing files from OSS:', error);
    throw error;
  }
}

// OSS客户端类型定义
export interface OSSClientOptions {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  stsToken: string;
  secure: boolean;
  bucket: string;
  refreshSTSToken?: () => Promise<{
    accessKeyId: string;
    accessKeySecret: string;
    stsToken: string;
  }>;
}

export interface STSTokenResponse {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  region: string;
  bucket: string;
}

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
  category: string;
}

export interface FileListItem {
  name: string;
  url: string;
  lastModified: string;
  size: number;
  type: string;
  path: string;
}

// 获取STS令牌并创建OSS客户端
export const getOSSClient = async (): Promise<OSS> => {
  try {
    // 从Memoir API获取STS令牌
    const token = getAuthToken();
    const response = await axios.get<STSTokenResponse>("/api/v1/oss/token", {
      headers: {
        Authorization: `Bearer ${token}` 
      }
    });
    
    // 检查响应是否成功
    if (!response.data) {
      throw new Error("获取STS令牌失败");
    }
    
    // 使用STS令牌创建OSS客户端
    const client = new OSS({
      region: "oss-cn-nanjing",
      accessKeyId: response.data.accessKeyId,
      accessKeySecret: response.data.accessKeySecret,
      stsToken: response.data.securityToken,
      secure: true,
      bucket: response.data.bucket,
      refreshSTSToken: async () => {
        const token = getAuthToken();
        const refreshToken = await axios.get<STSTokenResponse>("/api/v1/oss/token", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        return {
          accessKeyId: refreshToken.data.accessKeyId,
          accessKeySecret: refreshToken.data.accessKeySecret,
          stsToken: refreshToken.data.securityToken,
        };
      },
    });
    
    return client;
  } catch (error) {
    console.error("初始化OSS客户端失败:", error);
    throw error;
  }
};

// 获取当前用户ID (从token中提取或从用户上下文获取)
export const getCurrentUserId = (): string => {
  // 从localStorage获取用户ID
  const userId = localStorage.getItem('userId');
  if (!userId) {
    // 尝试从token中提取
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // JWT token 的格式是 header.payload.signature
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        if (decodedPayload.sub) {
          // 找到了用户ID，保存以备将来使用
          const extractedId = decodedPayload.sub.toString();
          localStorage.setItem('userId', extractedId);
          return extractedId;
        }
      }
    } catch (error) {
      console.error('从token提取用户ID失败:', error);
    }
    
    throw new Error('未找到用户ID，请重新登录');
  }
  return userId;
};

// 验证日期是否有效（不是未来日期）
function validateDate(date: Date): Date {
  const now = new Date();
  // 如果日期是未来日期，则使用当前日期
  if (date.getTime() > now.getTime()) {
    console.warn("检测到未来日期，使用当前日期代替");
    return now;
  }
  return date;
}

// 上传文件
export const uploadFile = async (
  file: File
): Promise<UploadResult> => {
  try {
    const client = await getOSSClient();
    const userId = getCurrentUserId();
    
    // 添加年/月/日的路径结构
    const now = validateDate(new Date());
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1并补0
    const day = String(now.getDate()).padStart(2, '0'); // 日期补0
    
    // 生成唯一文件名，避免冲突
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${timestamp}-${randomString}.${fileExtension}`;
    
    // 构建OSS对象路径，使用 userId/年/月/日 作为基础路径
    const objectPath = `${userId}/${year}/${month}/${day}/${uniqueFileName}`;
    
    console.log(`开始上传文件到路径: ${objectPath}`);
    
    try {
      // 上传文件（使用浏览器中的File对象）
      const result = await client.put(objectPath, file);
      
      // 确保URL使用HTTPS协议
      let url = result.url;
      if (url && url.startsWith('http:')) {
        url = url.replace('http:', 'https:');
      }
      
      console.log(`文件上传成功，URL: ${url}`);
      
      return {
        url: url,
        name: file.name,
        size: file.size,
        type: file.type,
        category: '' // 保留字段但不再使用分类
      };
    } catch (uploadError) {
      console.error("OSS上传失败:", uploadError);
      // 记录详细信息用于调试
      if (uploadError instanceof Error) {
        console.error("错误详情:", {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack,
        });
      }
      
      // 检查OSS客户端配置
      console.log("OSS客户端配置:", {
        region: (client as any).options?.region,
        bucket: (client as any).options?.bucket,
        secure: (client as any).options?.secure,
      });
      
      throw uploadError;
    }
  } catch (error) {
    console.error("上传文件失败:", error);
    throw error;
  }
};

// 批量上传文件
export const uploadFiles = async (
  files: File[],
  onProgress?: (id: string, progress: number) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (const file of files) {
    try {
      const result = await uploadFile(file);
      results.push(result);
    } catch (error) {
      console.error(`文件 ${file.name} 上传失败:`, error);
      // 继续上传其他文件
    }
  }
  
  return results;
};

// 获取文件列表
export const listFiles = async (): Promise<FileListItem[]> => {
  try {
    const client = await getOSSClient();
    const userId = getCurrentUserId();
    
    // 构建前缀，现在只用userId作为前缀，这样可以列出所有时间段的文件
    const fullPrefix = `${userId}/`;
    
    // 调用OSS客户端的list方法，递归获取所有子目录下的文件
    // @ts-ignore - ali-oss类型定义可能不准确
    const result = await client.list({
      prefix: fullPrefix,
      'max-keys': 1000, // 增加返回数量以获取更多文件
      // 不设置delimiter，这样可以递归获取所有子目录下的文件
    });
    
    // 处理分页，如果有nextMarker表示有更多结果
    let allObjects = result.objects || [];
    let nextMarker = result.nextMarker;
    
    // 获取所有分页结果
    while (nextMarker) {
      // @ts-ignore - ali-oss类型定义可能不准确
      const nextResult = await client.list({
        prefix: fullPrefix,
        'max-keys': 1000,
        marker: nextMarker
      });
      
      if (nextResult.objects) {
        allObjects = [...allObjects, ...nextResult.objects];
      }
      
      nextMarker = nextResult.nextMarker;
    }
    
    // 转换OSS对象为文件列表项
    return allObjects.map(obj => {
      // 构造文件URL
      const bucket = (client as any).options?.bucket || '';
      const region = (client as any).options?.region || '';
      const url = obj.url || `https://${bucket}.${region}.aliyuncs.com/${obj.name}`;
      
      // 从完整路径中提取文件名
      const pathParts = obj.name.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      // 提取年月日信息（适用于新的路径格式：userId/年/月/日/文件名）
      let year = '', month = '', day = '';
      if (pathParts.length >= 5) { // userId/year/month/day/fileName
        year = pathParts[1];
        month = pathParts[2];
        day = pathParts[3];
      }
      
      return {
        name: fileName,
        url: url,
        lastModified: obj.lastModified,
        size: obj.size,
        type: fileName.endsWith('.mp4') || fileName.endsWith('.mov') ? 'video' : 'image',
        // 添加完整路径信息，方便前端解析年月日等信息
        path: obj.name
      };
    }).filter(item => {
      // 排除目录对象（以/结尾且没有文件名的条目）
      return item.name !== '';
    });
  } catch (error) {
    console.error("获取文件列表失败:", error);
    throw error;
  }
};

// 按分类获取文件 (为了保持API兼容性，但不再使用分类)
export const getFilesByCategory = async (): Promise<FileListItem[]> => {
  return listFiles();
};

// 删除文件
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const client = await getOSSClient();
    const objectName = new URL(fileUrl).pathname.substring(1); // 移除开头的斜杠
    await client.delete(objectName);
  } catch (error) {
    console.error("删除文件失败:", error);
    throw error;
  }
};