import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError } from 'axios';
import { User } from '@/types/user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('🔐 Attempting login with:', { email: credentials.email });
      const data = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      console.log('✅ Login successful:', data);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      console.error('❌ Login failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.message ||
        'Đăng nhập thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('📝 Attempting register with:', { email: data.email });
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
      console.log('✅ Register successful:', response);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      console.log('❌ Register failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.message ||
        'Đăng ký thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  },

  async logout(): Promise<void> {
    // Logout chỉ cần xóa token ở client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};

export default authService;
export type { User } from '@/types/user';
export { UserRole } from '@/constants/userRole';
