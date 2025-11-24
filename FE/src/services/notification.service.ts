import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  entityName?: string | null;
  entityId?: string | null;
  action?: string | null;
  type?: 'info' | 'success' | 'warning' | 'error' | string;
  metadata?: Record<string, any> | null;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
}

const notificationService = {
  async getNotifications(): Promise<ApiResponse<UserNotification[]>> {
    return apiClient.get('/notifications');
  },

  async markAsRead(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    await apiClient.post('/notifications/read', { ids });
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read/all');
  },
};

export default notificationService;

