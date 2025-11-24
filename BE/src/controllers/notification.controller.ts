import { Request, Response, NextFunction } from 'express';
import { notificationCenterService } from '../services/notificationCenter.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import { notificationStream } from '../services/notificationStream.service';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const notifications = await notificationCenterService.listNotifications(userId!);
      const data = notifications.map((notificationUser) => ({
        id: notificationUser.notificationId,
        isRead: notificationUser.isRead,
        readAt: notificationUser.readAt,
        createdAt: notificationUser.notification.createdAt,
        title: notificationUser.notification.title,
        message: notificationUser.notification.message,
        entityName: notificationUser.notification.entityName,
        entityId: notificationUser.notification.entityId,
        action: notificationUser.notification.action,
        type: notificationUser.notification.type,
        metadata: notificationUser.notification.metadata
          ? JSON.parse(notificationUser.notification.metadata)
          : null,
      }));

      return sendSuccess(res, SuccessCode.SUCCESS, data);
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { ids } = req.body as { ids: string[] };
      await notificationCenterService.markAsRead(userId!, ids || []);
      return sendSuccess(res, SuccessCode.SUCCESS, { ids });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      await notificationCenterService.markAllAsRead(userId!);
      return sendSuccess(res, SuccessCode.SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  static async stream(req: Request, res: Response) {
    let userId = req.user?.userId;
    if (!userId && req.query.token) {
      const { verifyToken } = await import('../utils/jwt');
      try {
        const payload = verifyToken(req.query.token as string);
        userId = payload.userId;
      } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
    }

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    notificationStream.addClient(userId, res);
  }
}

