import { apiClient } from './api-client';

// 相册类型定义
export interface Album {
  id: string;
  couple_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
  photos_videos?: any[];
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
}

// 导出相册服务单例
export const albumService = new AlbumService(); 