import Personal from '@/components/Personal';
import MainLayout from '@/components/MainLayout';

export default function PersonalPage() {
  return (
    <MainLayout title={{ zh: '个人空间', en: 'Personal Space' }}>
      <Personal />
    </MainLayout>
  );
} 