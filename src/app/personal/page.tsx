import PersonalDashboard from '@/components/PersonalDashboard';
import MainLayout from '@/components/MainLayout';

export default function PersonalDashboardPage() {
  return (
    <MainLayout title={{ zh: '个人仪表盘', en: 'Personal Dashboard' }}>
      <PersonalDashboard />
    </MainLayout>
  );
}