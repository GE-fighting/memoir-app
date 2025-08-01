import OSS from 'ali-oss';
import { apiClient } from '@/services/api-client';
import { getPersonalSTSToken } from './stsTokenCache';

/**
 * 全局OSS配置选项
 */
export const OSSConfig = {
  /**
   * 是否启用CORS验证
   * 如果设置为false，则不会执行CORS验证
   * 当已知OSS配置正确且能正常上传大文件时，可以禁用此选项
   */
  enableCORSValidation: false,
  
  /**
   * 是否启用详细日志记录
   * 如果设置为true，将记录详细的上传过程和返回结果
   * 生产环境建议设置为false
   */
  enableDebugLogging: true
};

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
    
    // 文件大小阈值，超过此值使用分片上传（50MB）
    const MULTIPART_THRESHOLD = 10 * 1024 * 1024;
    
    // 如果文件较小，使用简单上传
    if (file.size < MULTIPART_THRESHOLD) {
      if (onProgress) {
        // 模拟上传开始
        onProgress(0);
      }
      
      const result = await client.put(objectKey, file, {
        headers,
        timeout: 120000 // 增加超时时间到120秒
      });
      
      if (onProgress) {
        // 模拟上传完成
        onProgress(100);
      }
      
      // 返回上传后的URL
      let url = result.url;
      if (OSSConfig.enableDebugLogging) {
        console.log('简单上传的result', result);
        console.log('上传后的url为', url);
      }
      if (!url) {
        // 使用类型断言访问client.options
        const ossOptions = (client as any).options;
        url = `https://${ossOptions.bucket}.${ossOptions.endpoint}/${objectKey}`;
      }
      return url;
    } 
    // 大文件使用分片上传
    else {
      // 分片大小，1MB
      const partSize = 1 * 1024 * 1024;
      
      try {
        const result = await client.multipartUpload(objectKey, file, {
          parallel: 5, // 并行上传分片数
          partSize, // 分片大小
          timeout: 120000, // 超时时间
          headers,
          progress: (p) => {
            if (onProgress) {
              // 转换为百分比并四舍五入到整数
              const percent = Math.round(p * 100);
              onProgress(percent);
            }
          }
        });

        // 记录更详细的日志以便调试
        if (OSSConfig.enableDebugLogging) {
          console.log('分片上传的result', result);
          if (result.res) {
            console.log('分片上传的result.res', result.res);
          }
        }
        
        // 更健壮地获取上传后的URL
        let url = '';
        
        // 尝试从requestUrls获取URL
        try {
          const requestUrls = result.res && (result.res as any).requestUrls;
          if (requestUrls && Array.isArray(requestUrls) && requestUrls.length > 0) {
            url = requestUrls[0];
          }
        } catch (err) {
          console.warn('从requestUrls获取URL失败:', err);
        }
        
        // 尝试从result.url获取
        if (!url && (result as any).url) {
          url = (result as any).url;
        }
        
        // 如果上述方法都失败，或URL包含uploadId参数，则构造一个干净的URL
        if (!url || url.includes('?uploadId=')) {
          // 使用类型断言访问client.options
          const ossOptions = (client as any).options;
          console.log('ossOptions', ossOptions);
          if (ossOptions && ossOptions.bucket && ossOptions.endpoint) {
            url = `https://${ossOptions.bucket}.${ossOptions.endpoint.host}/${objectKey}`;
          } else {
            console.warn('无法从client.options获取bucket或endpoint');
            // 最后的后备方案 - 尝试从结果中提取路径构造URL
            if (result.name) {
              const bucket = (client as any).options?.bucket || 'unknown-bucket';
              const endpoint = (client as any).options?.endpoint?.host || 'oss-cn-nanjing.aliyuncs.com';
              url = `https://${bucket}.${endpoint}/${result.name}`;
            } else {
              console.error('无法构建有效的URL');
              throw new Error('无法获取有效的文件URL');
            }
          }
        }
        return url;
      } catch (err) {
        // 检查是否是ETag相关错误
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        if (errorMessage.includes('etag of expose-headers') || 
            errorMessage.includes('ETag') || 
            errorMessage.includes('Failed to upload some parts')) {
          console.error('分片上传错误，可能是OSS的CORS配置问题:', errorMessage);
          
          // 抛出更友好的错误信息，包含解决方案链接
          throw new Error(
            `上传失败：OSS的CORS配置需要包含ETag在expose-headers中。\n` +
            `请参考文档：docs/oss-cors-config.md 或 https://help.aliyun.com/document_detail/32069.html\n` +
            `原始错误: ${errorMessage}`
          );
        }
        
        // 重新抛出其他错误
        throw err;
      }
    }
  } catch (err) {
    console.error('上传文件到OSS失败:', err);
    throw err;
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
  id?: string;  // 添加可选的id字段，用于媒体文件标识
  name: string;
  url: string;
  lastModified: string;
  size: number;
  type: string;
  path: string;
  originalUrl?: string; // 原始未签名的URL，用于需要重新获取签名时使用
  thumbnail_url?: string; // 缩略图URL，用于视频封面或图片预览
}

// 获取STS令牌并创建OSS客户端
export const getOSSClient = async (): Promise<OSS> => {
  try {
    // 使用缓存服务获取STS令牌
    const stsToken = await getPersonalSTSToken();
    
    // 使用STS令牌创建OSS客户端
    const client = new OSS({
      region: "oss-" + stsToken.region,
      accessKeyId: stsToken.accessKeyId,
      accessKeySecret: stsToken.accessKeySecret,
      stsToken: stsToken.securityToken,
      secure: true,
      bucket: stsToken.bucket,
      timeout: 120000, // 增加默认超时时间到120秒
      refreshSTSToken: async () => {
        // 当令牌需要刷新时，使用缓存服务获取新令牌
        const refreshToken = await getPersonalSTSToken();
        return {
          accessKeyId: refreshToken.accessKeyId,
          accessKeySecret: refreshToken.accessKeySecret,
          stsToken: refreshToken.securityToken,
        };
      },
    });
    
    return client;
  } catch (error) {
    console.error("初始化OSS客户端失败:", error);
    throw error;
  }
};

// 获取当前用户ID (从localStorage获取)
export const getCurrentUserId = (): string => {
  try {
    // 从localStorage获取用户ID
    const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;
    console.log('getCurrentUserId获取到:', userId);
    
    if (!userId) {
      // 返回默认值而非抛出错误
      console.warn('未找到用户ID，使用默认值');
      return 'user-default';
    }
    return userId;
  } catch (e) {
    console.error('获取用户ID时出错:', e);
    return 'user-error';
  }
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
export const uploadFile = async (file: File): Promise<UploadResult> => {
  try {
    // 调试日志
    console.log('上传前localStorage中的userId:', localStorage.getItem('userId'));
    
    const client = await getOSSClient();
    let userId;
    try {
      userId = getCurrentUserId();
      console.log('获取到的userId:', userId, typeof userId);
    } catch (error) {
      console.error('获取userId出错:', error);
      userId = 'default'; // 临时使用默认值而非undefined
    }
    
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
      // 使用改进的上传函数，支持大文件分片上传
      const url = await uploadFileToOSS(client, file, objectPath);
      
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
    // @ts-expect-error - ali-oss类型定义可能不准确
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
      // @ts-expect-error - ali-oss类型定义可能不准确
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
        id: obj.name,
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
    let objectName: string;
    
    try {
      objectName = new URL(fileUrl).pathname.substring(1); // 移除开头的斜杠
    } catch (error) {
      console.error('无效的URL格式:', fileUrl, error);
      // 使用简单的字符串处理作为后备方案
      // 移除协议部分
      const withoutProtocol = fileUrl.replace(/^https?:\/\/[^\/]+\//, '');
      // 移除查询参数
      objectName = withoutProtocol.split('?')[0];
      console.log('后备处理后的objectName:', objectName);
    }
    
    await client.delete(objectName);
  } catch (error) {
    console.error("删除文件失败:", error);
    throw error;
  }
};

/**
 * 获取带有授权的OSS对象URL
 * @param objectUrl 对象的原始URL或对象路径
 * @param expires 过期时间（秒），默认为3600秒(1小时)
 * @returns 带有授权的临时访问URL
 */
export const getSignedUrl = async (objectUrl: string, expires: number = 3600): Promise<string> => {
  try {
    const client = await getOSSClient();
    let objectName: string;
    
    // 检查是否为完整URL或仅为对象路径
    if (objectUrl.startsWith('http')) {
      // 从URL中提取对象名称
      try {
        objectName = new URL(objectUrl).pathname.substring(1); // 移除开头的斜杠
      } catch (error) {
        console.error('无效的URL格式:', objectUrl, error);
        // 使用简单的字符串处理作为后备方案
        // 移除协议部分
        const withoutProtocol = objectUrl.replace(/^https?:\/\/[^\/]+\//, '');
        // 移除查询参数
        objectName = withoutProtocol.split('?')[0];
        console.log('后备处理后的objectName:', objectName);
      }
    } else {
      // 直接使用作为对象路径
      objectName = objectUrl;
    }
    
    // 检查是否有处理参数
    if (objectUrl.includes('x-oss-process=')) {
      const processMatch = objectUrl.match(/x-oss-process=([^&]+)/);
      const processParam = processMatch ? processMatch[1] : '';
      
      if (processParam) {
        // 将处理参数添加到签名请求中
        const signedUrl = client.signatureUrl(objectName, {
          expires,
          process: decodeURIComponent(processParam),
          response: {
            'content-disposition': 'inline'
          }
        });
        return signedUrl;
      }
    }
    
    // 生成带签名的URL，设置过期时间
    const signedUrl = client.signatureUrl(objectName, {
      expires,
      response: {
        'content-disposition': 'inline' // 允许在浏览器中直接查看
      }
    });
    
    return signedUrl;
  } catch (error) {
    console.error("获取签名URL失败:", error);
    throw error;
  }
};

/**
 * 获取媒体缩略图/封面
 * 图片直接返回原URL，视频生成截帧缩略图
 * 
 * @param mediaUrl 媒体的URL
 * @param mediaType 媒体类型 'video' 或 'image'
 * @param options 截帧选项
 * @returns 缩略图URL
 */
export const getMediaThumbnail = async (
  mediaUrl: string, 
  mediaType: 'video' | 'image',
  options: {
    mode?: 'fast';       // 视频：截帧模式，fast为关键帧模式
  } = {}
): Promise<string> => {
  // 图片直接返回原URL
  if (mediaType === 'image') {
    return mediaUrl;
  }
  
  // 视频生成缩略图
  if (mediaType === 'video') {
    try {
      // 基本参数：第一帧，宽400px，高300px，JPG格式
      let process = 'video/snapshot,t_0,f_jpg,w_400,h_300';
      
      // 添加快速模式参数
      if (options.mode === 'fast') {
        process += ',m_fast';
      }
      
      // 自动旋转
      process += ',ar_auto';
      
      // 生成缩略图URL
      const baseUrl = mediaUrl.split('?')[0];
      const thumbnailUrl = `${baseUrl}?x-oss-process=${encodeURIComponent(process)}`;
      
      // 直接返回缩略图URL (不再进行签名处理，而是在使用时获取签名)
      return thumbnailUrl;
    } catch (error) {
      console.error("获取视频缩略图失败:", error);
      throw new Error("无法生成视频缩略图");
    }
  }
  
  throw new Error(`不支持的媒体类型: ${mediaType}`);
};