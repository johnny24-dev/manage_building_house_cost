/**
 * User Role Constants
 * 
 * Định nghĩa các role người dùng, khớp với backend
 * Backend: BE/src/entities/User.entity.ts
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  VIEWER = 'viewer',
}

/**
 * Kiểm tra xem user có phải là super admin không
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  return role === UserRole.SUPER_ADMIN;
}

/**
 * Kiểm tra xem user có phải là viewer không
 */
export function isViewer(role: string | undefined | null): boolean {
  return role === UserRole.VIEWER;
}

/**
 * Lấy label tiếng Việt cho role
 */
export function getRoleLabel(role: string | undefined | null): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'Quản trị viên';
    case UserRole.VIEWER:
      return 'Người xem';
    default:
      return 'Không xác định';
  }
}


