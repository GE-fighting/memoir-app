"use client";

import { apiClient } from "./api-client";
import { 
  PersonalMedia, 
  UpdateMediaRequest,
  PaginatedResponse,
  PageParams,
} from "./api-types";

/**
 * 个人媒体创建请求参数
 */
export interface CreatePersonalMediaWithURLParams {
  media_type: 'photo' | 'video';
  category?: string;
  title?: string;
  media_url: string;
  thumbnail_url: string;
  description?: string;
}

/**
 * 个人媒体查询参数
 */
export interface QueryPersonalMediaParams {
  page?: number;
  page_size?: number;
  category?: string;
  media_type?: string;
  start_date?: string;
  end_date?: string;
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
  getMediaList: async (params?: PageParams): Promise<PaginatedResponse<PersonalMedia>> => {
    return apiClient.get<PaginatedResponse<PersonalMedia>>("/personal-media/page", { 
      params: params 
    });
  },

  /**
   * 获取单个媒体项
   * @param id 媒体ID
   * @returns 媒体信息
   */
  getMedia: async (id: number): Promise<PersonalMedia> => {
    return apiClient.get<PersonalMedia>(`/personal-media/${id}`);
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
  }): Promise<PersonalMedia> => {
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
  updateMedia: async (id: number, mediaData: UpdateMediaRequest): Promise<PersonalMedia> => {
    return apiClient.put<PersonalMedia>(`/media/${id}`, mediaData);
  },

  /**
   * 删除媒体
   * @param id 媒体ID
   * @returns 操作结果
   */
  deleteMedia: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/personal-media/${id}`);
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
  ): Promise<PersonalMedia[]> => {
    const results: PersonalMedia[] = [];
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
  createPersonalMediaWithURL: async (params: CreatePersonalMediaWithURLParams): Promise<PersonalMedia> => {
    return apiClient.post<PersonalMedia>('/personal-media/create', params);
  },

  /**
   * 获取个人媒体列表
   * @param params 查询参数
   * @returns 分页媒体列表
   */
  queryPersonalMedia: async (params: QueryPersonalMediaParams = {}): Promise<PaginatedResponse<PersonalMedia>> => {
    // 设置默认值
    const queryParams = {
      page: params.page || 1,
      page_size: params.page_size || 10,
      category: params.category,
      media_type: params.media_type,
      start_date: params.start_date,
      end_date: params.end_date,
    };
    
    // 使用GET请求进行分页查询，符合后端API设计
    return apiClient.get<PaginatedResponse<PersonalMedia>>('/personal-media/page', { 
      params: queryParams 
    });
  },
  




}; 