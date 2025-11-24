import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { AxiosError, AxiosProgressEvent } from 'axios';

export interface DesignFile {
  id: string;
  name: string; // originalName từ backend
  fileName?: string; // fileName từ backend (optional)
  url: string; // URL từ BE response
  uploadedAt: string;
}

const fileService = {
  async getFiles(): Promise<ApiResponse<DesignFile[]>> {
    try {
      const data = await apiClient.get<ApiResponse<DesignFile[]>>('/designs');
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải danh sách file'
      );
    }
  },

  async getFile(id: string): Promise<ApiResponse<DesignFile>> {
    try {
      const data = await apiClient.get<ApiResponse<DesignFile>>(`/designs/${id}`);
      return data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể tải thông tin file'
      );
    }
  },

  async uploadFile(
    file: File,
    description?: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<DesignFile>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await apiClient.post<ApiResponse<DesignFile>>('/designs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 phút cho file lớn
        maxContentLength: 500 * 1024 * 1024, // 500MB
        maxBodyLength: 500 * 1024 * 1024, // 500MB
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      });
      return response;
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền upload file. Chỉ super admin mới có quyền thực hiện.');
      }
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Upload quá thời gian cho phép. Vui lòng thử lại với file nhỏ hơn hoặc kiểm tra kết nối mạng.');
      }
      if (axiosError.response?.status === 413) {
        throw new Error('File quá lớn. Kích thước tối đa là 500MB.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể upload file'
      );
    }
  },

  async deleteFile(id: string): Promise<void> {
    try {
      await apiClient.delete(`/designs/${id}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse<any>>;
      if (axiosError.response?.status === 403) {
        throw new Error('Bạn không có quyền xóa file. Chỉ super admin mới có quyền thực hiện.');
      }
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'Không thể xóa file'
      );
    }
  },

  getFileUrl(id: string): string {
    // Sử dụng Next.js API route để proxy request
    // Token sẽ được truyền trong header, không hiển thị trong URL
    return `/api/files/${id}`;
  },
};

export default fileService;

