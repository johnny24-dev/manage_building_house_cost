/**
 * Environment Variables Configuration
 * 
 * Helper để quản lý và validate environment variables
 * Next.js tự động load các file .env.local, .env.development, .env.production
 */

/**
 * URL của Backend API
 * Mặc định: http://localhost:9000/api
 * 
 * Lưu ý: Next.js chỉ expose biến môi trường có prefix NEXT_PUBLIC_ ra client-side
 */
export const API_URL = 
  (typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_API_URL 
    : null) ||
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:9000/api';

// Log API URL khi load (chỉ ở client-side để debug)
if (typeof window !== 'undefined') {
  console.log('🌐 API URL:', API_URL);
  console.log('🔍 NEXT_PUBLIC_API_URL from process.env:', process.env.NEXT_PUBLIC_API_URL);
}

/**
 * Môi trường hiện tại
 * development | production
 */
export const ENV = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development';

/**
 * Kiểm tra xem có đang ở môi trường development không
 */
export const isDevelopment = ENV === 'development';

/**
 * Kiểm tra xem có đang ở môi trường production không
 */
export const isProduction = ENV === 'production';

/**
 * Validate environment variables
 * Log warning nếu thiếu các biến quan trọng
 */
export function validateEnv() {
  if (typeof window === 'undefined') {
    // Server-side validation
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn(
        '⚠️  NEXT_PUBLIC_API_URL chưa được cấu hình. Sử dụng giá trị mặc định:',
        API_URL
      );
    }
  }
}

// Validate khi import (chỉ ở server-side)
if (typeof window === 'undefined') {
  validateEnv();
}

