"use client";

import { apiClient } from "./api-client";
import { 
  WishlistItem, 
  WishlistItemStatus,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  UpdateWishlistItemStatusRequest,
  PaginationParams, 
  PaginatedResponse 
} from "./api-types";

/**
 * 心愿清单服务
 * 处理与心愿清单相关的 API 请求
 */
export const wishlistService = {
  /**
   * 获取心愿清单列表
   * @param params 分页和过滤参数
   * @returns 心愿清单列表
   */
  getWishlistItems: async (params?: PaginationParams & {
    status?: WishlistItemStatus;
    createdBy?: number;
  }): Promise<PaginatedResponse<WishlistItem>> => {
    return apiClient.get<PaginatedResponse<WishlistItem>>("/wishlist", { params });
  },

  /**
   * 获取单个心愿清单项
   * @param id 心愿清单项ID
   * @returns 心愿清单项信息
   */
  getWishlistItem: async (id: number): Promise<WishlistItem> => {
    return apiClient.get<WishlistItem>(`/wishlist/${id}`);
  },

  /**
   * 创建心愿清单项
   * @param itemData 心愿清单项数据
   * @returns 创建的心愿清单项
   */
  createWishlistItem: async (itemData: CreateWishlistItemRequest): Promise<WishlistItem> => {
    return apiClient.post<WishlistItem>("/wishlist", itemData);
  },

  /**
   * 更新心愿清单项
   * @param id 心愿清单项ID
   * @param itemData 心愿清单项数据
   * @returns 更新后的心愿清单项
   */
  updateWishlistItem: async (id: number, itemData: UpdateWishlistItemRequest): Promise<WishlistItem> => {
    return apiClient.put<WishlistItem>(`/wishlist/${id}`, itemData);
  },

  /**
   * 更新心愿清单项状态
   * @param id 心愿清单项ID
   * @param status 新状态
   * @returns 更新后的心愿清单项
   */
  updateWishlistItemStatus: async (id: number, status: WishlistItemStatus): Promise<WishlistItem> => {
    return apiClient.put<WishlistItem>(`/wishlist/${id}/status`, { status } as UpdateWishlistItemStatusRequest);
  },

  /**
   * 删除心愿清单项
   * @param id 心愿清单项ID
   * @returns 操作结果
   */
  deleteWishlistItem: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/wishlist/${id}`);
  },
}; 