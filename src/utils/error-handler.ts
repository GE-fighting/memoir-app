"use client";

import { AxiosError } from "axios";

/**
 * API 错误类型
 */
export interface ApiErrorResponse {
  error?: string;
  message?: string;
  status?: number;
}

/**
 * 解析 API 错误
 * @param error Axios错误对象
 * @returns 格式化的错误消息
 */
export function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ApiErrorResponse;
    
    // 尝试获取API返回的错误消息
    if (response?.message) {
      return response.message;
    }
    
    if (response?.error) {
      return response.error;
    }
    
    // 处理常见的 HTTP 状态码
    switch (error.response?.status) {
      case 400:
        return "请求参数有误";
      case 401:
        return "未授权，请重新登录";
      case 403:
        return "没有访问权限";
      case 404:
        return "请求的资源不存在";
      case 409:
        return "资源冲突，可能已存在";
      case 422:
        return "请求格式正确，但含有语义错误";
      case 429:
        return "请求过于频繁，请稍后再试";
      case 500:
        return "服务器内部错误";
      default:
        return error.message || "发生未知错误";
    }
  }
  
  // 处理非 Axios 错误
  if (error instanceof Error) {
    return error.message;
  }
  
  return "发生未知错误";
}

/**
 * 错误处理工具
 */
export const errorHandler = {
  /**
   * 解析API错误
   */
  parseApiError,
  
  /**
   * 处理认证错误
   * @param error 错误对象
   * @returns 格式化的认证错误消息
   */
  getAuthErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      switch (error.response?.status) {
        case 401:
          return "用户名或密码错误";
        case 409:
          return "用户已存在，请直接登录或使用其他邮箱";
        default:
          return parseApiError(error);
      }
    }
    
    return parseApiError(error);
  }
}; 