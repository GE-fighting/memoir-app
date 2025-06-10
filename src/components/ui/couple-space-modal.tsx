import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageContext';

interface CoupleSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoHome: () => void;
}

export default function CoupleSpaceModal({ isOpen, onClose, onGoHome }: CoupleSpaceModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isRenderingDOM, setIsRenderingDOM] = useState(false);
  const { language } = useLanguage();

  // 控制页面滚动和交互
  useEffect(() => {
    if (isOpen) {
      // 禁用页面滚动和交互
      document.body.style.overflow = 'hidden';
    } else {
      // 恢复页面滚动和交互
      document.body.style.overflow = 'auto';
    }
    
    // 组件卸载时恢复页面状态
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // 立即将组件添加到DOM
      setIsRenderingDOM(true);
      setIsExiting(false);
      // Small delay to trigger enter animation
      setTimeout(() => setIsVisible(true), 10);
      // Start heart animation after modal appears
      setTimeout(() => setIsHeartAnimating(true), 500);
    } else if (!isOpen && isRenderingDOM) {
      // 只有当模态框已经在DOM中时才执行关闭动画
      // 当isOpen为false时，确保组件不在DOM中
      setIsVisible(false);
      setIsHeartAnimating(false);
      setIsExiting(false);
      // 延迟从DOM中移除，以便动画完成
      setTimeout(() => {
        setIsRenderingDOM(false);
      }, 300);
    }
  }, [isOpen, isRenderingDOM]);

  const handleClose = () => {
    setIsExiting(true);
    setIsVisible(false);
    setIsHeartAnimating(false);
    // Wait for exit animation to complete
    setTimeout(() => {
      onGoHome();
    }, 300);
  };

  const handleGoHome = () => {
    setIsExiting(true);
    setIsVisible(false);
    setIsHeartAnimating(false);
    // Wait for exit animation to complete
    setTimeout(() => {
      onGoHome();
    }, 300);
  };

  // 如果不需要渲染到DOM，直接返回null
  if (!isRenderingDOM) return null;

  const title = language === 'zh' ? '情侣空间未开启' : 'Couple Space Not Activated';
  const message = language === 'zh' 
    ? '您需要先建立情侣关系才能访问相册墙。请邀请您的伴侣加入并建立情侣关系。'
    : 'You need to establish a couple relationship first to access the album wall. Please invite your partner to join and establish a couple relationship.';
  const homeButtonText = language === 'zh' ? '返回首页' : 'Back to Home';
  const closeButtonText = language === 'zh' ? '关闭' : 'Close';

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${isExiting ? 'opacity-0' : ''}`}
      onClick={(e) => e.stopPropagation()} // 防止点击背景关闭模态框
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'
        } ${isExiting ? 'scale-95 translate-y-4' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 flex items-center">
          <div className="mr-3 bg-white bg-opacity-20 p-2 rounded-full">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white flex-1">{title}</h3>
          {/* 移除右上角关闭按钮，强制用户使用底部按钮 */}
        </div>
        
        <div className="p-6">
          {/* Illustration */}
          <div className="flex justify-center mb-6">
            <div className={`w-40 h-40 relative transition-transform duration-700 ease-in-out ${
              isHeartAnimating ? 'scale-110' : 'scale-100'
            }`}>
              {/* Heart with lock illustration */}
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Heart shape with pulse animation */}
                <path 
                  className={`transition-all duration-1000 ${
                    isHeartAnimating ? 'opacity-100' : 'opacity-80'
                  }`}
                  d="M50 85C50 85 15 65 15 40C15 25 25 15 40 15C45 15 50 20 50 20C50 20 55 15 60 15C75 15 85 25 85 40C85 65 50 85 50 85Z" 
                  fill="#FFECEC" 
                  stroke="#FF6B6B" 
                  strokeWidth="3"
                >
                  <animate 
                    attributeName="opacity" 
                    values="0.8;1;0.8" 
                    dur="2s" 
                    repeatCount="indefinite" 
                    begin={isHeartAnimating ? '0s' : 'indefinite'}
                  />
                </path>
                
                {/* Lock body */}
                <rect x="35" y="45" width="30" height="25" rx="2" fill="#FFD166" stroke="#FF9E00" strokeWidth="2">
                  <animate 
                    attributeName="y" 
                    values="45;43;45" 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                    begin={isHeartAnimating ? '0.5s' : 'indefinite'}
                  />
                </rect>
                
                {/* Lock shackle */}
                <path 
                  d="M40 45V35C40 30 45 25 50 25C55 25 60 30 60 35V45" 
                  stroke="#FF9E00" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                >
                  <animate 
                    attributeName="d" 
                    values="M40 45V35C40 30 45 25 50 25C55 25 60 30 60 35V45;M40 43V35C40 30 45 25 50 25C55 25 60 30 60 35V43;M40 45V35C40 30 45 25 50 25C55 25 60 30 60 35V45" 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                    begin={isHeartAnimating ? '0.5s' : 'indefinite'}
                  />
                </path>
                
                {/* Keyhole */}
                <circle cx="50" cy="55" r="5" fill="#FFFFFF">
                  <animate 
                    attributeName="cy" 
                    values="55;53;55" 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                    begin={isHeartAnimating ? '0.5s' : 'indefinite'}
                  />
                </circle>
                <rect x="48" y="55" width="4" height="8" fill="#FFFFFF">
                  <animate 
                    attributeName="y" 
                    values="55;53;55" 
                    dur="1.5s" 
                    repeatCount="indefinite" 
                    begin={isHeartAnimating ? '0.5s' : 'indefinite'}
                  />
                </rect>
              </svg>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 text-center">{message}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {closeButtonText}
            </button>
            <button
              onClick={handleGoHome}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-colors shadow-md"
            >
              {homeButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
}

export interface UseCoupleSpaceModalOptions {
  onClose?: () => void;
  onGoHome?: () => void;
}

export function useCoupleSpaceModal(options: UseCoupleSpaceModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const openModal = () => setIsOpen(true);
  
  // 修改closeModal函数，使其与goToHome功能相同，都跳转到首页
  const closeModal = () => {
    setIsOpen(false);
    if (options.onGoHome) {
      options.onGoHome();
    } else {
      router.push('/dashboard');
    }
  };
  
  const goToHome = () => {
    setIsOpen(false);
    if (options.onGoHome) {
      options.onGoHome();
    } else {
      router.push('/dashboard');
    }
  };

  const CoupleSpaceModalComponent = (
    <CoupleSpaceModal 
      isOpen={isOpen} 
      onClose={closeModal}
      onGoHome={goToHome} 
    />
  );

  return {
    openModal,
    closeModal,
    CoupleSpaceModalComponent,
  };
} 