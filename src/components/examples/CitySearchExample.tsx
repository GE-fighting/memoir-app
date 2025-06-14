/**
 * 城市搜索组件示例
 * 展示如何使用高德地图地理编码服务
 */

'use client';

import React, { useState } from 'react';
import { geocodingService, GeocodingResult } from '../../lib/services/geocodingService';

export default function CitySearchExample() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await geocodingService.searchCities(query);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: GeocodingResult) => {
    setSelectedCity(city);
    setQuery(city.city || city.name);
    setResults([]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        城市搜索示例
      </h2>

      {/* API配置状态 */}
      <div className="mb-4">
        {geocodingService.isConfigured() ? (
          <div className="flex items-center text-green-600">
            <i className="fas fa-check-circle mr-2"></i>
            高德地图API已配置
          </div>
        ) : (
          <div className="flex items-center text-red-600">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            请配置高德地图API Key
          </div>
        )}
      </div>

      {/* 搜索输入 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          搜索城市
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="输入城市名称，如：北京、上海、广州"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !geocodingService.isConfigured()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-search"></i>
            )}
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center text-red-700">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-800 mb-2">搜索结果</h3>
          <div className="space-y-2">
            {results.map((city, index) => (
              <div
                key={index}
                onClick={() => handleCitySelect(city)}
                className="p-3 border border-gray-200 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="font-medium text-gray-900">
                  {city.city || city.name}
                </div>
                <div className="text-sm text-gray-600">
                  {city.formattedAddress}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  经度: {city.longitude.toFixed(6)}, 纬度: {city.latitude.toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 选中的城市信息 */}
      {selectedCity && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            已选择城市
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">城市名称:</span> {selectedCity.city || selectedCity.name}
            </div>
            <div>
              <span className="font-medium">省份:</span> {selectedCity.province}
            </div>
            <div>
              <span className="font-medium">经度:</span> {selectedCity.longitude.toFixed(6)}
            </div>
            <div>
              <span className="font-medium">纬度:</span> {selectedCity.latitude.toFixed(6)}
            </div>
            <div className="col-span-2">
              <span className="font-medium">完整地址:</span> {selectedCity.formattedAddress}
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-medium text-gray-800 mb-2">使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 支持中文和英文城市名称搜索</li>
          <li>• 可以搜索城市、省份等地理位置</li>
          <li>• 点击搜索结果可以选择城市并获取详细信息</li>
          <li>• 自动获取精确的经纬度坐标</li>
        </ul>
      </div>
    </div>
  );
}
