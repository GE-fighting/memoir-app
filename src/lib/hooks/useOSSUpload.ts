import { useState, useRef, useCallback } from 'react';
import { uploadFile as ossUploadFile } from '../services/ossService';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'cancelled';

interface UploadProgress {
  [fileId: string]: number;
}

export interface UploadError {
  fileId?: string;
  fileName?: string;
  message: string;
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
      
      // 模拟进度更新（实际OSS SDK可能不直接提供进度回调）
      const updateInterval = setInterval(() => {
        setProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress < 95) {
            return { ...prev, [fileId]: currentProgress + 5 };
          }
          return prev;
        });
      }, 200);
      
      try {
        const result = await ossUploadFile(file);
        clearInterval(updateInterval);
        
        // 设置为完成
        setProgress(prev => ({ ...prev, [fileId]: 100 }));
        return result;
      } catch (err) {
        clearInterval(updateInterval);
        throw err;
      }
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
      
      const fileMap: { [id: string]: File } = {};
      
      // 为每个文件创建ID并初始化进度
      files.forEach(file => {
        const id = Math.random().toString(36).substring(2, 9);
        fileMap[id] = file;
        setProgress(prev => ({ ...prev, [id]: 0 }));
      });
      
      const results = [];
      const fileIds = Object.keys(fileMap);
      
      for (let i = 0; i < fileIds.length; i++) {
        const fileId = fileIds[i];
        const file = fileMap[fileId];
        
        if (abortController.current.signal.aborted) {
          throw new Error('上传已取消');
        }
        
        try {
          // 模拟进度更新
          const updateInterval = setInterval(() => {
            if (!abortController.current.signal.aborted) {
              setProgress(prev => {
                const currentProgress = prev[fileId] || 0;
                if (currentProgress < 95) {
                  return { ...prev, [fileId]: currentProgress + 5 };
                }
                return prev;
              });
            }
          }, 200);
          
          const result = await ossUploadFile(file);
          clearInterval(updateInterval);
          
          // 设置为完成
          setProgress(prev => ({ ...prev, [fileId]: 100 }));
          results.push(result);
        } catch (error) {
          if (abortController.current.signal.aborted) {
            break;
          }
          
          console.error(`文件上传失败: ${file.name}`, error);
          setError({
            fileId,
            fileName: file.name,
            message: error instanceof Error ? error.message : '上传失败'
          });
          
          // 继续上传其他文件
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
  }, [resetState]);
  
  // 取消上传
  const cancelUpload = useCallback(() => {
    abortController.current.abort();
    setStatus('cancelled');
  }, []);
  
  return {
    uploadFile,
    uploadFiles,
    cancelUpload,
    resetState,
    status,
    progress,
    error
  };
}; 