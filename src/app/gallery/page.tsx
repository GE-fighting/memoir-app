'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import Gallery from '@/components/Gallery';
import { userService } from '@/services/user-service';
import { useLanguage } from '@/components/LanguageContext';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useNotification } from '@/components/ui/notification';
import { useCoupleSpaceModal } from '@/components/ui/couple-space-modal';

export default function GalleryPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCoupleRelationship, setHasCoupleRelationship] = useState(false);
  const [hasCheckedRelationship, setHasCheckedRelationship] = useState(false);
  const { showNotification, NotificationComponent } = useNotification();
  
  // 处理返回首页的行为
  const handleGoHome = () => {
    router.push('/dashboard');
  };
  
  // 使用新的useCoupleSpaceModal接口
  const { openModal, CoupleSpaceModalComponent } = useCoupleSpaceModal({
    onGoHome: handleGoHome
  });
  
  // 检查情侣关系的函数
  const checkCoupleRelationship = async () => {
    if (hasCheckedRelationship) return; // 如果已经检查过，不再重复检查
    
    try {
      setIsLoading(true);
      const hasCouple = await userService.existCouple();
      
      setHasCoupleRelationship(hasCouple);
      setHasCheckedRelationship(true); // 标记已经检查过
      
      if (!hasCouple) {
        // 打开模态框，显示"情侣空间未开启"提示
        openModal();
      }
    } catch (error) {
      console.error('Failed to check couple relationship:', error);
      
      const message = language === 'zh' ? '检查情侣关系失败' : 'Failed to check couple relationship';
      const actionText = language === 'zh' ? '重试' : 'Retry';
      
      showNotification({
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
  };

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
  }, []);

  // 如果没有情侣关系，我们不再显示Gallery组件，因为用户会被导航到首页
  const shouldShowGallery = hasCoupleRelationship;

  return (
    <MainLayout title={{ zh: '照片墙', en: 'Gallery' }}>
      {NotificationComponent}
      {CoupleSpaceModalComponent}
      {isLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        shouldShowGallery && <Gallery />
      )}
    </MainLayout>
  );
} 