import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export interface Cost {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
  billImageUrl?: string | null;
  category?: {
    id: string;
    name: string;
  };
}

const costService = {
  async getCosts(): Promise<ApiResponse<Cost[]>> {
    try {
      const data = await apiClient.get<ApiResponse<Cost[]>>('/costs');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải danh sách chi phí'
      );
    }
  },

  async createCost(data: FormData): Promise<ApiResponse<Cost>> {
    try {
      const response = await apiClient.post<ApiResponse<Cost>>('/costs', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền tạo chi phí. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tạo chi phí'
      );
    }
  },

  async updateCost(id: string, data: FormData): Promise<ApiResponse<Cost>> {
    try {
      const response = await apiClient.put<ApiResponse<Cost>>(`/costs/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền cập nhật chi phí. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật chi phí'
      );
    }
  },

  async deleteCost(id: string): Promise<void> {
    try {
      await apiClient.delete(`/costs/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền xóa chi phí. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xóa chi phí'
      );
    }
  },
};

export default costService;

