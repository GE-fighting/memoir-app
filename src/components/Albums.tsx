'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { T, useLanguage } from './LanguageContext';
import CreateAlbumModal from './CreateAlbumModal';
import UploadPhotosModal from './UploadPhotosModal';
import { albumService, Album } from '@/services/album-service';
import { getCoupleSignedUrl } from '@/lib/services/coupleOssService';
import '@/styles/modal.css';
import '@/styles/albums.css';
import '@/styles/upload.css';

interface Photo {
  id: string;
  title?: string;
  media_url: string;
  thumbnail_url?: string;
  description?: string;
  media_type: 'photo' | 'video';
  created_at: string;
  url?: string; // 签名后的访问URL
}

export default function Albums() {
  const { language } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAlbumDetailOpen, setIsAlbumDetailOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<{id: string, title: string} | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<Photo | null>(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [albumsLoaded, setAlbumsLoaded] = useState(false);
  
  // 默认封面图片集合，当相册没有封面时随机选择一个
  const defaultCovers = [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522204538344-922f76ecc041?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556103255-4443dbae8e5a?q=80&w=500&auto=format&fit=crop"
  ];
  
  // 获取默认封面图片
  const getDefaultCover = (albumId: string) => {
    // 使用相册ID作为种子，确保同一个相册总是获得相同的默认封面
    const index = parseInt(albumId.substring(albumId.length - 2), 16) % defaultCovers.length;
    return defaultCovers[index];
  };
  
  // 加载相册列表
  const loadAlbums = async () => {
    // 如果已经加载过相册，不再重复加载
    if (albumsLoaded) return;
    
    try {
      setIsLoading(true);
      setError('');
      const data = await albumService.getAlbums();
      console.log('Albums data from API:', data); // 添加调试日志
      setAlbums(data);
      setAlbumsLoaded(true);
    } catch (err: any) {
      console.error('Failed to load albums:', err);
      setError(
        language === 'zh' 
          ? '加载相册失败，请刷新页面重试' 
          : 'Failed to load albums, please refresh and try again'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // 组件挂载时加载相册列表
  useEffect(() => {
    loadAlbums();
  }, []);
  
  // 打开创建相册模态框
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  
  // 关闭创建相册模态框
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  // 创建相册成功后的回调
  const handleAlbumCreated = () => {
    // 重新加载相册列表
    loadAlbums();
  };
  
  // 处理上传照片按钮点击
  const handleUploadPhotos = (albumId: string, albumTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setSelectedAlbum({ id: albumId, title: albumTitle });
    setIsUploadModalOpen(true);
  };
  
  // 关闭上传照片模态框
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedAlbum(null);
  };
  
  // 加载相册照片
  const loadAlbumPhotos = useCallback(async (albumId: string) => {
    // 避免重复加载同一个相册
    if (currentAlbum && currentAlbum.id === albumId && albumPhotos.length > 0) {
      setIsAlbumDetailOpen(true);
      return;
    }
    
    try {
      setLoadingPhotos(true);
      const albumWithPhotos = await albumService.getAlbumWithPhotos(albumId);
      setCurrentAlbum(albumWithPhotos);
      
      // 处理照片URL，为每张照片生成签名URL
      if (albumWithPhotos.photos_videos && albumWithPhotos.photos_videos.length > 0) {
        const photosWithSignedUrls = await Promise.all(
          albumWithPhotos.photos_videos.map(async (photo) => {
            try {
              // 使用情侣相册专用的签名URL方法
              let signedUrl = '';
              if (photo.media_url) {
                signedUrl = await getCoupleSignedUrl(photo.media_url);
              }
              
              // 获取缩略图URL的签名链接（如果存在）
              let thumbnailSignedUrl = '';
              if (photo.thumbnail_url) {
                thumbnailSignedUrl = await getCoupleSignedUrl(photo.thumbnail_url);
              }
              
              return {
                ...photo,
                url: signedUrl, // 添加签名后的URL
                thumbnail_url: thumbnailSignedUrl || '' // 使用签名后的缩略图URL
              };
            } catch (err) {
              console.error('处理照片URL失败:', err);
              return {
                ...photo,
                url: '', // 失败时使用空URL
                thumbnail_url: ''
              };
            }
          })
        );
        
        // 过滤掉URL为空的项
        const validPhotos = photosWithSignedUrls.filter(photo => photo.url);
        setAlbumPhotos(validPhotos);
      } else {
        setAlbumPhotos([]);
      }
      
      setIsAlbumDetailOpen(true);
    } catch (err) {
      console.error('Failed to load album photos:', err);
      alert(language === 'zh' ? '加载相册照片失败' : 'Failed to load album photos');
    } finally {
      setLoadingPhotos(false);
    }
  }, [currentAlbum, albumPhotos.length, language, getCoupleSignedUrl]);
  
  // 上传照片成功后的回调
  const handlePhotosUploaded = useCallback(() => {
    // 关闭上传模态框
    setIsUploadModalOpen(false);
    
    // 如果当前正在查看该相册，则刷新相册数据
    if (currentAlbum && selectedAlbum && currentAlbum.id === selectedAlbum.id) {
      loadAlbumPhotos(currentAlbum.id);
    }
  }, [currentAlbum, selectedAlbum, loadAlbumPhotos]);
  
  // 处理编辑相册按钮点击
  const handleEditAlbum = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    // TODO: 实现编辑相册功能
    console.log(`编辑相册: ${album.title} (ID: ${album.id})`);
  };
  
  // 处理删除相册按钮点击
  const handleDeleteAlbum = (albumId: string, albumTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    // TODO: 实现删除相册功能
    if (window.confirm(
      language === 'zh'
        ? `确定要删除相册 "${albumTitle}" 吗？`
        : `Are you sure you want to delete the album "${albumTitle}"?`
    )) {
      console.log(`删除相册: ${albumTitle} (ID: ${albumId})`);
      // 这里可以调用删除API
    }
  };
  
  // 处理相册点击
  const handleAlbumClick = useCallback((album: Album) => {
    loadAlbumPhotos(album.id);
  }, [loadAlbumPhotos]);
  
  // 关闭相册详情
  const handleCloseAlbumDetail = () => {
    setIsAlbumDetailOpen(false);
    setCurrentAlbum(null);
    setAlbumPhotos([]);
  };
  
  // 处理媒体点击
  const handleMediaClick = (media: Photo) => {
    setCurrentMedia(media);
    setIsMediaViewerOpen(true);
    
    // 如果是视频，设置一个短暂的延迟后自动播放
    if (media.media_type === 'video') {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.error('自动播放视频失败:', err);
          });
        }
      }, 100);
    }
  };
  
  // 关闭媒体查看器
  const handleCloseMediaViewer = () => {
    if (currentMedia?.media_type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
    setIsMediaViewerOpen(false);
    setCurrentMedia(null);
  };
  
  // 筛选相册
  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (language === 'zh') {
      return `${year}年${month}月`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[date.getMonth()]} ${year}`;
    }
  };
  
  return (
    <>
      <div className="timeline-header">
        <div className="search-filter-group">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder={language === 'zh' ? '搜索相册...' : 'Search albums...'} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <i className="fas fa-plus"></i>
          <T zh="新建相册" en="New Album" />
        </button>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p><T zh="加载中..." en="Loading..." /></p>
        </div>
      ) : error ? (
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="empty-container">
          <i className="fas fa-photo-video"></i>
          <p>
            {searchTerm ? (
              <T zh="没有找到匹配的相册" en="No matching albums found" />
            ) : (
              <T zh={'还没有创建相册，点击"新建相册"按钮开始创建'} en="No albums yet, click the 'New Album' button to get started" />
            )}
          </p>
        </div>
      ) : (
        <div className="albums-grid">
          {filteredAlbums.map(album => (
            <div className="album-card" key={album.id} onClick={() => handleAlbumClick(album)}>
              <div className="album-cover">
                <img 
                  src={album.cover_url || getDefaultCover(album.id)} 
                  alt={album.title} 
                  onError={(e) => {
                    // 如果图片加载失败，使用默认封面
                    (e.target as HTMLImageElement).src = getDefaultCover(album.id);
                  }}
                />
                <div className="album-info">
                  <div className="album-name">{album.title}</div>
                  <div className="album-meta">
                    <div>
                      {album.count !== undefined ? (
                        <T 
                          zh={`${album.count}张照片`} 
                          en={`${album.count} Photos`} 
                        />
                      ) : album.photos_videos ? (
                        <T 
                          zh={`${album.photos_videos.length}张照片`} 
                          en={`${album.photos_videos.length} Photos`} 
                        />
                      ) : (
                        <T zh="0张照片" en="0 Photos" />
                      )}
                    </div>
                    <div>{formatDate(album.created_at)}</div>
                  </div>
                </div>
                <div className="album-actions">
                  <button title={language === 'zh' ? '上传照片' : 'Upload Photos'} onClick={(e) => handleUploadPhotos(album.id, album.title, e)}>
                    <i className="fas fa-upload"></i>
                  </button>
                  <button title={language === 'zh' ? '编辑相册' : 'Edit Album'} onClick={(e) => handleEditAlbum(album, e)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button title={language === 'zh' ? '删除相册' : 'Delete Album'} onClick={(e) => handleDeleteAlbum(album.id, album.title, e)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 创建相册模态框 */}
      <CreateAlbumModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseCreateModal} 
        onSuccess={handleAlbumCreated} 
      />
      
      {/* 上传照片模态框 */}
      {selectedAlbum && (
        <UploadPhotosModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          onSuccess={handlePhotosUploaded}
          albumId={selectedAlbum.id}
          albumTitle={selectedAlbum.title}
        />
      )}
      
      {/* 相册详情模态框 */}
      {isAlbumDetailOpen && currentAlbum && (
        <div className="modal-overlay" onClick={handleCloseAlbumDetail}>
          <div className="album-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentAlbum.title}</h2>
              <button className="close-btn" onClick={handleCloseAlbumDetail}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="album-description">
              {currentAlbum.description && <p>{currentAlbum.description}</p>}
              <div className="album-meta-info">
                <span>
                  <i className="fas fa-calendar"></i> {formatDate(currentAlbum.created_at)}
                </span>
                <span>
                  <i className="fas fa-image"></i> {currentAlbum.count !== undefined ? currentAlbum.count : albumPhotos.length} <T zh="张照片" en="Photos" />
                </span>
              </div>
            </div>
            
            {loadingPhotos ? (
              <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p><T zh="加载照片中..." en="Loading photos..." /></p>
              </div>
            ) : albumPhotos.length === 0 ? (
              <div className="empty-photos">
                <i className="fas fa-images"></i>
                <p><T zh="相册中还没有照片" en="No photos in this album yet" /></p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSelectedAlbum({ id: currentAlbum.id, title: currentAlbum.title });
                    setIsUploadModalOpen(true);
                  }}
                >
                  <i className="fas fa-upload"></i>
                  <T zh="上传照片" en="Upload Photos" />
                </button>
              </div>
            ) : (
              <div className="album-photos-grid">
                {albumPhotos.map((photo, index) => (
                  <div 
                    className="photo-item" 
                    key={photo.id || index}
                    onClick={() => handleMediaClick(photo)}
                  >
                    {photo.media_type === 'photo' ? (
                      <img 
                        src={photo.thumbnail_url || photo.url} 
                        alt={photo.title || `Photo ${index + 1}`} 
                        loading="lazy"
                      />
                    ) : (
                      <div className="video-thumbnail">
                        <img 
                          src={photo.thumbnail_url || `https://placehold.co/600x400/666/fff?text=Video`} 
                          alt={photo.title || `Video ${index + 1}`}
                          loading="lazy"
                        />
                        <div className="play-icon">
                          <i className="fas fa-play"></i>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 媒体查看器模态框 */}
      {isMediaViewerOpen && currentMedia && (
        <div className="modal-overlay media-viewer-overlay" onClick={handleCloseMediaViewer}>
          <div className="media-viewer-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn media-close-btn" onClick={handleCloseMediaViewer}>
              <i className="fas fa-times"></i>
            </button>
            
            {currentMedia.media_type === 'photo' ? (
              <img 
                src={currentMedia.url} 
                alt={currentMedia.title || 'Photo'} 
                className="media-viewer-image"
              />
            ) : (
              <div className="media-viewer-video-container">
                <video
                  ref={videoRef}
                  src={currentMedia.url}
                  controls
                  className="media-viewer-video"
                  controlsList="nodownload"
                />
              </div>
            )}
            
            {currentMedia.title && (
              <div className="media-viewer-caption">
                <h3>{currentMedia.title}</h3>
                {currentMedia.description && <p>{currentMedia.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .album-detail-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          position: relative;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 5px;
        }
        
        .album-description {
          margin-bottom: 20px;
          color: #666;
        }
        
        .album-meta-info {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          font-size: 14px;
          color: #888;
        }
        
        .album-meta-info i {
          margin-right: 5px;
        }
        
        .empty-photos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: #aaa;
        }
        
        .empty-photos i {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .album-photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }
        
        .photo-item {
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .photo-item:hover {
          transform: scale(1.02);
        }
        
        .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .video-thumbnail {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .album-card {
          cursor: pointer;
        }
        
        /* 媒体查看器样式 */
        .media-viewer-overlay {
          background-color: rgba(0, 0, 0, 0.9);
          z-index: 1100;
        }
        
        .media-viewer-container {
          position: relative;
          width: 90%;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .media-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        
        .media-viewer-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          margin: 0 auto;
        }
        
        .media-viewer-video-container {
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 比例 */
          position: relative;
        }
        
        .media-viewer-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .media-viewer-caption {
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 16px;
          margin-top: 16px;
          border-radius: 8px;
        }
        
        .media-viewer-caption h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }
        
        .media-viewer-caption p {
          margin: 0;
          font-size: 14px;
          color: #ddd;
        }
      `}</style>
    </>
  );
} 