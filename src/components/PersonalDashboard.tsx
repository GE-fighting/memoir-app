'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from '@/components/LanguageContext';

export default function PersonalDashboard() {
  const { language } = useLanguage();
  const [stats, setStats] = useState({
    photos: 42,
    videos: 18,
    events: 35,
    locations: 12
  });
  const [loading, setLoading] = useState(false); // 不再需要加载状态，因为我们使用静态数据
  const [error, setError] = useState<string | null>(null);

  // 统计卡片组件
  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    icon: string; 
    color: string; 
  }) => (
    <div className="stat-card">
      <div className="stat-header">
        <div className="stat-title">{title}</div>
        <div className={`stat-icon ${color}`}>
          <i className={icon}></i>
        </div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );

  // 移除了useEffect，因为我们现在使用静态数据

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <i className="fas fa-exclamation-circle text-2xl"></i>
        <p className="mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard 
          title={language === 'zh' ? '照片' : 'Photos'} 
          value={stats.photos} 
          icon="fas fa-image" 
          color="purple" 
        />
        <StatCard 
          title={language === 'zh' ? '视频' : 'Videos'} 
          value={stats.videos} 
          icon="fas fa-video" 
          color="orange" 
        />
        <StatCard 
          title={language === 'zh' ? '事件' : 'Events'} 
          value={stats.events} 
          icon="fas fa-calendar-days" 
          color="blue" 
        />
        <StatCard 
          title={language === 'zh' ? '地点' : 'Locations'} 
          value={stats.locations} 
          icon="fas fa-location-dot" 
          color="green" 
        />
      </div>
      
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <T zh="媒体类型分布" en="Media Type Distribution" />
            </div>
          </div>
          <div className="chart-body">
            <div className="chart-placeholder" style={{ '--chart-text': '"Chart Placeholder"' } as React.CSSProperties}>
              <T zh="图表占位符" en="Chart Placeholder" />
            </div>
          </div>
        </div>
        
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <T zh="月度增长趋势" en="Monthly Growth Trend" />
            </div>
          </div>
          <div className="chart-body">
            <div className="chart-placeholder" style={{ '--chart-text': '"Chart Placeholder"' } as React.CSSProperties}>
              <T zh="图表占位符" en="Chart Placeholder" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="map-section">
        <div className="map-container">
          <div className="map-header">
            <div className="map-title">
              <i className="fas fa-map-location-dot mr-2"></i>
              <T zh="个人足迹地图" en="Personal Footprint Map" />
            </div>
          </div>
          <div className="map-body">
            <div className="chart-placeholder" style={{ '--chart-text': '"Map Placeholder"' } as React.CSSProperties}>
              <T zh="地图占位符" en="Map Placeholder" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}