interface EnvConfig {
  appUrl: string;
  apiBaseUrl: string;
  apiPrefix: string;
  amapApiKey: string; // 高德地图API Key
}

// 扩展 Window 接口以包含运行时环境变量
declare global {
  interface Window {
    __ENV__?: {
      NEXT_PUBLIC_API_BASE_URL?: string;
      NEXT_PUBLIC_API_PREFIX?: string;
      NEXT_PUBLIC_APP_URL?: string;
      NEXT_PUBLIC_AMAP_API_KEY?: string;
    };
  }
}

export const getEnvConfig = (): EnvConfig => {
  // 优先从运行时注入的 window.__ENV__ 读取配置
  // 如果不存在（如在服务端渲染时），则回退到 process.env
  const runtimeEnv = typeof window !== 'undefined' ? window.__ENV__ : undefined;

  return {
    appUrl: runtimeEnv?.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiBaseUrl: runtimeEnv?.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '',
    apiPrefix: runtimeEnv?.NEXT_PUBLIC_API_PREFIX || process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1',
    amapApiKey: runtimeEnv?.NEXT_PUBLIC_AMAP_API_KEY || process.env.NEXT_PUBLIC_AMAP_API_KEY || '', // 高德地图API Key
  };
};