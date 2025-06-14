"use client";

import { apiClient } from "./api-client";
import { 
  Location, 
  CreateLocationRequest,
  PaginationParams, 
  PaginatedResponse 
} from "./api-types";

/**
 * 位置服务
 * 处理与地点位置相关的 API 请求
 */
export const locationService = {
  /**
   * 获取位置列表
   * @param params 分页参数
   * @returns 位置列表
   */
  getLocations: async (params?: PaginationParams & {
    couple_id?: string;
    query?: string;
    nearLat?: number;
    nearLng?: number;
    radius?: number;
  }): Promise<Location[]> => {
    return apiClient.get<Location[]>("/locations/list", { params });  
  },

  /**
   * 获取单个位置
   * @param id 位置ID
   * @returns 位置信息
   * @deprecated 后端暂不支持此操作
   */
  // getLocation: async (id: number): Promise<Location> => {
  //   return apiClient.get<Location>(`/locations/${id}`);
  // },

  /**
   * 创建位置
   * @param locationData 位置数据
   * @returns 创建的位置
   */
  createLocation: async (locationData: CreateLocationRequest): Promise<Location> => {
    return apiClient.post<Location>("/locations/create", locationData);
  },
}; 