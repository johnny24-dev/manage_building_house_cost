import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export interface CategoryGroup {
  id: string;
  name: string; // Tên hạng mục
  total?: number; // Dự tính chi phí
  note?: string; // Ghi chú
  unit?: string; // Đơn vị (khi dùng như CategoryItem)
  type?: 'phan_tho' | 'hoan_thien' | 'dien_nuoc' | 'noi_that' | 'phap_ly' | 'phat_sinh'; // Loại chi phí (optional)
  quantity?: number; // Deprecated
  unitPrice?: number; // Deprecated
  categoryId?: string; // Thuộc nhóm nào khi dùng cho item
  createdAt?: string;
  updatedAt?: string;
}

const categoryService = {
  // Category Groups
  async getGroups(): Promise<ApiResponse<CategoryGroup[]>> {
    try {
      const data = await apiClient.get<ApiResponse<CategoryGroup[]>>('/cost-categories');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải danh sách nhóm chi phí'
      );
    }
  },

  async createGroup(data: Omit<CategoryGroup, 'id'>): Promise<ApiResponse<CategoryGroup>> {
    try {
      const response = await apiClient.post<ApiResponse<CategoryGroup>>('/cost-categories', data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền tạo hạng mục. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tạo nhóm chi phí'
      );
    }
  },

  async updateGroup(id: string, data: Partial<CategoryGroup>): Promise<ApiResponse<CategoryGroup>> {
    try {
      const response = await apiClient.put<ApiResponse<CategoryGroup>>(`/cost-categories/${id}`, data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền cập nhật hạng mục. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật nhóm chi phí'
      );
    }
  },

  async deleteGroup(id: string): Promise<void> {
    try {
      await apiClient.delete(`/cost-categories/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền xóa hạng mục. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xóa nhóm chi phí'
      );
    }
  },

  async getGroup(id: string): Promise<ApiResponse<CategoryGroup>> {
    try {
      const data = await apiClient.get<ApiResponse<CategoryGroup>>(`/cost-categories/${id}`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải thông tin nhóm chi phí'
      );
    }
  },
};

// Export type for backward compatibility
export type CategoryItem = CategoryGroup;

export default categoryService;

