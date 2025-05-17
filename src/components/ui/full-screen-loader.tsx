"use client";

import React from "react";
import LoadingSpinner from "./loading-spinner";

interface FullScreenLoaderProps {
  message?: string;
}

/**
 * 全屏加载组件
 * 
 * 显示一个全屏的加载动画和可选的提示信息
 * 
 * @param message 加载提示信息
 */
export default function FullScreenLoader({
  message = "加载中...",
}: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-90">
      <LoadingSpinner size="lg" className="mb-4" />
      {message && (
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
          {message}
        </p>
      )}
    </div>
  );
} 