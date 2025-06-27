import { useState, useRef, useCallback } from 'react';
import { uploadFile as ossUploadFile, uploadFileToOSS, getOSSClient, OSSConfig } from '../services/ossService';
import { validateOSSConfig } from '../services/ossConfigValidator';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';

interface UploadProgress {
  [fileId: string]: number;
}

interface UploadError {
  message: string;
  fileName?: string;
}

export const useOSSUpload = () => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<UploadError | null>(null);
  const abortController = useRef(new AbortController());
  
  // 重置状态
  const resetState = useCallback(() => {
    setStatus('idle');
    setProgress({});
    setError(null);
  }, []);
  
  // 上传单个文件，带进度跟踪
  const uploadFile = useCallback(async (file: File) => {
    try {
      setStatus('uploading');
      const fileId = Math.random().toString(36).substring(2, 9);
      setProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      // 获取OSS客户端
      const client = await getOSSClient();
      
      // 验证OSS配置（如果启用）
      if (OSSConfig.enableCORSValidation) {
        try {
          const validationResult = await validateOSSConfig(client);
          if (!validationResult.success) {
            console.warn('OSS配置可能存在问题，可能影响上传功能:', validationResult.issues);
          }
        } catch (validationError) {
          console.error('验证OSS配置时出错:', validationError);
          // 继续使用客户端，不中断流程
        }
      }
      
      // 生成对象键（路径）
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop() || '';
      const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') || 'default' : 'default';
      
      // 添加年/月/日的路径结构
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      const objectKey = `${userId}/${year}/${month}/${day}/${timestamp}-${randomString}.${fileExtension}`;
      
      // 更新进度的回调函数
      const updateProgress = (p: number) => {
        setProgress(prev => ({ ...prev, [fileId]: p }));
      };
      
      // 使用改进的uploadFileToOSS函数上传文件
      const url = await uploadFileToOSS(client, file, objectKey, updateProgress);
      
      // 设置为完成
      setProgress(prev => ({ ...prev, [fileId]: 100 }));
      setStatus('success');
      
      return {
        url,
        name: file.name,
        size: file.size,
        type: file.type,
        category: ''
      };
    } catch (err) {
      setStatus('error');
      setError({
        message: err instanceof Error ? err.message : '上传失败',
        fileName: file.name
      });
      throw err;
    }
  }, []);
  
  // 上传多个文件
  const uploadFiles = useCallback(async (files: File[]) => {
    try {
      resetState();
      setStatus('uploading');
      abortController.current = new AbortController();
      
      const results = [];
      
      for (const file of files) {
        if (abortController.current.signal.aborted) {
          throw new Error('上传已取消');
        }
        
        try {
          const result = await uploadFile(file);
          results.push(result);
        } catch (error) {
          console.error(`文件 ${file.name} 上传失败:`, error);
          // 继续上传其他文件
        }
      }
      
      if (results.length > 0) {
        setStatus('success');
      } else {
        setStatus('error');
        setError({ message: '所有文件上传失败' });
      }
      
      return results;
    } catch (error) {
      setStatus('error');
      setError({
        message: error instanceof Error ? error.message : '上传失败'
      });
      throw error;
    }
  }, [uploadFile, resetState]);
  
  // 取消上传
  const cancelUpload = useCallback(() => {
    abortController.current.abort();
    setStatus('cancelled');
  }, []);
  
  return {
    uploadFile,
    uploadFiles,
    cancelUpload,
    status,
    progress,
    error,
    resetState
  };
}; 