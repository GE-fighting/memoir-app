'use client';

import React, { useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import { useWishModal } from './ui/wish-modal';

interface WishItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  category: 'travel' | 'promise';
  date?: string;
}

export default function Wishlist() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<'travel' | 'promise'>('travel');
  const [wishlist, setWishlist] = useState<WishItem[]>([
    {
      id: 1,
      title: language === 'zh' ? '巴黎之旅' : 'Trip to Paris',
      description: language === 'zh' ? '参观埃菲尔铁塔，在塞纳河畔漫步，品尝正宗的法国美食。' : 'Visit the Eiffel Tower, stroll along the Seine, and taste authentic French cuisine.',
      completed: false,
      category: 'travel'
    },
    {
      id: 2,
      title: language === 'zh' ? '马尔代夫度假' : 'Maldives Vacation',
      description: language === 'zh' ? '在水上别墅度过浪漫的一周，浮潜，欣赏日落。' : 'Spend a romantic week in an overwater villa, snorkeling, and watching sunsets.',
      completed: false,
      category: 'travel',
      date: '2023-12-15'
    },
    {
      id: 3,
      title: language === 'zh' ? '学习一项新技能' : 'Learn a New Skill Together',
      description: language === 'zh' ? '一起报名烹饪课程，学习制作我们最喜欢的菜肴。' : 'Sign up for cooking classes and learn to make our favorite dishes.',
      completed: true,
      category: 'promise',
      date: '2023-08-10'
    },
    {
      id: 4,
      title: language === 'zh' ? '观星夜晚' : 'Stargazing Night',
      description: language === 'zh' ? '带上望远镜和毯子，去郊外找一个安静的地方观星。' : 'Take a telescope and blankets, find a quiet spot in the countryside to watch the stars.',
      completed: false,
      category: 'promise'
    }
  ]);

  const { openModal, WishModalComponent } = useWishModal({
    onSave: (wishData) => {
      const newWish: WishItem = {
        id: Date.now(),
        title: wishData.title,
        description: wishData.description,
        completed: false,
        category: wishData.category,
        date: wishData.date
      };
      
      setWishlist([...wishlist, newWish]);
    }
  });

  const toggleComplete = (id: number) => {
    setWishlist(wishlist.map(wish => 
      wish.id === id ? { ...wish, completed: !wish.completed } : wish
    ));
  };

  const deleteWish = (id: number) => {
    setWishlist(wishlist.filter(wish => wish.id !== id));
  };

  const filteredWishes = wishlist.filter(wish => wish.category === activeCategory);
  
  return (
    <div className="wish-container">
      {WishModalComponent}
      
      <div className="category-tabs">
        <button 
          className={`category-tab ${activeCategory === 'travel' ? 'active' : ''}`}
          onClick={() => setActiveCategory('travel')}
        >
          <i className="fas fa-map-marked-alt"></i>
          <span><T zh="旅行梦想" en="Travel Dreams" /></span>
        </button>
        <button 
          className={`category-tab ${activeCategory === 'promise' ? 'active' : ''}`}
          onClick={() => setActiveCategory('promise')}
        >
          <i className="fas fa-hands-holding-heart"></i>
          <span><T zh="共赴之约" en="Love Promises" /></span>
        </button>
      </div>

      <div className="wish-add-form">
        <button 
          className="wish-add-btn w-full flex items-center justify-center gap-2"
          onClick={() => openModal(activeCategory)}
        >
          <i className="fas fa-plus"></i>
          <T zh="添加" en="Add" />
        </button>
      </div>

      <div className="wish-list">
        {filteredWishes.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-heart"></i>
            <p><T zh="还没有心愿，添加一个吧！" en="No wishes yet, add one!" /></p>
          </div>
        ) : (
          filteredWishes.map(wish => (
            <div className={`wish-item ${wish.completed ? 'completed' : ''}`} key={wish.id}>
              <div className="wish-checkbox" onClick={() => toggleComplete(wish.id)}>
                {wish.completed ? <i className="fas fa-check"></i> : null}
              </div>
              <div className="wish-content">
                <h3 className="wish-title">{wish.title}</h3>
                {wish.description && <p className="wish-description">{wish.description}</p>}
                {wish.date && (
                  <div className="wish-date">
                    <i className="fas fa-calendar"></i>
                    <span>{wish.date}</span>
                  </div>
                )}
              </div>
              <button className="wish-delete" onClick={() => deleteWish(wish.id)}>
                <i className="fas fa-times"></i>
              </button>
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

        .wish-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .wish-item {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
        }

        .wish-item.completed {
          background: #f8f9fa;
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
        }

        .wish-delete {
          background: none;
          border: none;
          color: #ccc;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .wish-delete:hover {
          color: #ff6b6b;
          background: #fff0f0;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 0;
          color: #adb5bd;
          text-align: center;
        }

        .empty-state i {
          font-size: 48px;
          margin-bottom: 16px;
          color: #e9ecef;
        }
      `}</style>
    </div>
  );
} 