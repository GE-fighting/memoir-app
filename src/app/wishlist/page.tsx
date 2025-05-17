'use client';

import MainLayout from '@/components/MainLayout';
import Wishlist from '@/components/Wishlist';

export default function WishlistPage() {
  return (
    <MainLayout title={{ zh: '心愿画卷', en: 'Journey Wishes' }}>
      <Wishlist />
    </MainLayout>
  );
} 