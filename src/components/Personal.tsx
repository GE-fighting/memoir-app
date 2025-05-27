'use client';

import React, { useState, useEffect } from 'react';
import MediaUpload from '@/components/MediaUpload';
import { T, useLanguage } from './LanguageContext';
import { FileListItem, getSignedUrl } from '@/lib/services/ossService';
import { QueryPersonalMediaParams } from '@/services/personal-media-service';

export default function Personal() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaFiles, setMediaFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 加载文件列表
  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 导入媒体服务
      const { mediaService } = await import('@/services/personal-media-service');
      
      // 设置查询参数
      const params: QueryPersonalMediaParams = {
        media_type: activeTab === 'photos' ? 'photo' : activeTab === 'videos' ? 'video' : undefined
      };
      
      // 使用API获取媒体列表，而不是直接从OSS获取
      const response = await mediaService.queryPersonalMedia(params);
      
      // 将API响应的Media对象转换为FileListItem格式
      const fileItemsPromises = response.data.map(async media => {
        // 从URL中提取文件名 (使用media_url字段，若不存在则回退到url)
        const mediaUrl = media.media_url || '';
        let fileName = '';
        
        try {
          if (mediaUrl) {
            const url = new URL(mediaUrl);
            const pathParts = url.pathname.split('/');
            fileName = pathParts[pathParts.length - 1];
            
            // 获取带有授权的签名URL
            const signedUrl = await getSignedUrl(mediaUrl);
            
            // 处理缩略图URL，如果存在也获取签名URL
            let thumbnailSignedUrl = '';
            if (media.thumbnail_url) {
              try {
                // 直接使用getSignedUrl，它已经能处理处理参数了
                thumbnailSignedUrl = await getSignedUrl(media.thumbnail_url);
              } catch (thumbErr) {
                console.error('处理缩略图URL失败:', thumbErr);
              }
            }
            
            return {
              name: media.title || fileName,
              url: signedUrl, // 使用带授权的URL
              lastModified: media.updated_at || media.created_at,
              size: 0, // API没有提供文件大小信息
              type: media.media_type === 'photo' ? 'image' : 'video',
              path: '',  // 不再使用path字段
              originalUrl: mediaUrl, // 保存原始URL，便于需要时重新获取签名
              thumbnail_url: thumbnailSignedUrl || '' // 使用带授权的缩略图URL
            };
          }
        } catch (e) {
          console.error('处理媒体URL失败:', e);
        }
        
        // 如果处理失败，返回一个默认对象
        return {
          name: media.title || '未知文件',
          url: '', // 空URL
          lastModified: media.updated_at || media.created_at,
          size: 0,
          type: media.media_type === 'photo' ? 'image' : 'video',
          path: '',
          originalUrl: mediaUrl,
          thumbnail_url: ''
        };
      });
      
      // 等待所有URL处理完成
      const fileItems = await Promise.all(fileItemsPromises);
      
      // 过滤掉URL为空的项
      const validFileItems = fileItems.filter(item => item.url);
      
      // 设置媒体文件列表
      setMediaFiles(validFileItems);
    } catch (err) {
      console.error('加载媒体文件失败:', err);
      setError(err instanceof Error ? err.message : '加载媒体文件失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载和标签变化时重新加载
  useEffect(() => {
    loadMediaFiles();
  }, [activeTab]);
  
  // 上传完成后重新加载
  const handleUploadComplete = () => {
    loadMediaFiles();
    setShowUploadModal(false);
  };
  
  // 搜索过滤
  const filteredMedia = searchTerm 
    ? mediaFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mediaFiles;
  
  return (
    <>
      <div className="timeline-header">
        <div className="search-filter-group">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder={language === 'zh' ? '搜索个人内容...' : 'Search personal content...'} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button 
          className="btn btn-primary text-base font-bold shadow-lg bg-accent hover:bg-accent/90 text-white"
          onClick={() => setShowUploadModal(true)}
        >
          <i className="fas fa-plus mr-2"></i>
          <T zh="添加内容" en="Add Content" />
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-3xl mx-4">
            <MediaUpload onClose={handleUploadComplete} />
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '0 1rem' }}>
        <div className="personal-content-tabs">
          <div 
            className={`tab ${activeTab === 'photos' ? 'active' : ''}`} 
            onClick={() => setActiveTab('photos')}
          >
            <i className="fas fa-image" style={{ marginRight: '0.5rem' }}></i>
            <T zh="照片" en="Photos" />
          </div>
          <div 
            className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <i className="fas fa-video" style={{ marginRight: '0.5rem' }}></i>
            <T zh="视频" en="Videos" />
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-2xl text-accent"></i>
          <p className="mt-2"><T zh="加载中..." en="Loading..." /></p>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="text-center py-10 text-red-500">
          <i className="fas fa-exclamation-circle text-2xl"></i>
          <p className="mt-2">{error}</p>
        </div>
      )}
      
      {/* 没有内容的提示 */}
      {!loading && !error && filteredMedia.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <i className="fas fa-folder-open text-3xl"></i>
          <p className="mt-2"><T zh="没有找到内容" en="No content found" /></p>
          <button
            className="mt-4 btn btn-primary bg-accent hover:bg-accent/90 text-white"
            onClick={() => setShowUploadModal(true)}
          >
            <i className="fas fa-plus mr-2"></i>
            <T zh="上传新内容" en="Upload new content" />
          </button>
        </div>
      )}

      {/* 媒体内容展示 */}
      {!loading && !error && filteredMedia.length > 0 && (
        <div className="media-grid">
          {filteredMedia.map((file, index) => (
            <div key={index} className="media-item">
              {file.type === 'image' ? (
                <div className="image-container">
                  <img src={file.thumbnail_url || file.url} alt={file.name} className="media-image" />
                  <div className="media-actions">
                    <button className="media-action-btn"><i className="fas fa-edit"></i></button>
                    <button className="media-action-btn"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ) : (
                <div className="video-container">
                  <div className="video-thumbnail">
                    <img 
                      src={file.thumbnail_url || `https://placehold.co/600x400/666/fff?text=Video`} 
                      alt={file.name} 
                      className="media-image" 
                    />
                    <div className="play-icon">
                      <i className="fas fa-play"></i>
                    </div>
                  </div>
                  <div className="media-actions">
                    <button className="media-action-btn"><i className="fas fa-edit"></i></button>
                    <button className="media-action-btn"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
} 