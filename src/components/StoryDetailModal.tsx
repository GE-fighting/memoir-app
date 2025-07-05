'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';
import { TimelineEvent, PersonalMedia } from '../services/api-types';
import { getCoupleSignedUrl } from '../lib/services/coupleOssService';
import { eventService } from '../services/event-service';
import EditStoryModal from './EditStoryModal';
import Image from 'next/image';
import '../styles/story-modal.css';

interface StoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  onDeleted?: () => void;
}

// Base64 编码的错误占位图，一个简单的灰色背景带有错误图标
const ERROR_PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNGMEYwRjAiLz4KICA8cGF0aCBkPSJNMTgyLjUgMTMwLjVMMjAwIDEwMEwyMTcuNSAxMzAuNUgyMzVMMjAwIDc1TDE2NSAxMzAuNUgxODIuNVoiIGZpbGw9IiM5OTk5OTkiLz4KICA8cGF0aCBkPSJNMTY1IDE0MEgyMzVWMTcwSDE2NVYxNDBaIiBmaWxsPSIjOTk5OTk5Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NjY2NiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4=';

export default function StoryDetailModal({ isOpen, onClose, event, onDeleted }: StoryDetailModalProps) {
  const { language } = useLanguage();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [signedMediaUrls, setSignedMediaUrls] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<PersonalMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fullEvent, setFullEvent] = useState<TimelineEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (language === 'zh') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }
  };

  const loadEventDetails = useCallback(async () => {
    if (!event || !event.id) return;

    try {
      setIsLoadingEvent(true);
      setEventError(null);
      const fullEventData = await eventService.getEvent(event.id);
      setFullEvent(fullEventData);
    } catch (error) {
      console.error('获取故事详情失败:', error);
      setEventError(language === 'zh' ? '加载故事详情失败，请稍后重试' : 'Failed to load story details, please try again later');
      setFullEvent(event);
    } finally {
      setIsLoadingEvent(false);
    }
  }, [event, language]);

  useEffect(() => {
    if (isOpen && event) {
      loadEventDetails();
    } else {
      setFullEvent(null);
    }
  }, [isOpen, event, loadEventDetails]);

  const getSignedMediaUrls = useCallback(async () => {
    const currentEvent = fullEvent || event;
    if (!currentEvent || !currentEvent.photos_videos || currentEvent.photos_videos.length === 0) {
      setSignedMediaUrls([]);
      setMediaItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingError(null);
      setMediaLoaded(false);

      const urls = await Promise.all(
        currentEvent.photos_videos.map(async (media: PersonalMedia) => {
          try {
            return await getCoupleSignedUrl(media.media_url);
          } catch (err) {
            console.error(`获取媒体 ${media.id} 的签名URL失败:`, err);
            return ERROR_PLACEHOLDER_IMAGE;
          }
        })
      );
      setSignedMediaUrls(urls);
      setMediaItems(currentEvent.photos_videos);
    } catch (error) {
      console.error('获取签名媒体URL失败:', error);
      setLoadingError(language === 'zh' ? '加载媒体失败，请稍后重试' : 'Failed to load media, please try again later');
    } finally {
      setIsLoading(false);
    }
  }, [fullEvent, event, language]);

  useEffect(() => {
    if (isOpen && (fullEvent || event)) {
      // 重置错误状态
      setLoadingError(null);
      setMediaLoaded(false);

      const currentEvent = fullEvent || event;
      // 只有当事件有照片时才调用 getSignedMediaUrls
      if (currentEvent && currentEvent.photos_videos && currentEvent.photos_videos.length > 0) {
        getSignedMediaUrls();
      } else {
        // 没有照片时，清除相关状态
        setSignedMediaUrls([]);
        setMediaItems([]);
        setIsLoading(false);
        setCurrentMediaIndex(0);
      }
    } else {
      setCurrentMediaIndex(0);
      setMediaLoaded(false);
      setLoadingError(null);
    }
  }, [isOpen, fullEvent, event, getSignedMediaUrls]);

  // 保留键盘导航功能，但简化实现
  const handlePrevMedia = useCallback(() => {
    if (signedMediaUrls.length <= 1) return;
    setMediaLoaded(false);
    setCurrentMediaIndex((prev) =>
      prev === 0 ? signedMediaUrls.length - 1 : prev - 1
    );
  }, [signedMediaUrls.length]);

  const handleNextMedia = useCallback(() => {
    if (signedMediaUrls.length <= 1) return;
    setMediaLoaded(false);
    setCurrentMediaIndex((prev) =>
      prev === signedMediaUrls.length - 1 ? 0 : prev + 1
    );
  }, [signedMediaUrls.length]);

  const handleGoToMedia = useCallback((index: number) => {
    if (index === currentMediaIndex || signedMediaUrls.length <= 1) return;
    setMediaLoaded(false);
    setCurrentMediaIndex(index);
  }, [currentMediaIndex, signedMediaUrls.length]);

  const handleMediaLoaded = () => {
    setMediaLoaded(true);
  };

  const handleMediaError = () => {
    setMediaLoaded(true);
    setLoadingError(language === 'zh' ? '媒体加载失败' : 'Failed to load media');
  };

  const getCurrentMediaType = () => {
    if (mediaItems.length > 0 && mediaItems[currentMediaIndex]) {
      return mediaItems[currentMediaIndex].media_type;
    }
    return 'photo'; // 默认为图片
  };

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    // 重新加载故事详情
    if (event && event.id) {
      loadEventDetails();
    }
  };

  const handleDelete = async () => {
    if (!fullEvent || !fullEvent.id) return;
    setShowMenu(false);
    const confirmMsg = language === 'zh'
      ? `确定要删除这条回忆吗？此操作无法撤销。`
      : `Are you sure you want to delete this memory? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await eventService.deleteEvent(fullEvent.id);
      setIsDeleting(false);
      if (onDeleted) onDeleted();
      handleClose();
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteError(
        err?.response?.data?.message ||
        (language === 'zh' ? '删除失败，请稍后重试' : 'Failed to delete, please try again later')
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevMedia();
          break;
        case 'ArrowRight':
          handleNextMedia();
          break;
        case 'Escape':
          if (showMenu) {
            setShowMenu(false);
          } else {
            handleClose();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrevMedia, handleNextMedia, handleClose, showMenu]);

  if (!isOpen) return null;

  const currentEvent = fullEvent || event;

  if (!currentEvent) {
    return (
      <div className="story-modal-overlay" onClick={handleClose}>
        <div className="story-modal-container" onClick={e => e.stopPropagation()}>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p><T zh="加载中..." en="Loading..." /></p>
          </div>
        </div>
      </div>
    );
  }
  
  const renderMedia = () => {
    if (isLoadingEvent) {
      return (
        <div className="media-loading">
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p><T zh="加载故事详情中..." en="Loading story details..." /></p>
          </div>
        </div>
      );
    }

    if (eventError) {
      return (
        <div className="media-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{eventError}</p>
          <button className="retry-button" onClick={loadEventDetails}>
            <T zh="重试" en="Retry" />
          </button>
        </div>
      );
    }

    // 检查当前事件是否有照片
    const hasPhotos = currentEvent && currentEvent.photos_videos && currentEvent.photos_videos.length > 0;

    // 如果没有照片，直接显示占位符，不显示加载状态或错误
    if (!hasPhotos) {
      return (
        <div className="media-placeholder">
          <i className="fas fa-image"></i>
          <p><T zh="暂无图片" en="No Images" /></p>
        </div>
      );
    }

    if (isLoading) {
        return (
          <div className="media-loading">
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p><T zh="加载媒体中..." en="Loading media..." /></p>
            </div>
          </div>
        );
    }

    if (loadingError && signedMediaUrls.length === 0) {
        return (
          <div className="media-error">
            <i className="fas fa-exclamation-circle"></i>
            <p>{loadingError}</p>
            <button className="retry-button" onClick={() => getSignedMediaUrls()}>
              <T zh="重试" en="Retry" />
            </button>
          </div>
        );
    }

    const mediaToShow = signedMediaUrls.length > 0 ? signedMediaUrls : (currentEvent.cover_url ? [currentEvent.cover_url] : []);
    const currentIndex = signedMediaUrls.length > 0 ? currentMediaIndex : 0;

    if (mediaToShow.length === 0) {
        return (
          <div className="media-placeholder">
            <i className="fas fa-image"></i>
            <p><T zh="暂无图片" en="No Images" /></p>
          </div>
        );
    }
    
    const currentMediaType = getCurrentMediaType();

    return (
      <div
        className="media-container"
        ref={mediaContainerRef}
      >
        {currentMediaType === 'photo' ? (
          <img
            key={mediaToShow[currentIndex]} // Add key for re-rendering on src change
            src={mediaToShow[currentIndex]}
            alt={`${currentEvent.title} - ${currentIndex + 1}`}
            className={`media-image ${mediaLoaded ? 'loaded' : ''}`}
            onLoad={handleMediaLoaded}
            onError={handleMediaError}
          />
        ) : (
          <video
            key={mediaToShow[currentIndex]} // Add key for re-rendering on src change
            ref={videoRef}
            src={mediaToShow[currentIndex]}
            className={`media-video ${mediaLoaded ? 'loaded' : ''}`}
            controls
            controlsList="nodownload"
            onLoadedData={handleMediaLoaded}
            onError={handleMediaError}
            onPlay={() => setMediaLoaded(true)}
          />
        )}

        {!mediaLoaded && (
          <div className="media-loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        {loadingError && mediaLoaded && (
          <div className="media-error-overlay">
            <i className="fas fa-exclamation-circle"></i>
            <p>{loadingError}</p>
          </div>
        )}

        {/* 添加左右导航按钮 - 仅在有多个媒体且已加载完成时显示 */}
        {mediaToShow.length > 1 && mediaLoaded && (
          <>
            <button
              className="media-nav-button media-nav-prev"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMedia();
              }}
              aria-label={language === 'zh' ? '上一个' : 'Previous'}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              className="media-nav-button media-nav-next"
              onClick={(e) => {
                e.stopPropagation();
                handleNextMedia();
              }}
              aria-label={language === 'zh' ? '下一个' : 'Next'}
            >
              <i className="fas fa-chevron-right"></i>
            </button>

            {/* 添加圆点导航指示器 */}
            <div className="media-dots-nav">
              {mediaToShow.map((_, index) => (
                <button
                  key={index}
                  className={`media-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGoToMedia(index);
                  }}
                  aria-label={language === 'zh' ? `查看第${index + 1}个` : `View media ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`story-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`story-modal-container ${isClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="story-close-button" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>
        
        {/* 三点菜单按钮 */}
        <button
          ref={menuButtonRef}
          className="story-menu-button"
          onClick={toggleMenu}
          title={language === 'zh' ? '更多操作' : 'More Actions'}
          style={{
            position: 'absolute',
            top: 18,
            right: 'auto',
            left: 18,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #666)',
            cursor: 'pointer',
            fontSize: 20,
            opacity: 0.85,
            transition: 'color 0.2s, opacity 0.2s',
            zIndex: 10,
          }}
          aria-label={language === 'zh' ? '更多操作' : 'More Actions'}
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          <i className="fas fa-ellipsis-v"></i>
        </button>
        
        {/* 下拉菜单 */}
        {showMenu && (
          <div
            ref={menuRef}
            className="story-menu-dropdown"
            style={{
              position: 'absolute',
              top: '48px',
              left: '18px',
              background: 'var(--bg-card, white)',
              boxShadow: 'var(--shadow-md, 0 2px 10px rgba(0,0,0,0.1))',
              borderRadius: '8px',
              padding: '4px 0',
              zIndex: 20,
              minWidth: '120px',
              border: '1px solid var(--border-primary, rgba(0,0,0,0.1))',
            }}
          >
            <button
              onClick={handleEdit}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text-secondary, #666)',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary, #f5f5f5)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
              <T zh="编辑" en="Edit" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                color: 'var(--accent-danger, #e53e3e)',
                transition: 'background-color 0.2s',
                opacity: isDeleting ? 0.6 : 1,
              }}
              onMouseOver={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary, #f5f5f5)')}
              onMouseOut={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <i className="fas fa-trash-alt" style={{ marginRight: '8px' }}></i>
              <T zh="删除" en="Delete" />
              {isDeleting && <i className="fas fa-circle-notch fa-spin" style={{ marginLeft: '8px' }}></i>}
            </button>
          </div>
        )}
        
        <div className="story-modal-media">
          {renderMedia()}
        </div>
        
        <div className="story-modal-content">
          <div className="story-header">
            <h2 className="story-title">{currentEvent.title}</h2>
            <div className="story-date">
              {formatDate(currentEvent.start_date)}
              {currentEvent.start_date !== currentEvent.end_date && ` - ${formatDate(currentEvent.end_date)}`}
            </div>
          </div>
          
          <div className="story-body">
            <p className="story-content">{currentEvent.content}</p>
          </div>
          
          {currentEvent.locations && currentEvent.locations.length > 0 && (
            <div className="story-locations">
              <h3 className="section-title">
                <i className="fas fa-map-marker-alt"></i>
                <T zh="地点" en="Locations" />
              </h3>
              <div className="locations-list">
                {currentEvent.locations.map(location => (
                  <div className="location-item" key={location.id}>
                    <span className="location-name">{location.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="keyboard-shortcuts">
            <p>
              <i className="fas fa-keyboard"></i> 
              {signedMediaUrls.length > 1 ? (
                <T 
                  zh="按 ← → 切换媒体，ESC 关闭" 
                  en="Press ← → to navigate, ESC to close" 
                />
              ) : (
                <T zh="按 ESC 关闭" en="Press ESC to close" />
              )}
            </p>
          </div>
          
          {deleteError && (
            <div className="delete-error-message" style={{ color: 'var(--accent-danger, #e53e3e)', marginBottom: 8, fontSize: 14 }}>
              <i className="fas fa-exclamation-circle"></i> {deleteError}
            </div>
          )}
        </div>
        
        {showEditModal && fullEvent && (
          <EditStoryModal 
            isOpen={showEditModal} 
            onClose={() => setShowEditModal(false)} 
            onSuccess={handleEditSuccess}
            event={fullEvent}
          />
        )}
      </div>
    </div>
  );
}