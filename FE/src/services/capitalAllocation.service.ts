import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export interface CapitalAllocation {
  id: string;
  totalBudget: number;
  phanThoPercent: number;
  hoanThienPercent: number;
  dienNuocPercent: number;
  noiThatPercent: number;
  phapLyPercent: number;
  phatSinhPercent: number;
  tamUngPercent: number;
  phanThoAmount?: number;
  hoanThienAmount?: number;
  dienNuocAmount?: number;
  noiThatAmount?: number;
  phapLyAmount?: number;
  phatSinhAmount?: number;
  tamUngAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

const capitalAllocationService = {
  async getAllocation(): Promise<ApiResponse<CapitalAllocation | null>> {
    try {
      const data = await apiClient.get<ApiResponse<CapitalAllocation | null>>('/capital-allocations');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải thông tin phân bổ vốn'
      );
    }
  },

  async createAllocation(data: Omit<CapitalAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CapitalAllocation>> {
    try {
      const response = await apiClient.post<ApiResponse<CapitalAllocation>>('/capital-allocations', data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tạo phân bổ vốn'
      );
    }
  },

  async updateAllocation(data: Partial<CapitalAllocation>): Promise<ApiResponse<CapitalAllocation>> {
    try {
      const response = await apiClient.put<ApiResponse<CapitalAllocation>>('/capital-allocations', data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật phân bổ vốn'
      );
    }
  },
};

export default capitalAllocationService;

