import { apiClient } from './api-client';
import { PaginatedResponse } from './api-types';

// 相册类型定义
export interface Album {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  count?: number;
  created_at: string;
  updated_at: string;
  photos_videos?: any[];
}

//情侣媒体类型定义
export interface CoupleMedia {
  id: string;
  couple_id: string;
  album_id?: string;
  title?: string;
  description?: string;
  media_type: 'photo' | 'video';
  media_url: string;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}



// 创建相册请求
export interface CreateAlbumRequest {
  title: string;
  description?: string;
  cover_url?: string;
}

// 更新相册请求
export interface UpdateAlbumRequest {
  title?: string;
  description?: string;
  cover_url?: string;
}

/**
 * 相册媒体创建请求参数
 */
export interface CreateAlbumMediaParams {
  album_id: string;
  media_type: 'photo' | 'video';
  title?: string;
  media_url: string;
  thumbnail_url: string;
  description?: string;
}
/**
 * 
 */
export interface DeleteCoupleAlbumPhotosRequest {
  album_id: string;
  photo_video_ids: string[];
}

/**
 * 媒体列表响应
 */
export interface MediaListResponse {
  items: Array<{
    id: string;
    title?: string;
    media_url: string;
    thumbnail_url?: string;
    description?: string;
    media_type: 'photo' | 'video';
    created_at: string;
    album_id: string;
    album_title: string;
  }>;
  has_more: boolean;
  total: number;
}

/**
 * 情侣媒体查询参数
 */
export interface CoupleMediaQueryParams {
  couple_id: string;
  page?: number;
  page_size?: number;
}

/**
 * 相册服务类
 * 提供相册相关的API调用
 */
class AlbumService {
  /**
   * 获取所有相册
   * @returns 相册列表
   */
  async getAlbums(): Promise<Album[]> {
    return apiClient.get<Album[]>('/albums/list');
  }

  /**
   * 获取单个相册详情
   * @param id 相册ID
   * @returns 相册详情
   */
  async getAlbum(id: string): Promise<Album> {
    return apiClient.get<Album>(`/albums/${id}`);
  }

  /**
   * 获取相册及其照片
   * @param id 相册ID
   * @returns 包含照片的相册详情
   */
  async getAlbumWithPhotos(id: string): Promise<Album> {
    return apiClient.get<Album>(`/albums/photos?id=${id}`);
  }

  /**
   * 创建相册
   * @param data 相册数据
   * @returns 创建的相册
   */
  async createAlbum(data: CreateAlbumRequest): Promise<Album> {
    return apiClient.post<Album>('/albums/create', data);
  }

  /**
   * 更新相册
   * @param id 相册ID
   * @param data 更新数据
   * @returns 更新后的相册
   */
  async updateAlbum(id: string, data: UpdateAlbumRequest): Promise<Album> {
    return apiClient.put<Album>(`/albums/${id}`, data);
  }

  /**
   * 删除相册
   * @param id 相册ID
   */
  async deleteAlbum(id: string): Promise<void> {
    return apiClient.delete<void>(`/albums/${id}`);
  }
  
  /**
   * 获取相册上传STS令牌
   * @returns STS令牌
   */
  async getAlbumSTSToken(): Promise<any> {
    return apiClient.get<any>('/couple/sts');
  }
  
  /**
   * 上传媒体到相册
   * @param params 媒体参数
   * @returns 上传结果
   */
  async uploadMediaToAlbum(params: CreateAlbumMediaParams): Promise<any> {
    return apiClient.post<any>('/albums/media', params);
  }

  /**
   * 删除情侣相册中的照片或视频
   * @param params 删除请求参数
   * @returns 删除结果
   */
  async deleteCoupleAlbumPhotos(params: DeleteCoupleAlbumPhotosRequest): Promise<void> {
    return apiClient.post<void>('/albums/deletePhotos', params);
  };
  
  /**
   * 获取所有媒体文件（瀑布流）
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 媒体列表响应
   */
  async getAllMedia(coupleId: string, media_type: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<CoupleMedia>> {
    const params = {  
      couple_id: coupleId,
      media_type,
      page,
      page_size: pageSize,
    };
    return apiClient.get<PaginatedResponse<CoupleMedia>>(`/albums/all-media/page`, { params });
  }
}

// 导出相册服务单例
export const albumService = new AlbumService(); 