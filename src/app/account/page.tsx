'use client';

import MainLayout from '@/components/MainLayout';
import Account from '@/components/Account';

export default function AccountPage() {
  return (
    <MainLayout title={{ zh: '账户设置', en: 'Account Settings' }}>
      <Account />
    </MainLayout>
  );
} 