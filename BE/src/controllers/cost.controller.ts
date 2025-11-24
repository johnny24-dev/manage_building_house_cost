import { Request, Response, NextFunction } from 'express';
import { costService } from '../services/cost.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import { notificationService } from '../services/notification.service';
import { formatCurrency, formatDate } from '../utils/format';

export class CostController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const cost = await costService.create(req.body);
      notificationService.queueAdminAction({
        action: 'create',
        entityName: 'chi phí',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: cost.id,
        details: [
          { label: 'Mô tả', value: cost.description },
          { label: 'Hạng mục', value: cost.categoryId },
          { label: 'Số tiền', value: formatCurrency(cost.amount) },
          { label: 'Ngày', value: formatDate(cost.date) },
          { label: 'Trạng thái', value: cost.status },
        ],
      });
      return sendSuccess(res, SuccessCode.CREATED, cost);
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.query;
      const costs = categoryId
        ? await costService.findByCategoryId(categoryId as string)
        : await costService.findAll();
      return sendSuccess(res, SuccessCode.SUCCESS, costs);
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cost = await costService.findById(id);
      return sendSuccess(res, SuccessCode.SUCCESS, cost);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cost = await costService.update(id, req.body);
      notificationService.queueAdminAction({
        action: 'update',
        entityName: 'chi phí',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: cost.id,
        details: [
          { label: 'Mô tả', value: cost.description },
          { label: 'Hạng mục', value: cost.categoryId },
          { label: 'Số tiền', value: formatCurrency(cost.amount) },
          { label: 'Ngày', value: formatDate(cost.date) },
          { label: 'Trạng thái', value: cost.status },
        ],
      });
      return sendSuccess(res, SuccessCode.UPDATED, cost);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cost = await costService.delete(id);
      notificationService.queueAdminAction({
        action: 'delete',
        entityName: 'chi phí',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: cost.id,
        details: [
          { label: 'Mô tả', value: cost.description },
          { label: 'Hạng mục', value: cost.categoryId },
          { label: 'Số tiền', value: formatCurrency(cost.amount) },
          { label: 'Ngày', value: formatDate(cost.date) },
        ],
      });
      return sendSuccess(res, SuccessCode.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

