"use client"

import { apiClient } from "./api-client"
import { DashboardDTO } from "./api-types"

export const dashboardService = {
    /**
     * 获取仪表盘数据
     * @returns 
     */
    getDashboardData: async (): Promise<DashboardDTO> => {
        return apiClient.get<DashboardDTO>("/dashboard")
    }
};


