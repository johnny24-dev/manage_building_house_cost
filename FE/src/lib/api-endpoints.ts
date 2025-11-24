/**
 * API Endpoints Configuration
 * Tổng hợp tất cả các API endpoints để dễ quản lý và tham chiếu
 * Khớp với BE routes trong server.ts
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },

  // Cost Categories (Nhóm chi phí)
  COST_CATEGORIES: {
    LIST: '/cost-categories',
    CREATE: '/cost-categories',
    UPDATE: (id: string) => `/cost-categories/${id}`,
    DELETE: (id: string) => `/cost-categories/${id}`,
    GET: (id: string) => `/cost-categories/${id}`,
  },

  // Costs (Chi phí)
  COSTS: {
    LIST: '/costs',
    CREATE: '/costs',
    UPDATE: (id: string) => `/costs/${id}`,
    DELETE: (id: string) => `/costs/${id}`,
    GET: (id: string) => `/costs/${id}`,
  },

  // Advance Payments (Tạm ứng)
  ADVANCE_PAYMENTS: {
    LIST: '/advance-payments',
    SUMMARY: '/advance-payments/summary',
    CREATE: '/advance-payments',
    UPDATE: (id: string) => `/advance-payments/${id}`,
    DELETE: (id: string) => `/advance-payments/${id}`,
    GET: (id: string) => `/advance-payments/${id}`,
  },

  // Design Files (File thiết kế)
  DESIGNS: {
    LIST: '/designs',
    UPLOAD: '/designs/upload',
    GET: (id: string) => `/designs/${id}`,
    FILE: (id: string) => `/designs/file/${id}`, // Stream file
    DELETE: (id: string) => `/designs/${id}`,
  },

  // Capital Allocations (Phân bổ vốn)
  CAPITAL_ALLOCATIONS: {
    GET: '/capital-allocations',
    CREATE: '/capital-allocations',
    UPDATE: '/capital-allocations',
  },

  // Notes (Ghi chú)
  NOTES: {
    LIST_BY_CATEGORY: (categoryId: string) => `/notes/category/${categoryId}`,
    CREATE: '/notes',
    UPDATE: (id: string) => `/notes/${id}`,
    DELETE: (id: string) => `/notes/${id}`,
    GET: (id: string) => `/notes/${id}`,
  },

  // Dashboard
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    REPORT: '/dashboard/report',
    REPORT_EXPORT: '/dashboard/report/export',
  },

  // Settings
  SETTINGS: {
    PROFILE: '/settings/profile',
    NOTIFICATIONS: '/settings/notifications',
    PASSWORD: '/settings/password',
    AVATAR: '/settings/avatar',
    USERS: '/settings/users',
    USER_ROLE: (id: string) => `/settings/users/${id}/role`,
    USER_DELETE: (id: string) => `/settings/users/${id}`,
  },
} as const;

