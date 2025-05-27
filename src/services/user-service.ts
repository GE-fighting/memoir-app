"use client";

import { apiClient } from "./api-client";
import { User, UserPreferences, ApiResponse } from "./api-types";

/**
 * 用户服务
 * 处理与用户相关的 API 请求
 */
export const userService = {
  /**
   * 获取当前用户信息
   * @returns 当前用户信息
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>("/users/me");
  },

  /**
   * 更新用户信息
   * @param userData 用户数据
   * @returns 更新后的用户信息
   */
  updateUser: async (userData: Partial<User>): Promise<User> => {
    return apiClient.put<User>("/users/me", userData);
  },

  /**
   * 获取用户偏好设置
   * @returns 用户偏好设置
   */
  getUserPreferences: async (): Promise<UserPreferences> => {
    return apiClient.get<UserPreferences>("/users/preferences");
  },

  /**
   * 更新用户偏好设置
   * @param preferences 用户偏好设置
   * @returns 更新后的用户偏好设置
   */
  updateUserPreferences: async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    return apiClient.put<UserPreferences>("/users/preferences", preferences);
  },

  /**
   * 获取用户是否存在情侣关系
   * @returns 是否存在情侣关系
   */
  existCouple: async (): Promise<boolean> => {
    return apiClient.get<boolean>("/users/exist-couple");
  },
}; 