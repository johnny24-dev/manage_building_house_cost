import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';
import { SettingsController } from '../controllers/settings.controller';
import { avatarUpload } from '../middleware/avatarUpload.middleware';

const router = Router();
router.use(authenticate);

/**
 * @route GET /api/settings/profile
 * @desc  Lấy thông tin cài đặt người dùng hiện tại
 */
router.get('/profile', SettingsController.getProfile);

/**
 * @route PUT /api/settings/profile
 * @desc  Cập nhật thông tin cá nhân
 */
router.put('/profile', SettingsController.updateProfile);

/**
 * @route PUT /api/settings/notifications
 * @desc  Cập nhật cài đặt thông báo
 */
router.put('/notifications', SettingsController.updateNotifications);

/**
 * @route PUT /api/settings/password
 * @desc  Đổi mật khẩu
 */
router.put('/password', SettingsController.updatePassword);

/**
 * @route PUT /api/settings/avatar
 * @desc  Cập nhật avatar người dùng
 */
router.put('/avatar', avatarUpload.single('avatar'), SettingsController.updateAvatar);

/**
 * @route GET /api/settings/users
 * @desc  Danh sách người dùng (chỉ admin)
 */
router.get('/users', requireSuperAdmin, SettingsController.listUsers);

/**
 * @route PUT /api/settings/users/:id/role
 * @desc  Cập nhật vai trò người dùng
 */
router.put('/users/:id/role', requireSuperAdmin, SettingsController.updateUserRole);

/**
 * @route DELETE /api/settings/users/:id
 * @desc  Xóa người dùng
 */
router.delete('/users/:id', requireSuperAdmin, SettingsController.deleteUser);

export default router;


