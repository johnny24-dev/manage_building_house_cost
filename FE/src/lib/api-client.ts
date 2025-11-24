import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from './env';

/**
 * API Client Configuration
 * 
 * Base URL: Lấy từ environment variable NEXT_PUBLIC_API_URL
 * Default: http://localhost:9000/api (khớp với BE port)
 * 
 * Features:
 * - Tự động thêm Authorization token vào header
 * - Tự động xử lý 401 (Unauthorized) - redirect về login
 * - Error handling thống nhất
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: URL của Backend API (ví dụ: http://localhost:9000/api)
 */

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    // Log API URL khi khởi tạo (chỉ ở client-side)
    if (typeof window !== 'undefined') {
      console.log('🔗 API Client initialized with URL:', baseURL);
      console.log('🔍 process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Cảnh báo nếu URL không đúng
      if (baseURL.includes('localhost:3000')) {
        console.error('❌ LỖI: API URL đang trỏ đến Frontend (port 3000) thay vì Backend (port 9000)');
        console.error('💡 Giải pháp:');
        console.error('   1. Kiểm tra file .env.local có NEXT_PUBLIC_API_URL=http://localhost:9000/api');
        console.error('   2. Restart Next.js dev server (Ctrl+C rồi npm run dev lại)');
        console.error('   3. Xóa cache: rm -rf .next');
      }
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds (default)
      maxContentLength: 500 * 1024 * 1024, // 500MB
      maxBodyLength: 500 * 1024 * 1024, // 500MB
    });

    // Request interceptor để thêm token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Chỉ chạy ở client side
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor để xử lý lỗi
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Log lỗi để debug
        if (typeof window !== 'undefined') {
          console.log('API Error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            data: error.response?.data,
          });
        }

        // Xử lý lỗi kết nối (network error)
        if (!error.response) {
          console.error('❌ Không thể kết nối đến server. Kiểm tra:');
          console.error('  1. Backend có đang chạy không? (http://localhost:9000)');
          console.error('  2. API URL có đúng không?', baseURL);
          console.error('  3. CORS có được cấu hình đúng không?');
        }

        // Xử lý lỗi 401 (Unauthorized)
        if (error.response?.status === 401) {
          // Xóa token và redirect về login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Chỉ redirect nếu không phải đang ở trang login/register
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              window.location.href = '/login';
            }
          }
        }

        // Xử lý lỗi 403 (Forbidden) - Không có quyền
        if (error.response?.status === 403) {
          console.error('❌ Không có quyền thực hiện thao tác này. Chỉ super admin mới có quyền.');
          // Không redirect, chỉ log và để component xử lý
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * POST request
   * Config có thể chứa axios config như timeout, onUploadProgress, etc.
   */
  async post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data, config);
    return response.data;
  }
}

// Export singleton instance
const apiClient = new ApiClient(API_URL);

export default apiClient;
