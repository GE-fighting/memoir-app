"use client";

import { apiClient } from "./api-client";
import { 
  WishlistItem, 
  WishlistItemStatus,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  UpdateWishlistItemStatusRequest,
  WishlistQueryParams
} from "./api-types";

/**
 * 心愿清单服务
 * 处理与心愿清单相关的 API 请求
 */
export const wishlistService = {
  /**
   * 获取心愿清单列表
   * @param coupleId 情侣ID
   * @returns 心愿清单列表
   */
  getWishlistItems: async (coupleId: string): Promise<WishlistItem[]> => {
    return apiClient.get<WishlistItem[]>("/wishlist/list", { 
      params: { couple_id: coupleId } 
    });
  },

  /**
   * 根据查询条件获取心愿清单列表
   * @param params 查询参数
   * @returns 心愿清单列表
   */
  getWishlistItemsByQuery: async (params: WishlistQueryParams): Promise<WishlistItem[]> => {
    return apiClient.get<WishlistItem[]>("/wishlist/list", { params });
  },

  /**
   * 创建心愿清单项
   * @param itemData 心愿清单项数据
   * @returns 创建的心愿清单项
   */
  createWishlistItem: async (itemData: CreateWishlistItemRequest): Promise<WishlistItem> => {
    return apiClient.post<WishlistItem>("/wishlist/create", itemData);
  },

  /**
   * 更新心愿清单项
   * @param id 心愿清单项ID
   * @param itemData 更新的数据
   * @returns 更新后的心愿清单项
   */
  updateWishlistItem: async (itemData: UpdateWishlistItemRequest): Promise<WishlistItem> => {
    return apiClient.put<WishlistItem>(`/wishlist/update`, itemData);
  },

  /**
   * 更新心愿清单项状态
   * @param id 心愿清单项ID
   * @param status 新状态
   * @returns 更新后的心愿清单项
   */
  updateWishlistItemStatus: async (id: string, status: UpdateWishlistItemStatusRequest): Promise<WishlistItem> => {
    return apiClient.put<WishlistItem>(`/wishlist/${id}/status`, status);
  },

  /**
   * 删除心愿清单项
   * @param id 心愿清单项ID
   * @returns 操作结果
   */
  deleteWishlistItem: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/wishlist/${id}`);
  }
}; 