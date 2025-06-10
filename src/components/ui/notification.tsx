import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { T, useLanguage } from '@/components/LanguageContext';

export interface NotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  actionText?: string;
  onAction?: () => void;
  onClose?: () => void;
  autoClose?: boolean;
}

export function Notification({
  message,
  type = 'info',
  duration = 5000,
  actionText,
  onAction,
  onClose,
  autoClose = true
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    // Enter animation
    const enterTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Auto dismiss after duration, only if autoClose is true
    let dismissTimeout: NodeJS.Timeout | null = null;
    if (autoClose) {
      dismissTimeout = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      clearTimeout(enterTimeout);
      if (dismissTimeout) {
        clearTimeout(dismissTimeout);
      }
    };
  }, [duration, autoClose]);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const handleAction = () => {
    if (onAction) onAction();
    handleClose();
  };

  if (!isVisible && !isExiting) return null;

  const typeConfig = {
    info: {
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      borderColor: 'border-blue-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
      borderColor: 'border-green-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
      borderColor: 'border-yellow-600',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-gradient-to-r from-red-500 to-red-600',
      borderColor: 'border-red-700',
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const { bgColor, borderColor, icon } = typeConfig[type];

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      } ${isExiting ? 'opacity-0 translate-y-4' : ''}`}
    >
      <div className={`${bgColor} rounded-lg shadow-lg overflow-hidden max-w-md w-full flex border ${borderColor}`}>
        <div className="p-4 flex items-center space-x-3">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 rounded-full">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium">{message}</p>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2">
            {actionText && (
              <button
                onClick={handleAction}
                className="bg-white text-gray-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm"
              >
                {actionText}
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors bg-white bg-opacity-10 rounded-full p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const router = useRouter();
  const { language } = useLanguage();

  const showNotification = (props: NotificationProps) => {
    setNotification(props);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  const showCoupleNotActivated = () => {
    const message = language === 'zh' ? '情侣空间未开启' : 'Couple space is not activated';
    const actionText = language === 'zh' ? '返回首页' : 'Back to Home';
    
    showNotification({
      message,
      type: 'warning',
      duration: 5000,
      actionText,
      onAction: () => {
        router.push('/dashboard');
      },
      onClose: () => {
        router.push('/dashboard');
      },
      autoClose: false
    });
  };

  const NotificationComponent = notification ? (
    <Notification
      {...notification}
      onClose={() => {
        if (notification.onClose) notification.onClose();
        hideNotification();
      }}
    />
  ) : null;

  return {
    showNotification,
    hideNotification,
    showCoupleNotActivated,
    NotificationComponent
  };
} 