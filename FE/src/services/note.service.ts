import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';

export interface Note {
  id: string;
  categoryId: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

const noteService = {
  async getNotesByCategory(categoryId: string): Promise<ApiResponse<Note[]>> {
    try {
      const data = await apiClient.get<ApiResponse<Note[]>>(`/notes/category/${categoryId}`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải danh sách ghi chú'
      );
    }
  },

  async getNote(id: string): Promise<ApiResponse<Note>> {
    try {
      const data = await apiClient.get<ApiResponse<Note>>(`/notes/${id}`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải thông tin ghi chú'
      );
    }
  },

  async createNote(data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Note>> {
    try {
      const response = await apiClient.post<ApiResponse<Note>>('/notes', data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tạo ghi chú'
      );
    }
  },

  async updateNote(id: string, data: Partial<Pick<Note, 'content'>>): Promise<ApiResponse<Note>> {
    try {
      const response = await apiClient.put<ApiResponse<Note>>(`/notes/${id}`, data);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật ghi chú'
      );
    }
  },

  async deleteNote(id: string): Promise<void> {
    try {
      await apiClient.delete(`/notes/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xóa ghi chú'
      );
    }
  },
};

export default noteService;

