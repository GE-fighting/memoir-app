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
 * - 提供个人空间与情侣空间切换功能
 * 
 * 该组件通常在MainLayout中使用，是应用布局的重要组成部分。
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from './LanguageContext';
import { useAuth } from '@/contexts/auth-context';
import { useSpaceMode } from '@/contexts/space-mode-context';
import LogoutButton from './logout-button';

interface MenuItem {
  path: string;
  icon: string;
  labelZh: string;
  labelEn: string;
}

// 情侣空间菜单项 (不包含个人空间)
const coupleSpaceMenuItems: MenuItem[] = [
  {
    path: '/',
    icon: 'fas fa-chart-simple',
    labelZh: '仪表盘',
    labelEn: 'Dashboard'
  },
  {
    path: '/timeline',
    icon: 'fas fa-clock-rotate-left',
    labelZh: '记忆长廊',
    labelEn: 'Memory Gallery'
  },
  {
    path: '/albums',
    icon: 'fas fa-images',
    labelZh: '相册墙',
    labelEn: 'Albums'
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

// 个人空间菜单项 (包含个人空间和仪表盘)
const personalSpaceMenuItems: MenuItem[] = [
  {
    path: '/personal',
    icon: 'fas fa-chart-simple',
    labelZh: '仪表盘',
    labelEn: 'Dashboard'
  },
  {
    path: '/personal/gallery',
    icon: 'fas fa-user-circle',
    labelZh: '个人空间',
    labelEn: 'Personal Space'
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
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { spaceMode, setSpaceMode } = useSpaceMode();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // 切换空间模式并跳转到对应仪表盘
  const toggleSpaceModeAndRedirect = () => {
    const newMode = spaceMode === 'personal' ? 'couple' : 'personal';
    setSpaceMode(newMode);
    
    // 跳转到对应的仪表盘页面
    if (newMode === 'personal') {
      router.push('/personal');
    } else {
      router.push('/');
    }
  };

  // 根据当前模式选择菜单项
  const menuItems = spaceMode === 'personal' ? personalSpaceMenuItems : coupleSpaceMenuItems;

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
      
      <div className="space-mode-toggle">
        <button 
          className={`mode-toggle-btn ${spaceMode === 'personal' ? 'active' : ''}`}
          onClick={toggleSpaceModeAndRedirect}
        >
          <i className={`fas ${spaceMode === 'personal' ? 'fa-users' : 'fa-user'}`}></i>
          <span>
            {spaceMode === 'personal' 
              ? (language === 'zh' ? '情侣空间' : 'Couple Space') 
              : (language === 'zh' ? '个人空间' : 'Personal Space')}
          </span>
          <i className="fas fa-arrow-right arrow-icon"></i>
        </button>
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