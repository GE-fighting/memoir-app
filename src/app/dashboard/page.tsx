'use client';

import MainLayout from '@/components/MainLayout';
import Dashboard from '@/components/Dashboard';

/**
 * Dashboard页面
 * 用于显示用户登录/注册后的仪表盘内容
 */
export default function DashboardPage() {
  return (
    <MainLayout title={{ zh: '仪表盘', en: 'Dashboard' }}>
      <Dashboard />
    </MainLayout>
  );
} 