'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import MediaUpload from './MediaUpload';
import { getFilesByCategory, FileListItem } from '@/lib/services/ossService';

export default function Personal() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('photos');
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
      const { mediaService } = await import('@/services/media-service');
      
      // 使用API获取媒体列表，而不是直接从OSS获取
      const response = await mediaService.queryPersonalMedia(
        undefined, // 不按分类筛选
        activeTab === 'photos' ? 'photo' : activeTab === 'videos' ? 'video' : undefined
      );
      
      // 将API响应的Media对象转换为FileListItem格式
      const fileItems: FileListItem[] = response.items.map(media => {
        // 从URL中提取文件名
        const url = new URL(media.url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        return {
          name: media.title || fileName,
          url: media.url,
          lastModified: media.updated_at || media.created_at,
          size: 0, // API没有提供文件大小信息
          type: media.media_type === 'photo' ? 'image' : 'video',
          path: media.path || '' // 使用新添加的path字段
        };
      });
      
      // 设置媒体文件列表
      setMediaFiles(fileItems);
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
  
  // 将媒体文件按上传时间分组
  const groupedMedia = filteredMedia.reduce((acc, file) => {
    // 使用月份作为分组依据
    let uploadDate = new Date(file.lastModified); // 默认使用 lastModified
    
    // 尝试从文件路径中提取日期信息
    if (file.path) {
      const pathParts = file.path.split('/');
      if (pathParts.length >= 5) {
        // 路径格式为 userId/year/month/day/fileName
        try {
          const year = parseInt(pathParts[1]);
          const month = parseInt(pathParts[2]) - 1; // 月份从0开始
          const day = parseInt(pathParts[3]);
          
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            uploadDate = new Date(year, month, day);
          }
        } catch (e) {
          // 解析失败情况下已有默认值
        }
      }
    }
    
    // 格式化显示
    const monthYear = uploadDate.toLocaleDateString(
      language === 'zh' ? 'zh-CN' : 'en-US',
      { year: 'numeric', month: 'long' }
    );
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(file);
    return acc;
  }, {} as Record<string, FileListItem[]>);
  
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
        <div className="albums-grid">
          {Object.entries(groupedMedia).map(([monthYear, files]) => (
            <div key={monthYear} className="album-card">
              <div className="album-cover">
                {/* 使用第一个文件作为封面 */}
                {files[0].type === 'image' ? (
                  <img src={files[0].url} alt={monthYear} />
                ) : (
                  <div className="video-thumbnail">
                    <img src={`https://placehold.co/600x400/666/fff?text=Video`} alt={monthYear} />
                    <div className="play-icon">
                      <i className="fas fa-play"></i>
                    </div>
                  </div>
                )}
                <div className="album-info">
                  <div className="album-name">
                    {monthYear}
                  </div>
                  <div className="album-meta">
                    <div>
                      {activeTab === 'photos'
                        ? <T zh={`${files.length}张照片`} en={`${files.length} Photos`} />
                        : <T zh={`${files.length}个视频`} en={`${files.length} Videos`} />
                      }
                    </div>
                    <div>
                      {new Date(files[0].lastModified).toLocaleDateString(
                        language === 'zh' ? 'zh-CN' : 'en-US',
                        { year: 'numeric', month: 'short' }
                      )}
                    </div>
                  </div>
                </div>
                <div className="album-actions">
                  <button><i className="fas fa-edit"></i></button>
                  <button><i className="fas fa-trash"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
} 