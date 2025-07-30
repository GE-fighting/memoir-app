import PersonalSpace from '@/components/PersonalSpace';
import MainLayout from '@/components/MainLayout';

export default function PersonalSpacePage() {
  return (
    <MainLayout title={{ zh: '个人空间', en: 'Personal Space' }}>
      <PersonalSpace />
    </MainLayout>
  );
}