'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { locationService } from '../services/location-service';
import { Location, CreateLocationRequest } from '../services/api-types';
import LocationModal from './LocationModal';

export default function CoupleLocations() {
  const { language } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  // 获取情侣ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 从localStorage获取，使用正确的键名'coupleID'（大写ID）
      const storedCoupleId = localStorage.getItem('coupleID');
      console.log('Retrieved coupleId from localStorage:', storedCoupleId);
      
      if (storedCoupleId) {
        setCoupleId(storedCoupleId);
      } else {
        console.warn('No coupleId found in localStorage');
        setError(language === 'zh' ? '未找到情侣ID，请先登录' : 'No couple ID found, please login first');
      }
    }
  }, [language]);

  // 获取地点列表
  useEffect(() => {
    const fetchLocations = async () => {
      console.log('Current coupleId in fetchLocations effect:', coupleId);
      if (!coupleId) {
        console.log('No coupleId available, skipping API call');
        return; // 如果没有情侣ID，不进行请求
      }
      
      try {
        setLoading(true);
        console.log('Fetching locations with coupleId:', coupleId);
        const data = await locationService.getLocations({ 
          couple_id: coupleId 
        });
        console.log('Locations API response:', data);
        setLocations(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        setError(language === 'zh' ? '获取地点失败' : 'Failed to fetch locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [coupleId, language]);

  // 处理模态框开关状态变化
  useEffect(() => {
    if (isModalOpen && locations.length === 0 && coupleId) {
      console.log('Modal opened but no locations loaded yet, triggering fetch');
      locationService.getLocations({ couple_id: coupleId })
        .then(data => {
          console.log('Modal trigger fetch response:', data);
          setLocations(data || []);
        })
        .catch(err => {
          console.error('Failed to fetch locations on modal open:', err);
        });
    }
  }, [isModalOpen, locations.length, coupleId]);

  // 处理添加地点
  const handleAddLocation = async (locationData: Omit<CreateLocationRequest, 'couple_id'>) => {
    if (!coupleId) {
      setError(language === 'zh' ? '找不到情侣ID' : 'Couple ID not found');
      return Promise.reject(new Error('Couple ID not found'));
    }
    
    try {
      setLoading(true);
      const created = await locationService.createLocation({
        ...locationData,
        couple_id: coupleId
      });
      
      setLocations(prev => [...prev, created]);
      return Promise.resolve();
    } catch (err) {
      console.error('Failed to create location:', err);
      setError(language === 'zh' ? '添加地点失败' : 'Failed to add location');
      return Promise.reject(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 简单漂浮组件 */}
      <div 
        className="floating-footprints-button"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center">
          <i className="fas fa-map-marker-alt mr-2"></i>
          <span><T zh="我们的足迹" en="Our Footprints" /></span>
          <div className="location-count ml-2">
            {locations.length > 0 && (
              <span className="count-badge">{locations.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* 地点模态框 */}
      <LocationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        locations={locations}
        onAddLocation={handleAddLocation}
        loading={loading}
        error={error}
      />
    </>
  );
} 