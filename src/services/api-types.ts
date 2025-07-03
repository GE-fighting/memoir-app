/**
 * API 类型定义
 * 定义了所有与 API 相关的请求和响应类型
 */

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  couple_id: string;
}

export interface UserPreferences {
  theme: string;
  language: string;
  notifications_enabled: boolean;
}




// 时间轴事件相关类型
export interface TimelineEvent {
  id: string;
  couple_id: string;
  start_date: string; // 格式：2006-01-02
  end_date: string; // 格式：2006-01-02
  title: string;
  content: string;
  locations?: Location[]; // 关联的位置列表
  photos_videos?: PersonalMedia[]; // 关联的照片和视频列表
  created_at: string;
  updated_at: string;
  cover_url?: string; // 封面图片URL，前端扩展字段
}

export interface CreateTimelineEventRequest {
  couple_id: string;
  start_date: string;
  end_date: string;
  title: string;
  content: string;
  cover_url?: string;
  location_ids?: string[];
  photo_video_ids?: string[];
}

export interface UpdateTimelineEventRequest {
  event_id: string;
  couple_id?: string;
  start_date?: string;
  end_date?: string;
  title?: string;
  content?: string;
  cover_url?: string;
  location_ids?: string[];
  photo_video_ids?: string[];
}

// 位置相关类型
export interface Location {
  id: string;
  couple_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationRequest {
  couple_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
}

// 媒体相关类型
export enum MediaType {
  PHOTO = "photo",
  VIDEO = "video",
}

export interface PersonalMedia {
  id: string;
  user_id?: string;
  title?: string;
  description?: string;
  media_type: MediaType;
  media_url: string;
  url?: string;
  thumbnail_url?: string;
  location_id?: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateMediaRequest {
  title?: string;
  description?: string;
  taken_at?: string;
  location_id?: string;
  tags?: string[];
}

// 心愿清单相关类型
export enum WishlistItemStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

export interface WishlistItem {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  priority: number; // 1-高，2-中，3-低
  status: WishlistItemStatus;
  type: number; // 1-日常，2-旅行
  reminder_date?: string; // 格式: "2006-01-02"
  created_at: string;
  updated_at: string;
}

export interface CreateWishlistItemRequest {
  couple_id: string;
  title: string;
  description?: string;
  priority?: number; // 1-高，2-中，3-低
  type?: number; // 1-日常，2-旅行
  reminder_date?: string;
}

export interface UpdateWishlistItemRequest {
  ID: string;
  title?: string;
  description?: string;
  priority?: number;
  type?: number;
  reminder_date?: string;
}

export interface UpdateWishlistItemStatusRequest {
  status: WishlistItemStatus;
}


// 仪表盘相关类型
export interface DashboardDTO{
  story_count: number;
  media_count: number;
  album_count: number;
  couple_days: number;
  locations: Location[];
}

// 分页相关类型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 心愿清单查询参数
export interface WishlistQueryParams extends PaginationParams {
  couple_id: string;
  status?: WishlistItemStatus;
  priority?: number;
  type?: number;
}

// 更新的分页参数，与后端一致
export interface PageParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 通用响应类型
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  error: string;
  message: string;
  status: number;
}

