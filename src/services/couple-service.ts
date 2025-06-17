"use client";

import { apiClient } from "./api-client";

export interface CoupleInfoDTO {
  couple_id: string;
  couple_name: string;
  couple_days: number;
  anniversary_date: string
}

export interface CreateCoupleRequest {
  pair_token: string;
  anniversary_date: string;
}



/**
 * 伴侣服务
 * 处理与伴侣关系相关的 API 请求
 */
export const coupleService = {
  /**
   * 创建情侣关系
   * @param param 
   * @returns 
   */
  createCouple: async (param: CreateCoupleRequest): Promise<CoupleInfoDTO> => {
    return apiClient.post<CoupleInfoDTO>("/couple/create", param)
  },

  /**
   * 获取情侣数据
   * @returns 
   */
  getCoupleInfo: async (): Promise<CoupleInfoDTO> => {
    return apiClient.get<CoupleInfoDTO>("/couple/info")
  }
}; 