'use client';

import React, { useState, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';

interface UploadPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  albumId: string;
  albumTitle: string;
}

export default function UploadPhotosModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  albumId, 
  albumTitle 
}: UploadPhotosModalProps) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 如果模态框不是打开状态，不渲染任何内容
  if (!isOpen) return null;

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    
    // 生成预览URL
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prevUrls => [...prevUrls, ...newPreviewUrls]);
  };

  // 移除已选择的文件
  const removeFile = (index: number) => {
    // 释放预览URL
    URL.revokeObjectURL(previewUrls[index]);
    
    // 移除文件和预览URL
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError(language === 'zh' ? '请选择至少一张照片' : 'Please select at least one photo');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // TODO: 实现文件上传逻辑
      // 这里可以使用FormData来上传文件到服务器
      const formData = new FormData();
      formData.append('album_id', albumId);
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // 模拟上传延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 成功后重置状态并关闭模态框
      setSelectedFiles([]);
      setPreviewUrls([]);
      onSuccess();
      onClose();
    } catch (err: any) {
      // 显示错误信息
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '上传照片失败，请稍后重试' : 'Failed to upload photos, please try again later')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container upload-modal">
        <div className="modal-header">
          <h2>
            <T 
              zh={`上传照片到"${albumTitle}"`}
              en={`Upload Photos to "${albumTitle}"`}
            />
          </h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
              
              <button
                type="button"
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-cloud-upload-alt"></i>
                <span>
                  <T zh="选择照片" en="Select Photos" />
                </span>
              </button>
              
              <div className="upload-info">
                <T 
                  zh="支持JPG、PNG、WebP等格式，单张照片不超过10MB" 
                  en="Supports JPG, PNG, WebP formats. Max 10MB per photo" 
                />
              </div>
            </div>
            
            {previewUrls.length > 0 && (
              <div className="preview-container">
                <h3>
                  <T 
                    zh={`已选择 ${previewUrls.length} 张照片`}
                    en={`${previewUrls.length} Photos Selected`}
                  />
                </h3>
                <div className="preview-grid">
                  {previewUrls.map((url, index) => (
                    <div className="preview-item" key={index}>
                      <img src={url} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeFile(index)}
                        title={language === 'zh' ? '移除' : 'Remove'}
                      >
                        <i className="fas fa-times"></i>
                      </button>
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
              onClick={onClose}
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
                <T zh="上传照片" en="Upload Photos" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 