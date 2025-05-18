interface EnvConfig {
  appUrl: string;
  apiBaseUrl: string;
  userId: string; // Temporary, should come from auth
}

// Helper function to require env variables
const requireEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    // In development, warn instead of throwing
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing required environment variable: ${key}`);
      return '';
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const getEnvConfig = (): EnvConfig => {
  return {
    appUrl: requireEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    apiBaseUrl: requireEnv('NEXT_PUBLIC_API_BASE_URL', '/api'),
    userId: requireEnv('NEXT_PUBLIC_USER_ID', 'user1'), // Temporary
  };
};