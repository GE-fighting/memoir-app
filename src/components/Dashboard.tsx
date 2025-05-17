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

import React from 'react';
import { T, useLanguage } from './LanguageContext';

export default function Dashboard() {
  const { language } = useLanguage();
  
  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="时间轴条目" en="TIMELINE ENTRIES" />
            </div>
            <div className="stat-icon purple">
              <i className="fas fa-clock-rotate-left"></i>
            </div>
          </div>
          <div className="stat-value">124</div>
          <div className="stat-change positive">
            <i className="fas fa-arrow-up"></i>
            <T zh="较上月增长8%" en="8% since last month" />
          </div>
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
          <div className="stat-value">2,567</div>
          <div className="stat-change positive">
            <i className="fas fa-arrow-up"></i>
            <T zh="较上月增长12%" en="12% since last month" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="创建的相册" en="ALBUMS CREATED" />
            </div>
            <div className="stat-icon blue">
              <i className="fas fa-images"></i>
            </div>
          </div>
          <div className="stat-value">42</div>
          <div className="stat-change positive">
            <i className="fas fa-arrow-up"></i>
            <T zh="较上月增长4%" en="4% since last month" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="相伴天数" en="DAYS TOGETHER" />
            </div>
            <div className="stat-icon green">
              <i className="fas fa-heart"></i>
            </div>
          </div>
          <div className="stat-value">748</div>
          <div className="stat-change positive">
            <i className="fas fa-calendar"></i>
            <T zh="2年18天" en="2 years, 18 days" />
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