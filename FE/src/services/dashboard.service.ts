import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface DashboardStats {
  totalBudget: number;
  totalSpent: number;
  totalAdvance: number;
  remaining: number;
  categoryStats: {
    categoryId: string;
    categoryName: string;
    total: number;
    spent: number;
    color: string;
  }[];
  constructionProgress: {
    phase: string;
    percentage: number;
    status: 'completed' | 'in-progress' | 'pending';
  }[];
  overallProgress: number;
}

export interface ExpenseChartData {
  month: string;
  chiPhí: number;
  dựToán: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  color: string;
}

const dashboardService = {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    try {
      const data = await apiClient.get<ApiResponse<DashboardSummary>>(API_ENDPOINTS.DASHBOARD.SUMMARY);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải tổng hợp dashboard'
      );
    }
  },
};

export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  total: number; // Dự tính
  spent: number; // Đã chi
  advancePaid: number; // Tạm ứng đã thanh toán
  remaining: number;
  percentage: number; // Phần trăm hoàn thành
}

export interface ConstructionPhase {
  name: string;
  percentage: number;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface DashboardSummary {
  totalCost: number; // Tổng dự tính
  totalCostByType: {
    [key: string]: number;
  };
  totalAdvancePayment: number; // Tổng tạm ứng đã thanh toán
  totalSpent: number; // Tổng đã chi
  totalBudget: number; // Tổng vốn
  remaining: number; // Còn lại
  capitalAllocation: {
    id: string;
    totalBudget: number;
    phanTho: number;
    hoanThien: number;
    dienNuoc: number;
    noiThat: number;
    phapLy: number;
    phatSinh: number;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  categoryStats: CategoryStat[]; // Chi phí theo từng category
  constructionProgress: ConstructionPhase[]; // Tiến độ xây dựng
  overallProgress: number; // Tiến độ tổng thể
  currentPhase: string; // Giai đoạn hiện tại
}

export default dashboardService;

