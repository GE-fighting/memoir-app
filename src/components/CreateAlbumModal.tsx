'use client';

import React, { useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import { albumService, CreateAlbumRequest } from '@/services/album-service';
import defaultCovers, { fallbackCovers } from '@/utils/default-covers';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAlbumModal({ isOpen, onClose, onSuccess }: CreateAlbumModalProps) {
  const { language } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 默认封面图片集合
  const defaultCoversArray = defaultCovers;

  // 如果模态框不是打开状态，不渲染任何内容
  if (!isOpen) return null;

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    if (!title.trim()) {
      setError(language === 'zh' ? '请输入相册标题' : 'Please enter album title');
      return;
    }
    
    // 封面图片是必填项
    if (!coverUrl.trim()) {
      setError(language === 'zh' ? '请选择封面图片' : 'Please select a cover image');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // 准备请求数据
      const albumData: CreateAlbumRequest = {
        title: title.trim(),
        cover_url: coverUrl.trim()
      };
      
      // 可选字段只在有值时添加
      if (description.trim()) {
        albumData.description = description.trim();
      }
      
      // 发送创建请求
      await albumService.createAlbum(albumData);
      
      // 成功后重置表单并关闭模态框
      setTitle('');
      setDescription('');
      setCoverUrl('');
      onSuccess();
      onClose();
    } catch (err: any) {
      // 显示错误信息
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '创建相册失败，请稍后重试' : 'Failed to create album, please try again later')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2><T zh="创建新相册" en="Create New Album" /></h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="album-title">
                <T zh="相册标题" en="Album Title" /> <span className="required">*</span>
              </label>
              <input
                id="album-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={language === 'zh' ? '输入相册标题' : 'Enter album title'}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="album-description">
                <T zh="相册描述" en="Album Description" />
              </label>
              <textarea
                id="album-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'zh' ? '输入相册描述（可选）' : 'Enter album description (optional)'}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>
                <T zh="选择封面图片" en="Select Cover Image" /> <span className="required">*</span>
              </label>
              <div className="cover-options">
                {defaultCoversArray.map((cover, index) => (
                  <div 
                    key={index}
                    className={`cover-option ${coverUrl === cover ? 'selected' : ''}`}
                    onClick={() => setCoverUrl(cover)}
                  >
                    <img 
                      src={cover} 
                      alt={`Cover ${index + 1}`} 
                      onError={(e) => {
                        // 如果默认图片加载失败，使用备用图片
                        if (fallbackCovers[index]) {
                          (e.target as HTMLImageElement).src = fallbackCovers[index];
                        } else {
                          // 如果找不到对应的备用图片，使用通用备用图片
                          (e.target as HTMLImageElement).src = "https://placehold.co/500x500/CCCCCC/FFFFFF?text=Cover+${index+1}";
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="custom-url-section">
                <label htmlFor="album-cover">
                  <T zh="或输入自定义图片URL" en="Or enter custom image URL" />
                </label>
                <input
                  id="album-cover"
                  type="text"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder={language === 'zh' ? '输入封面图片URL' : 'Enter cover image URL'}
                />
              </div>
              {coverUrl && (
                <div className="cover-preview">
                  <div className="preview-container">
                    <img 
                      src={coverUrl} 
                      alt="Cover preview" 
                      className="preview-image"
                      onError={(e) => {
                        // 查找当前选择的URL在defaultCovers数组中的索引
                        const index = defaultCoversArray.indexOf(coverUrl);
                        // 如果找到且有对应的备用URL，则使用备用URL
                        if (index !== -1 && fallbackCovers[index]) {
                          (e.target as HTMLImageElement).src = fallbackCovers[index];
                        } else {
                          // 如果找不到对应的备用图片，使用通用备用图片
                          (e.target as HTMLImageElement).src = "https://placehold.co/500x500/CCCCCC/FFFFFF?text=Preview+Not+Available";
                        }
                      }}
                    />
                  </div>
                  <p className="preview-hint"><T zh="封面预览" en="Cover Preview" /></p>
                </div>
              )}
            </div>
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
              disabled={isLoading}
            >
              {isLoading ? (
                <span><i className="fas fa-spinner fa-spin"></i> <T zh="创建中..." en="Creating..." /></span>
              ) : (
                <T zh="创建相册" en="Create Album" />
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .cover-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 15px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .cover-option {
          border: 2px solid transparent;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          height: 80px;
          transition: border-color 0.2s;
        }
        
        .cover-option:hover {
          border-color: #007bff;
        }
        
        .cover-option.selected {
          border-color: #007bff;
          box-shadow: 0 0 0 2px #007bff;
        }
        
        .cover-option img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .custom-url-section {
          margin-top: 15px;
        }
        
        .custom-url-section input {
          margin-top: 5px;
        }
        
        /* 封面预览样式 */
        .cover-preview {
          margin-top: 15px !important;
          text-align: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .preview-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 250px;
          background-color: white;
          border-radius: 4px;
          overflow: hidden;
          padding: 10px;
        }
        
        .preview-image {
          max-width: 100% !important;
          max-height: 300px !important;
          object-fit: contain !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          background-color: white;
        }
        
        .preview-hint {
          margin-top: 8px;
          font-size: 14px;
          color: #6c757d;
        }
        
        /* 滚动条样式 */
        .cover-options::-webkit-scrollbar {
          width: 6px;
        }
        
        .cover-options::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .cover-options::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .cover-options::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
} 