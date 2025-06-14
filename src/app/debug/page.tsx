'use client';

import EnvDebug from '../../components/debug/EnvDebug';

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">环境变量调试页面</h1>
        <EnvDebug />
      </div>
    </div>
  );
}
