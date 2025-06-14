'use client';

import React, { useState, useRef, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import { Location, CreateLocationRequest } from '../services/api-types';
import { geocodingService, GeocodingResult } from '../lib/services/geocodingService';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: Location[];
  onAddLocation: (location: Omit<CreateLocationRequest, 'couple_id'>) => Promise<void>;
  loading: boolean;
  error: string | null;
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
  loading,
  error
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <i className="fas fa-map-marker-alt mr-2 text-blue-500"></i>
            <T zh="我们的足迹" en="Our Footprints" />
          </h2>
          <div className="flex items-center">
            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="mr-3 w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-sm transition"
            >
              <i className={`fas ${showAddForm ? 'fa-times' : 'fa-plus'}`}></i>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message text-red-500 p-4 border-b">
            {error}
          </div>
        )}

        {/* Add Location Form */}
        {showAddForm && (
          <div className="p-4 border-b animate-slideDown">
            {/* 使用提示 */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
                <div className="text-sm text-blue-700">
                  <T
                    zh="💡 输入城市名称即可自动获取经纬度，支持中英文搜索。匹配的城市会自动填充坐标，也可点击搜索结果选择。"
                    en="💡 Enter city name to auto-fill coordinates, supports Chinese and English search. Matching cities will auto-fill coordinates, or click search results to select."
                  />
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T zh="城市名称" en="City Name" />
                </label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    name="name"
                    value={citySearchQuery || newLocation.name}
                    onChange={handleCitySearchChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={language === 'zh' ? '搜索城市，如：北京、巴黎' : 'Search city, e.g., Beijing, Paris'}
                    required
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <i className="fas fa-spinner fa-spin text-gray-400"></i>
                    </div>
                  )}
                </div>

                {/* 搜索结果下拉列表 */}
                {showCityResults && citySearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {citySearchResults.map((city, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleCitySelect(city)}
                      >
                        <div className="font-medium text-gray-900">
                          {city.city || city.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {city.formattedAddress}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 搜索错误提示 */}
                {searchError && (
                  <div className="mt-1 text-sm text-red-600">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    {searchError}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <T zh="纬度" en="Latitude" />
                    {newLocation.latitude !== 0 && (
                      <span className="ml-1 text-xs text-green-600">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={language === 'zh' ? '自动填充或手动输入' : 'Auto-filled or manual input'}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <T zh="经度" en="Longitude" />
                    {newLocation.longitude !== 0 && (
                      <span className="ml-1 text-xs text-green-600">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={language === 'zh' ? '自动填充或手动输入' : 'Auto-filled or manual input'}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <T zh="备注" en="Note" />
                </label>
                <textarea
                  name="description"
                  value={newLocation.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
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

        {/* City List */}
        <div className="flex-1 overflow-auto p-4">
          {loading && !locations.length ? (
            <div className="text-center py-8">
              <i className="fas fa-spinner fa-spin mr-2"></i>
              <T zh="加载中..." en="Loading..." />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-map-pin text-4xl mb-3 text-gray-300"></i>
              <p>
                <T zh="还没有添加地点，开始记录你们的足迹吧！" en="No places added yet. Start recording your journey together!" />
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location, index) => (
                <div key={location.id} className="city-item flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className={`city-color-indicator w-10 h-10 rounded-full ${getCityColor(index)} flex items-center justify-center text-white mr-3`}>
                    {location.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{location.name}</h3>
                    <div className="text-xs text-gray-500">
                      {location.created_at ? new Date(location.created_at).toLocaleDateString() : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t bg-gray-50 flex justify-center">
          <div className="text-sm text-gray-500">
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