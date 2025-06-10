/**
 * 侧边栏导航组件文件
 * 
 * 本文件实现了应用的主导航侧边栏，为用户提供应用的核心导航功能。
 * 
 * 主要功能：
 * - 提供应用的主要导航链接（仪表盘、时间轴、相册等）
 * - 支持折叠/展开功能，优化小屏幕体验
 * - 根据当前路由高亮活动菜单项
 * - 集成国际化支持，根据当前语言显示菜单文本
 * - 显示用户头像和简易信息
 * 
 * 该组件通常在MainLayout中使用，是应用布局的重要组成部分。
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageContext';
import { useAuth } from '@/contexts/auth-context';
import LogoutButton from './logout-button';

interface MenuItem {
  path: string;
  icon: string;
  labelZh: string;
  labelEn: string;
}

const menuItems: MenuItem[] = [
  {
    path: '/',
    icon: 'fas fa-chart-simple',
    labelZh: '仪表盘',
    labelEn: 'Dashboard'
  },
  {
    path: '/timeline',
    icon: 'fas fa-clock-rotate-left',
    labelZh: '时间轴',
    labelEn: 'Timeline'
  },
  {
    path: '/albums',
    icon: 'fas fa-images',
    labelZh: '相册墙',
    labelEn: 'Albums'
  },
  {
    path: '/personal',
    icon: 'fas fa-user-circle',
    labelZh: '个人空间',
    labelEn: 'Personal Space'
  },
  {
    path: '/wishlist',
    icon: 'fas fa-heart-circle-check',
    labelZh: '心愿画卷',
    labelEn: 'Journey Wishes'
  },
  {
    path: '/account',
    icon: 'fas fa-gear',
    labelZh: '账户设置',
    labelEn: 'Account Settings'
  }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { language } = useLanguage();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // 获取用户名的首字母作为头像显示
  const getInitial = () => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <i className="fas fa-book-heart"></i>
          <span>Memoir</span>
        </div>
        <button className="sidebar-collapse-btn" onClick={toggleSidebar}>
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <Link 
            href={item.path} 
            key={item.path}
            className={`menu-item ${pathname === item.path ? 'active' : ''}`}
          >
            <i className={item.icon}></i>
            <span>{language === 'zh' ? item.labelZh : item.labelEn}</span>
          </Link>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="profile-preview">
          <div className="avatar">
            <span>{getInitial()}</span>
          </div>
          <div className="user-name">{user?.username || '用户'}</div>
        </div>
        <LogoutButton className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
        </LogoutButton>
      </div>
    </div>
  );
} 