'use client';

import React, { useState, useRef, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { useAlbumUpload } from '@/lib/hooks/useAlbumUpload';
import { albumService } from '@/services/album-service';

interface UploadPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  albumId: string;
  albumTitle: string;
}

interface PreviewFile {
  url: string;
  type: 'image' | 'video';
}

export default function UploadPhotosModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  albumId, 
  albumTitle 
}: UploadPhotosModalProps) {
  const { language } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<PreviewFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successMessageRef = useRef<HTMLDivElement | null>(null);
  const [isHandlingSuccess, setIsHandlingSuccess] = useState(false);
  
  // 使用相册上传hook
  const { 
    uploadFiles, 
    cancelUpload, 
    status, 
    progress, 
    error 
  } = useAlbumUpload(albumId);
  
  // 上传状态是否为上传中
  const isLoading = status === 'uploading';
  
  // 根据状态更新UI
  useEffect(() => {
    // 上传成功后关闭模态框
    if (status === 'success' && !isHandlingSuccess) {
      setIsHandlingSuccess(true); // 标记正在处理成功状态，避免重复处理
      
      // 清理之前的成功消息（如果存在）
      if (successMessageRef.current) {
        document.body.removeChild(successMessageRef.current);
        successMessageRef.current = null;
      }
      
      // 显示成功消息
      const messageElement = document.createElement('div');
      messageElement.className = 'upload-success-message';
      messageElement.textContent = language === 'zh' ? '上传成功！' : 'Upload successful!';
      document.body.appendChild(messageElement);
      successMessageRef.current = messageElement;
      
      // 刷新相册列表以更新照片数量
      const refreshAlbums = async () => {
        try {
          // 触发外部的onSuccess回调，通知父组件更新状态
          onSuccess();
          
          // 2秒后移除消息并关闭模态框
          setTimeout(() => {
            if (successMessageRef.current) {
              document.body.removeChild(successMessageRef.current);
              successMessageRef.current = null;
            }
            setSelectedFiles([]);
            setPreviewUrls([]);
            onClose();
            setIsHandlingSuccess(false); // 重置状态处理标记
          }, 2000);
        } catch (err) {
          console.error('刷新相册列表失败:', err);
          setIsHandlingSuccess(false); // 发生错误也要重置状态处理标记
        }
      };
      
      refreshAlbums();
    } else if (status !== 'success') {
      // 如果状态不是成功，重置处理标记
      setIsHandlingSuccess(false);
    }
  }, [status, onSuccess, onClose, language, albumId, isHandlingSuccess]);
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理预览URL
      previewUrls.forEach(file => URL.revokeObjectURL(file.url));
      
      // 清理成功消息（如果存在）
      if (successMessageRef.current) {
        document.body.removeChild(successMessageRef.current);
        successMessageRef.current = null;
      }
    };
  }, [previewUrls]);

  // 如果模态框不是打开状态，不渲染任何内容
  if (!isOpen) return null;
  
  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    
    // 生成预览URL并判断文件类型
    const newPreviewUrls = files.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' as const : 'video' as const
    }));
    setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
  };

  // 移除已选择的文件
  const removeFile = (index: number) => {
    // 释放预览URL
    URL.revokeObjectURL(previewUrls[index].url);
    
    // 移除文件和预览URL
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      return;
    }

    try {
      // 上传文件到相册
      await uploadFiles(selectedFiles);
    } catch (err) {
      console.error('上传错误:', err);
    }
  };
  
  // 处理取消
  const handleCancel = () => {
    if (isLoading) {
      cancelUpload();
    }
    
    // 清理预览URL
    previewUrls.forEach(file => URL.revokeObjectURL(file.url));
    
    // 清理成功消息（如果存在）
    if (successMessageRef.current) {
      document.body.removeChild(successMessageRef.current);
      successMessageRef.current = null;
    }
    
    setSelectedFiles([]);
    setPreviewUrls([]);
    onClose();
  };
  
  // 获取文件上传进度
  const getFileProgress = (index: number): number => {
    const fileIds = Object.keys(progress);
    if (fileIds.length <= index) return 0;
    return progress[fileIds[index]] || 0;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container upload-modal">
        <div className="modal-header">
          <h2>
            <T 
              zh={`上传照片/视频到"${albumTitle}"`}
              en={`Upload Photos/Videos to "${albumTitle}"`}
            />
          </h2>
          <button className="close-button" onClick={handleCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error.message}</div>}
            
            <div className="upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              
              <button
                type="button"
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                <span>
                  <T zh="选择照片/视频" en="Select Photos/Videos" />
                </span>
              </button>
              
              <div className="upload-info">
                <T 
                  zh="支持JPG、PNG、WebP等图片格式和MP4、WebM等视频格式，单个文件不超过10MB" 
                  en="Supports JPG, PNG, WebP image formats and MP4, WebM video formats. Max 10MB per file" 
                />
                <div className="upload-note">
                  <T 
                    zh="上传成功后相册将自动更新" 
                    en="Album will update automatically after successful upload" 
                  />
                </div>
              </div>
            </div>
            
            {previewUrls.length > 0 && (
              <div className="preview-container">
                <h3>
                  <T 
                    zh={`已选择 ${previewUrls.length} 个文件`}
                    en={`${previewUrls.length} Files Selected`}
                  />
                </h3>
                <div className="preview-grid">
                  {previewUrls.map((preview, index) => (
                    <div className="preview-item" key={index}>
                      {preview.type === 'image' ? (
                        <img src={preview.url} alt={`Preview ${index + 1}`} />
                      ) : (
                        <video src={preview.url} controls={false} muted={true} />
                      )}
                      {isLoading && (
                        <div className="upload-progress">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${getFileProgress(index)}%` }}
                          ></div>
                          <span className="progress-text">{getFileProgress(index)}%</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeFile(index)}
                        title={language === 'zh' ? '移除' : 'Remove'}
                        disabled={isLoading}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      {preview.type === 'video' && (
                        <div className="video-indicator">
                          <i className="fas fa-video"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              <T zh="取消" en="Cancel" />
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoading || selectedFiles.length === 0}
            >
              {isLoading ? (
                <span>
                  <i className="fas fa-spinner fa-spin"></i> 
                  <T zh="上传中..." en="Uploading..." />
                </span>
              ) : (
                <T zh="上传文件" en="Upload Files" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 