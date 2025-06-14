interface EnvConfig {
  appUrl: string;
  apiBaseUrl: string;
  amapApiKey: string; // 高德地图API Key
}

export const getEnvConfig = (): EnvConfig => {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
    amapApiKey: process.env.NEXT_PUBLIC_AMAP_API_KEY || '', // 高德地图API Key
  };
};