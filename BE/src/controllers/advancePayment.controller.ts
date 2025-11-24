import { Request, Response, NextFunction } from 'express';
import { advancePaymentService } from '../services/advancePayment.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import { notificationService } from '../services/notification.service';
import { formatCurrency, formatDate } from '../utils/format';

export class AdvancePaymentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      // Parse paymentDate từ string sang Date nếu cần
      const data = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : new Date(),
      };
      const payment = await advancePaymentService.create(data);
      notificationService.queueAdminAction({
        action: 'create',
        entityName: 'tạm ứng',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: payment.id,
        details: [
          { label: 'Tên phiếu', value: payment.ticketName },
          { label: 'Đợt', value: payment.phase },
          { label: 'Hạng mục', value: payment.categoryId },
          { label: 'Số tiền', value: formatCurrency(payment.amount) },
          { label: 'Ngày thanh toán', value: formatDate(payment.paymentDate) },
          { label: 'Trạng thái', value: payment.status },
        ],
      });
      return sendSuccess(res, SuccessCode.CREATED, payment);
    } catch (error) {
      next(error);
    }
  }

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const payments = await advancePaymentService.findAll();
      return sendSuccess(res, SuccessCode.SUCCESS, payments);
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await advancePaymentService.findById(id);
      return sendSuccess(res, SuccessCode.SUCCESS, payment);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      // Parse paymentDate từ string sang Date nếu có
      const data = {
        ...req.body,
        paymentDate: req.body.paymentDate ? new Date(req.body.paymentDate) : undefined,
      };
      const payment = await advancePaymentService.update(id, data);
      notificationService.queueAdminAction({
        action: 'update',
        entityName: 'tạm ứng',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: payment.id,
        details: [
          { label: 'Tên phiếu', value: payment.ticketName },
          { label: 'Đợt', value: payment.phase },
          { label: 'Hạng mục', value: payment.categoryId },
          { label: 'Số tiền', value: formatCurrency(payment.amount) },
          { label: 'Ngày thanh toán', value: formatDate(payment.paymentDate) },
          { label: 'Trạng thái', value: payment.status },
        ],
      });
      return sendSuccess(res, SuccessCode.UPDATED, payment);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payment = await advancePaymentService.delete(id);
      notificationService.queueAdminAction({
        action: 'delete',
        entityName: 'tạm ứng',
        actorEmail: req.user?.email,
        actorId: req.user?.userId,
        entityId: payment.id,
        details: [
          { label: 'Tên phiếu', value: payment.ticketName },
          { label: 'Đợt', value: payment.phase },
          { label: 'Hạng mục', value: payment.categoryId },
          { label: 'Số tiền', value: formatCurrency(payment.amount) },
          { label: 'Ngày thanh toán', value: formatDate(payment.paymentDate) },
        ],
      });
      return sendSuccess(res, SuccessCode.DELETED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy tổng hợp tạm ứng
   */
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await advancePaymentService.getSummary();
      return sendSuccess(res, SuccessCode.SUCCESS, summary);
    } catch (error) {
      next(error);
    }
  }
}

