"use client";

import { useState, useEffect } from 'react';
import { 
  eventService, 
  mediaService, 
  wishlistService,
  TimelineEvent,
  PersonalMedia,
  WishlistItem,
  WishlistItemStatus
} from '@/services';
import { useAuth } from '@/contexts/auth-context';

/**
 * API 服务使用示例组件
 * 展示了如何在组件中使用各种 API 服务
 */
export default function ApiExample() {
  // 获取用户上下文
  const { user } = useAuth();
  
  // 状态定义
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [media, setMedia] = useState<PersonalMedia[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState({
    events: true,
    media: true,
    wishlist: true
  });
  const [error, setError] = useState({
    events: null as string | null,
    media: null as string | null,
    wishlist: null as string | null
  });

  // 获取时间轴事件列表
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // 从用户上下文或 localStorage 获取 couple_id
        const coupleId = user?.couple_id || localStorage.getItem('coupleID');
        
        if (!coupleId) {
          setError(prev => ({ ...prev, events: '无法获取情侣ID，请先登录' }));
          setLoading(prev => ({ ...prev, events: false }));
          return;
        }
        
        const response = await eventService.getEvents({
          page: 1,
          page_size: 5,
          couple_id: coupleId
        });
        setEvents(response.data || []);
      } catch (err) {
        console.error('获取事件失败:', err);
        setError(prev => ({ ...prev, events: '获取事件失败' }));
      } finally {
        setLoading(prev => ({ ...prev, events: false }));
      }
    };

    fetchEvents();
  }, [user]);

  // 获取媒体列表
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await mediaService.queryPersonalMedia({
          page: 1,
          page_size: 5
        });
        setMedia(response.data || []);
      } catch (err) {
        console.error('获取媒体失败:', err);
        setError(prev => ({ ...prev, media: '获取媒体失败' }));
      } finally {
        setLoading(prev => ({ ...prev, media: false }));
      }
    };

    fetchMedia();
  }, []);

  // 获取心愿清单列表
  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        // 从用户上下文或 localStorage 获取 couple_id
        const coupleId = user?.couple_id || localStorage.getItem('coupleID');
        
        if (!coupleId) {
          setError(prev => ({ ...prev, wishlist: '无法获取情侣ID，请先登录' }));
          setLoading(prev => ({ ...prev, wishlist: false }));
          return;
        }
        
        const items = await wishlistService.getWishlistItems(coupleId);
        setWishlistItems(items || []);
      } catch (err) {
        console.error('获取心愿清单失败:', err);
        setError(prev => ({ ...prev, wishlist: '获取心愿清单失败' }));
      } finally {
        setLoading(prev => ({ ...prev, wishlist: false }));
      }
    };

    fetchWishlist();
  }, [user]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API 服务使用示例</h1>
      
      {/* 时间轴事件 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">时间轴事件</h2>
        {loading.events ? (
          <p>加载中...</p>
        ) : error.events ? (
          <p className="text-red-500">{error.events}</p>
        ) : events.length === 0 ? (
          <p>暂无事件</p>
        ) : (
          <ul className="space-y-4">
            {events.map(event => (
              <li key={event.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-lg">{event.title}</h3>
                <p className="text-gray-600">{event.content}</p>
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">日期：</span>
                  <span>{new Date(event.start_date).toLocaleDateString('zh-CN')}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      
      {/* 媒体展示 */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">照片和视频</h2>
        {loading.media ? (
          <p>加载中...</p>
        ) : error.media ? (
          <p className="text-red-500">{error.media}</p>
        ) : media.length === 0 ? (
          <p>暂无媒体</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {media.map(item => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                {item.media_type === 'photo' ? (
                  <img 
                    src={item.thumbnail_url || item.media_url} 
                    alt={item.title || `照片 ${item.id}`}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                    <img 
                      src={item.thumbnail_url || ''} 
                      alt={item.title || `视频 ${item.id}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-80" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="p-2">
                  <h3 className="font-medium text-sm truncate">{item.title || `媒体 ${item.id}`}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* 心愿清单 */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">心愿清单</h2>
        {loading.wishlist ? (
          <p>加载中...</p>
        ) : error.wishlist ? (
          <p className="text-red-500">{error.wishlist}</p>
        ) : wishlistItems.length === 0 ? (
          <p>暂无心愿</p>
        ) : (
          <ul className="space-y-4">
            {wishlistItems.map(item => (
              <li key={item.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">{item.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === WishlistItemStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                    item.status === WishlistItemStatus.PENDING ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {
                      item.status === WishlistItemStatus.COMPLETED ? '已完成' :
                      item.status === WishlistItemStatus.PENDING ? '进行中' : '已取消'
                    }
                  </span>
                </div>
                {item.description && (
                  <p className="text-gray-600 mt-2">{item.description}</p>
                )}
                {item.reminder_date && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">提醒日期：</span>
                    <span>{new Date(item.reminder_date).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
} 