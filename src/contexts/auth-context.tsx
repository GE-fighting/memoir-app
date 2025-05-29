"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { userService, authService } from "@/services";
import { User } from "@/services/api-types";

// 定义用户类型
type AuthUser = User | null;

// 定义认证上下文类型
type AuthContextType = {
  user: AuthUser;
  isLoading: boolean;
  login: (username: string, email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, pairToken?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshTokens: () => Promise<boolean>;
};

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证上下文提供者组件
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // 验证是否已认证
  const isAuthenticated = !!user;

  // 组件挂载时检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setIsLoading(false);
          return;
        }

        // 获取当前用户信息
        try {
          const userData = await userService.getCurrentUser();
          setUser(userData);
          // 确保用户ID和情侣ID被保存到localStorage
          localStorage.setItem('userId', String(userData.id));
          if (userData.couple_id) {
            localStorage.setItem('coupleID', String(userData.couple_id));
          }
        } catch (error) {
          // 如果令牌无效，尝试刷新
          const refreshSuccess = await refreshTokens();
          if (!refreshSuccess) {
            logout();
          }
        }
      } catch (error) {
        console.error("认证检查失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 刷新令牌
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) return false;

      const tokenData = await authService.refreshToken(refreshToken);
      authService.saveTokens(tokenData);

      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
        // 确保用户ID和情侣ID被保存到localStorage
        localStorage.setItem('userId', String(userData.id));
        if (userData.couple_id) {
          localStorage.setItem('coupleID', String(userData.couple_id));
        }
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error("刷新令牌失败:", error);
      return false;
    }
  };

  // 登录方法
  const login = async (
    username: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      const tokenData = await authService.login(username, email, password);
      authService.saveTokens(tokenData);

      // 获取用户信息
      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
        // 保存用户ID和情侣ID到localStorage
        localStorage.setItem('userId', String(userData.id));
        if (userData.couple_id) {
          localStorage.setItem('coupleID', String(userData.couple_id));
        }
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error("登录失败:", error);
      return false;
    }
  };

  // 注册方法
  const register = async (
    username: string,
    email: string,
    password: string,
    pairToken?: string
  ): Promise<boolean> => {
    try {
      const tokenData = await authService.register(
        username,
        email,
        password,
        pairToken
      );
      authService.saveTokens(tokenData);

      // 获取用户信息
      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
        // 保存用户ID和情侣ID到localStorage
        localStorage.setItem('userId', String(userData.id));
        if (userData.couple_id) {
          localStorage.setItem('coupleID', String(userData.couple_id));
        }
        return true;
      } catch {
        return false;
      }
    } catch (error) {
      console.error("注册失败:", error);
      return false;
    }
  };

  // 登出方法
  const logout = () => {
    authService.clearTokens();
    localStorage.removeItem('userId');
    localStorage.removeItem('coupleID');
    setUser(null);
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 自定义钩子，用于在组件中使用认证上下文
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 