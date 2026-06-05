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
  otpCode?: string;
}

export interface SendOTPResponse {
  expiresAt: string;
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
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
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

  async sendRegisterOTP(email: string): Promise<ApiResponse<SendOTPResponse>> {
    try {
      console.log('📧 Sending OTP to:', email);
      const response = await apiClient.post<ApiResponse<SendOTPResponse>>('/auth/send-register-otp', { email });
      console.log('✅ OTP sent successfully:', response);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      console.error('❌ Send OTP failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.message ||
        'Không thể gửi mã OTP. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      console.log('📝 Attempting register with:', { email: data.email });
      if (!data.otpCode) {
        throw new Error('Mã OTP là bắt buộc');
      }
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
      console.log('✅ Register successful:', response);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
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

  async sendForgotPasswordOTP(email: string): Promise<ApiResponse<SendOTPResponse>> {
    try {
      console.log('📧 Sending forgot password OTP to:', email);
      const response = await apiClient.post<ApiResponse<SendOTPResponse>>('/auth/send-forgot-password-otp', { email });
      console.log('✅ Forgot password OTP sent successfully:', response);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      console.error('❌ Send forgot password OTP failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.message ||
        'Không thể gửi mã OTP. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  },

  async resetPassword(email: string, newPassword: string, otpCode: string): Promise<ApiResponse<void>> {
    try {
      console.log('🔐 Attempting password reset for:', email);
      const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', {
        email,
        newPassword,
        otpCode,
      });
      console.log('✅ Password reset successful:', response);
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      console.error('❌ Password reset failed:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.message ||
        'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  },
};

export default authService;
export type { User } from '@/types/user';
export { UserRole } from '@/constants/userRole';
