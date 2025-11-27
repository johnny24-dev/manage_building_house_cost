import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface CostByMonth {
  month: string;
  total: number;
  count: number;
}

export interface CostByCategory {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
}

export interface PaymentStatistics {
  paid: number;
  pending: number;
  cancelled: number;
  total: number;
}

export interface AdvanceReportItem {
  id: string;
  ticketName: string;
  categoryName?: string | null;
  amount: number;
  paymentDate: string;
  phase: string;
  status: 'paid' | 'planned';
  description?: string | null;
  billImageUrl?: string | null;
}

export interface AdvanceReportSummary {
  totalAmount: number;
  paidAmount: number;
  plannedAmount: number;
  totalCount: number;
  paidCount: number;
  plannedCount: number;
  recentAdvances: AdvanceReportItem[];
}

export interface ReportSummary {
  totalCost: number;
  averageCostPerMonth: number;
  largestCategory: {
    name: string;
    amount: number;
  } | null;
  totalTransactions: number;
  costByMonth: CostByMonth[];
  costByCategory: CostByCategory[];
  paymentStatistics: PaymentStatistics;
  advanceSummary: AdvanceReportSummary;
}

const reportService = {
  /**
   * Lấy báo cáo chi tiết
   */
  async getReportSummary(): Promise<ApiResponse<ReportSummary>> {
    try {
      const data = await apiClient.get<ApiResponse<ReportSummary>>(
        API_ENDPOINTS.DASHBOARD.REPORT
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải báo cáo'
      );
    }
  },

  /**
   * Xuất báo cáo chi tiết (CSV)
   */
  async exportReportSummary(): Promise<Blob> {
    try {
      const blob = await apiClient.get<Blob>(API_ENDPOINTS.DASHBOARD.REPORT_EXPORT, {
        responseType: 'blob',
      });
      return blob;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xuất báo cáo'
      );
    }
  },
};

export default reportService;

