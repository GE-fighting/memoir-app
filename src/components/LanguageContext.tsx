/**
 * 多语言支持上下文文件
 * 
 * 本文件实现了应用的国际化功能，提供中英文切换和翻译能力。
 * 
 * 包含以下关键组件和函数：
 * - LanguageProvider: 语言上下文提供者，包装整个应用提供语言状态
 * - useLanguage: 自定义Hook，用于在组件中获取和设置当前语言
 * - LanguageSwitcher: 语言切换器组件，显示在页面右上角
 * - T: 便捷翻译组件，根据当前语言显示对应文本
 * 
 * 这个文件是应用国际化的核心，使所有组件能够访问和响应语言设置。
 */

'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'zh' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (zhText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  const t = (zhText: string, enText: string) => {
    return language === 'zh' ? zhText : enText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className="language-switch">
      <button 
        className={`language-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        EN
      </button>
      <button 
        className={`language-btn ${language === 'zh' ? 'active' : ''}`}
        onClick={() => setLanguage('zh')}
      >
        中
      </button>
    </div>
  );
}

export function T({ zh, en }: { zh: string; en: string }) {
  const { language } = useLanguage();
  return <>{language === 'zh' ? zh : en}</>;
} 