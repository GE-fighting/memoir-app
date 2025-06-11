'use client';

import { useState, useEffect } from 'react';

// 用户类型定义
interface User {
  id: string;
  username: string;
  email: string;
  couple_id?: string;
}

// 认证上下文返回类型
interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// 模拟的用户数据，实际应用中应从API获取
const mockUser: User = {
  id: '123',
  username: 'testuser',
  email: 'test@example.com',
  couple_id: '1' // 这里是硬编码的情侣ID，实际应用中应从API获取
};

/**
 * 认证钩子，用于获取当前用户信息和认证状态
 * 实际应用中，这应该与后端API交互，获取真实的用户信息
 */
export function useAuth(): AuthContextType {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 模拟从本地存储或API获取用户信息
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 实际应用中，这里应该调用API验证token并获取用户信息
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          // 模拟API调用延迟
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 使用模拟数据
          setCurrentUser(mockUser);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 模拟登录功能
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 实际应用中，这里应该调用API进行认证
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟成功登录
      localStorage.setItem('accessToken', 'mock-token');
      setCurrentUser(mockUser);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 登出功能
  const logout = () => {
    localStorage.removeItem('accessToken');
    setCurrentUser(null);
  };

  return {
    currentUser,
    isLoading,
    isAuthenticated: !!currentUser,
    login,
    logout
  };
} 