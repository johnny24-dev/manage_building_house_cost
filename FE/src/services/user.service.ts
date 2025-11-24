import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

const userService = {
  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get('/users/profile');
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put('/users/profile', data);
  },
};

export default userService;

