/**
 * API 类型定义
 * 定义了所有与 API 相关的请求和响应类型
 */

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: string;
  language: string;
  notifications_enabled: boolean;
}

// 伴侣相关类型
export interface Couple {
  id: number;
  name: string;
  anniversary: string;
  user_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface CoupleSettings {
  theme: string;
  notification_preferences: {
    events: boolean;
    memories: boolean;
    wishlist: boolean;
  };
  privacy_settings: {
    share_timeline: boolean;
    share_photos: boolean;
  };
}

// 时间轴事件相关类型
export interface TimelineEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location_id?: number;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  media_ids: number[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTimelineEventRequest {
  title: string;
  description: string;
  event_date: string;
  location_id?: number;
  media_ids?: number[];
  tags?: string[];
}

export interface UpdateTimelineEventRequest {
  title?: string;
  description?: string;
  event_date?: string;
  location_id?: number;
  media_ids?: number[];
  tags?: string[];
}

// 位置相关类型
export interface Location {
  id: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
}

// 媒体相关类型
export enum MediaType {
  PHOTO = "photo",
  VIDEO = "video",
}

export interface Media {
  id: number;
  title?: string;
  description?: string;
  media_type: MediaType;
  url: string;
  thumbnail_url?: string;
  taken_at?: string;
  location_id?: number;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  path?: string;
}

export interface UpdateMediaRequest {
  title?: string;
  description?: string;
  taken_at?: string;
  location_id?: number;
  tags?: string[];
}

// 心愿清单相关类型
export enum WishlistItemStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface WishlistItem {
  id: number;
  title: string;
  description?: string;
  status: WishlistItemStatus;
  due_date?: string;
  completed_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateWishlistItemRequest {
  title: string;
  description?: string;
  due_date?: string;
}

export interface UpdateWishlistItemRequest {
  title?: string;
  description?: string;
  due_date?: string;
}

export interface UpdateWishlistItemStatusRequest {
  status: WishlistItemStatus;
}

// 分页相关类型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 通用响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
} 