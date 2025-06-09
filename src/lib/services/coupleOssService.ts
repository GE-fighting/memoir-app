import OSS from 'ali-oss';
import { coupleMediaService } from '@/services/couple-media-service';

export interface STSTokenResponse {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  region: string;
  bucket: string;
}

/**
 * 获取情侣相册的OSS客户端
 * 使用情侣专用的STS令牌
 */
export const getCoupleOSSClient = async (): Promise<OSS> => {
  try {
    // 使用情侣服务获取STS令牌
    const response = await coupleMediaService.getCoupleSTSToken();
    
    // 使用STS令牌创建OSS客户端
    const client = new OSS({
      region: "oss-" + response.region,
      accessKeyId: response.accessKeyId,
      accessKeySecret: response.accessKeySecret,
      stsToken: response.securityToken,
      secure: true,
      bucket: response.bucket,
      refreshSTSToken: async () => {
        const refreshToken = await coupleMediaService.getCoupleSTSToken();
        return {
          accessKeyId: refreshToken.accessKeyId,
          accessKeySecret: refreshToken.accessKeySecret,
          stsToken: refreshToken.securityToken,
        };
      },
    });
    
    return client;
  } catch (error) {
    console.error("初始化情侣OSS客户端失败:", error);
    throw error;
  }
};

/**
 * 获取带有授权的情侣相册OSS对象URL
 * @param objectUrl 对象的原始URL或对象路径
 * @param expires 过期时间（秒），默认为3600秒(1小时)
 * @returns 带有授权的临时访问URL
 */
export const getCoupleSignedUrl = async (objectUrl: string, expires: number = 3600): Promise<string> => {
  try {
    const client = await getCoupleOSSClient();
    let objectName: string;
    
    // 检查是否为完整URL或仅为对象路径
    if (objectUrl.startsWith('http')) {
      // 从URL中提取对象名称
      objectName = new URL(objectUrl).pathname.substring(1); // 移除开头的斜杠
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
    console.error("获取情侣签名URL失败:", error);
    throw error;
  }
};

/**
 * 获取媒体缩略图/封面
 * 图片直接返回原URL，视频生成截帧缩略图
 * 
 * @param mediaUrl 媒体的URL
 * @param mediaType 媒体类型 'photo' 或 'video'
 * @returns 缩略图URL
 */
export const getCoupleThumbnail = async (
  mediaUrl: string, 
  mediaType: 'photo' | 'video'
): Promise<string> => {
  // 图片直接返回原URL
  if (mediaType === 'photo') {
    return mediaUrl;
  }
  
  // 视频生成缩略图
  if (mediaType === 'video') {
    try {
      // 基本参数：第一帧，宽400px，高300px，JPG格式
      let process = 'video/snapshot,t_0,f_jpg,w_400,h_300,ar_auto';
      
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