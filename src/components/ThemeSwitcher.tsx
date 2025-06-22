'use client';

import React from 'react';
import { useTheme } from '@/contexts/theme-context';
import { useLanguage } from './LanguageContext';

export default function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher"
      title={
        theme === 'light'
          ? (language === 'zh' ? '切换到深色模式' : 'Switch to Dark Mode')
          : (language === 'zh' ? '切换到浅色模式' : 'Switch to Light Mode')
      }
    >
      {theme === 'light' ? (
        <i className="fas fa-moon"></i>
      ) : (
        <i className="fas fa-sun"></i>
      )}
    </button>
  );
}
