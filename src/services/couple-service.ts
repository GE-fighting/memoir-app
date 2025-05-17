"use client";

import { apiClient } from "./api-client";
import { Couple, CoupleSettings } from "./api-types";

/**
 * 伴侣服务
 * 处理与伴侣关系相关的 API 请求
 */
export const coupleService = {
  /**
   * 获取当前用户的伴侣关系信息
   * @returns 伴侣关系信息
   */
  getCouple: async (): Promise<Couple> => {
    return apiClient.get<Couple>("/couples");
  },

  /**
   * 更新伴侣关系信息
   * @param coupleData 伴侣关系数据
   * @returns 更新后的伴侣关系信息
   */
  updateCouple: async (coupleData: Partial<Couple>): Promise<Couple> => {
    return apiClient.put<Couple>("/couples", coupleData);
  },

  /**
   * 获取伴侣关系设置
   * @returns 伴侣关系设置
   */
  getCoupleSettings: async (): Promise<CoupleSettings> => {
    return apiClient.get<CoupleSettings>("/couples/settings");
  },

  /**
   * 更新伴侣关系设置
   * @param settings 伴侣关系设置
   * @returns 更新后的伴侣关系设置
   */
  updateCoupleSettings: async (settings: Partial<CoupleSettings>): Promise<CoupleSettings> => {
    return apiClient.put<CoupleSettings>("/couples/settings", settings);
  },
}; 