import { useState, useRef, useCallback } from 'react';
import OSS from 'ali-oss';
import { CreateCoupleMediaWithURLParams, coupleMediaService } from '@/services/couple-media-service';
import { uploadFileToOSS, getMediaThumbnail } from '@/lib/services/ossService';
import { MediaType } from '@/services/api-types';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';

interface UploadProgress {
  [fileId: string]: number;
}

export interface UploadError {
  fileId?: string;
  fileName?: string;
  message: string;
}

export interface AlbumUploadResult {
  url: string;
  name: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
}

export const useAlbumUpload = (albumId: string) => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<UploadError | null>(null);
  const abortController = useRef(new AbortController());
  const ossClient = useRef<OSS | null>(null);
  
  // 重置状态
  const resetState = useCallback(() => {
    setStatus('idle');
    setProgress({});
    setError(null);
  }, []);
  
  // 初始化OSS客户端
  const initOSSClient = useCallback(async () => {
    try {
      // 获取STS令牌
      const stsResponse = await coupleMediaService.getCoupleSTSToken();
      
      // 创建OSS客户端
      const client = new OSS({
        region: "oss-" + stsResponse.region,
        accessKeyId: stsResponse.accessKeyId,
        accessKeySecret: stsResponse.accessKeySecret,
        stsToken: stsResponse.securityToken,
        secure: true,
        bucket: stsResponse.bucket,
        refreshSTSToken: async () => {
          const refreshToken = await coupleMediaService.getCoupleSTSToken();
          return {
            accessKeyId: refreshToken.accessKeyId,
            accessKeySecret: refreshToken.accessKeySecret,
            stsToken: refreshToken.securityToken,
          };
        },
      });
      
      ossClient.current = client;
      return client;
    } catch (error) {
      console.error('初始化OSS客户端失败:', error);
      throw error;
    }
  }, []);
  
  // 生成文件的对象键
  const generateObjectKey = useCallback((file: File): string => {
    const extension = file.name.split('.').pop() || '';
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // 添加年/月/日的路径结构
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 获取coupleID，如果不存在则使用默认值
    const coupleID = typeof window !== 'undefined' ? localStorage.getItem('coupleID') || 'default' : 'default';
    
    // Format: couples/{coupleID}/{year}/{month}/{day}/{timestamp}-{randomString}.{extension}
    return `${coupleID}/${year}/${month}/${day}/${timestamp}-${randomString}.${extension}`;
  }, []);
  
  // 上传单个文件
  const uploadFile = useCallback(async (file: File, fileId: string): Promise<AlbumUploadResult> => {
    try {
      // 确保OSS客户端已初始化
      const client = ossClient.current || await initOSSClient();
      
      // 生成对象键
      const objectKey = generateObjectKey(file);
      
      // 更新进度
      const updateProgress = (p: number) => {
        setProgress(prev => ({ ...prev, [fileId]: p }));
      };
      
      // 上传文件
      const url = await uploadFileToOSS(client, file, objectKey, updateProgress);
      
      // 判断媒体类型
      const isImage = file.type.startsWith('image/');
      const mediaType = isImage ? 'image' : 'video';
      
      // 生成缩略图
      let thumbnailUrl = '';
      try {
        thumbnailUrl = await getMediaThumbnail(
          url,
          mediaType,
          !isImage ? { mode: 'fast' } : {}
        );
      } catch (thumbErr) {
        console.error('生成缩略图失败:', thumbErr);
      }
      
      return {
        url,
        name: file.name,
        size: file.size,
        type: file.type,
        thumbnailUrl
      };
    } catch (error) {
      console.error(`上传文件失败: ${file.name}`, error);
      throw error;
    }
  }, [albumId, initOSSClient, generateObjectKey]);
  
  // 上传多个文件
  const uploadFiles = useCallback(async (files: File[]): Promise<AlbumUploadResult[]> => {
    try {
      resetState();
      setStatus('uploading');
      abortController.current = new AbortController();
      
      const fileMap: { [id: string]: File } = {};
      
      // 为每个文件创建ID并初始化进度
      files.forEach(file => {
        const id = Math.random().toString(36).substring(2, 9);
        fileMap[id] = file;
        setProgress(prev => ({ ...prev, [id]: 0 }));
      });
      
      const results: AlbumUploadResult[] = [];
      const fileIds = Object.keys(fileMap);
      
      // 上传文件并保存到相册
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i];
        const file = fileMap[fileId];
        
        if (abortController.current.signal.aborted) {
          throw new Error('上传已取消');
        }
        
        try {
          // 上传文件到OSS
          const uploadResult = await uploadFile(file, fileId);
          
          // 保存媒体信息到相册
          const isImage = file.type.startsWith('image/');
          const mediaParams: CreateCoupleMediaWithURLParams = {
            album_id: albumId,
            media_type: isImage ? MediaType.PHOTO : MediaType.VIDEO,
            title: file.name,
            media_url: uploadResult.url,
            thumbnail_url: uploadResult.thumbnailUrl || '',
          };
          
          // 调用API保存媒体信息
          await coupleMediaService.createCoupleMediaWithURL(mediaParams);
          
          results.push(uploadResult);
        } catch (error) {
          if (abortController.current.signal.aborted) {
            break;
          }
          
          setError({
            fileId,
            fileName: file.name,
            message: error instanceof Error ? error.message : '上传失败'
          });
        }
      }
      
      if (results.length === files.length) {
        setStatus('success');
      } else if (results.length > 0) {
        setStatus('success'); // 部分成功也算成功
      } else {
        setStatus('error');
      }
      
      return results;
    } catch (err) {
      setStatus('error');
      setError({
        message: err instanceof Error ? err.message : '上传失败'
      });
      throw err;
    }
  }, [albumId, resetState, uploadFile]);
  
  // 取消上传
  const cancelUpload = useCallback(() => {
    abortController.current.abort();
    setStatus('cancelled');
  }, []);
  
  return {
    uploadFiles,
    cancelUpload,
    resetState,
    status,
    progress,
    error
  };
}; 