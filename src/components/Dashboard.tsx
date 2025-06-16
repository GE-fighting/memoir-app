/**
 * 仪表盘组件文件
 * 
 * 本文件实现了应用的主仪表盘/首页内容，展示关键数据和统计信息。
 * 
 * 主要内容：
 * - 统计卡片：显示时间轴条目数、照片和视频数量、相册数、相伴天数等核心统计
 * - 地图组件：展示去过的地点，使用高德地图API
 * 
 * 该组件用于应用首页，为用户提供整体概览和关键数据展示。
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';
import { dashboardService } from '../services/dashboard-service';
import type { DashboardDTO, Location } from '../services/api-types';

// 为高德地图声明全局类型
declare global {
  interface Window {
    AMap: any;
  }
}

export default function Dashboard() {
  const { language } = useLanguage();
  const [dashboardData, setDashboardData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

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

  // 初始化地图
  useEffect(() => {
    // 确保在客户端环境中运行且数据已加载
    if (typeof window === 'undefined' || !mapRef.current || !dashboardData || !dashboardData.locations) return;

    // 清除可能存在的旧地图实例
    if (mapRef.current.children.length > 0) {
      mapRef.current.innerHTML = '';
    }

    // 动态加载高德地图 API
    const initMap = () => {
      const map = new window.AMap.Map(mapRef.current!, {
        center: dashboardData.locations.length > 0 
          ? [dashboardData.locations[0].longitude, dashboardData.locations[0].latitude]
          : [116.397428, 39.90923], // 默认中心点（北京）
        zoom: 4, // 默认缩放级别
      });

      // 如果没有位置数据，不继续处理
      if (!dashboardData.locations.length) return;

      // 使用行政区划查询插件
      window.AMap.plugin('AMap.DistrictSearch', () => {
        const districtSearch = new window.AMap.DistrictSearch({
          level: 'city', // 查询行政级别为城市
          subdistrict: 0, // 不返回下级行政区
        });

        // 为每个地点创建标记和高亮城市
        const markers: any[] = [];
        const polygons: any[] = [];

        // 处理每个位置
        let processedCount = 0;
        dashboardData.locations.forEach(location => {
          // 创建标记
          const marker = new window.AMap.Marker({
            position: [location.longitude, location.latitude],
            title: location.name,
            map: map,
          });
          markers.push(marker);

          // 查询并高亮城市
          districtSearch.search(location.name, (status: string, result: any) => {
            processedCount++;
            
            if (status === 'complete' && result.districtList && result.districtList.length > 0) {
              const bounds = result.districtList[0].boundaries;
              if (bounds) {
                for (let i = 0; i < bounds.length; i++) {
                  const polygon = new window.AMap.Polygon({
                    path: bounds[i],
                    fillColor: '#FF0080', // 鲜艳的洋红色
                    fillOpacity: 0.6, // 提高透明度使颜色更明显
                    strokeColor: '#FF00FF', // 亮紫色边框
                    strokeWeight: 3, // 增加边框宽度
                  });
                  polygons.push(polygon);
                  map.add(polygon);
                }
              }
            }

            // 当所有位置都处理完毕后，调整地图视野
            if (processedCount === dashboardData.locations.length && polygons.length > 0) {
              // 确保地图自动缩放到合适的视野，包含所有高亮区域
              map.setFitView(polygons, false, [60, 60, 60, 60]); // 设置一定的内边距，使视野更加合适
              
              // 如果只有一个城市，则放大一点
              if (dashboardData.locations.length === 1) {
                // 在设置完视野后稍微放大，以便更好地查看单个城市
                setTimeout(() => {
                  const currentZoom = map.getZoom();
                  if (currentZoom < 8) {
                    map.setZoom(8); // 设置适当的缩放级别
                  }
                }, 100);
              }
            }
          });
        });
      });
    };

    // 加载高德地图脚本
    const loadAMapScript = () => {
      if (window.AMap) {
        initMap();
        return;
      }
      const script = document.createElement('script');
      // 添加时间戳避免缓存
      script.src = `https://webapi.amap.com/maps?v=2.0&key=013ca9b4e62d17ac30b93423824aa2e1&t=${new Date().getTime()}`;
      script.async = true;
      script.onload = initMap;
      script.onerror = () => console.error('加载高德地图失败');
      document.head.appendChild(script);
    };

    loadAMapScript();

    // 清理脚本
    return () => {
      // 只有在我们添加了脚本的情况下才移除
      if (!window.AMap) {
        const script = document.querySelector(`script[src*="webapi.amap.com"]`);
        if (script) document.head.removeChild(script);
      }
    };
  }, [dashboardData]);

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
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-title">
              <T zh="去过的地方" en="PLACES VISITED" />
            </div>
            <div className="stat-icon green">
              <i className="fas fa-map-pin"></i>
            </div>
          </div>
          <div className="stat-value">{dashboardData?.locations?.length ?? '-'}</div>
          <div className="stat-change" style={{ color: 'var(--secondary)', fontWeight: 600 }}>
            <i className="fas fa-globe-asia"></i>
            <T zh="共同探索的城市" en="Cities explored together" />
          </div>
        </div>
      </div>

      <div className="map-section">
        <div className="map-container">
          <div className="map-header">
            <div className="map-title">
              <i className="fas fa-map-marked-alt" style={{ marginRight: '8px', color: '#4285f4' }}></i>
              <T zh="足迹地图" en="Our Footprints" />
              <span className="map-subtitle" style={{ marginLeft: '10px', fontSize: '0.8em', opacity: 0.7 }}>
                <T zh="记录我们的每一步" en="Tracking our journey" />
              </span>
            </div>
          </div>
          <div className="map-body" style={{ height: '500px' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
        </div>
      </div>
    </>
  );
} 