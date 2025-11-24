import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { settingsService } from '../services/settings.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { UserRole } from '../entities/User.entity';

export class SettingsController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const profile = await settingsService.getProfile(userId!);
      return sendSuccess(res, SuccessCode.SUCCESS, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const profile = await settingsService.updateProfile(userId!, req.body);
      return sendSuccess(res, SuccessCode.SUCCESS, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const profile = await settingsService.updateNotifications(userId!, req.body);
      return sendSuccess(res, SuccessCode.SUCCESS, profile);
    } catch (error) {
      next(error);
    }
  }

  static async updatePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;
      await settingsService.updatePassword(userId!, currentPassword, newPassword);
      return sendSuccess(res, SuccessCode.SUCCESS, {
        message: 'Đổi mật khẩu thành công',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError(ErrorCode.FILE_NOT_FOUND, 'Không có file được upload');
      }
      const userId = req.user?.userId;
      const relativePath = `/uploads/avatars/${req.file.filename}`;
      const absolutePath = path.join(process.cwd(), 'uploads', 'avatars', req.file.filename);
      const profile = await settingsService.updateAvatar(userId!, relativePath, absolutePath);
      return sendSuccess(res, SuccessCode.SUCCESS, profile);
    } catch (error) {
      next(error);
    }
  }

  static async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await settingsService.listUsers();
      return sendSuccess(res, SuccessCode.SUCCESS, users);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        throw new AppError(ErrorCode.FIELD_REQUIRED, 'Vai trò là bắt buộc');
      }

      if (!Object.values(UserRole).includes(role)) {
        throw new AppError(ErrorCode.FIELD_INVALID, 'Vai trò không hợp lệ');
      }

      const actorId = req.user?.userId;
      const updated = await settingsService.updateUserRole(id, role, actorId!);
      return sendSuccess(res, SuccessCode.UPDATED, updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const actorId = req.user?.userId;
      await settingsService.deleteUser(id, actorId!);
      return sendSuccess(res, SuccessCode.DELETED, { id });
    } catch (error) {
      next(error);
    }
  }
}


