import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export interface AdvancePayment {
  id: string;
  ticketName: string; // Tên phiếu
  categoryId?: string | null; // Hạng mục
  paymentDate: string; // ISO date string
  phase: string; // Đợt tạm ứng
  amount: number;
  description?: string;
  status: 'paid' | 'planned';
  createdAt?: string;
  updatedAt?: string;
  category?: {
    id: string;
    name: string;
  };
}

export const CONSTRUCTION_PHASES = [
  { value: 'Đợt 1', label: 'Đợt 1' },
  { value: 'Đợt 2', label: 'Đợt 2' },
  { value: 'Đợt 3', label: 'Đợt 3' },
  { value: 'Đợt 4', label: 'Đợt 4' },
  { value: 'Đợt 5', label: 'Đợt 5' },
] as const;

const advanceService = {
  async getAdvances(): Promise<ApiResponse<AdvancePayment[]>> {
    try {
      const data = await apiClient.get<ApiResponse<AdvancePayment[]>>('/advance-payments');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải danh sách tạm ứng'
      );
    }
  },

  async getSummary(): Promise<ApiResponse<any>> {
    try {
      const data = await apiClient.get<ApiResponse<any>>('/advance-payments/summary');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải tổng hợp tạm ứng'
      );
    }
  },

  async getAdvance(id: string): Promise<ApiResponse<AdvancePayment>> {
    try {
      const data = await apiClient.get<ApiResponse<AdvancePayment>>(`/advance-payments/${id}`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải thông tin tạm ứng'
      );
    }
  },

  async createAdvance(data: {
    ticketName: string;
    categoryId?: string | null;
    amount: number;
    paymentDate: string;
    phase: string;
    description?: string;
    status?: 'paid' | 'planned';
  }): Promise<ApiResponse<AdvancePayment>> {
    try {
      const response = await apiClient.post<ApiResponse<AdvancePayment>>('/advance-payments', {
        ...data,
        paymentDate: new Date(data.paymentDate).toISOString(),
      });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền tạo phiếu tạm ứng. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tạo phiếu tạm ứng'
      );
    }
  },

  async updateAdvance(id: string, data: {
    ticketName?: string;
    categoryId?: string | null;
    amount?: number;
    paymentDate?: string;
    phase?: string;
    description?: string;
    status?: 'paid' | 'planned';
  }): Promise<ApiResponse<AdvancePayment>> {
    try {
      const updateData: any = { ...data };
      if (data.paymentDate) {
        updateData.paymentDate = new Date(data.paymentDate).toISOString();
      }
      const response = await apiClient.put<ApiResponse<AdvancePayment>>(`/advance-payments/${id}`, updateData);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền cập nhật phiếu tạm ứng. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật phiếu tạm ứng'
      );
    }
  },

  async deleteAdvance(id: string): Promise<void> {
    try {
      await apiClient.delete(`/advance-payments/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền xóa phiếu tạm ứng. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xóa phiếu tạm ứng'
      );
    }
  },
};

export default advanceService;

