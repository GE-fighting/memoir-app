'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';
import { useAuth } from '../contexts/auth-context';
import CoupleLocations from './CoupleLocations';
import CreateStoryModal from './CreateStoryModal';
import StoryDetailModal from './StoryDetailModal';
import { eventService } from '../services/event-service';
import { TimelineEvent } from '../services/api-types';
import { getCoupleSignedUrl } from '../lib/services/coupleOssService';
import '@/styles/modal.css'; // 确保模态框样式优先加载

// Base64 编码的错误占位图，一个简单的灰色背景带有错误图标
const ERROR_PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiB2aWV3Qm94PSIwIDAgNDAwIDI1MCIgZmlsbD0ibm9uZSI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNGMEYwRjAiLz4KICA8cGF0aCBkPSJNMTgyLjUgMTMwLjVMMjAwIDEwMEwyMTcuNSAxMzAuNUgyMzVMMjAwIDc1TDE2NSAxMzAuNUgxODIuNVoiIGZpbGw9IiM5OTk5OTkiLz4KICA8cGF0aCBkPSJNMTY1IDE0MEgyMzVWMTcwSDE2NVYxNDBaIiBmaWxsPSIjOTk5OTk5Ii8+CiAgPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY2NjY2NiI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4=';

export default function Timeline() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // 添加故事详情模态框状态
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  
  // 每页加载的事件数量
  const PAGE_SIZE = 6;
  
  // 打开创建故事模态框
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  
  // 关闭创建故事模态框
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // 打开故事详情模态框
  const openDetailModal = (event: TimelineEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
  };
  
  // 关闭故事详情模态框
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };
  
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
  
  // 处理图片URL，获取签名URL
  const getSignedImageUrl = useCallback(async (url: string) => {
    if (!url) return ERROR_PLACEHOLDER_IMAGE;
    return getCoupleSignedUrl(url);
  }, []);
  
  // 截取内容前10个字符
  const truncateContent = (content: string) => {
    if (!content) return "";
    return content.length > 10 ? content.substring(0, 10) + "..." : content;
  };
  
  // 加载事件数据
  const loadEvents = useCallback(async (pageNumber: number, searchQuery: string = "") => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {
        couple_id: user.couple_id as string,
        page: pageNumber,
        page_size: PAGE_SIZE,
        title: searchQuery || undefined
      };
      
      const response = await eventService.getEvents(params);
      
      // 处理图片URL，获取签名URL
      const eventsWithSignedUrls = await Promise.all(response.data.map(async (event) => {
        console.log("处理事件图片:", event.id, event.title);
        event.cover_url = await getSignedImageUrl(event.cover_url || '');
        console.log("处理后的封面图:", event.cover_url);
        return event;
      }));
      if (pageNumber === 1) {
        setEvents(eventsWithSignedUrls);
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setEvents(prev => [...prev, ...eventsWithSignedUrls]);
      }
      
      setTotalEvents(response.total);
      setHasMore(response.data.length === PAGE_SIZE && pageNumber < response.total_pages);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '加载事件失败' : 'Failed to load events')
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, language, getSignedImageUrl]);
  
  // 初始加载和搜索条件变化时重新加载
  useEffect(() => {
    setPage(1);
    loadEvents(1, searchTerm);
  }, [searchTerm, loadEvents]);
  
  // 处理搜索输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // 处理搜索提交
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEvents(1, searchTerm);
  };
  
  // 故事创建成功的回调
  const handleStoryCreated = () => {
    // 重新加载第一页数据
    setPage(1);
    loadEvents(1, searchTerm);
    closeCreateModal();
  };
  
  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 处理加载更多按钮点击
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadEvents(nextPage, searchTerm);
    }
  };
  
  return (
    <>
      {/* 爱的足迹 - Journey Together Section */}
      <CoupleLocations />
      
      <div className="timeline-header">
        <form className="search-filter-group" onSubmit={handleSearchSubmit}>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder={language === 'zh' ? '搜索时间轴条目...' : 'Search timeline entries...'} 
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button type="submit" className="search-btn">
              <T zh="搜索" en="Search" />
            </button>
          </div>
        </form>
        <button className="btn btn-primary create-story-btn" onClick={openCreateModal}>
          <i className="fas fa-plus"></i>
          <T zh="新建故事" en="New Entry" />
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* 加载状态 - 仅首次加载时显示 */}
      {isLoading && page === 1 && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p><T zh="加载中..." en="Loading..." /></p>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && events.length === 0 && (
        <div className="empty-state">
          <i className="fas fa-book-open"></i>
          <h3><T zh="还没有故事" en="No Stories Yet" /></h3>
          <p>
            <T 
              zh="创建你们的第一个故事，记录美好时刻。" 
              en="Create your first story to record your special moments." 
            />
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <T zh="创建故事" en="Create Story" />
          </button>
        </div>
      )}

      {/* 时间轴网格 */}
      {events.length > 0 && (
        <div className="timeline-container" ref={timelineRef}>
          <div className="timeline-grid">
            {events.map((event) => (
              <div 
                className="timeline-card" 
                key={event.id} 
                onClick={() => openDetailModal(event)}
                role="button"
                tabIndex={0}
                aria-label={`查看故事: ${event.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDetailModal(event);
                  }
                }}
              >
                <div className="timeline-card-media">
                  {event.cover_url ? (
                      <img 
                        src={event.cover_url} 
                        alt={event.title} 
                        className="timeline-card-image"
                        loading="lazy"
                        onError={(e) => {
                          console.error("图片加载失败:", e.currentTarget.src);
                          // 使用 Base64 编码的错误占位图，避免无限循环
                          e.currentTarget.src = ERROR_PLACEHOLDER_IMAGE;
                          // 添加标记，防止重复触发错误处理
                          e.currentTarget.onerror = null;
                        }}
                      />
                  ) : (
                    <div className="timeline-card-placeholder">
                      <i className="fas fa-image"></i>
                    </div>
                  )}
                  <div className="timeline-card-date">
                    {formatDate(event.start_date)}
                    {event.start_date !== event.end_date && ` - ${formatDate(event.end_date)}`}
                  </div>
                  <div className="timeline-card-overlay">
                    <div className="view-story-btn">
                      <i className="fas fa-eye"></i>
                      <span><T zh="查看故事" en="View Story" /></span>
                    </div>
                  </div>
                </div>
                <div className="timeline-card-content">
                  <h3 className="timeline-card-title">{event.title}</h3>
                  <p className="timeline-card-description">
                    {truncateContent(event.content)}
                  </p>
                  <div className="timeline-card-footer">
                    {event.locations && event.locations.length > 0 && (
                      <div className="timeline-card-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {event.locations[0].name}
                        {event.locations.length > 1 && ` +${event.locations.length - 1}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 加载更多按钮 - 移到时间轴网格外部，确保它始终显示 */}
      {events.length > 0 && (
        <div className="load-more-container">
          {hasMore ? (
            <button 
              className={`load-more-btn ${isLoading && page > 1 ? 'loading' : ''}`}
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading && page > 1 ? (
                <>
                  <div className="loading-spinner-small"></div>
                  <T zh="加载中..." en="Loading..." />
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt"></i>
                  <T zh="加载更多" en="Load More" />
                </>
              )}
            </button>
          ) : (
            <div className="no-more-events">
              <T zh="没有更多故事了" en="No more stories" />
            </div>
          )}
        </div>
      )}
      
      {/* 事件计数 */}
      {events.length > 0 && (
        <div className="events-count">
          <T 
            zh={`共 ${totalEvents} 个故事`} 
            en={`${totalEvents} ${totalEvents === 1 ? 'Story' : 'Stories'} Total`} 
          />
        </div>
      )}

      {/* 回到顶部按钮 - 确保它始终可见并正常工作 */}
      {events.length > 0 && (
        <button 
          className="scroll-to-top-btn" 
          onClick={scrollToTop}
          aria-label={language === 'zh' ? '回到顶部' : 'Back to top'}
          type="button"
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}

      {/* 创建故事模态框 */}
      <CreateStoryModal 
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSuccess={handleStoryCreated}
      />

      {/* 故事详情模态框 */}
      <StoryDetailModal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        event={selectedEvent}
      />
      
      {/* 添加样式 */}
      <style jsx>{`
        .timeline-container {
          margin-top: 2rem;
          position: relative;
        }
        
        .timeline-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }
        
        .timeline-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: fadeIn 0.5s ease forwards;
          opacity: 0;
          cursor: pointer;
          position: relative;
          outline: none; /* 移除默认的焦点轮廓 */
        }
        
        .timeline-card:focus {
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15), 0 0 0 2px var(--primary);
        }
        
        .timeline-card:active {
          transform: scale(0.98);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .timeline-card:nth-child(1) { animation-delay: 0.1s; }
        .timeline-card:nth-child(2) { animation-delay: 0.2s; }
        .timeline-card:nth-child(3) { animation-delay: 0.3s; }
        .timeline-card:nth-child(4) { animation-delay: 0.4s; }
        .timeline-card:nth-child(5) { animation-delay: 0.5s; }
        .timeline-card:nth-child(6) { animation-delay: 0.6s; }
        
        .timeline-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
        }
        
        .timeline-card-media {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        
        .timeline-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .timeline-card:hover .timeline-card-image {
          transform: scale(1.05);
        }
        
        .timeline-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .timeline-card:hover .timeline-card-overlay {
          opacity: 1;
        }
        
        .view-story-btn {
          background: rgba(255, 255, 255, 0.9);
          color: var(--primary);
          padding: 10px 20px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transform: translateY(10px);
          transition: transform 0.3s ease, background-color 0.3s ease;
        }
        
        .timeline-card:hover .view-story-btn {
          transform: translateY(0);
        }
        
        .timeline-card:active .view-story-btn {
          background: rgba(255, 255, 255, 1);
        }
        
        .timeline-card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          color: #ccc;
          font-size: 3rem;
        }
        
        .timeline-card-date {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          color: white;
          padding: 1rem;
          font-size: 0.9rem;
          font-weight: 500;
          z-index: 2;
        }
        
        .timeline-card-content {
          padding: 1.5rem;
        }
        
        .timeline-card-title {
          margin: 0 0 0.75rem;
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--dark);
        }
        
        .timeline-card-description {
          color: #666;
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .timeline-card-footer {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid #eee;
        }
        
        .timeline-card-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #888;
          font-size: 0.9rem;
        }
        
        .load-more-container {
          display: flex;
          justify-content: center;
          margin-top: 3rem;
          margin-bottom: 1rem;
        }
        
        .load-more-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background-color: white;
          color: var(--primary);
          border: 2px solid var(--primary);
          border-radius: 30px;
          padding: 0.75rem 2rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .load-more-btn:hover {
          background-color: var(--primary);
          color: white;
        }
        
        .load-more-btn.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-left-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .no-more-events {
          color: #888;
          font-size: 0.9rem;
          text-align: center;
          padding: 1rem;
        }
        
        .events-count {
          text-align: center;
          color: #888;
          font-size: 0.9rem;
          margin-top: 2rem;
        }
        
        .scroll-to-top-btn {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: var(--primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 100;
        }
        
        .scroll-to-top-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .search-filter-group {
          flex: 1;
          min-width: 300px;
        }
        
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-box i {
          position: absolute;
          left: 1rem;
          color: #888;
        }
        
        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border: 1px solid #ddd;
          border-radius: 30px;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
        }
        
        .search-box input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(106, 123, 217, 0.1);
        }
        
        .search-btn {
          position: absolute;
          right: 5px;
          background-color: var(--primary);
          color: white;
          border: none;
          border-radius: 30px;
          padding: 0.5rem 1rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .search-btn:hover {
          background-color: var(--primary-dark);
        }
        
        .create-story-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(106, 123, 217, 0.1);
          border-left-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .error-message {
          background-color: #fff3f3;
          color: var(--danger);
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }
        
        .empty-state i {
          font-size: 3rem;
          color: #ddd;
          margin-bottom: 1rem;
        }
        
        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--dark);
        }
        
        .empty-state p {
          color: #888;
          margin-bottom: 2rem;
        }
        
        @media (max-width: 768px) {
          .timeline-grid {
            grid-template-columns: 1fr;
          }
          
          .timeline-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-filter-group {
            width: 100%;
          }
          
          .create-story-btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
} 