'use client';

import MainLayout from '@/components/MainLayout';
import Timeline from '@/components/Timeline';

export default function TimelinePage() {
  return (
    <MainLayout title={{ zh: '我们的故事', en: 'Our Story' }}>
      <Timeline />
    </MainLayout>
  );
} 