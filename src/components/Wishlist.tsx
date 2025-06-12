'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { useWishModal } from './ui/wish-modal';
import { wishlistService } from '@/services/wishlist-service';
import { WishlistItem as WishlistItemType, WishlistItemStatus } from '@/services/api-types';
import { useAuth } from '@/contexts/auth-context';

export default function Wishlist() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<1 | 2>(1); // 1-日常，2-旅行
  const [wishlist, setWishlist] = useState<WishlistItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingWish, setEditingWish] = useState<WishlistItemType | null>(null);
  
  // 从用户信息或localStorage中获取情侣ID
  const coupleId = user?.couple_id || 
                  (typeof window !== 'undefined' ? localStorage.getItem('coupleID') : null) || 
                  "1"; // 如果都不存在，则使用默认值
  
  useEffect(() => {
    if (coupleId) {
      fetchWishlistItems();
    } else {
      setError(language === 'zh' ? '未找到情侣关系，请先建立关系' : 'No couple relationship found, please establish one first');
    }
  }, [coupleId, language]);

  const fetchWishlistItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching wishlist items for couple ID: ${coupleId}`);
      const items = await wishlistService.getWishlistItems(coupleId);
      setWishlist(items);
    } catch (err) {
      console.error('Failed to fetch wishlist items:', err);
      setError(language === 'zh' ? '获取心愿单失败' : 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const { openModal, WishModalComponent } = useWishModal({
    onSave: async (wishData) => {
      try {
        setLoading(true);
        setError(null);
        
        if (editingWish) {
          // 更新现有心愿
          const updatedWish = await wishlistService.updateWishlistItem({
            ID: editingWish.id,
            title: wishData.title,
            description: wishData.description,
            priority: wishData.priority || editingWish.priority,
            type: wishData.category === 'travel' ? 2 : 1,
            reminder_date: wishData.date
          });
          
          setWishlist(wishlist.map(wish => 
            wish.id === updatedWish.id ? updatedWish : wish
          ));
          setEditingWish(null);
        } else {
          // 创建新心愿
          const newWish = await wishlistService.createWishlistItem({
            couple_id: coupleId,
            title: wishData.title,
            description: wishData.description,
            priority: wishData.priority || 2, // 默认为中等
            type: wishData.category === 'travel' ? 2 : 1, // 1-日常，2-旅行
            reminder_date: wishData.date
          });
          
          setWishlist([...wishlist, newWish]);
        }
      } catch (err) {
        console.error('Failed to save wishlist item:', err);
        setError(language === 'zh' ? 
          (editingWish ? '更新心愿单项目失败' : '创建心愿单项目失败') : 
          (editingWish ? 'Failed to update wishlist item' : 'Failed to create wishlist item'));
      } finally {
        setLoading(false);
      }
    }
  });

  const editWish = (wish: WishlistItemType) => {
    setEditingWish(wish);
    openModal(wish.type === 2 ? 'travel' : 'promise', {
      title: wish.title,
      description: wish.description || '',
      priority: wish.priority,
      category: wish.type === 2 ? 'travel' : 'promise',
      date: wish.reminder_date
    });
  };

  const toggleComplete = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const item = wishlist.find(wish => wish.id === id);
      if (!item) return;
      
      const newStatus = item.status === WishlistItemStatus.COMPLETED 
        ? WishlistItemStatus.PENDING 
        : WishlistItemStatus.COMPLETED;
      
      await wishlistService.updateWishlistItemStatus(id, { status: newStatus });
      
      setWishlist(wishlist.map(wish => 
        wish.id === id ? { ...wish, status: newStatus } : wish
      ));
    } catch (err) {
      console.error('Failed to update wishlist item status:', err);
      setError(language === 'zh' ? '更新心愿单状态失败' : 'Failed to update wishlist item status');
    } finally {
      setLoading(false);
    }
  };

  const deleteWish = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await wishlistService.deleteWishlistItem(id);
      
      setWishlist(wishlist.filter(wish => wish.id !== id));
    } catch (err) {
      console.error('Failed to delete wishlist item:', err);
      setError(language === 'zh' ? '删除心愿单项目失败' : 'Failed to delete wishlist item');
    } finally {
      setLoading(false);
    }
  };

  const filteredWishes = wishlist.filter(wish => wish.type === activeCategory);
  
  return (
    <div className="wish-container">
      {WishModalComponent}
      
      <div className="category-tabs">
        <button 
          className={`category-tab ${activeCategory === 2 ? 'active' : ''}`}
          onClick={() => setActiveCategory(2)}
        >
          <i className="fas fa-map-marked-alt"></i>
          <span><T zh="旅行梦想" en="Travel Dreams" /></span>
        </button>
        <button 
          className={`category-tab ${activeCategory === 1 ? 'active' : ''}`}
          onClick={() => setActiveCategory(1)}
        >
          <i className="fas fa-hands-holding-heart"></i>
          <span><T zh="共赴之约" en="Love Promises" /></span>
        </button>
      </div>

      <div className="wish-add-form">
        <button 
          className="wish-add-btn w-full flex items-center justify-center gap-2"
          onClick={() => {
            setEditingWish(null);
            openModal(activeCategory === 2 ? 'travel' : 'promise');
          }}
          disabled={loading}
        >
          <i className="fas fa-plus"></i>
          <T zh="添加" en="Add" />
        </button>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p><T zh="加载中..." en="Loading..." /></p>
        </div>
      )}

      <div className="wish-list">
        {!loading && filteredWishes.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-heart"></i>
            <p><T zh="还没有心愿，添加一个吧！" en="No wishes yet, add one!" /></p>
          </div>
        ) : (
          filteredWishes.map(wish => (
            <div className={`wish-item ${wish.status === WishlistItemStatus.COMPLETED ? 'completed' : ''} priority-${wish.priority === 1 ? 'high' : wish.priority === 2 ? 'medium' : 'low'}`} key={wish.id}>
              <div className="wish-checkbox" onClick={() => toggleComplete(wish.id)}>
                {wish.status === WishlistItemStatus.COMPLETED ? <i className="fas fa-check"></i> : null}
              </div>
              <div className="wish-content">
                <h3 className="wish-title">
                  {wish.title}
                  <span className={`priority-badge priority-${wish.priority === 1 ? 'high' : wish.priority === 2 ? 'medium' : 'low'}`}>
                    <i className="fas fa-flag"></i>
                    <span>{wish.priority === 1 ? <T zh="高" en="High" /> : 
                          wish.priority === 2 ? <T zh="中" en="Medium" /> : 
                          <T zh="低" en="Low" />}
                    </span>
                  </span>
                </h3>
                {wish.description && <p className="wish-description">{wish.description}</p>}
                {wish.reminder_date && (
                  <div className="wish-date">
                    <i className="fas fa-calendar"></i>
                    <span>{wish.reminder_date}</span>
                  </div>
                )}
              </div>
              <div className="wish-actions">
                <button className="wish-edit" onClick={() => editWish(wish)} disabled={loading}>
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <button className="wish-delete" onClick={() => deleteWish(wish.id)} disabled={loading}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .wish-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .category-tabs {
          display: flex;
          margin-bottom: 24px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .category-tab {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #666;
          transition: all 0.3s ease;
        }

        .category-tab.active {
          background: #6c5ce7;
          color: white;
        }

        .category-tab i {
          font-size: 18px;
        }

        .wish-add-form {
          display: flex;
          margin-bottom: 24px;
          gap: 12px;
        }

        .wish-add-btn {
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 14px 24px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.3s ease;
        }

        .wish-add-btn:hover {
          background: #5b4ecc;
        }

        .wish-add-btn:disabled {
          background: #a29ddb;
          cursor: not-allowed;
        }

        .error-message {
          background: #ffe0e0;
          color: #d63031;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          color: #adb5bd;
          text-align: center;
        }

        .loading-state i,
        .empty-state i {
          font-size: 48px;
          margin-bottom: 16px;
          color: #e9ecef;
        }

        .wish-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wish-item {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          padding-left: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border-left-width: 6px;
          border-left-style: solid;
        }

        .wish-item.completed {
          background: #f8f9fa;
          border-left-color: #adb5bd !important;
        }

        .wish-item.priority-high {
          border-left-color: #e74c3c;
        }

        .wish-item.priority-medium {
          border-left-color: #f39c12;
        }

        .wish-item.priority-low {
          border-left-color: #2ecc71;
        }

        .wish-item.completed .wish-title,
        .wish-item.completed .wish-description {
          text-decoration: line-through;
          color: #adb5bd;
        }

        .wish-checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid #6c5ce7;
          border-radius: 50%;
          margin-right: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
          background: transparent;
          transition: all 0.2s ease;
        }

        .wish-item.completed .wish-checkbox {
          background: #6c5ce7;
        }

        .wish-content {
          flex: 1;
        }

        .wish-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 8px 0;
          color: #333;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: normal;
          padding: 2px 8px;
          border-radius: 12px;
          color: white;
        }

        .priority-badge.priority-high {
          background-color: #e74c3c;
        }

        .priority-badge.priority-medium {
          background-color: #f39c12;
        }

        .priority-badge.priority-low {
          background-color: #2ecc71;
        }

        .wish-description {
          font-size: 14px;
          color: #666;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .wish-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #888;
          margin-bottom: 4px;
        }

        .wish-actions {
          display: flex;
          gap: 8px;
        }

        .wish-edit,
        .wish-delete {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          color: #ccc;
        }

        .wish-edit:hover {
          color: #6c5ce7;
          background: #f5f3ff;
        }

        .wish-delete:hover {
          color: #ff6b6b;
          background: #fff0f0;
        }

        .wish-edit:disabled,
        .wish-delete:disabled {
          color: #e9ecef;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
} 