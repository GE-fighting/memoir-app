/**
 * STS Token Cache Service
 * 
 * 用于缓存STS令牌，减少对后端API的请求次数
 * 令牌将被存储在localStorage中，有效期为1小时
 */

import { apiClient } from '@/services/api-client';
import { coupleMediaService } from '@/services/couple-media-service';

// 缓存键名
const PERSONAL_STS_CACHE_KEY = 'personal_sts_token_cache';
const COUPLE_STS_CACHE_KEY = 'couple_sts_token_cache';

// STS令牌接口
export interface STSTokenCache {
  accessKeyId: string;
  accessKeySecret: string;
  securityToken: string;
  expiration: string;
  region: string;
  bucket: string;
  timestamp: number; // 缓存时间戳
}

/**
 * 检查令牌是否有效
 * 
 * @param tokenCache 缓存的令牌
 * @returns 如果令牌有效返回true，否则返回false
 */
const isTokenValid = (tokenCache: STSTokenCache | null): boolean => {
  if (!tokenCache) return false;
  
  // 检查缓存是否超过1小时
  const now = Date.now();
  const cacheTime = tokenCache.timestamp;
  const oneHour = 60 * 60 * 1000; // 1小时的毫秒数
  
  if (now - cacheTime > oneHour) {
    return false;
  }
  
  // 检查令牌是否已过期（使用expiration字段）
  const expirationTime = new Date(tokenCache.expiration).getTime();
  if (now >= expirationTime) {
    return false;
  }
  
  return true;
};

/**
 * 获取个人STS令牌（带缓存）
 * 
 * @returns STS令牌
 */
export const getPersonalSTSToken = async (): Promise<STSTokenCache> => {
  try {
    // 尝试从缓存获取
    const cachedToken = getTokenFromCache(PERSONAL_STS_CACHE_KEY);
    
    // 如果缓存有效，直接返回
    if (isTokenValid(cachedToken)) {
      console.log('使用缓存的个人STS令牌');
      return cachedToken!;
    }
    
    // 缓存无效，从API获取新令牌
    console.log('从API获取新的个人STS令牌');
    const response = await apiClient.get<STSTokenCache>("oss/token");
    
    // 添加时间戳并缓存
    const tokenWithTimestamp: STSTokenCache = {
      ...response,
      timestamp: Date.now()
    };
    
    // 保存到缓存
    saveTokenToCache(PERSONAL_STS_CACHE_KEY, tokenWithTimestamp);
    
    return tokenWithTimestamp;
  } catch (error) {
    console.error("获取个人STS令牌失败:", error);
    throw error;
  }
};

/**
 * 获取情侣STS令牌（带缓存）
 * 
 * @returns STS令牌
 */
export const getCoupleSTSToken = async (): Promise<STSTokenCache> => {
  try {
    // 尝试从缓存获取
    const cachedToken = getTokenFromCache(COUPLE_STS_CACHE_KEY);
    
    // 如果缓存有效，直接返回
    if (isTokenValid(cachedToken)) {
      console.log('使用缓存的情侣STS令牌');
      return cachedToken!;
    }
    
    // 缓存无效，从API获取新令牌
    console.log('从API获取新的情侣STS令牌');
    const response = await coupleMediaService.getCoupleSTSToken();
    
    // 添加时间戳并缓存
    const tokenWithTimestamp: STSTokenCache = {
      ...response,
      timestamp: Date.now()
    };
    
    // 保存到缓存
    saveTokenToCache(COUPLE_STS_CACHE_KEY, tokenWithTimestamp);
    
    return tokenWithTimestamp;
  } catch (error) {
    console.error("获取情侣STS令牌失败:", error);
    throw error;
  }
};

/**
 * 从缓存获取令牌
 * 
 * @param cacheKey 缓存键名
 * @returns 缓存的令牌，如果不存在则返回null
 */
const getTokenFromCache = (cacheKey: string): STSTokenCache | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    return JSON.parse(cachedData) as STSTokenCache;
  } catch (error) {
    console.error(`从缓存获取${cacheKey}失败:`, error);
    return null;
  }
};

/**
 * 保存令牌到缓存
 * 
 * @param cacheKey 缓存键名
 * @param token 要缓存的令牌
 */
const saveTokenToCache = (cacheKey: string, token: STSTokenCache): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(cacheKey, JSON.stringify(token));
  } catch (error) {
    console.error(`保存${cacheKey}到缓存失败:`, error);
  }
};

/**
 * 清除所有STS令牌缓存
 */
export const clearAllSTSTokenCache = (): void => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(PERSONAL_STS_CACHE_KEY);
    localStorage.removeItem(COUPLE_STS_CACHE_KEY);
  } catch (error) {
    console.error('清除STS令牌缓存失败:', error);
  }
}; 