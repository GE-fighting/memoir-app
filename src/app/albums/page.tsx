'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import Albums from '@/components/Albums';
import { userService } from '@/services/user-service';
import { useLanguage } from '@/components/LanguageContext';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useNotification } from '@/components/ui/notification';
import { useCoupleSpaceModal } from '@/components/ui/couple-space-modal';

export default function AlbumsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCoupleRelationship, setHasCoupleRelationship] = useState(false);
  const [hasCheckedRelationship, setHasCheckedRelationship] = useState(false);
  const [modalClosed] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  
  // 处理返回首页的行为
  const handleGoHome = useCallback(() => {
    router.push('/dashboard');
  }, [router]);
  
  // 使用新的useCoupleSpaceModal接口
  // 注意：现在两个按钮都会导航到首页，所以只需要提供onGoHome
  const { openModal, CoupleSpaceModalComponent } = useCoupleSpaceModal({
    onGoHome: handleGoHome
  });
  
  // 使用useRef存储函数引用，避免依赖变化
  const showNotificationRef = useRef(showNotification);
  const openModalRef = useRef(openModal);
  
  // 更新refs当函数变化时
  useEffect(() => {
    showNotificationRef.current = showNotification;
    openModalRef.current = openModal;
  }, [showNotification, openModal]);
  
  // 检查情侣关系的函数
  const checkCoupleRelationship = useCallback(async () => {
    if (hasCheckedRelationship) return; // 如果已经检查过，不再重复检查
    
    try {
      setIsLoading(true);
      const hasCouple = await userService.existCouple();
      
      setHasCoupleRelationship(hasCouple);
      setHasCheckedRelationship(true); // 标记已经检查过
      
      if (!hasCouple) {
        // 打开模态框，显示"情侣空间未开启"提示
        openModalRef.current();
      }
    } catch (error) {
      console.error('Failed to check couple relationship:', error);
      
      const message = language === 'zh' ? '检查情侣关系失败' : 'Failed to check couple relationship';
      const actionText = language === 'zh' ? '重试' : 'Retry';
      
      showNotificationRef.current({
        message,
        type: 'error',
        duration: 5000,
        actionText,
        onAction: () => {
          setHasCheckedRelationship(false); // 重置检查标记，允许重试
          checkCoupleRelationship();
        }
      });
    } finally {
      setIsLoading(false);
    }
  }, [language, hasCheckedRelationship]);

  // 只在组件挂载时检查一次情侣关系
  useEffect(() => {
    let isMounted = true;
    
    const checkRelationship = async () => {
      if (!isMounted) return;
      await checkCoupleRelationship();
    };
    
    checkRelationship();
    
    return () => {
      isMounted = false;
    };
  }, [checkCoupleRelationship]);

  // 确保当模态框关闭后，页面状态正确
  useEffect(() => {
    if (modalClosed) {
      // 重置页面状态，确保用户可以与页面交互
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
    }
  }, [modalClosed]);

  // 如果没有情侣关系，我们不再显示Albums组件，因为用户会被导航到首页
  // 这里保留这个逻辑是为了防止在导航完成前有闪烁
  const shouldShowAlbums = hasCoupleRelationship;

  return (
    <MainLayout title={{ zh: '相册墙', en: 'Albums' }}>
      {NotificationComponent}
      {CoupleSpaceModalComponent}
      {isLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shouldShowAlbums && <Albums />
      )}
    </MainLayout>
  );
} 