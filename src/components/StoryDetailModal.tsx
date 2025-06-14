'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';
import { TimelineEvent, PersonalMedia } from '../services/api-types';
import { getCoupleSignedUrl } from '../lib/services/coupleOssService';
import { eventService } from '../services/event-service';
import Image from 'next/image';

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
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  
  // 添加新的状态变量
  const [fullEvent, setFullEvent] = useState<TimelineEvent | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  
  // 触摸滑动相关状态
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // 检测设备类型
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // 格式化日期
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

  // 加载完整的故事数据
  const loadEventDetails = useCallback(async () => {
    if (!event || !event.id) return;
    
    try {
      setIsLoadingEvent(true);
      setEventError(null);
      
      // 调用 getEvent 接口获取完整的故事数据
      const fullEventData = await eventService.getEvent(event.id);
      setFullEvent(fullEventData);
    } catch (error) {
      console.error('获取故事详情失败:', error);
      setEventError(language === 'zh' ? '加载故事详情失败，请稍后重试' : 'Failed to load story details, please try again later');
      // 如果获取详情失败，使用传入的事件数据作为备用
      setFullEvent(event);
    } finally {
      setIsLoadingEvent(false);
    }
  }, [event, language]);

  // 当模态框打开且有事件ID时，加载完整的故事数据
  useEffect(() => {
    if (isOpen && event) {
      loadEventDetails();
    } else {
      setFullEvent(null);
    }
  }, [isOpen, event, loadEventDetails]);

  // 获取签名媒体URL
  const getSignedMediaUrls = useCallback(async () => {
    // 使用 fullEvent 代替 event
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
            // 使用 Base64 编码的错误占位图，而不是外部 placeholder 服务
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

  // 当事件变化时获取签名URL
  useEffect(() => {
    if (isOpen && (fullEvent || event)) {
      getSignedMediaUrls();
    } else {
      setCurrentMediaIndex(0);
      setImageLoaded(false);
    }
  }, [isOpen, fullEvent, event, getSignedMediaUrls]);

  // 处理媒体导航
  const handlePrevMedia = () => {
    setImageLoaded(false);
    setSlideDirection('prev');
    setCurrentMediaIndex((prev) => 
      prev === 0 ? signedMediaUrls.length - 1 : prev - 1
    );
  };

  const handleNextMedia = () => {
    setImageLoaded(false);
    setSlideDirection('next');
    setCurrentMediaIndex((prev) => 
      prev === signedMediaUrls.length - 1 ? 0 : prev + 1
    );
  };

  // 处理图片加载完成
  const handleImageLoaded = () => {
    setImageLoaded(true);
  };

  // 处理图片加载错误
  const handleImageError = () => {
    setImageLoaded(true);
    setLoadingError(language === 'zh' ? '图片加载失败' : 'Failed to load image');
    // 使用 Base64 编码的错误占位图
    if (mediaContainerRef.current) {
      const imgElement = mediaContainerRef.current.querySelector('img');
      if (imgElement) {
        imgElement.src = ERROR_PLACEHOLDER_IMAGE;
        // 防止重复触发错误处理
        imgElement.onerror = null;
      }
    }
  };

  // 处理关闭模态框
  const handleClose = () => {
    setIsClosing(true);
    // 添加延迟，等待关闭动画完成
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };
  
  // 触摸事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || signedMediaUrls.length <= 1) return;
    
    const touchDiff = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50; // 最小滑动距离，以像素为单位
    
    if (touchDiff > minSwipeDistance) {
      // 向右滑动，显示上一张
      handlePrevMedia();
    } else if (touchDiff < -minSwipeDistance) {
      // 向左滑动，显示下一张
      handleNextMedia();
    }
    
    // 重置触摸状态
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // 添加键盘导航支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          if (signedMediaUrls.length > 1) handlePrevMedia();
          break;
        case 'ArrowRight':
          if (signedMediaUrls.length > 1) handleNextMedia();
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
  }, [isOpen, signedMediaUrls.length, onClose]);

  // 如果模态框不是打开状态，不渲染任何内容
  if (!isOpen) return null;
  
  // 使用 fullEvent 或 event
  const currentEvent = fullEvent || event;
  
  // 如果没有事件数据，显示加载状态
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

  // 渲染媒体内容
  const renderMedia = () => {
    // 如果正在加载故事数据
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
    
    // 如果加载故事数据时出错
    if (eventError) {
      return (
        <div className="media-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{eventError}</p>
          <button 
            className="retry-button"
            onClick={loadEventDetails}
          >
            <T zh="重试" en="Retry" />
          </button>
        </div>
      );
    }
    
    // 如果正在加载签名URL
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

    // 如果加载签名URL时出错
    if (loadingError && signedMediaUrls.length === 0) {
      return (
        <div className="media-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{loadingError}</p>
          <button 
            className="retry-button"
            onClick={() => getSignedMediaUrls()}
          >
            <T zh="重试" en="Retry" />
          </button>
        </div>
      );
    }

    // 如果没有媒体，使用封面图片
    if (signedMediaUrls.length === 0) {
      return currentEvent.cover_url ? (
        <div className="media-container">
          <img 
            src={currentEvent.cover_url} 
            alt={currentEvent.title} 
            className={`media-image ${imageLoaded ? 'loaded' : ''}`}
            onLoad={handleImageLoaded}
            onError={handleImageError}
          />
          {!imageLoaded && (
            <div className="image-loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="media-placeholder">
          <i className="fas fa-image"></i>
          <p><T zh="暂无图片" en="No Images" /></p>
        </div>
      );
    }

    // 渲染媒体
    return (
      <div 
        className="media-container" 
        ref={mediaContainerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={signedMediaUrls[currentMediaIndex]} 
          alt={`${currentEvent.title} - ${currentMediaIndex + 1}`} 
          className={`media-image ${imageLoaded ? 'loaded' : ''} ${slideDirection ? `slide-${slideDirection}` : ''}`}
          onLoad={() => {
            setImageLoaded(true);
            // 重置滑动方向，以便下次动画正常工作
            setTimeout(() => setSlideDirection(null), 500);
          }}
          onError={handleImageError}
        />
        
        {/* 图片加载中的覆盖层 */}
        {!imageLoaded && (
          <div className="image-loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {/* 如果加载特定图片时出错 */}
        {loadingError && imageLoaded && (
          <div className="image-error-overlay">
            <i className="fas fa-exclamation-circle"></i>
            <p>{loadingError}</p>
          </div>
        )}
        
        {/* 媒体导航按钮 - 在非移动设备上显示 */}
        {signedMediaUrls.length > 1 && !isMobile && (
          <>
            <button 
              className="media-nav-btn prev-btn" 
              onClick={handlePrevMedia}
              aria-label={language === 'zh' ? '上一张' : 'Previous'}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="media-nav-btn next-btn" 
              onClick={handleNextMedia}
              aria-label={language === 'zh' ? '下一张' : 'Next'}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </>
        )}
        
        {/* 媒体计数指示器 */}
        {signedMediaUrls.length > 1 && (
          <div className="media-counter">
            {currentMediaIndex + 1} / {signedMediaUrls.length}
          </div>
        )}
        
        {/* 添加键盘/触摸导航提示 */}
        {signedMediaUrls.length > 1 && (
          <div className="keyboard-nav-hint">
            {isMobile ? (
              <span><i className="fas fa-hand-pointer"></i> <T zh="左右滑动切换图片" en="Swipe to navigate" /></span>
            ) : (
              <span><i className="fas fa-keyboard"></i> <T zh="使用 ← → 键导航" en="Use ← → keys to navigate" /></span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`story-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`story-modal-container ${isClosing ? 'closing' : ''} ${isMobile ? 'mobile' : ''}`} onClick={e => e.stopPropagation()}>
        {/* 关闭按钮 - 在移动设备上显示在顶部 */}
        {isMobile && (
          <button className="story-close-button mobile" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        )}
        
        {/* 左侧：媒体展示区 */}
        <div className="story-modal-media">
          {renderMedia()}
        </div>
        
        {/* 右侧：故事详情 */}
        <div className="story-modal-content">
          {/* 关闭按钮 - 在非移动设备上显示在右侧内容区 */}
          {!isMobile && (
            <button className="story-close-button" onClick={handleClose}>
              <i className="fas fa-times"></i>
            </button>
          )}
          
          {/* 故事标题和日期 */}
          <div className="story-header">
            <h2 className="story-title">{currentEvent.title}</h2>
            <div className="story-date">
              {formatDate(currentEvent.start_date)}
              {currentEvent.start_date !== currentEvent.end_date && ` - ${formatDate(currentEvent.end_date)}`}
            </div>
          </div>
          
          {/* 故事内容 */}
          <div className="story-body">
            <p className="story-content">{currentEvent.content}</p>
          </div>
          
          {/* 故事地点 */}
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
          
          {/* 添加键盘快捷键提示 - 在非移动设备上显示 */}
          {!isMobile && (
            <div className="keyboard-shortcuts">
              <p><i className="fas fa-keyboard"></i> <T zh="按 ESC 关闭" en="Press ESC to close" /></p>
            </div>
          )}
        </div>
      </div>
      
      {/* 添加样式 */}
      <style jsx>{`
        .story-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 20px;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        
        .story-modal-overlay.closing {
          opacity: 0;
        }
        
        .story-modal-container {
          display: flex;
          width: 95%;
          max-width: 1200px;
          height: 85vh;
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          animation: modal-appear 0.3s ease;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s ease, opacity 0.3s ease;
          position: relative;
        }
        
        .story-modal-container.mobile {
          flex-direction: column;
          height: 95vh;
          width: 100%;
          border-radius: 0;
        }
        
        .story-modal-container.closing {
          transform: scale(0.95);
          opacity: 0;
        }
        
        @keyframes modal-appear {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .story-modal-media {
          flex: 3;
          background-color: #000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .story-modal-content {
          flex: 2;
          padding: 30px;
          position: relative;
          overflow-y: auto;
          background-color: white;
          animation: content-slide-in 0.4s ease;
        }
        
        @keyframes content-slide-in {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .story-close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #999;
          cursor: pointer;
          transition: color 0.2s, transform 0.2s;
          z-index: 10;
        }
        
        .story-close-button.mobile {
          top: 10px;
          right: 10px;
          color: white;
          font-size: 1.8rem;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        
        .story-close-button:hover {
          color: #333;
          transform: scale(1.1);
        }
        
        .story-close-button.mobile:hover {
          color: white;
        }
        
        .story-header {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .story-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 12px;
          color: #262626;
        }
        
        .story-date {
          font-size: 1rem;
          color: #8e8e8e;
        }
        
        .story-body {
          margin-bottom: 24px;
        }
        
        .story-content {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #262626;
          white-space: pre-wrap;
        }
        
        .story-locations {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #eee;
        }
        
        .section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #262626;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .locations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .location-item {
          display: flex;
          flex-direction: column;
          padding: 12px 16px;
          background-color: #fafafa;
          border-radius: 8px;
          transition: transform 0.2s ease;
        }
        
        .location-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        .location-name {
          font-weight: 600;
          color: #262626;
        }
        
        .location-description {
          font-size: 0.9rem;
          color: #8e8e8e;
          margin-top: 4px;
        }
        
        .media-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          touch-action: pan-y; /* 允许垂直滚动，但水平滑动会被捕获 */
        }
        
        .media-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.5s ease;
        }
        
        .media-image.loaded {
          opacity: 1;
        }
        
        .media-image.slide-next {
          animation: slide-from-right 0.5s ease;
        }
        
        .media-image.slide-prev {
          animation: slide-from-left 0.5s ease;
        }
        
        @keyframes slide-from-right {
          from {
            transform: translateX(50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-from-left {
          from {
            transform: translateX(-50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .image-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 4;
        }
        
        .image-error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          z-index: 4;
        }
        
        .image-error-overlay i {
          font-size: 3rem;
          color: #ff5252;
          margin-bottom: 16px;
        }
        
        .media-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(255, 255, 255, 0.8);
          color: #262626;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 5;
          opacity: 0.7;
        }
        
        .media-nav-btn:hover {
          background-color: rgba(255, 255, 255, 0.95);
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }
        
        .prev-btn {
          left: 16px;
        }
        
        .next-btn {
          right: 16px;
        }
        
        .media-counter {
          position: absolute;
          top: 16px;
          right: 16px;
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.8rem;
          z-index: 5;
        }
        
        .keyboard-nav-hint {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        
        .keyboard-nav-hint:hover {
          opacity: 1;
        }
        
        .keyboard-shortcuts {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #eee;
          font-size: 0.9rem;
          color: #8e8e8e;
          text-align: center;
        }
        
        .media-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #8e8e8e;
        }
        
        .media-placeholder i {
          font-size: 3rem;
          margin-bottom: 16px;
        }
        
        .media-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
        }
        
        .loading-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .loading-spinner-container p {
          margin-top: 16px;
          font-size: 1rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .media-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: white;
          text-align: center;
          padding: 20px;
        }
        
        .media-error i {
          font-size: 3rem;
          color: #ff5252;
          margin-bottom: 16px;
        }
        
        .media-error p {
          margin-bottom: 24px;
          font-size: 1.1rem;
        }
        
        .retry-button {
          background-color: white;
          color: #262626;
          border: none;
          border-radius: 20px;
          padding: 8px 24px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .retry-button:hover {
          background-color: #f1f1f1;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .story-modal-overlay {
            padding: 0;
          }
          
          .story-modal-container {
            flex-direction: column;
            height: 100vh;
            width: 100%;
            border-radius: 0;
            max-width: none;
          }
          
          .story-modal-media {
            flex: none;
            height: 40%;
          }
          
          .story-modal-content {
            flex: none;
            height: 60%;
            padding: 20px;
          }
          
          .story-title {
            font-size: 1.5rem;
            margin-bottom: 8px;
          }
          
          .story-content {
            font-size: 1rem;
          }
          
          .section-title {
            font-size: 1.1rem;
          }
          
          /* 增强移动设备上的触摸区域 */
          .media-container {
            cursor: grab;
          }
          
          .media-container:active {
            cursor: grabbing;
          }
        }
      `}</style>
    </div>
  );
} 