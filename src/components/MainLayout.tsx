/**
 * 主布局组件 - 为所有页面提供统一的布局结构
 * 包含侧边栏、顶部标题栏和内容区域
 */

// 'use client' 指令标识这是客户端组件
'use client';

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { LanguageSwitcher, T, useLanguage } from './LanguageContext';
import LogoutButton from './logout-button';

/**
 * 主布局组件属性接口
 * @property children - 子组件/内容
 * @property title - 页面标题对象，支持中英文
 */
interface MainLayoutProps {
  children: ReactNode;
  title: {
    zh: string;
    en: string;
  };
}

/**
 * 主布局组件
 * 提供应用的主要布局结构，包括侧边栏和主内容区
 * 
 * @param children - 页面内容
 * @param title - 页面标题，包含中英文版本
 */
export default function MainLayout({ children, title }: MainLayoutProps) {
  // 从语言上下文中获取当前语言设置
  const { language } = useLanguage();
  
  return (
    <>
      {/* 侧边栏组件，包含导航菜单 */}
      <Sidebar />
      
      {/* 主内容区域 */}
      <div className="main-container">
        {/* 顶部标题栏 */}
        <div className="header">
          {/* 根据当前语言显示对应标题 */}
          <h1 className="page-title">
            {language === 'zh' ? title.zh : title.en}
          </h1>
          
          {/* 右侧操作区域 */}
          <div className="header-actions">
            {/* 语言切换器，移到顶部操作区域 */}
            <LanguageSwitcher />
            
            {/* 通知图标 */}
            <div className="notification-bell">
              <i className="far fa-bell"></i>
              <span className="badge">2</span>
            </div>
            
            {/* 登出按钮 */}
            <LogoutButton className="header-logout-btn">
              <i className="fas fa-sign-out-alt mr-2"></i>
              <T zh="退出" en="Logout" />
            </LogoutButton>
          </div>
        </div>
        
        {/* 页面主要内容区域 */}
        <div className="content">
          {children}
        </div>
      </div>
    </>
  );
} 