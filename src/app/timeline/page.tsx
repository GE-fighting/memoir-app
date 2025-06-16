'use client';

import MainLayout from '@/components/MainLayout';
import Timeline from '@/components/Timeline';

export default function TimelinePage() {
  return (
    <MainLayout title={{ zh: '我们的回忆', en: 'Our Memories' }}>
      <Timeline />
    </MainLayout>
  );
} 