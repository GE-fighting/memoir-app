'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';
import { TimelineEvent, PersonalMedia } from '../services/api-types';
import { getCoupleSignedUrl } from '../lib/services/coupleOssService';
import { eventService } from '../services/event-service';
import Image from 'next/image';
import '../styles/story-modal.css';

interface StoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
}

// Base64 编码的错误占位图，一个简单的灰色背景带有错误图标
const ERROR_PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNGMEYwRjAiLz4KICA8cGF0aCBkPSJNMTgyLjUgMTMwLjVMMjAwIDEwMEwyMTcuNSAxMzAuNUgyMzVMMjAwIDc1TDE2NSAxMzAuNUgxODIuNVoiIGZpbGw9IiM5OTk5OTkiLz4KICA8cGF0aCBkPSJNMTY1IDE0MEgyMzVWMTcwSDE2NVYxNDBaIiBmaWxsPSIjOTk5OTk5Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NjY2NiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4=';

export default function StoryDetailModal({ isOpen, onClose, event }: StoryDetailModalProps) {
  const { language } = useLanguage();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [signedMediaUrls, setSignedMediaUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
  // 移除滑动方向状态
  
  const [fullEvent, setFullEvent] = useState<TimelineEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  
  const mediaContainerRef = useRef<HTMLDivElement>(null);

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
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingError(null);
      setImageLoaded(false);

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
    } catch (error) {
      console.error('获取签名媒体URL失败:', error);
      setLoadingError(language === 'zh' ? '加载媒体失败，请稍后重试' : 'Failed to load media, please try again later');
    } finally {
      setIsLoading(false);
    }
  }, [fullEvent, event, language]);

  useEffect(() => {
    if (isOpen && (fullEvent || event)) {
      getSignedMediaUrls();
    } else {
      setCurrentMediaIndex(0);
      setImageLoaded(false);
    }
  }, [isOpen, fullEvent, event, getSignedMediaUrls]);

  // 保留键盘导航功能，但简化实现
  const handlePrevMedia = useCallback(() => {
    if (signedMediaUrls.length <= 1) return;
    setImageLoaded(false);
    setCurrentMediaIndex((prev) =>
      prev === 0 ? signedMediaUrls.length - 1 : prev - 1
    );
  }, [signedMediaUrls.length]);

  const handleNextMedia = useCallback(() => {
    if (signedMediaUrls.length <= 1) return;
    setImageLoaded(false);
    setCurrentMediaIndex((prev) =>
      prev === signedMediaUrls.length - 1 ? 0 : prev + 1
    );
  }, [signedMediaUrls.length]);
  
  const handleGoToMedia = useCallback((index: number) => {
    if (index === currentMediaIndex || signedMediaUrls.length <= 1) return;
    setImageLoaded(false);
    setCurrentMediaIndex(index);
  }, [currentMediaIndex, signedMediaUrls.length]);

  const handleImageLoaded = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(true);
    setLoadingError(language === 'zh' ? '图片加载失败' : 'Failed to load image');
    if (mediaContainerRef.current) {
      const imgElement = mediaContainerRef.current.querySelector('img');
      if (imgElement) {
        imgElement.src = ERROR_PLACEHOLDER_IMAGE;
        imgElement.onerror = null;
      }
    }
  };

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

    // 移除触摸相关代码

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
          handleClose();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrevMedia, handleNextMedia, handleClose]);

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
    
    return (
      <div 
        className="media-container" 
        ref={mediaContainerRef}
      >
        <img 
          key={mediaToShow[currentIndex]} // Add key for re-rendering on src change
          src={mediaToShow[currentIndex]} 
          alt={`${currentEvent.title} - ${currentIndex + 1}`} 
          className={`media-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoaded}
          onError={handleImageError}
        />
        
        {!imageLoaded && (
          <div className="image-loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {loadingError && imageLoaded && (
          <div className="image-error-overlay">
            <i className="fas fa-exclamation-circle"></i>
            <p>{loadingError}</p>
          </div>
        )}
        
        {/* 添加左右导航按钮 - 仅在有多个媒体且已加载完成时显示 */}
        {mediaToShow.length > 1 && imageLoaded && (
          <>
            <button 
              className="media-nav-button media-nav-prev" 
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMedia();
              }}
              aria-label={language === 'zh' ? '上一张' : 'Previous'}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="media-nav-button media-nav-next" 
              onClick={(e) => {
                e.stopPropagation();
                handleNextMedia();
              }}
              aria-label={language === 'zh' ? '下一张' : 'Next'}
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
                  aria-label={language === 'zh' ? `查看第${index + 1}张` : `View image ${index + 1}`}
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
                    {location.description && (
                      <span className="location-description">{location.description}</span>
                    )}
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
        </div>
      </div>
    </div>
  );
}