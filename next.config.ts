/**
 * Next.js配置文件
 * 
 * 本文件定义Next.js应用的全局配置选项。通过该文件可以自定义Next.js的行为，如：
 * - 环境变量配置
 * - 页面和API路由的重写规则
 * - 自定义webpack配置
 * - 国际化设置
 * - 图像优化配置
 * - 服务器端中间件
 * 
 * 这是Next.js应用的核心配置文件，影响整个项目的构建和运行行为。
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 添加API请求重写规则，用于开发环境
  async rewrites() {
    // 判断是否处于开发环境
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发环境中启用API请求代理
    if (isDevelopment && process.env.NEXT_PUBLIC_API_BASE_URL) {
      return [
        {
          // 匹配所有以/api/v1开头的请求
          source: "/api/v1/:path*",
          // 重写到环境变量中定义的API地址
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/:path*`
        }
      ];
    }
    
    return [];
  },
  
  // 配置ESLint选项
  eslint: {
    // 在构建过程中忽略ESLint错误，允许即使有ESLint错误也能完成生产构建
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
