/**
 * 主布局组件 - 为所有页面提供统一的布局结构
 * 包含侧边栏、顶部标题栏和内容区域
 */

// 'use client' 指令标识这是客户端组件
'use client';

import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { LanguageSwitcher, T, useLanguage } from './LanguageContext';

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
      {/* 语言切换器，显示在页面右上角 */}
      <LanguageSwitcher />
      
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
            {/* 通知图标 */}
            <div className="notification-bell">
              <i className="far fa-bell"></i>
              <span className="badge">2</span>
            </div>
            
            {/* 新建按钮，使用T组件实现多语言 */}
            <button className="btn btn-primary">
              <i className="fas fa-plus"></i>
              <T zh="新建" en="Create New" />
            </button>
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