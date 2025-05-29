"use client";

import { apiClient } from "./api-client";
import { 
  PersonalMedia, 
  PaginatedResponse,
  PageParams,
  MediaType,
} from "./api-types";

/**
 * 情侣媒体创建请求参数
 */
export interface CreateCoupleMediaWithURLParams {
  media_type: MediaType;
  title?: string;
  media_url: string;
  thumbnail_url: string;
  description?: string;
  album_id: string;
  event_id?: string;
  location_id?: string;
}

/**
 * 情侣媒体查询参数
 */
export interface QueryCoupleMediaParams {
  page?: number;
  page_size?: number;
  category?: string;
  media_type?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 情侣媒体服务
 * 处理与情侣空间照片和视频相关的 API 请求
 */
export const coupleMediaService = {
  /**
   * 通过URL创建情侣媒体
   * 用于前端上传到OSS后，将媒体信息保存到数据库
   * @param params 创建参数
   * @returns 创建的媒体对象
   */
  createCoupleMediaWithURL: async (params: CreateCoupleMediaWithURLParams): Promise<PersonalMedia> => {
    return apiClient.post<PersonalMedia>('/media/create', params);
  },

  /**
   * 获取情侣媒体列表
   * @param params 查询参数
   * @returns 分页媒体列表
   */
  queryCoupleMedia: async (params: QueryCoupleMediaParams = {}): Promise<PaginatedResponse<PersonalMedia>> => {
    // 设置默认值
    const queryParams = {
      page: params.page || 1,
      page_size: params.page_size || 10,
      category: params.category,
      media_type: params.media_type,
      start_date: params.start_date,
      end_date: params.end_date,
    };
    
    // 使用POST请求进行分页查询，符合后端API设计
    const response = await apiClient.post<PaginatedResponse<PersonalMedia>>('/couple-media/page', queryParams);
    return response;
  },
  



  /**
   * 获取情侣空间上传STS令牌
   * @returns STS令牌
   */
  getCoupleSTSToken: async (): Promise<any> => {
    return apiClient.get<any>('/couple/sts');
  }
};
