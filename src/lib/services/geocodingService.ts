"use client";

import { getEnvConfig } from '../config/env';

// 高德地图地理编码API响应类型
interface AmapGeocodingResponse {
  status: string;
  info: string;
  infocode: string;
  count: string;
  geocodes: AmapGeocode[];
}

interface AmapGeocode {
  formatted_address: string;
  country: string;
  province: string;
  citycode: string;
  city: string;
  district: string;
  township: string;
  neighborhood: {
    name: string;
    type: string;
  };
  building: {
    name: string;
    type: string;
  };
  adcode: string;
  street: string;
  number: string;
  location: string; // "经度,纬度"
  level: string;
}

// 地理编码结果类型
export interface GeocodingResult {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  province: string;
  country: string;
}

// 高德地图地理编码服务
class GeocodingService {
  private apiKey: string;
  private baseUrl = 'https://restapi.amap.com/v3/geocode/geo';
  private cache = new Map<string, { data: GeocodingResult[], timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    const config = getEnvConfig();
    this.apiKey = config.amapApiKey;

    // 临时调试：如果环境变量未加载，使用硬编码（仅用于测试）
    if (!this.apiKey && process.env.NODE_ENV === 'development') {
      console.warn('高德地图API Key 环境变量未加载');
    }
  }

  /**
   * 根据地址获取经纬度
   * @param address 地址字符串，如"北京市朝阳区"
   * @returns 地理编码结果数组
   */
  async geocode(address: string): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      throw new Error('高德地图API Key未配置，请在环境变量中设置 NEXT_PUBLIC_AMAP_API_KEY');
    }

    if (!address.trim()) {
      return [];
    }

    // 检查缓存
    const cacheKey = address.trim().toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('使用缓存结果:', cacheKey);
      return cached.data;
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        address: address.trim(),
        output: 'json',
        batch: 'false'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AmapGeocodingResponse = await response.json();

      if (data.status !== '1') {
        throw new Error(`高德地图API错误: ${data.info} (${data.infocode})`);
      }

      const results = data.geocodes.map(geocode => {
        const [longitude, latitude] = geocode.location.split(',').map(Number);
        return {
          name: address,
          formattedAddress: geocode.formatted_address,
          latitude,
          longitude,
          city: geocode.city || geocode.province,
          province: geocode.province,
          country: geocode.country
        };
      });

      // 保存到缓存
      this.cache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('地理编码失败:', error);
      throw error;
    }
  }

  /**
   * 搜索城市建议
   * @param query 搜索关键词
   * @returns 城市建议列表
   */
  async searchCities(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // 直接搜索用户输入的内容，避免多次API调用
      const results = await this.geocode(query.trim());
      return results.slice(0, 10); // 最多返回10个结果
    } catch (error) {
      console.warn(`搜索 "${query}" 失败:`, error);

      // 如果是频率限制错误，抛出更友好的错误信息
      if (error instanceof Error) {
        if (error.message.includes('CHOPS_HAS_EXCEEDED_THE_LIMIT') || error.message.includes('10021')) {
          throw new Error('搜索频率过快，请稍后再试');
        }
        if (error.message.includes('INVALID_USER_KEY') || error.message.includes('10001')) {
          throw new Error('API密钥无效，请检查配置');
        }
        if (error.message.includes('INSUFFICIENT_PRIVILEGES') || error.message.includes('10004')) {
          throw new Error('API权限不足，请检查服务配置');
        }
      }

      throw error;
    }
  }

  /**
   * 检查API Key是否已配置
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// 导出单例实例
export const geocodingService = new GeocodingService();
