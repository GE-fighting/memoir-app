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
import '@/styles/timeline.css'; // 导入时间轴样式

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
  const PAGE_SIZE = 10;
  
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
      
      // 记录当前滚动位置
      const scrollPosition = window.scrollY;
      console.log("记录滚动位置:", scrollPosition, "页码:", pageNumber);
      
      const params = {
        couple_id: user.couple_id as string,
        page: pageNumber,
        page_size: PAGE_SIZE,
        title: searchQuery || undefined
      };
      
      const response = await eventService.getEvents(params);
      
      // 添加调试日志，输出API返回的分页信息
      console.log("API分页信息:", {
        当前页: response.page,
        每页数量: response.limit,
        总记录数: response.total,
        总页数: response.total_pages,
        当前返回数据量: response.data.length
      });
      
      // 处理图片URL，获取签名URL
      const eventsWithSignedUrls = await Promise.all(response.data.map(async (event) => {
        console.log("处理事件图片:", event.id, event.title);
        event.cover_url = await getSignedImageUrl(event.cover_url || '');
        console.log("处理后的封面图:", event.cover_url);
        return event;
      }));
      
      // 更新事件列表，确保正确合并数据
      setEvents(prev => {
        // 如果是第一页，替换所有数据
        if (pageNumber === 1) {
          // 滚动到顶部
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return eventsWithSignedUrls;
        } 
        // 如果是加载更多，合并数据
        else {
          const newEvents = [...prev, ...eventsWithSignedUrls];
          console.log("合并后的事件数:", newEvents.length);
          
          // 恢复滚动位置
          setTimeout(() => {
            window.scrollTo({ top: scrollPosition });
            console.log("恢复滚动位置:", scrollPosition);
          }, 100);
          
          return newEvents;
        }
      });
      
      setTotalEvents(response.total);
      
      // 修改hasMore的判断逻辑
      // 不依赖于events.length，而是直接使用当前页码和API返回信息计算
      const currentLoadedCount = (pageNumber - 1) * PAGE_SIZE + eventsWithSignedUrls.length;
      const hasMoreEvents = currentLoadedCount < response.total;
      
      console.log("加载更多状态:", {
        当前页码: pageNumber,
        当前页数据量: eventsWithSignedUrls.length,
        已加载总数: currentLoadedCount,
        总事件数: response.total,
        是否还有更多: hasMoreEvents
      });
      
      setHasMore(hasMoreEvents);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '加载事件失败' : 'Failed to load events')
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, language, getSignedImageUrl]); // 移除对events.length的依赖
  
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
      console.log("加载更多 - 页码:", nextPage, "当前事件数:", events.length);
      setPage(nextPage);
      loadEvents(nextPage, searchTerm);
    }
  };
  
  return (
    <>
      {/* 背景装饰元素 */}
      <div className="romantic-bg">
        <div className="bg-gradient"></div>
        <div className="bg-decoration"></div>
      </div>

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
          <T zh="创建回忆" en="Create Memory" />
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
            <T zh="创建回忆" en="Create Memory" />
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
                aria-label={`查看回忆: ${event.title}`}
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
                      <span><T zh="查看回忆" en="View Memory" /></span>
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
    </>
  );
} 