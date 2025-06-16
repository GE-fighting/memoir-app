/**
 * 仪表盘组件文件
 * 
 * 本文件实现了应用的主仪表盘/首页内容，展示关键数据和统计信息。
 * 
 * 主要内容：
 * - 统计卡片：显示时间轴条目数、照片和视频数量、相册数、相伴天数等核心统计
 * - 活动图表：展示时间轴活动和相册增长的趋势图表
 * - 支持多语言切换显示
 * 
 * 该组件用于应用首页，为用户提供整体概览和关键数据展示。
 * 当前使用了占位图表，在实际项目中可替换为真实图表库实现。
 */

'use client';

import React, { useEffect, useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import { dashboardService } from '../services/dashboard-service';
import type { DashboardDTO } from '../services/api-types';

export default function Dashboard() {
  const { language } = useLanguage();
  const [dashboardData, setDashboardData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardService.getDashboardData()
      .then(data => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch(err => {
        setError('获取仪表盘数据失败');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div><T zh="正在加载仪表盘数据..." en="Loading dashboard data..." /></div>;
  }
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="回忆数量" en="TIMELINE ENTRIES" />
            </div>
            <div className="stat-icon purple">
              <i className="fas fa-clock-rotate-left"></i>
            </div>
          </div>
          <div className="stat-value">{dashboardData?.story_count ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="照片和视频" en="PHOTOS & VIDEOS" />
            </div>
            <div className="stat-icon orange">
              <i className="fas fa-camera"></i>
            </div>
          </div>
          <div className="stat-value">{dashboardData?.media_count ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="相册数量" en="ALBUMS CREATED" />
            </div>
            <div className="stat-icon blue">
              <i className="fas fa-images"></i>
            </div>
          </div>
          <div className="stat-value">{dashboardData?.album_count ?? '-'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="相伴天数" en="DAYS TOGETHER" />
            </div>
            <div className="stat-icon red">
              <i className="fas fa-heart"></i>
            </div>
          </div>
          <div className="stat-value">{dashboardData?.couple_days ?? '-'}</div>
          <div className="stat-change" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            <i className="fas fa-calendar"></i>
            {/* 只在有年时显示年，否则只显示天 */}
            {dashboardData && dashboardData.couple_days !== undefined ? (
              (() => {
                const years = Math.floor(dashboardData.couple_days / 365);
                const days = dashboardData.couple_days % 365;
                return years > 0
                  ? `${years}年${days}天`
                  : `${days}天`;
              })()
            ) : '-'}
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <T zh="时间轴活动" en="Timeline Activity" />
            </div>
            <div className="chart-controls">
              <div className="period-selector">
                <div className="period-option">
                  <T zh="周" en="Week" />
                </div>
                <div className="period-option active">
                  <T zh="月" en="Month" />
                </div>
                <div className="period-option">
                  <T zh="年" en="Year" />
                </div>
              </div>
            </div>
          </div>
          <div className="chart-body">
            <div className="chart-placeholder" style={{ 
              "--chart-text": language === 'zh' ? '"时间轴活动图表"' : '"Timeline Activity Chart"'
            } as React.CSSProperties}></div>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-header">
            <div className="chart-title">
              <T zh="相册增长" en="Albums Growth" />
            </div>
            <div className="chart-controls">
              <div className="period-selector">
                <div className="period-option">
                  <T zh="周" en="Week" />
                </div>
                <div className="period-option active">
                  <T zh="月" en="Month" />
                </div>
                <div className="period-option">
                  <T zh="年" en="Year" />
                </div>
              </div>
            </div>
          </div>
          <div className="chart-body">
            <div className="chart-placeholder albums" style={{ 
              "--chart-text": language === 'zh' ? '"相册活动图表"' : '"Album Activity Chart"'
            } as React.CSSProperties}></div>
          </div>
        </div>
      </div>
    </>
  );
} 