/**
 * Services Index
 * Export tất cả services để dễ import
 */

export { default as authService } from './auth.service';
export type { User, LoginCredentials, RegisterData, AuthResponse } from './auth.service';
export { default as categoryService } from './category.service';
export { default as advanceService } from './advance.service';
export { default as fileService } from './file.service';
export { default as dashboardService } from './dashboard.service';
export { default as capitalAllocationService } from './capitalAllocation.service';
export { default as noteService } from './note.service';

// Export types
export type { CategoryGroup, CategoryItem } from './category.service';
export type { AdvancePayment, CONSTRUCTION_PHASES } from './advance.service';
export type { DesignFile } from './file.service';
export type { DashboardSummary } from './dashboard.service';
export type { CapitalAllocation } from './capitalAllocation.service';
export type { Note } from './note.service';
