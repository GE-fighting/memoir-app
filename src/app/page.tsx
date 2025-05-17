/**
 * 主页组件文件
 * 这是应用的首页，对应路由 "/"
 */

// 'use client' 指令表明这是一个客户端组件
// 客户端组件可以使用React hooks、事件处理等交互功能
'use client';

// 导入需要的组件
import MainLayout from '@/components/MainLayout';
import Dashboard from '@/components/Dashboard';
import AuthVerify from '@/components/auth/auth-verify';

/**
 * 首页组件
 * Next.js会自动将此默认导出组件渲染为路由"/"的页面内容
 * 在App Router模式下，page.tsx文件会自动成为路由端点
 */
export default function HomePage() {
  return (
    // AuthVerify 确保只有认证用户才能访问此页面
    <AuthVerify redirectTo="/auth/login">
      {/* MainLayout提供整体页面结构，包括侧边栏、标题等 */}
      <MainLayout title={{ zh: '仪表盘', en: 'Dashboard' }}>
        {/* Dashboard组件包含仪表盘的具体内容 */}
        <Dashboard />
      </MainLayout>
    </AuthVerify>
  );
}
