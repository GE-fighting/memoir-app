/**
 * 认证相关工具函数
 */

/**
 * 获取存储在本地的认证token
 * @returns 认证token字符串
 */
export const getAuthToken = (): string => {
  // 从localStorage获取accessToken
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('未找到认证令牌，请重新登录');
  }
  return token;
};

/**
 * 保存认证token到本地存储
 * @param token JWT认证令牌
 */
export const saveAuthToken = (token: string): void => {
  localStorage.setItem('accessToken', token);
};

/**
 * 清除认证信息
 */
export const clearAuth = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');
};

/**
 * 保存用户ID到本地存储
 * @param userId 用户ID
 */
export const saveUserId = (userId: string): void => {
  localStorage.setItem('userId', userId);
};

/**
 * 检查用户是否已认证
 * @returns 是否已认证
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
}; 