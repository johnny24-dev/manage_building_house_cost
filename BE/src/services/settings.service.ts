import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';

const getUserRepository = () => AppDataSource.getRepository(User);

export interface ProfileDto {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface NotificationDto {
  notifyEmail: boolean;
  notifyBudget: boolean;
}

export const settingsService = {
  async getProfile(userId: string) {
    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    const { password, ...profile } = user;
    return profile;
  },

  async updateProfile(userId: string, data: ProfileDto) {
    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    user.fullName = data.fullName ?? null;
    user.phone = data.phone ?? null;
    user.address = data.address ?? null;

    const saved = await userRepository.save(user);
    const { password, ...profile } = saved;
    return profile;
  },

  async updateNotifications(userId: string, data: NotificationDto) {
    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    user.notifyEmail = data.notifyEmail;
    user.notifyBudget = data.notifyBudget;

    const saved = await userRepository.save(user);
    const { password, ...profile } = saved;
    return profile;
  },

  async updateAvatar(userId: string, avatarUrl: string, diskPath: string) {
    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    const oldAvatar = user.avatarUrl;
    user.avatarUrl = avatarUrl;

    const saved = await userRepository.save(user);

    if (oldAvatar) {
      const oldPath = path.join(process.cwd(), oldAvatar.replace(/^\//, ''));
      if (fs.existsSync(oldPath) && oldPath !== diskPath) {
        fs.unlink(oldPath, (err) => {
          if (err) {
            console.warn('Không thể xóa avatar cũ:', err);
          }
        });
      }
    }

    const { password, ...profile } = saved;
    return profile;
  },

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Không tìm thấy người dùng');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 'Mật khẩu hiện tại không chính xác');
    }

    if (currentPassword === newPassword) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await userRepository.save(user);
  },

  async listUsers() {
    const userRepository = getUserRepository();
    const users = await userRepository.find({
      order: { createdAt: 'ASC' },
    });
    return users.map(({ password, ...user }) => user);
  },

  async updateUserRole(targetUserId: string, role: UserRole, actorId: string) {
    const userRepository = getUserRepository();
    if (targetUserId === actorId) {
      throw new AppError(ErrorCode.OPERATION_NOT_ALLOWED, 'Không thể tự thay đổi vai trò');
    }

    const user = await userRepository.findOne({ where: { id: targetUserId } });
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, 'Không tìm thấy người dùng');
    }

    if (user.role === UserRole.SUPER_ADMIN && role !== UserRole.SUPER_ADMIN) {
      const totalSuperAdmins = await userRepository.count({
        where: { role: UserRole.SUPER_ADMIN },
      });
      if (totalSuperAdmins <= 1) {
        throw new AppError(
          ErrorCode.OPERATION_NOT_ALLOWED,
          'Cần ít nhất một quản trị viên để quản lý hệ thống'
        );
      }
    }

    user.role = role;
    const saved = await userRepository.save(user);
    const { password, ...profile } = saved;
    return profile;
  },

  async deleteUser(targetUserId: string, actorId: string) {
    if (targetUserId === actorId) {
      throw new AppError(ErrorCode.OPERATION_NOT_ALLOWED, 'Không thể tự xóa tài khoản');
    }

    const userRepository = getUserRepository();
    const user = await userRepository.findOne({ where: { id: targetUserId } });

    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, 'Không tìm thấy người dùng');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      const totalSuperAdmins = await userRepository.count({
        where: { role: UserRole.SUPER_ADMIN },
      });
      if (totalSuperAdmins <= 1) {
        throw new AppError(
          ErrorCode.OPERATION_NOT_ALLOWED,
          'Cần ít nhất một quản trị viên để quản lý hệ thống'
        );
      }
    }

    if (user.avatarUrl) {
      const avatarPath = path.join(process.cwd(), user.avatarUrl.replace(/^\//, ''));
      if (fs.existsSync(avatarPath)) {
        fs.unlink(avatarPath, (err) => {
          if (err) {
            console.warn('Không thể xóa avatar khi xóa user:', err);
          }
        });
      }
    }

    await userRepository.remove(user);
  },
};


