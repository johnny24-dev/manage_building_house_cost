import { AppDataSource } from '../config/database';
import { Notification } from '../entities/Notification.entity';
import { NotificationUser } from '../entities/NotificationUser.entity';
import { User } from '../entities/User.entity';
import { notificationStream } from './notificationStream.service';

export interface CreateNotificationPayload {
  title: string;
  message: string;
  action?: 'create' | 'update' | 'delete' | string;
  entityName?: string;
  entityId?: string | null;
  type?: Notification['type'];
  metadata?: Record<string, any>;
  actorId?: string;
}

const getNotificationRepository = () => AppDataSource.getRepository(Notification);
const getNotificationUserRepository = () => AppDataSource.getRepository(NotificationUser);
const getUserRepository = () => AppDataSource.getRepository(User);

export const notificationCenterService = {
  async createBroadcastNotification(payload: CreateNotificationPayload) {
    const notificationRepository = getNotificationRepository();
    const notificationUserRepository = getNotificationUserRepository();
    const userRepository = getUserRepository();

    const notification = notificationRepository.create({
      title: payload.title,
      message: payload.message,
      action: payload.action,
      entityName: payload.entityName,
      entityId: payload.entityId,
      type: payload.type || 'info',
      metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
      createdById: payload.actorId || null,
    });

    const savedNotification = await notificationRepository.save(notification);

    const users = await userRepository.find({
      select: ['id'],
    });

    if (users.length > 0) {
      const notificationUsers = users.map((user) =>
        notificationUserRepository.create({
          notificationId: savedNotification.id,
          userId: user.id,
        })
      );
      await notificationUserRepository.save(notificationUsers);
      notificationStream.broadcast(savedNotification, users.map((user) => user.id));
    }

    return savedNotification;
  },

  async listNotifications(userId: string, limit = 50) {
    const notificationUserRepository = getNotificationUserRepository();
    return notificationUserRepository.find({
      where: { userId },
      relations: ['notification'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  },

  async markAsRead(userId: string, ids: string[]) {
    const notificationUserRepository = getNotificationUserRepository();
    if (ids.length === 0) return;

    await notificationUserRepository
      .createQueryBuilder()
      .update(NotificationUser)
      .set({ isRead: true, readAt: () => 'CURRENT_TIMESTAMP' })
      .where('user_id = :userId', { userId })
      .andWhere('notification_id IN (:...ids)', { ids })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();
  },

  async markAllAsRead(userId: string) {
    const notificationUserRepository = getNotificationUserRepository();
    await notificationUserRepository
      .createQueryBuilder()
      .update(NotificationUser)
      .set({ isRead: true, readAt: () => 'CURRENT_TIMESTAMP' })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = :isRead', { isRead: false })
      .execute();
  },
};

