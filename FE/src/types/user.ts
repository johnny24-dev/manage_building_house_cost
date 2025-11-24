/**
 * User Types
 * 
 * Định nghĩa các type liên quan đến User
 * Khớp với backend: BE/src/entities/User.entity.ts
 */

import { UserRole } from '@/constants/userRole';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}


