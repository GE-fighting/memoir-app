"use client";

import { apiClient } from "./api-client";
import { 
  TimelineEvent, 
  CreateTimelineEventRequest, 
  UpdateTimelineEventRequest,
  PaginationParams,
  PaginatedResponse,
  PageParams
} from "./api-types";

/**
 * 事件服务
 * 处理与时间轴事件相关的 API 请求
 */
export const eventService = {
  /**
   * 获取时间轴事件列表
   * @param params 查询参数
   * @returns 时间轴事件列表
   */
  getEvents: async (params: PageParams & {
    couple_id: string;      // 必需参数：情侣ID
    start_date?: string;    // 可选参数：开始日期，格式：2006-01-02
    end_date?: string;      // 可选参数：结束日期，格式：2006-01-02
    title?: string;         // 可选参数：事件标题
    location_id?: string;   // 可选参数：位置ID
  }): Promise<PaginatedResponse<TimelineEvent>> => {
    return apiClient.get<PaginatedResponse<TimelineEvent>>("/events/page", { params });
  },

  /**
   * 获取单个时间轴事件
   * @param id 事件ID
   * @returns 时间轴事件
   */
  getEvent: async (id: string): Promise<TimelineEvent> => {
    return apiClient.get<TimelineEvent>(`/events/${id}`);
  },

  /**
   * 创建时间轴事件
   * @param eventData 事件数据
   * @returns 创建的时间轴事件
   */
  createEvent: async (eventData: CreateTimelineEventRequest): Promise<TimelineEvent> => {
    return apiClient.post<TimelineEvent>("/events/create", eventData);
  },

  /**
   * 更新时间轴事件
   * @param id 事件ID
   * @param eventData 事件数据
   * @returns 更新后的时间轴事件
   */
  updateEvent: async (id: number, eventData: UpdateTimelineEventRequest): Promise<TimelineEvent> => {
    return apiClient.put<TimelineEvent>(`/events/${id}`, eventData);
  },

  /**
   * 删除时间轴事件
   * @param id 事件ID
   * @returns 操作结果
   */
  deleteEvent: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/events/${id}`);
  },
}; 