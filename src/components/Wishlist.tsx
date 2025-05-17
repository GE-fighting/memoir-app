'use client';

import React, { useState } from 'react';
import { T, useLanguage } from './LanguageContext';

interface WishItem {
  id: number;
  title: string;
  description: string;
  status: 'wishlist' | 'planned' | 'completed';
  priority: 'high' | 'medium' | 'low';
  image: string;
  date?: string;
}

export default function Wishlist() {
  const { language } = useLanguage();
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  
  // 示例数据 - 在实际应用中，这些数据应该来自API或状态管理库
  const travelDreams: WishItem[] = [
    {
      id: 1,
      title: language === 'zh' ? '巴黎之旅' : 'Trip to Paris',
      description: language === 'zh' ? '参观埃菲尔铁塔，在塞纳河畔漫步，品尝正宗的法国美食。' : 'Visit the Eiffel Tower, stroll along the Seine, and taste authentic French cuisine.',
      status: 'wishlist',
      priority: 'high',
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGFyaXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=60'
    },
    {
      id: 2,
      title: language === 'zh' ? '马尔代夫度假' : 'Maldives Vacation',
      description: language === 'zh' ? '在水上别墅度过浪漫的一周，浮潜，欣赏日落。' : 'Spend a romantic week in an overwater villa, snorkeling, and watching sunsets.',
      status: 'planned',
      date: '2023-12-15',
      priority: 'medium',
      image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8bWFsZGl2ZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=600&q=60'
    }
  ];
  
  const lovePromises: WishItem[] = [
    {
      id: 3,
      title: language === 'zh' ? '学习一项新技能' : 'Learn a New Skill Together',
      description: language === 'zh' ? '一起报名烹饪课程，学习制作我们最喜欢的菜肴。' : 'Sign up for cooking classes and learn to make our favorite dishes.',
      status: 'completed',
      date: '2023-08-10',
      priority: 'medium',
      image: 'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29va2luZyUyMGNsYXNzfGVufDB8fDB8fHww&auto=format&fit=crop&w=600&q=60'
    },
    {
      id: 4,
      title: language === 'zh' ? '观星夜晚' : 'Stargazing Night',
      description: language === 'zh' ? '带上望远镜和毯子，去郊外找一个安静的地方观星。' : 'Take a telescope and blankets, find a quiet spot in the countryside to watch the stars.',
      status: 'wishlist',
      priority: 'low',
      image: 'https://images.unsplash.com/photo-1532978379173-523e16f371f9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c3RhcmdhemluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=600&q=60'
    }
  ];
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <i className="fas fa-check"></i>;
      case 'planned': return <i className="fas fa-calendar-check"></i>;
      default: return <i className="fas fa-star"></i>;
    }
  };
  
  return (
    <div className="wishlist-container">
      {/* 旅行梦想部分 */}
      <div className="wishlist-section">
        <div className="wishlist-header">
          <div className="wishlist-title">
            <i className="fas fa-map-marked-alt"></i>
            <h2><T zh="旅行梦想" en="Travel Dreams" /></h2>
          </div>
          <button className="btn btn-primary" onClick={() => setShowTravelModal(true)}>
            <i className="fas fa-plus"></i>
            <T zh="添加梦想" en="Add Dream" />
          </button>
        </div>
        
        <div className="wishlist-grid">
          {travelDreams.map(dream => (
            <div className="wishlist-card" key={dream.id}>
              <div className={`wishlist-card-status ${dream.status}`}>
                {getStatusIcon(dream.status)}
              </div>
              <div className="wishlist-card-image">
                <img src={dream.image} alt={dream.title} />
              </div>
              <div className="wishlist-card-content">
                <div className="wishlist-card-title">{dream.title}</div>
                <div className="wishlist-card-desc">{dream.description}</div>
                <div className="wishlist-card-meta">
                  {dream.date ? (
                    <div className={`wishlist-date ${dream.status}`}>
                      <i className="fas fa-calendar"></i>
                      {dream.date}
                    </div>
                  ) : (
                    <div className={`wishlist-priority ${dream.priority}`}>
                      <i className="fas fa-flag"></i>
                      <T 
                        zh={dream.priority === 'high' ? '高' : dream.priority === 'medium' ? '中' : '低'} 
                        en={dream.priority === 'high' ? 'High' : dream.priority === 'medium' ? 'Medium' : 'Low'} 
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="wishlist-card-actions">
                <button className="wishlist-action-btn">
                  <i className="fas fa-edit"></i>
                </button>
                <button className="wishlist-action-btn">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 爱的约定部分 */}
      <div className="wishlist-section">
        <div className="wishlist-header">
          <div className="wishlist-title">
            <i className="fas fa-hands-holding-heart"></i>
            <h2><T zh="共赴之约" en="Love Promises" /></h2>
          </div>
          <button className="btn btn-primary" onClick={() => setShowPromiseModal(true)}>
            <i className="fas fa-plus"></i>
            <T zh="添加约定" en="Add Promise" />
          </button>
        </div>
        
        <div className="wishlist-grid">
          {lovePromises.map(promise => (
            <div className="wishlist-card" key={promise.id}>
              <div className={`wishlist-card-status ${promise.status}`}>
                {getStatusIcon(promise.status)}
              </div>
              <div className="wishlist-card-image">
                <img src={promise.image} alt={promise.title} />
              </div>
              <div className="wishlist-card-content">
                <div className="wishlist-card-title">{promise.title}</div>
                <div className="wishlist-card-desc">{promise.description}</div>
                <div className="wishlist-card-meta">
                  {promise.date ? (
                    <div className={`wishlist-date ${promise.status}`}>
                      <i className="fas fa-calendar"></i>
                      {promise.date}
                    </div>
                  ) : (
                    <div className={`wishlist-priority ${promise.priority}`}>
                      <i className="fas fa-flag"></i>
                      <T 
                        zh={promise.priority === 'high' ? '高' : promise.priority === 'medium' ? '中' : '低'} 
                        en={promise.priority === 'high' ? 'High' : promise.priority === 'medium' ? 'Medium' : 'Low'} 
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="wishlist-card-actions">
                <button className="wishlist-action-btn">
                  <i className="fas fa-edit"></i>
                </button>
                <button className="wishlist-action-btn">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 添加旅行梦想模态框 - 实际应用中应该用更好的模态框组件 */}
      {showTravelModal && (
        <div className="wishlist-modal show">
          <div className="wishlist-modal-container">
            <button className="wishlist-modal-close" onClick={() => setShowTravelModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <h3 className="wishlist-modal-title">
              <T zh="添加旅行梦想" en="Add Travel Dream" />
            </h3>
            {/* 表单内容省略 */}
          </div>
        </div>
      )}
      
      {/* 添加爱的约定模态框 */}
      {showPromiseModal && (
        <div className="wishlist-modal show">
          <div className="wishlist-modal-container">
            <button className="wishlist-modal-close" onClick={() => setShowPromiseModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <h3 className="wishlist-modal-title">
              <T zh="添加共赴之约" en="Add Love Promise" />
            </h3>
            {/* 表单内容省略 */}
          </div>
        </div>
      )}
    </div>
  );
} 