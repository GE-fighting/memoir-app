"use client";

import { apiClient } from "./api-client";
import { 
  Attachment, 
  CreateAttachmentRequest, 
  AttachmentQueryParams, 
  PaginatedResponse 
} from "./api-types";

/**
 * 附件服务
 * 处理与附件相关的 API 请求
 */
export const attachmentService = {
  /**
   * 创建附件
   * @param data 附件数据
   * @returns 创建的附件
   */
  createAttachment: async (data: CreateAttachmentRequest): Promise<Attachment> => {
    return apiClient.post<Attachment>('/attachments/create', data);
  },

  /**
   * 获取单个附件
   * @param id 附件ID
   * @returns 附件信息
   */
  getAttachment: async (id: string): Promise<Attachment> => {
    return apiClient.get<Attachment>(`/attachments/${id}`);
  },

  /**
   * 获取附件列表
   * @param params 查询参数
   * @returns 附件列表
   */
  listAttachments: async (params: AttachmentQueryParams = {}): Promise<PaginatedResponse<Attachment>> => {
    return apiClient.get<PaginatedResponse<Attachment>>('/attachments/list', { 
      params: params 
    });
  },

  /**
   * 删除附件
   * @param id 附件ID
   * @returns 操作结果
   */
  deleteAttachment: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/attachments/${id}`);
  }
}; 