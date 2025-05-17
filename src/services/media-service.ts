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
}; 