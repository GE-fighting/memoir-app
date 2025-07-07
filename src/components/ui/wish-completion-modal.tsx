'use client';

import React, { useState, useRef, useEffect } from 'react';
import { T, useLanguage } from '../LanguageContext';
import { useOSSUpload } from '@/lib/hooks/useOSSUpload';
import { getCoupleSTSToken } from '@/lib/services/stsTokenCache';
import { attachmentService } from '@/services/attachment-service';
import { wishlistService } from '@/services/wishlist-service';
import { WishlistItem, Attachment } from '@/services/api-types';

interface WishCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  wishItem: WishlistItem | null;
}

interface PreviewFile {
  id: string; // 唯一标识
  file: File;
  url: string;
  type: 'image' | 'video';
}

export function useWishCompletionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWish, setSelectedWish] = useState<WishlistItem | null>(null);

  const openModal = (wishItem: WishlistItem) => {
    setSelectedWish(wishItem);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedWish(null);
  };

  const WishCompletionModalComponent = (
    <WishCompletionModal
      isOpen={isOpen}
      onClose={closeModal}
      onSuccess={() => {
        closeModal();
      }}
      wishItem={selectedWish}
    />
  );

  return { openModal, closeModal, WishCompletionModalComponent };
}

export default function WishCompletionModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  wishItem 
}: WishCompletionModalProps) {
  const { language } = useLanguage();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const successMessageRef = useRef<HTMLDivElement | null>(null);
  
  // 最大文件数限制
  const MAX_FILES = 5;
  
  // 使用OSS上传hook
  const { 
    uploadFiles, 
    status, 
    progress, 
    resetState 
  } = useOSSUpload();
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理所有预览URL
      previewUrls.forEach(item => {
        URL.revokeObjectURL(item.url);
      });
      
      // 清理成功消息（如果存在）
      if (successMessageRef.current) {
        document.body.removeChild(successMessageRef.current);
        successMessageRef.current = null;
      }
    };
  }, [previewUrls]);

  // 如果模态框不是打开状态，不渲染任何内容
  if (!isOpen || !wishItem) return null;
  
  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // 将FileList转换为数组并与现有文件合并
    const newFiles = Array.from(e.target.files);
    
    // 检查文件总数是否超过限制
    if (selectedFiles.length + newFiles.length > MAX_FILES) {
      setError(language === 'zh' 
        ? `最多只能上传${MAX_FILES}个文件` 
        : `You can upload maximum ${MAX_FILES} files`);
      return;
    }
    
    // 添加新的文件到选择列表
    const updatedFiles = [...selectedFiles, ...newFiles];
    setSelectedFiles(updatedFiles);
    
    // 为每个新文件生成预览URL
    const newPreviews = newFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file: file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' as const : 'video' as const
    }));
    
    // 更新预览URL列表
    setPreviewUrls([...previewUrls, ...newPreviews]);
    
    // 清除input的值，允许选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除特定文件
  const removeFile = (previewId: string) => {
    // 找到要移除的预览项
    const previewToRemove = previewUrls.find(p => p.id === previewId);
    if (!previewToRemove) return;
    
    // 释放预览URL
    URL.revokeObjectURL(previewToRemove.url);
    
    // 更新预览列表
    const updatedPreviews = previewUrls.filter(p => p.id !== previewId);
    setPreviewUrls(updatedPreviews);
    
    // 更新文件列表
    const updatedFiles = selectedFiles.filter(f => {
      // 匹配文件名和大小，因为File对象是不同的实例
      return !(f.name === previewToRemove.file.name && f.size === previewToRemove.file.size);
    });
    setSelectedFiles(updatedFiles);
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError(language === 'zh' ? '请选择至少一个文件' : 'Please select at least one file');
      return;
    }

    if (!wishItem || !wishItem.couple_id) {
      setError(language === 'zh' ? '心愿信息不完整' : 'Wish information is incomplete');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // 批量上传文件到OSS
      const uploadResults = await uploadFiles(selectedFiles);
      
      if (!uploadResults || uploadResults.length === 0) {
        throw new Error(language === 'zh' ? '上传失败' : 'Upload failed');
      }
      
      // 为每个上传成功的文件创建附件记录
      const attachmentPromises = uploadResults.map(result => {
        if (!result || !result.url) return null;
        
        return attachmentService.createAttachment({
          file_name: result.name,
          file_type: result.type,
          file_size: result.size,
          url: result.url,
          couple_id: wishItem.couple_id,
          space_type: 'couple'
        });
      });
      
      // 等待所有附件创建完成
      const createdAttachments = await Promise.all(attachmentPromises.filter(Boolean));
      
      // 提取创建的附件ID
      const attachmentIds = createdAttachments
        .filter((attachment): attachment is Attachment => attachment !== null)
        .map(attachment => attachment.id);
      
      // 将附件关联到心愿清单项
      if (attachmentIds.length > 0) {
        await wishlistService.associateAttachments({
          wishlist_id: wishItem.id,
          attachment_ids: attachmentIds
        });
      }
      
      // 显示成功消息 - 使用内联样式确保尺寸
      const messageElement = document.createElement('div');
      messageElement.className = 'upload-success-message';
      messageElement.innerHTML = `<i class="fas fa-check-circle"></i> ${language === 'zh' ? '已完成' : 'Done'}`;
      // 添加内联样式确保形状
      messageElement.style.cssText = 'width: auto; height: auto; max-height: 40px; display: inline-flex; flex-direction: row;';
      document.body.appendChild(messageElement);
      successMessageRef.current = messageElement;
      
      // 1.5秒后移除消息并关闭模态框
      setTimeout(() => {
        if (successMessageRef.current) {
          document.body.removeChild(successMessageRef.current);
          successMessageRef.current = null;
        }
        // 清理状态
        setSelectedFiles([]);
        setPreviewUrls([]);
        onSuccess();
      }, 1500);
      
    } catch (err) {
      console.error('上传错误:', err);
      setError(language === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again');
    } finally {
      setUploading(false);
      resetState();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>
            <T 
              zh={`记录"${wishItem.title}"的完成时刻`}
              en={`Record the completion of "${wishItem.title}"`}
            />
          </h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <p className="completion-message">
              <T 
                zh="上传照片或视频，记录这个特别的时刻吧！" 
                en="Upload photos or videos to record this special moment!" 
              />
            </p>
            
            <div className="upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                disabled={uploading || selectedFiles.length >= MAX_FILES}
              />
              
              {previewUrls.length > 0 && (
                <div className="preview-grid">
                  {previewUrls.map((preview) => (
                    <div key={preview.id} className="preview-item">
                      {preview.type === 'image' ? (
                        <img src={preview.url} alt="Preview" />
                      ) : (
                        <video src={preview.url} controls />
                      )}
                      <button 
                        type="button" 
                        className="remove-file" 
                        onClick={() => removeFile(preview.id)}
                        disabled={uploading}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      
                      {uploading && (
                        <div className="upload-progress">
                          <div 
                            className="progress-bar" 
                            style={{ width: `${progress[preview.id] || 0}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* 添加更多文件的按钮 */}
                  {selectedFiles.length < MAX_FILES && (
                    <div 
                      className="add-more-files"
                      onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                      <i className="fas fa-plus"></i>
                      <span>
                        <T zh="添加" en="Add" />
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {previewUrls.length === 0 && (
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>
                    <T zh="选择照片/视频" en="Select Photos/Videos" />
                  </span>
                </button>
              )}
              
              <div className="upload-info">
                <T 
                  zh={`支持JPG、PNG、WebP等图片格式和MP4、WebM等视频格式，每个文件不超过10MB，最多${MAX_FILES}个文件`}
                  en={`Supports JPG, PNG, WebP image formats and MP4, WebM video formats. Max 10MB per file, up to ${MAX_FILES} files`}
                />
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={uploading}
            >
              <T zh="取消" en="Cancel" />
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? (
                <><i className="fas fa-spinner fa-spin"></i> <T zh="上传中..." en="Uploading..." /></>
              ) : (
                <T zh="上传" en="Upload" />
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-container {
          background-color: var(--bg-card, white);
          border-radius: 12px;
          box-shadow: var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.2));
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-primary, #eee);
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #333);
        }
        
        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-tertiary, #999);
          font-size: 18px;
        }
        
        .modal-body {
          padding: 20px;
          flex-grow: 1;
        }
        
        .completion-message {
          margin-bottom: 20px;
          color: var(--text-secondary, #666);
          text-align: center;
        }
        
        .error-message {
          background: var(--bg-error, #ffe0e0);
          color: var(--accent-danger, #d63031);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border-error, rgba(214, 48, 49, 0.2));
        }
        
        .upload-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .upload-button {
          background: var(--bg-tertiary, #f5f7fa);
          border: 2px dashed var(--border-primary, #ddd);
          border-radius: 12px;
          padding: 30px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-button:hover {
          background: var(--bg-hover, #edf2f7);
          border-color: var(--accent-primary, #6c5ce7);
        }
        
        .upload-button i {
          font-size: 32px;
          color: var(--accent-primary, #6c5ce7);
        }
        
        .upload-button span {
          color: var(--text-secondary, #666);
          font-size: 16px;
        }
        
        .upload-info {
          font-size: 12px;
          color: var(--text-tertiary, #888);
          text-align: center;
          max-width: 90%;
        }
        
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          width: 100%;
        }
        
        .preview-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.1));
          aspect-ratio: 1 / 1;
        }
        
        .preview-item img,
        .preview-item video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .remove-file {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 5;
        }
        
        .remove-file:hover {
          background: rgba(0, 0, 0, 0.8);
        }
        
        .upload-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: rgba(0, 0, 0, 0.2);
        }
        
        .progress-bar {
          height: 100%;
          background: var(--accent-primary, #6c5ce7);
          transition: width 0.2s ease;
        }
        
        .add-more-files {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary, #f5f7fa);
          border: 2px dashed var(--border-primary, #ddd);
          border-radius: 8px;
          cursor: pointer;
          aspect-ratio: 1 / 1;
          transition: all 0.2s ease;
          padding: 10px;
        }
        
        .add-more-files:hover {
          background: var(--bg-hover, #edf2f7);
          border-color: var(--accent-primary, #6c5ce7);
        }
        
        .add-more-files i {
          font-size: 20px;
          color: var(--accent-primary, #6c5ce7);
          margin-bottom: 5px;
        }
        
        .add-more-files span {
          font-size: 12px;
          color: var(--text-secondary, #666);
        }
        
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--border-primary, #eee);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .cancel-button,
        .submit-button {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .cancel-button {
          background: var(--bg-secondary, #f8f9fa);
          color: var(--text-secondary, #666);
          border: 1px solid var(--border-primary, #ddd);
        }
        
        .cancel-button:hover {
          background: var(--bg-hover, #edf2f7);
        }
        
        .submit-button {
          background: var(--accent-primary, #6c5ce7);
          color: var(--text-inverse, white);
          border: none;
        }
        
        .submit-button:hover {
          background: var(--accent-hover, #5b4ecc);
        }
        
        .submit-button:disabled,
        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .submit-button i {
          margin-right: 6px;
        }
        
        @media (max-width: 768px) {
          .modal-container {
            width: 95%;
          }
          
          .preview-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
        }
        
        /* 全局样式 */
        :global(.upload-success-message) {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent-success, #2ecc71);
          color: white;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(46, 204, 113, 0.3);
          z-index: 1100;
          width: auto;
          height: auto;
          max-height: 40px;
          max-width: 200px;
          min-width: 80px;
          white-space: nowrap;
          overflow: hidden;
          animation: toastFade 1.5s ease forwards;
        }
        
        :global(.upload-success-message i) {
          font-size: 14px;
        }
        
        @keyframes toastFade {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
} 