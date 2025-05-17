"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import LoadingSpinner from "../ui/loading-spinner";

interface AuthVerifyProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * 认证验证组件
 * 
 * 该组件用于保护路由，确保用户已登录才能访问特定页面，
 * 或确保用户未登录才能访问特定页面（如登录、注册页面）
 * 
 * @param children 子组件
 * @param redirectTo 重定向路径
 * @param requireAuth 是否需要认证（默认为true）
 */
export default function AuthVerify({ 
  children, 
  redirectTo = "/auth/login", 
  requireAuth = true 
}: AuthVerifyProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // 如果需要认证但未登录，重定向到登录页
      if (requireAuth && !isAuthenticated) {
        router.replace(redirectTo);
      }
      // 如果不需要认证但已登录，重定向到仪表板
      else if (!requireAuth && isAuthenticated) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !isAuthenticated) {
    return null; // 等待重定向
  }

  if (!requireAuth && isAuthenticated) {
    return null; // 等待重定向
  }

  return <>{children}</>;
} 