"use client";

import { apiClient } from "./api-client";
import { 
  Media, 
  MediaType,
  UpdateMediaRequest,
  PaginationParams, 
  PaginatedResponse 
} from "./api-types";

/**
 * 个人媒体创建请求参数
 */
export interface CreatePersonalMediaWithURLParams {
  mediaType: 'photo' | 'video';
  category: string;
  title: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  description?: string;
  isPrivate?: boolean;
  tags?: string[];
}

/**
 * 媒体服务
 * 处理与照片和视频相关的 API 请求
 */
export const mediaService = {
  /**
   * 获取媒体列表
   * @param params 分页和过滤参数
   * @returns 媒体列表
   */
  getMediaList: async (params?: PaginationParams & {
    type?: MediaType;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    locationId?: number;
  }): Promise<PaginatedResponse<Media>> => {
    return apiClient.get<PaginatedResponse<Media>>("/media", { params });
  },

  /**
   * 获取单个媒体项
   * @param id 媒体ID
   * @returns 媒体信息
   */
  getMedia: async (id: number): Promise<Media> => {
    return apiClient.get<Media>(`/media/${id}`);
  },

  /**
   * 上传媒体文件
   * @param file 文件对象
   * @param metadata 元数据
   * @returns 上传后的媒体信息
   */
  uploadMedia: async (file: File, metadata?: {
    title?: string;
    description?: string;
    taken_at?: string;
    location_id?: number;
    tags?: string[];
  }): Promise<Media> => {
    const formData = new FormData();
    formData.append("file", file);
    
    if (metadata) {
      // 将元数据转换为 JSON 字符串并添加到表单中
      formData.append("metadata", JSON.stringify(metadata));
    }

    // 使用原始 fetch 而不是 apiClient，因为需要特殊处理 FormData
    const accessToken = localStorage.getItem("accessToken");
    
    const response = await fetch("/api/v1/media", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "上传失败");
    }

    return response.json();
  },

  /**
   * 更新媒体信息
   * @param id 媒体ID
   * @param mediaData 媒体数据
   * @returns 更新后的媒体信息
   */
  updateMedia: async (id: number, mediaData: UpdateMediaRequest): Promise<Media> => {
    return apiClient.put<Media>(`/media/${id}`, mediaData);
  },

  /**
   * 删除媒体
   * @param id 媒体ID
   * @returns 操作结果
   */
  deleteMedia: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/media/${id}`);
  },

  /**
   * 批量上传媒体文件
   * @param files 文件对象数组
   * @param commonMetadata 所有文件的共同元数据
   * @returns 上传状态和进度信息
   */
  batchUploadMedia: async (
    files: File[],
    commonMetadata?: {
      location_id?: number;
      tags?: string[];
    },
    onProgress?: (progress: number) => void
  ): Promise<Media[]> => {
    const results: Media[] = [];
    let completed = 0;

    for (const file of files) {
      try {
        const media = await mediaService.uploadMedia(file, commonMetadata);
        results.push(media);
        
        completed++;
        if (onProgress) {
          onProgress((completed / files.length) * 100);
        }
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        // 继续上传其他文件
      }
    }

    return results;
  },

  /**
   * 通过URL创建个人媒体
   * 用于前端上传到OSS后，将媒体信息保存到数据库
   * @param params 创建参数
   * @returns 创建的媒体对象
   */
  createPersonalMediaWithURL: async (params: CreatePersonalMediaWithURLParams): Promise<Media> => {
    return apiClient.post<Media>('/personal-media/url', params);
  },

  /**
   * 获取个人媒体列表
   * @param category 分类
   * @param mediaType 媒体类型
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 分页媒体列表
   */
  queryPersonalMedia: async (
    category?: string,
    mediaType?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Media>> => {
    let queryParams = new URLSearchParams();
    
    if (category) queryParams.append('category', category);
    if (mediaType) queryParams.append('mediaType', mediaType);
    queryParams.append('page', page.toString());
    queryParams.append('pageSize', pageSize.toString());
    
    return apiClient.get<PaginatedResponse<Media>>(`/personal-media?${queryParams.toString()}`);
  },
  
  /**
   * 获取单个媒体详情
   * @param id 媒体ID
   * @returns 媒体对象
   */
  getPersonalMediaById: async (id: number): Promise<Media> => {
    return apiClient.get<Media>(`/personal-media/${id}`);
  },

  /**
   * 更新媒体信息
   * @param id 媒体ID
   * @param title 标题
   * @param description 描述
   * @param isPrivate 是否私密
   * @param tags 标签
   * @returns 更新后的媒体对象
   */
  updatePersonalMedia: async (
    id: number, 
    title: string, 
    description: any,
    isPrivate: boolean = false,
    tags: string[] = []
  ): Promise<Media> => {
    return apiClient.put<Media>(`/personal-media/${id}`, {
      title,
      description: JSON.stringify(description),
      isPrivate,
      tags
    });
  },

  /**
   * 删除媒体
   * @param id 媒体ID
   * @returns void
   */
  deletePersonalMedia: async (id: number): Promise<void> => {
    return apiClient.delete(`/personal-media/${id}`);
  }
}; 