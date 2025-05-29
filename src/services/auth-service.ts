"use client";

import { apiClient } from "./api-client";
import { errorHandler } from "@/utils/error-handler";

// 认证响应类型
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * 认证服务
 * 处理用户认证相关的 API 请求
 */
export const authService = {
  /**
   * 用户登录
   * @param username 用户名
   * @param email 电子邮箱
   * @param password 密码
   * @returns 认证响应
   */
  login: async (username: string = "", email: string = "", password: string): Promise<AuthResponse> => {
    try {
      const payload: any = { password };
      
      // 根据提供的登录方式选择登录参数
      if (email) {
        payload.email = email;
      } else if (username) {
        payload.username = username;
      }

      return await apiClient.post<AuthResponse>("/auth/login", payload);
    } catch (error) {
      const errorMessage = errorHandler.getAuthErrorMessage(error);
      console.error("登录失败:", errorMessage);
      throw error;
    }
  },

  /**
   * 用户注册
   * @param username 用户名
   * @param email 电子邮箱
   * @param password 密码
   * @param pairToken 配对令牌（可选）
   * @returns 认证响应
   */
  register: async (
    username: string,
    email: string,
    password: string,
    pairToken?: string
  ): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>("/auth/register", {
        username,
        email,
        password,
        pair_token: pairToken || "",
      });
    } catch (error) {
      const errorMessage = errorHandler.getAuthErrorMessage(error);
      console.error("注册失败:", errorMessage);
      throw error;
    }
  },

  /**
   * 刷新认证令牌
   * @param refreshToken 刷新令牌
   * @returns 新的认证响应
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      return await apiClient.post<AuthResponse>("/auth/refresh", {
        refresh_token: refreshToken,
      });
    } catch (error) {
      console.error("刷新令牌失败:", errorHandler.parseApiError(error));
      throw error;
    }
  },

  /**
   * 保存认证令牌到本地存储
   * @param tokens 认证响应
   */
  saveTokens: (tokens: AuthResponse): void => {
    localStorage.setItem("accessToken", tokens.access_token);
    localStorage.setItem("refreshToken", tokens.refresh_token);
    
    // 从访问令牌中提取用户ID并保存
    try {
      // JWT token 的格式是 header.payload.signature
      const payload = tokens.access_token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      if (decodedPayload.sub) {
        localStorage.setItem("userId", decodedPayload.sub.toString());
      }
    } catch (error) {
      console.error("无法从令牌中提取用户ID:", error);
    }
  },

  /**
   * 清除本地存储的认证令牌
   */
  clearTokens: (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("coupleID");
  },

  /**
   * 获取保存的访问令牌
   * @returns 访问令牌
   */
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  /**
   * 获取保存的刷新令牌
   * @returns 刷新令牌
   */
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },

  /**
   * 检查用户是否已认证
   * @returns 是否已认证
   */
  isAuthenticated: (): boolean => {
    return !!authService.getAccessToken();
  }
}; 