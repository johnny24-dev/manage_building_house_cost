import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface UserSettings {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  avatarUrl?: string | null;
  notifyEmail: boolean;
  notifyBudget: boolean;
  role: string;
  createdAt: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  fullName?: string | null;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
  notifyEmail?: boolean;
}

export interface UpdateProfileDto {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface UpdateNotificationsDto {
  notifyEmail: boolean;
  notifyBudget: boolean;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

const settingsService = {
  async getProfile(): Promise<ApiResponse<UserSettings>> {
    try {
      const data = await apiClient.get<ApiResponse<UserSettings>>(API_ENDPOINTS.SETTINGS.PROFILE);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải thông tin cài đặt'
      );
    }
  },

  async updateProfile(payload: UpdateProfileDto): Promise<ApiResponse<UserSettings>> {
    try {
      const data = await apiClient.put<ApiResponse<UserSettings>>(API_ENDPOINTS.SETTINGS.PROFILE, payload);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật thông tin cá nhân'
      );
    }
  },

  async updateNotifications(
    payload: UpdateNotificationsDto
  ): Promise<ApiResponse<UserSettings>> {
    try {
      const data = await apiClient.put<ApiResponse<UserSettings>>(
        API_ENDPOINTS.SETTINGS.NOTIFICATIONS,
        payload
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật cài đặt thông báo'
      );
    }
  },

  async updatePassword(payload: UpdatePasswordDto): Promise<void> {
    try {
      await apiClient.put(API_ENDPOINTS.SETTINGS.PASSWORD, payload);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể đổi mật khẩu'
      );
    }
  },

  async updateAvatar(file: File): Promise<ApiResponse<UserSettings>> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await apiClient.put<ApiResponse<UserSettings>>(
        API_ENDPOINTS.SETTINGS.AVATAR,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật ảnh đại diện'
      );
    }
  },

  async getUsers(): Promise<ApiResponse<ManagedUser[]>> {
    try {
      return await apiClient.get<ApiResponse<ManagedUser[]>>(API_ENDPOINTS.SETTINGS.USERS);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải danh sách người dùng'
      );
    }
  },

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<ManagedUser>> {
    try {
      return await apiClient.put<ApiResponse<ManagedUser>>(API_ENDPOINTS.SETTINGS.USER_ROLE(userId), {
        role,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể cập nhật vai trò'
      );
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.SETTINGS.USER_DELETE(userId));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xóa người dùng'
      );
    }
  },
};

export default settingsService;


