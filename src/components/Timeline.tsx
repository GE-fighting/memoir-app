'use client';

import React from 'react';
import { T, useLanguage } from './LanguageContext';

export default function Timeline() {
  const { language } = useLanguage();
  
  return (
    <>
      <div className="timeline-header">
        <div className="search-filter-group">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder={language === 'zh' ? '搜索时间轴条目...' : 'Search timeline entries...'} 
            />
          </div>
          <div className="filter-dropdown">
            <select>
              <option><T zh="所有媒体类型" en="All Media Types" /></option>
              <option><T zh="照片" en="Photos" /></option>
              <option><T zh="视频" en="Videos" /></option>
              <option><T zh="仅文本" en="Text Only" /></option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary">
          <i className="fas fa-plus"></i>
          <T zh="新建条目" en="New Entry" />
        </button>
      </div>

      <div className="timeline-grid">
        <div className="timeline-item">
          <div className="timeline-media">
            <img src="https://images.unsplash.com/photo-1536318431364-5cc762cfc8ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" alt="Beach Sunset" />
            <div className="media-type">
              <i className="fas fa-image"></i>
            </div>
          </div>
          <div className="timeline-content">
            <div className="timeline-header-row">
              <div className="timeline-title"><T zh="海滩日落" en="Beach Sunset" /></div>
              <div className="timeline-date"><T zh="2023年7月15日" en="July 15, 2023" /></div>
            </div>
            <div className="timeline-description">
              <T 
                zh="沿着海岸线漫步，夕阳将天空渲染成橙色和粉色。那是时间仿佛静止的完美时刻之一。海浪拍打岸边的声音如此舒缓。我们一直待到星星出现。" 
                en="Walking along the shoreline as the sun painted the sky in shades of orange and pink. One of those perfect moments where time seemed to stand still. The sound of the waves crashing against the shore was so soothing. We stayed until the stars came out." 
              />
            </div>
            <div className="timeline-footer">
              <div className="timeline-user">
                <div className="avatar">J</div>
                <div>Jamie</div>
              </div>
              <div className="timeline-actions">
                <button><i className="fas fa-edit"></i></button>
                <button><i className="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-media">
            <img src="https://images.unsplash.com/photo-1513326738677-b964603b136d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1049&q=80" alt="First Date" />
            <div className="media-type">
              <i className="fas fa-image"></i>
            </div>
          </div>
          <div className="timeline-content">
            <div className="timeline-header-row">
              <div className="timeline-title"><T zh="我们的第一场音乐会" en="Our First Concert" /></div>
              <div className="timeline-date"><T zh="2023年4月10日" en="April 10, 2023" /></div>
            </div>
            <div className="timeline-description">
              <T 
                zh="现场气氛太棒了！我们跳舞数小时，完全沉浸在音乐和彼此中。绝对是永远珍藏的记忆。灯光与音乐同步的方式令人惊叹。" 
                en="The energy was incredible! We danced for hours, completely lost in the music and each other. Definitely a memory to cherish forever. The way the lights synchronized with the music was mind-blowing." 
              />
            </div>
            <div className="timeline-footer">
              <div className="timeline-user">
                <div className="avatar">A</div>
                <div>Alex</div>
              </div>
              <div className="timeline-actions">
                <button><i className="fas fa-edit"></i></button>
                <button><i className="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional timeline items can be added similar to above */}
      </div>
    </>
  );
} 