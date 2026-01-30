"use client";

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { getEnvConfig } from "@/lib/config/env";

// API 基础配置
// API 基础配置
const env = getEnvConfig();
// 使用环境变量定义API基础URL，如果不存在则使用相对路径
const API_BASE_URL = typeof window !== "undefined"
  ? env.apiBaseUrl.startsWith('http') ? env.apiBaseUrl : window.location.origin
  : "";
const API_PREFIX = env.apiPrefix;




/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * API业务逻辑错误
 */
export class ApiError extends Error {
  code: number;
  success: boolean;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.success = false;
  }
}

/**
 * API 客户端类
 * 提供了基础的 API 请求方法，自动处理认证和请求/响应拦截
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // 创建 axios 实例，合并基础URL和API前缀
    this.client = axios.create({
      baseURL: `${API_BASE_URL}${API_PREFIX}`,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 请求拦截器 - 添加 token
    this.client.interceptors.request.use(
      (config) => {
        // 从 localStorage 获取 token
        const token = typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

        // 如果 token 存在，添加到请求头
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 处理常见错误
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // 处理 401 未授权错误 - 尝试刷新 token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // 尝试刷新 token
            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
              return Promise.reject(error);
            }

            const refreshResponse = await axios.post(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            // 更新 tokens
            const { access_token, refresh_token } = refreshResponse.data;
            localStorage.setItem("accessToken", access_token);
            localStorage.setItem("refreshToken", refresh_token);

            // 使用新 token 重试原请求
            this.client.defaults.headers.common.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // 刷新 token 失败，清除当前登录状态
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            // 重定向到登录页
            if (typeof window !== "undefined") {
              window.location.href = "/auth/login";
            }

            return Promise.reject(refreshError);
          }
        }

        // 处理其他错误
        return Promise.reject(error);
      }
    );
  }

  /**
   * 验证API响应状态
   * @param response API响应对象
   * @returns 验证通过的响应数据
   * @throws ApiError 当响应状态不成功时
   */
  private validateResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const apiResponse = response.data;

    // 检查响应状态
    if (!apiResponse.success) {
      throw new ApiError(
        apiResponse.message || apiResponse.error || '请求失败',
        apiResponse.code
      );
    }

    // 返回响应数据
    return apiResponse.data as T;
  }

  // 基础请求方法
  async get<T>(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return this.validateResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return this.validateResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return this.validateResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return this.validateResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // 处理错误
  private handleError(error: unknown) {
    if (error instanceof ApiError) {
      // 业务逻辑错误
      console.error(`API 业务错误: [${error.code}] ${error.message}`);
    } else if (error instanceof AxiosError && error.response) {
      // 服务器返回了错误状态码
      console.error('API 错误:', error.response.data);
    } else if (error instanceof AxiosError && error.request) {
      // 请求已发送但没有收到响应
      console.error('无响应错误:', error.request);
    } else if (error instanceof Error) {
      // 请求配置有误或其他错误
      console.error('请求错误:', error.message);
    } else {
      console.error('未知错误:', error);
    }
  }
}

// 导出 API 客户端单例
export const apiClient = new ApiClient(); 