'use client';

import MainLayout from '@/components/MainLayout';
import Timeline from '@/components/Timeline';

export default function TimelinePage() {
  return (
    <MainLayout title={{ zh: '时间轴', en: 'Timeline' }}>
      <Timeline />
    </MainLayout>
  );
} 