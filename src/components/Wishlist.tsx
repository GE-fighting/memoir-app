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

      {/* 浮动添加按钮 */}
      <button 
        className="fab-button"
        onClick={() => {
          setEditingWish(null);
          openModal(activeCategory === 2 ? 'travel' : 'promise');
        }}
        disabled={loading}
        aria-label={language === 'zh' ? '添加心愿' : 'Add wish'}
      >
        <i className="fas fa-plus"></i>
        <span className="fab-tooltip">{language === 'zh' ? '添加' : 'Add'}</span>
      </button>

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
          background: var(--bg-card, white);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.05));
          border: 1px solid var(--border-primary, transparent);
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
          color: var(--text-secondary, #666);
          transition: all 0.3s ease;
        }

        .category-tab.active {
          background: var(--accent-primary, #6c5ce7);
          color: var(--text-inverse, white);
        }

        .category-tab i {
          font-size: 18px;
        }

        .fab-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: var(--accent-primary, #6c5ce7);
          color: var(--text-inverse, white);
          border: none;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg, 0 4px 12px rgba(108, 92, 231, 0.3));
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 100;
          transform: translateZ(0);
        }

        /* 移动设备上的样式调整 */
        @media (max-width: 768px) {
          .fab-button {
            bottom: 20px;
            right: 20px;
            width: 56px;
            height: 56px;
            font-size: 22px;
          }
        }

        .fab-button:hover {
          background: var(--accent-hover, #5b4ecc);
          box-shadow: var(--shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.3));
          transform: translateY(-2px);
        }

        .fab-button:active {
          transform: translateY(0);
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.2));
        }

        .fab-button:disabled {
          background: var(--accent-disabled, #a29ddb);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .fab-button i {
          transition: transform 0.2s ease;
        }

        .fab-button:hover i {
          transform: rotate(90deg);
        }

        .fab-tooltip {
          position: absolute;
          right: 70px;
          background: var(--bg-tooltip, rgba(0, 0, 0, 0.7));
          color: var(--text-inverse, white);
          padding: 5px 12px;
          border-radius: 4px;
          font-size: 14px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .fab-button:hover .fab-tooltip {
          opacity: 1;
          visibility: visible;
        }

        /* 添加小三角形指向按钮 */
        .fab-tooltip:after {
          content: '';
          position: absolute;
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
          border-left: 6px solid var(--bg-tooltip, rgba(0, 0, 0, 0.7));
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }

        .error-message {
          background: var(--bg-error, #ffe0e0);
          color: var(--accent-danger, #d63031);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border-error, rgba(214, 48, 49, 0.2));
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          color: var(--text-muted, #adb5bd);
          text-align: center;
        }

        .loading-state i,
        .empty-state i {
          font-size: 48px;
          margin-bottom: 16px;
          color: var(--text-muted, #e9ecef);
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
          background: var(--bg-card, white);
          border-radius: 12px;
          box-shadow: var(--shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.05));
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          border-left-width: 6px;
          border-left-style: solid;
          border: 1px solid var(--border-primary, transparent);
        }

        .wish-item.completed {
          background: var(--bg-secondary, #f8f9fa);
          border-left-color: var(--text-muted, #adb5bd) !important;
        }

        .wish-item.priority-high {
          border-left-color: var(--accent-danger, #e74c3c);
        }

        .wish-item.priority-medium {
          border-left-color: var(--accent-warning, #f39c12);
        }

        .wish-item.priority-low {
          border-left-color: var(--accent-success, #2ecc71);
        }

        .wish-item.completed .wish-title,
        .wish-item.completed .wish-description {
          text-decoration: line-through;
          color: var(--text-muted, #adb5bd);
        }

        .wish-checkbox {
          width: 24px;
          height: 24px;
          border: 2px solid var(--accent-primary, #6c5ce7);
          border-radius: 50%;
          margin-right: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--text-inverse, white);
          background: transparent;
          transition: all 0.2s ease;
        }

        .wish-item.completed .wish-checkbox {
          background: var(--accent-primary, #6c5ce7);
        }

        .wish-content {
          flex: 1;
        }

        .wish-title {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 8px 0;
          color: var(--text-primary, #333);
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
          color: var(--text-inverse, white);
        }

        .priority-badge.priority-high {
          background-color: var(--accent-danger, #e74c3c);
        }

        .priority-badge.priority-medium {
          background-color: var(--accent-warning, #f39c12);
        }

        .priority-badge.priority-low {
          background-color: var(--accent-success, #2ecc71);
        }

        .wish-description {
          font-size: 14px;
          color: var(--text-secondary, #666);
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .wish-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--text-tertiary, #888);
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
          color: var(--text-muted, #ccc);
        }

        .wish-edit:hover {
          color: var(--accent-primary, #6c5ce7);
          background: var(--bg-tertiary, #f5f3ff);
        }

        .wish-delete:hover {
          color: var(--accent-danger, #ff6b6b);
          background: var(--bg-error, #fff0f0);
        }

        .wish-edit:disabled,
        .wish-delete:disabled {
          color: var(--text-muted, #e9ecef);
          cursor: not-allowed;
        }

        /* 深色主题特殊适配 */
        :global([data-theme="dark"]) .category-tab:hover:not(.active) {
          background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
        }

        :global([data-theme="dark"]) .wish-item:hover {
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.3));
        }

        :global([data-theme="dark"]) .fab-button {
          box-shadow: var(--shadow-lg, 0 4px 12px rgba(108, 92, 231, 0.4));
        }

        :global([data-theme="dark"]) .error-message {
          background: rgba(248, 81, 73, 0.1);
          border-color: rgba(248, 81, 73, 0.3);
        }

        :global([data-theme="dark"]) .wish-edit:hover {
          background: rgba(108, 92, 231, 0.1);
        }

        :global([data-theme="dark"]) .wish-delete:hover {
          background: rgba(248, 81, 73, 0.1);
        }
      `}</style>
    </div>
  );
} 