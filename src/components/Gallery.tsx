'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from './LanguageContext';
import { albumService, MediaListResponse } from '@/services/album-service';
import { getCoupleSignedUrl } from '@/lib/services/coupleOssService';
import LoadingSpinner from './ui/loading-spinner';
import { useNotification } from './ui/notification';
import '../styles/gallery.css';

interface MediaItem {
  id: string;
  title?: string;
  media_url: string;
  thumbnail_url?: string;
  description?: string;
  media_type: 'photo' | 'video';
  created_at: string;
  url?: string; // 签名后的访问URL
  album_id?: string;
  album_title?: string;
}

export default function Gallery() {
  const { language } = useLanguage();
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showNotification, NotificationComponent } = useNotification();
  
  // 观察器用于无限滚动
  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMedia();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);
  
  // 加载媒体数据
  const loadMedia = async (pageNum: number, refresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      setError('');
      
      // 这里调用API获取所有相册的媒体文件
      const coupleId = localStorage.getItem('coupleID') || '';
      const response = await albumService.getAllMedia(coupleId); // 每页20项
      
      // 处理返回的数据 
      const items = response.data;
      const has_more = response.page < response.total_pages;
      
      // 处理媒体URL，为每个媒体生成签名URL
      const mediaWithSignedUrls = await Promise.all(
        items.map(async (item) => {
          try {
            // 使用情侣相册专用的签名URL方法
            let signedUrl = '';
            if (item.media_url) {
              signedUrl = await getCoupleSignedUrl(item.media_url);
            }
            
            // 获取缩略图URL的签名链接（如果存在）
            let thumbnailSignedUrl = '';
            if (item.thumbnail_url) {
              thumbnailSignedUrl = await getCoupleSignedUrl(item.thumbnail_url);
            }
            
            return {
              ...item,
              url: signedUrl, // 添加签名后的URL
              thumbnail_url: thumbnailSignedUrl || '' // 使用签名后的缩略图URL
            };
          } catch (err) {
            console.error('处理媒体URL失败:', err);
            return {
              ...item,
              url: '', // 失败时使用空URL
              thumbnail_url: ''
            };
          }
        })
      );
      
      // 过滤掉URL为空的项
      const validMedia = mediaWithSignedUrls.filter(item => item.url);
      
      if (refresh || pageNum === 1) {
        setMediaItems(validMedia);
      } else {
        setMediaItems(prev => [...prev, ...validMedia]);
      }
      
      setHasMore(has_more);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load media:', err);
      setError(
        language === 'zh' 
          ? '加载媒体文件失败，请刷新页面重试' 
          : 'Failed to load media files, please refresh and try again'
      );
      
      showNotification({
        message: language === 'zh' ? '加载媒体文件失败' : 'Failed to load media files',
        type: 'error',
        duration: 5000,
        actionText: language === 'zh' ? '重试' : 'Retry',
        onAction: () => loadMedia(1, true)
      });
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };
  
  // 加载更多媒体
  const loadMoreMedia = () => {
    if (!loadingMore && hasMore) {
      loadMedia(page + 1);
    }
  };
  
  // 组件挂载时加载第一页数据
  useEffect(() => {
    loadMedia(1);
  }, []);
  
  // 处理媒体点击
  const handleMediaClick = (media: MediaItem) => {
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
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    if (language === 'zh') {
      return `${year}年${month}月${day}日`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[date.getMonth()]} ${day}, ${year}`;
    }
  };
  
  return (
    <>
      {NotificationComponent}
      
      <div className="gallery-header">
        <div className="gallery-title-section">
          <button
            className="btn btn-secondary back-to-albums-btn"
            onClick={() => router.push('/albums')}
            title={language === 'zh' ? '返回相册墙' : 'Back to Albums'}
          >
            <i className="fas fa-images"></i>
            {language === 'zh' ? '相册墙' : 'Albums'}
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <LoadingSpinner size="lg" />
          <p>{language === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button 
            className="retry-btn"
            onClick={() => loadMedia(1, true)}
          >
            {language === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      ) : mediaItems.length === 0 ? (
        <div className="empty-container">
          <i className="fas fa-images"></i>
          <p>
            {language === 'zh' 
              ? '还没有媒体文件，请先在相册中上传照片或视频。' 
              : 'No media files yet. Please upload photos or videos in albums first.'}
          </p>
        </div>
      ) : (
        <div className="waterfall-container">
          <div className="waterfall-grid">
            {mediaItems.map((item, index) => {
              // 为最后一个元素添加ref，用于无限滚动
              const isLastItem = index === mediaItems.length - 1;
              
              return (
                <div 
                  className={`waterfall-item ${item.media_type === 'video' ? 'video-item' : ''}`}
                  key={item.id}
                  ref={isLastItem ? lastItemRef : null}
                  onClick={() => handleMediaClick(item)}
                >
                  {item.media_type === 'photo' ? (
                    <img 
                      src={item.thumbnail_url || item.url} 
                      alt={item.title || `Photo ${index + 1}`} 
                      loading="lazy"
                    />
                  ) : (
                    <div className="video-thumbnail">
                      <img 
                        src={item.thumbnail_url || `https://placehold.co/600x400/666/fff?text=Video`} 
                        alt={item.title || `Video ${index + 1}`}
                        loading="lazy"
                      />
                      <div className="play-icon">
                        <i className="fas fa-play"></i>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {loadingMore && (
            <div className="loading-more">
              <LoadingSpinner size="md" />
              <p>{language === 'zh' ? '加载更多...' : 'Loading more...'}</p>
            </div>
          )}
          
          {!hasMore && mediaItems.length > 0 && (
            <div className="no-more-items">
              <p>{language === 'zh' ? '已经到底啦' : 'No more items'}</p>
            </div>
          )}
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
            
            <div className="media-viewer-info">
              {currentMedia.title && <h3>{currentMedia.title}</h3>}
              {currentMedia.description && <p className="media-description">{currentMedia.description}</p>}
              
              <div className="media-meta">
                {currentMedia.album_title && (
                  <span className="album-info">
                    <i className="fas fa-images"></i> {currentMedia.album_title}
                  </span>
                )}
                <span className="date-info">
                  <i className="fas fa-calendar"></i> {formatDate(currentMedia.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 