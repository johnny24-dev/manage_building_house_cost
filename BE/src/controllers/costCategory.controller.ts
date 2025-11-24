import { Request, Response, NextFunction } from 'express';
import { costCategoryService } from '../services/costCategory.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import { notificationService } from '../services/notification.service';
import { formatCurrency } from '../utils/format';

export class CostCategoryController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await costCategoryService.create(req.body);
      notificationService.queueAdminAction({
        action: 'create',
        entityName: 'hạng mục chi phí',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: category.id,
        details: [
          { label: 'Tên', value: category.name },
          { label: 'Loại', value: category.type },
          { label: 'Tổng dự tính', value: formatCurrency(category.total) },
          { label: 'Ghi chú', value: category.note },
        ],
      });
      return sendSuccess(res, SuccessCode.CREATED, category);
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await costCategoryService.findAll();
      return sendSuccess(res, SuccessCode.SUCCESS, categories);
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await costCategoryService.findById(id);
      return sendSuccess(res, SuccessCode.SUCCESS, category);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await costCategoryService.update(id, req.body);
      notificationService.queueAdminAction({
        action: 'update',
        entityName: 'hạng mục chi phí',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: category.id,
        details: [
          { label: 'Tên', value: category.name },
          { label: 'Loại', value: category.type },
          { label: 'Tổng dự tính', value: formatCurrency(category.total) },
          { label: 'Ghi chú', value: category.note },
        ],
      });
      return sendSuccess(res, SuccessCode.UPDATED, category);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await costCategoryService.delete(id);
      notificationService.queueAdminAction({
        action: 'delete',
        entityName: 'hạng mục chi phí',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: category.id,
        details: [
          { label: 'Tên', value: category.name },
          { label: 'Loại', value: category.type },
          { label: 'Tổng dự tính', value: formatCurrency(category.total) },
        ],
      });
      return sendSuccess(res, SuccessCode.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

