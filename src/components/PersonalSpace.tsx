'use client';

import React, { useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import MediaUpload from '@/components/MediaUpload';
import { FileListItem, getSignedUrl } from '@/lib/services/ossService';
import { mediaService, QueryPersonalMediaParams } from '@/services/personal-media-service';

export default function PersonalSpace() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaFiles, setMediaFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<FileListItem | null>(null);
  
  // 删除相关状态
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<FileListItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // 加载文件列表
  const loadMediaFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
              id: media.id, // 添加媒体ID，用于删除操作
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
          id: media.id, // 添加媒体ID，即使处理失败也保留ID
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
  React.useEffect(() => {
    loadMediaFiles();
  }, [activeTab]);
  
  // 上传完成后重新加载
  const handleUploadComplete = () => {
    loadMediaFiles();
    setShowUploadModal(false);
  };
  
  // 播放视频
  const playVideo = (file: FileListItem) => {
    setCurrentVideo(file);
  };
  
  // 关闭视频模态框
  const closeVideoModal = () => {
    setCurrentVideo(null);
  };
  
  // 搜索过滤
  const filteredMedia = searchTerm 
    ? mediaFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : mediaFiles;
  
  // 处理删除按钮点击
  const handleDeleteClick = (e: React.MouseEvent, file: FileListItem) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发其他点击事件
    setMediaToDelete(file);
    setConfirmDelete(true);
  };

  // 确认删除媒体
  const confirmDeleteMedia = async () => {
    if (!mediaToDelete || !mediaToDelete.id) return;
    
    setDeleteLoading(true);
    try {
      await mediaService.deleteMedia(mediaToDelete.id);
      // 删除成功，刷新媒体列表
      loadMediaFiles();
    } catch (err) {
      console.error('删除媒体失败:', err);
      setError(err instanceof Error ? err.message : '删除媒体失败');
    } finally {
      setDeleteLoading(false);
      setConfirmDelete(false);
      setMediaToDelete(null);
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setConfirmDelete(false);
    setMediaToDelete(null);
  };
  
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

      {/* Video Player Modal */}
      {currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={closeVideoModal}>
          <div className="relative w-full max-w-4xl p-2" onClick={e => e.stopPropagation()}>
            <div className="video-player-container">
              <video 
                src={currentVideo.url} 
                controls 
                className="w-full h-auto rounded-lg shadow-xl"
                controlsList="nodownload"
                autoPlay
              />
              <button 
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
                onClick={closeVideoModal}
              >
                <i className="fas fa-times"></i>
              </button>
              <h3 className="text-white text-lg font-medium mt-4">{currentVideo.name}</h3>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {confirmDelete && mediaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 relative shadow-xl transform transition-all">
            <h3 className="text-lg font-medium mb-4">
              <T zh={`确认删除 "${mediaToDelete.name}"?`} en={`Delete "${mediaToDelete.name}"?`} />
            </h3>
            <p className="text-gray-500 mb-4">
              <T 
                zh="此操作无法撤销，媒体文件将被永久删除。" 
                en="This action cannot be undone. The media will be permanently deleted." 
              />
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
                onClick={cancelDelete}
                disabled={deleteLoading}
              >
                <T zh="取消" en="Cancel" />
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center justify-center min-w-[80px]"
                onClick={confirmDeleteMedia}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <T zh="删除" en="Delete" />
                )}
              </button>
            </div>
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
                    <button 
                      className="media-action-btn"
                      onClick={(e) => handleDeleteClick(e, file)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="video-container" onClick={() => playVideo(file)}>
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
                    <button 
                      className="media-action-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e, file);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }

        .media-item {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          background: white;
        }

        .image-container, .video-container {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
          cursor: pointer;
        }

        .media-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .image-container:hover .media-image,
        .video-container:hover .media-image {
          transform: scale(1.05);
        }

        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: rgba(0,0,0,0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          transition: all 0.3s ease;
        }

        .video-container:hover .play-icon {
          background: rgba(108, 92, 231, 0.8);
          transform: translate(-50%, -50%) scale(1.1);
        }

        .media-actions {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .image-container:hover .media-actions,
        .video-container:hover .media-actions {
          opacity: 1;
        }

        .media-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #333;
          transition: all 0.2s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .media-action-btn:hover {
          background: white;
          color: #e53e3e;
          transform: scale(1.1);
        }

        .video-player-container {
          position: relative;
          width: 100%;
        }
      `}</style>
    </>
  );
}