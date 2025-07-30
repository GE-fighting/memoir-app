import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义空间模式类型
type SpaceMode = 'couple' | 'personal';

// 定义上下文类型
interface SpaceModeContextType {
  spaceMode: SpaceMode;
  toggleSpaceMode: () => void;
  setSpaceMode: (mode: SpaceMode) => void;
}

// 创建上下文
const SpaceModeContext = createContext<SpaceModeContextType | undefined>(undefined);

// 创建Provider组件
export function SpaceModeProvider({ children }: { children: ReactNode }) {
  // 初始化状态，优先从localStorage读取，如果没有则默认为'couple'
  const [spaceMode, setSpaceMode] = useState<SpaceMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('spaceMode');
      return (savedMode as SpaceMode) || 'couple';
    }
    return 'couple';
  });

  // 切换空间模式
  const toggleSpaceMode = () => {
    const newMode = spaceMode === 'couple' ? 'personal' : 'couple';
    setSpaceMode(newMode);
    // 保存到localStorage
    localStorage.setItem('spaceMode', newMode);
  };

  // 设置空间模式
  const setSpaceModeHandler = (mode: SpaceMode) => {
    setSpaceMode(mode);
    // 保存到localStorage
    localStorage.setItem('spaceMode', mode);
  };

  return (
    <SpaceModeContext.Provider 
      value={{ 
        spaceMode, 
        toggleSpaceMode, 
        setSpaceMode: setSpaceModeHandler 
      }}
    >
      {children}
    </SpaceModeContext.Provider>
  );
}

// 自定义Hook用于访问空间模式上下文
export function useSpaceMode() {
  const context = useContext(SpaceModeContext);
  if (context === undefined) {
    throw new Error('useSpaceMode must be used within a SpaceModeProvider');
  }
  return context;
}