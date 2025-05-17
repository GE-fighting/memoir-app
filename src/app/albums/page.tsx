'use client';

import MainLayout from '@/components/MainLayout';
import Albums from '@/components/Albums';

export default function AlbumsPage() {
  return (
    <MainLayout title={{ zh: '相册墙', en: 'Albums' }}>
      <Albums />
    </MainLayout>
  );
} 