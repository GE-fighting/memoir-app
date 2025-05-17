'use client';

import MainLayout from '@/components/MainLayout';
import Account from '@/components/Account';

export default function AccountPage() {
  return (
    <MainLayout title={{ zh: '我们的账户', en: 'Our Account' }}>
      <Account />
    </MainLayout>
  );
} 