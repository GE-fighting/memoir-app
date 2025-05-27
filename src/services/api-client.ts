"use client";

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

// API 基础配置
// 使用环境变量定义API基础URL，如果不存在则使用相对路径
const API_BASE_URL = typeof window !== "undefined" 
  ? process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin 
  : "";
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || "/api/v1";

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

  // 基础请求方法
  async get<T>(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.get(url, config);
      return response.data.data as T;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.post(url, data, config);
      return response.data.data as T;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.put(url, data, config);
      return response.data.data as T;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    try {
      const response = await this.client.delete(url, config);
      return response.data.data as T;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  // 处理错误
  private handleError(error: AxiosError) {
    if (error.response) {
      // 服务器返回了错误状态码
      console.error('API 错误:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('无响应错误:', error.request);
    } else {
      // 请求配置有误
      console.error('请求错误:', error.message);
    }
  }
}

// 导出 API 客户端单例
export const apiClient = new ApiClient(); 