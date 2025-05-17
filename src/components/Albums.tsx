'use client';

import React from 'react';
import { T, useLanguage } from './LanguageContext';

export default function Albums() {
  const { language } = useLanguage();
  
  return (
    <>
      <div className="timeline-header">
        <div className="search-filter-group">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder={language === 'zh' ? '搜索相册...' : 'Search albums...'} 
            />
          </div>
          <div className="filter-dropdown">
            <select>
              <option><T zh="所有分类" en="All Categories" /></option>
              <option><T zh="旅行" en="Travel" /></option>
              <option><T zh="约会" en="Dates" /></option>
              <option><T zh="特殊场合" en="Special Occasions" /></option>
              <option><T zh="日常生活" en="Daily Life" /></option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary">
          <i className="fas fa-plus"></i>
          <T zh="新建相册" en="New Album" />
        </button>
      </div>

      <div className="albums-grid">
        <div className="album-card">
          <div className="album-cover">
            <img src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1568&q=80" alt="Beach Getaway" />
            <div className="album-info">
              <div className="album-name"><T zh="海滩度假" en="Beach Getaway" /></div>
              <div className="album-meta">
                <div><T zh="82张照片" en="82 Photos" /></div>
                <div><T zh="2023年7月" en="Jul 2023" /></div>
              </div>
            </div>
            <div className="album-actions">
              <button><i className="fas fa-edit"></i></button>
              <button><i className="fas fa-trash"></i></button>
            </div>
          </div>
        </div>

        <div className="album-card">
          <div className="album-cover">
            <img src="https://images.unsplash.com/photo-1583244532610-2a827990ebc8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1033&q=80" alt="Mountain Adventure" />
            <div className="album-info">
              <div className="album-name"><T zh="山地探险" en="Mountain Adventure" /></div>
              <div className="album-meta">
                <div><T zh="64张照片" en="64 Photos" /></div>
                <div><T zh="2023年5月" en="May 2023" /></div>
              </div>
            </div>
            <div className="album-actions">
              <button><i className="fas fa-edit"></i></button>
              <button><i className="fas fa-trash"></i></button>
            </div>
          </div>
        </div>

        <div className="album-card">
          <div className="album-cover">
            <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1032&q=80" alt="Date Nights" />
            <div className="album-info">
              <div className="album-name"><T zh="城市约会之夜" en="City Date Nights" /></div>
              <div className="album-meta">
                <div><T zh="38张照片" en="38 Photos" /></div>
                <div><T zh="2023年6月" en="Jun 2023" /></div>
              </div>
            </div>
            <div className="album-actions">
              <button><i className="fas fa-edit"></i></button>
              <button><i className="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 