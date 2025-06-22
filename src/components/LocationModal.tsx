'use client';

import React, { useState, useRef, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { Location, CreateLocationRequest } from '../services/api-types';
import { geocodingService, GeocodingResult } from '../lib/services/geocodingService';
import '../styles/location-modal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onAddLocation: (location: Omit<CreateLocationRequest, 'couple_id'>) => Promise<void>;
  onDeleteLocation?: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  success?: string | null;
}

// 预设的城市颜色
const CITY_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-yellow-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-teal-500'
];

export default function LocationModal({
  isOpen,
  onClose,
  locations,
  onAddLocation,
  onDeleteLocation,
  loading,
  error,
  success
}: LocationModalProps) {
  const { language } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    visitDate: ''
  });

  // 城市搜索相关状态
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<GeocodingResult[]>([]);
  const [showCityResults, setShowCityResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 删除确认相关状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 城市搜索处理函数
  const handleCitySearch = async (query: string) => {
    if (!query.trim()) {
      setCitySearchResults([]);
      setShowCityResults(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      if (!geocodingService.isConfigured()) {
        throw new Error(language === 'zh' ? '高德地图API未配置' : 'Amap API not configured');
      }

      const results = await geocodingService.searchCities(query);
      setCitySearchResults(results);
      setShowCityResults(results.length > 0);

      // 如果搜索结果只有一个，或者第一个结果的城市名与查询完全匹配，自动填充经纬度
      if (results.length > 0) {
        const firstResult = results[0];
        const queryLower = query.toLowerCase().trim();
        const cityNameLower = (firstResult.city || firstResult.name).toLowerCase();

        // 检查是否完全匹配或高度匹配
        if (results.length === 1 ||
            cityNameLower === queryLower ||
            cityNameLower === queryLower + '市' ||
            cityNameLower.replace('市', '') === queryLower) {

          // 自动填充经纬度
          setNewLocation(prev => ({
            ...prev,
            latitude: firstResult.latitude,
            longitude: firstResult.longitude
          }));
        }
      }
    } catch (error) {
      console.error('城市搜索失败:', error);
      setSearchError(error instanceof Error ? error.message : '搜索失败');
      setCitySearchResults([]);
      setShowCityResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理城市搜索输入变化
  const handleCitySearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCitySearchQuery(query);
    setNewLocation(prev => ({ ...prev, name: query }));

    // 清除之前的搜索定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 设置新的搜索定时器，防抖处理（增加到1秒避免频率限制）
    searchTimeoutRef.current = setTimeout(() => {
      handleCitySearch(query);
    }, 1000);
  };

  // 选择城市
  const handleCitySelect = (city: GeocodingResult) => {
    setNewLocation(prev => ({
      ...prev,
      name: city.city || city.name,
      latitude: city.latitude,
      longitude: city.longitude
    }));
    setCitySearchQuery(city.city || city.name);
    setShowCityResults(false);
    setCitySearchResults([]);
  };

  // 清理搜索定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowCityResults(false);
      }
    };

    if (showCityResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCityResults]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { visitDate, ...locationData } = newLocation;
      // 将访问日期添加到描述中
      const description = locationData.description
        ? `${locationData.description}\n访问日期/Visit Date: ${visitDate}`
        : `访问日期/Visit Date: ${visitDate}`;

      await onAddLocation({
        ...locationData,
        description
      });

      setShowAddForm(false);
      setNewLocation({
        name: '',
        description: '',
        latitude: 0,
        longitude: 0,
        visitDate: ''
      });
      setCitySearchQuery('');
      setCitySearchResults([]);
      setShowCityResults(false);
    } catch (err) {
      console.error('Failed to create location:', err);
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLocation(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) : value
    }));
  };

  // 获取城市颜色
  const getCityColor = (index: number) => {
    return CITY_COLORS[index % CITY_COLORS.length];
  };

  // 处理删除地点
  const handleDelete = async (id: string) => {
    setLocationToDelete(id);
    setShowDeleteConfirm(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (locationToDelete && onDeleteLocation) {
      try {
        setDeletingId(locationToDelete);
        await onDeleteLocation(locationToDelete);
        setShowDeleteConfirm(false);
        setLocationToDelete(null);
      } catch (err) {
        console.error('Failed to delete location:', err);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setLocationToDelete(null);
  };

  if (!isOpen) return null;

  return (
    <div className="location-modal-overlay">
      <div className="location-modal-container">
        {/* Modal Header */}
        <div className="location-modal-header">
          <h2 className="location-modal-title">
            <i className="fas fa-map-marker-alt"></i>
            <T zh="我们的足迹" en="Our Footprints" />
          </h2>
          <div className="location-modal-actions">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="add-location-btn"
            >
              <i className={`fas ${showAddForm ? 'fa-times' : 'fa-plus'}`}></i>
            </button>
            <button onClick={onClose} className="close-modal-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            {success}
          </div>
        )}

        {/* Add Location Form */}
        {showAddForm && (
          <div className="add-location-form">
            {/* 使用提示 */}
            <div className="form-tip">
              <div className="form-tip-content">
                <i className="fas fa-info-circle"></i>
                <div className="form-tip-text">
                  <T
                    zh="💡 输入城市名称即可自动获取经纬度，支持中英文搜索。匹配的城市会自动填充坐标，也可点击搜索结果选择。"
                    en="💡 Enter city name to auto-fill coordinates, supports Chinese and English search. Matching cities will auto-fill coordinates, or click search results to select."
                  />
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="form-space-y-4">
              <div className="form-group">
                <label className="form-label">
                  <T zh="城市名称" en="City Name" />
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    name="name"
                    value={citySearchQuery || newLocation.name}
                    onChange={handleCitySearchChange}
                    className={`form-input ${isSearching ? 'form-input-with-icon' : ''}`}
                    placeholder={language === 'zh' ? '搜索城市，如：北京、巴黎' : 'Search city, e.g., Beijing, Paris'}
                    required
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="input-icon">
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                  )}
                </div>

                {/* 搜索结果下拉列表 */}
                {showCityResults && citySearchResults.length > 0 && (
                  <div className="search-results">
                    {citySearchResults.map((city, index) => (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => handleCitySelect(city)}
                      >
                        <div className="search-result-name">
                          {city.city || city.name}
                        </div>
                        <div className="search-result-address">
                          {city.formattedAddress}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 搜索错误提示 */}
                {searchError && (
                  <div className="search-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    {searchError}
                  </div>
                )}
              </div>
              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">
                    <T zh="纬度" en="Latitude" />
                    {newLocation.latitude !== 0 && (
                      <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-success, #10b981)' }}>
                        <i className="fas fa-check-circle"></i>
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={newLocation.latitude || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={language === 'zh' ? '自动填充或手动输入' : 'Auto-filled or manual input'}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <T zh="经度" en="Longitude" />
                    {newLocation.longitude !== 0 && (
                      <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', color: 'var(--accent-success, #10b981)' }}>
                        <i className="fas fa-check-circle"></i>
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={newLocation.longitude || ''}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder={language === 'zh' ? '自动填充或手动输入' : 'Auto-filled or manual input'}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  <T zh="备注" en="Note" />
                </label>
                <textarea
                  name="description"
                  value={newLocation.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={2}
                ></textarea>
              </div>
              <div className="form-submit-container">
                <button
                  type="submit"
                  className="form-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <T zh="提交中..." en="Submitting..." />
                  ) : (
                    <T zh="保存" en="Save" />
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 删除确认对话框 */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-container">
              <h3 className="delete-confirm-title">
                <T zh="确认删除" en="Confirm Deletion" />
              </h3>
              <p className="delete-confirm-text">
                <T
                  zh="确定要删除这个地点吗？此操作无法撤销。"
                  en="Are you sure you want to delete this location? This action cannot be undone."
                />
              </p>
              <div className="delete-confirm-actions">
                <button
                  onClick={cancelDelete}
                  className="delete-cancel-btn"
                >
                  <T zh="取消" en="Cancel" />
                </button>
                <button
                  onClick={confirmDelete}
                  className="delete-confirm-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <T zh="删除中..." en="Deleting..." />
                  ) : (
                    <T zh="确认删除" en="Delete" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* City List */}
        <div className="city-list-container">
          {loading && !locations.length ? (
            <div className="loading-container">
              <i className="fas fa-spinner fa-spin"></i>
              <T zh="加载中..." en="Loading..." />
            </div>
          ) : locations.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-map-pin"></i>
              <p>
                <T zh="还没有添加地点，开始记录你们的足迹吧！" en="No places added yet. Start recording your journey together!" />
              </p>
            </div>
          ) : (
            <div className="city-list">
              {locations.map((location, index) => (
                <div key={location.id} className="city-item">
                  <div className={`city-color-indicator ${getCityColor(index)}`}>
                    {location.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="city-info">
                    <h3 className="city-name">{location.name}</h3>
                    <div className="city-date">
                      {location.created_at ? new Date(location.created_at).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  {onDeleteLocation && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(location.id);
                      }}
                      className="city-delete-btn"
                      aria-label={language === 'zh' ? '删除' : 'Delete'}
                      disabled={deletingId === location.id}
                    >
                      {deletingId === location.id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash-alt"></i>
                      )}
                      <span className="delete-tooltip">
                        <T zh="删除" en="Delete" />
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="location-modal-footer">
          <div className="location-count">
            <T
              zh={`共 ${locations.length} 个城市`}
              en={`${locations.length} ${locations.length === 1 ? 'city' : 'cities'} in total`}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 