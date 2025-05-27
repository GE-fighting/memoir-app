'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { useOSSUpload } from '@/lib/hooks/useOSSUpload';
import { getMediaThumbnail } from '@/lib/services/ossService';
import { mediaService } from '@/services/personal-media-service';

// 文件上传项类型
type UploadItem = {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
  progress: number;
  status: 'waiting' | 'uploading' | 'success' | 'error';
  error?: string;
};

export default function MediaUpload({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 使用OSS上传hook
  const { 
    uploadFiles, 
    cancelUpload, 
    progress, 
    status, 
    error: uploadError 
  } = useOSSUpload();
  
  // 上传状态是否为上传中
  const isUploading = status === 'uploading';
  
  // 根据hook中的progress更新上传进度
  useEffect(() => {
    if (Object.keys(progress).length === 0) return;
    
    setUploadItems(prevItems => 
      prevItems.map(item => {
        const currentProgress = progress[item.id];
        if (currentProgress !== undefined) {
          return {
            ...item,
            progress: currentProgress,
            status: currentProgress === 100 ? 'success' : 'uploading'
          };
        }
        return item;
      })
    );
  }, [progress]);
  
  // 根据hook的status更新整体状态
  useEffect(() => {
    // 上传成功时关闭模态窗
    if (status === 'success') {
      setTimeout(() => {
        onClose();
      }, 1000); // 稍等一下让用户看到上传完成的状态
    }
    
    // 显示错误消息
    if (status === 'error' && uploadError) {
      console.error('上传错误:', uploadError);
      // 可以选择显示错误消息或由组件自己处理
    }
  }, [status, uploadError, onClose]);
  
  // 选择文件
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles: UploadItem[] = Array.from(e.target.files).map(file => {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      return {
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type,
        progress: 0,
        status: 'waiting',
      };
    });
    
    setUploadItems(prev => [...prev, ...newFiles]);
    
    // 重置文件输入框
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 移除文件
  const removeFile = (id: string) => {
    setUploadItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      
      // 释放预览URL内存
      const removedItem = prev.find(item => item.id === id);
      if (removedItem) {
        URL.revokeObjectURL(removedItem.preview);
      }
      
      return filtered;
    });
  };
  
  // 上传文件
  const handleUpload = async () => {
    if (uploadItems.length === 0 || isUploading) return;
    
    try {
      // 将所有项标记为上传中
      setUploadItems(prev => prev.map(item => ({
        ...item,
        status: 'uploading',
      })));
      
      // 开始上传
      const filesMap = uploadItems.reduce((map, item) => {
        map[item.id] = item.file;
        return map;
      }, {} as Record<string, File>);
      
      // 调用hook中的上传方法
      const uploadResults = await uploadFiles(Object.values(filesMap));
      
      // 如果上传成功，将媒体信息保存到数据库
      if (uploadResults && uploadResults.length > 0) {
        try {
          // 保存每个媒体信息
          for (const result of uploadResults) {
            // 判断媒体类型
            const isVideo = result.type.startsWith('video/');
            const mediaType = isVideo ? 'video' : 'image';
            
            try {     
              // 生成缩略图
              const thumbnailUrl = await getMediaThumbnail(
                result.url,
                mediaType,
                isVideo ? { mode: 'fast' } : {}
              );
              
              // 保存媒体信息
              await mediaService.createPersonalMediaWithURL({
                media_type: isVideo ? 'video' : 'photo',
                title: result.name,
                media_url: result.url,
                thumbnail_url: thumbnailUrl,
              });
            } catch (error: any) {
              console.error('媒体处理失败:', error);
              throw new Error(`${result.name} 处理失败: ${error.message || '未知错误'}`);
            }
          }
          
          // 上传成功，通知父组件
          onClose?.();
        } catch (err) {
          console.error('保存媒体信息失败:', err);
          // 显示错误提示
          setUploadItems(prev => prev.map(item => ({
            ...item,
            status: 'error',
            error: err instanceof Error ? err.message : '保存媒体信息失败',
          })));
        }
      }
    } catch (err) {
      console.error('上传错误:', err);
      
      // 标记所有为错误
      setUploadItems(prev => prev.map(item => ({
        ...item,
        status: 'error',
        error: err instanceof Error ? err.message : '未知错误',
      })));
    }
  };
  
  // 取消上传和关闭模态窗
  const handleCancel = () => {
    if (isUploading) {
      // 取消正在进行的上传
      cancelUpload();
    }
    
    // 清理预览URL
    uploadItems.forEach(item => {
      URL.revokeObjectURL(item.preview);
    });
    
    onClose();
  };

  return (
    <div className="upload-container p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="upload-header flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          <T zh="上传媒体" en="Upload Media" />
        </h2>
        <button 
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="file-input mb-6">
        <label className="block text-sm font-medium mb-2">
          <T zh="选择文件" en="Select Files" />
        </label>
        <div className="flex items-center">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept="image/*,video/*"
            disabled={isUploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary bg-accent hover:bg-accent/90 text-white mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
          >
            <i className="fas fa-plus mr-2"></i>
            <T zh="添加文件" en="Add Files" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <T 
              zh={`已选择 ${uploadItems.length} 个文件`} 
              en={`${uploadItems.length} files selected`}
            />
          </span>
        </div>
      </div>
      
      {uploadItems.length > 0 && (
        <div className="preview-container mb-6">
          <h3 className="text-lg font-medium mb-3">
            <T zh="预览" en="Preview" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadItems.map(item => (
              <div 
                key={item.id} 
                className="relative border rounded-md overflow-hidden group"
              >
                {item.type === 'image' ? (
                  <img 
                    src={item.preview} 
                    alt="Preview" 
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                    <video 
                      src={item.preview} 
                      className="w-full h-32 object-cover"
                      controls
                    />
                  </div>
                )}
                
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-full px-4">
                      <div className="w-full bg-gray-300 rounded-full h-2.5">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full" 
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-white text-center mt-1 text-sm">
                        {item.progress}%
                      </p>
                    </div>
                  </div>
                )}
                
                {item.status === 'success' && (
                  <div className="absolute inset-0 bg-green-500 bg-opacity-50 flex items-center justify-center">
                    <i className="fas fa-check text-white text-2xl"></i>
                  </div>
                )}
                
                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center">
                    <i className="fas fa-exclamation-circle text-white text-2xl"></i>
                  </div>
                )}
                
                <button
                  onClick={() => removeFile(item.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
                
                <div className="p-2">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 错误提示 */}
      {uploadError && (
        <div className="error-message mb-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-700">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          {uploadError.message}
        </div>
      )}
      
      <div className="actions flex justify-end">
        <button
          onClick={handleCancel}
          className="btn border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 py-2 px-4 rounded-md mr-2 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <T zh="取消" en="Cancel" />
        </button>
        <button
          onClick={handleUpload}
          className="btn btn-primary bg-accent hover:bg-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUploading || uploadItems.length === 0}
        >
          {isUploading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              <T zh="上传中..." en="Uploading..." />
            </>
          ) : (
            <>
              <i className="fas fa-cloud-upload-alt mr-2"></i>
              <T zh="上传" en="Upload" />
            </>
          )}
        </button>
      </div>
    </div>
  );
} 