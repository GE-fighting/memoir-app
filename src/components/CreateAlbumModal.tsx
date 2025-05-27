'use client';

import React, { useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import { albumService, CreateAlbumRequest } from '@/services/album-service';

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

    try {
      setIsLoading(true);
      setError('');
      
      // 准备请求数据
      const albumData: CreateAlbumRequest = {
        title: title.trim()
      };
      
      // 可选字段只在有值时添加
      if (description.trim()) {
        albumData.description = description.trim();
      }
      
      if (coverUrl.trim()) {
        albumData.cover_url = coverUrl.trim();
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
              <label htmlFor="album-cover">
                <T zh="封面图片URL" en="Cover Image URL" />
              </label>
              <input
                id="album-cover"
                type="text"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder={language === 'zh' ? '输入封面图片URL（可选）' : 'Enter cover image URL (optional)'}
              />
              {coverUrl && (
                <div className="cover-preview">
                  <img src={coverUrl} alt="Cover preview" />
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
    </div>
  );
} 