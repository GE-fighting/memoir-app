/**
 * 服务模块索引
 * 用于导出所有 API 服务，方便在应用中导入
 */

// 导出 API 客户端
export { apiClient } from './api-client';

// 导出所有服务
export { userService } from './user-service';
export { coupleService } from './couple-service';
export { eventService } from './event-service';
export { locationService } from './location-service';
export { mediaService } from './personal-media-service';
export { wishlistService } from './wishlist-service';
export { authService } from './auth-service';
export { attachmentService } from './attachment-service';
export { albumService } from './album-service';

// 导出类型定义
export * from './api-types'; 