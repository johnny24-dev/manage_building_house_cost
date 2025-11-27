import { Request, Response, NextFunction } from 'express';
import { advancePaymentService } from '../services/advancePayment.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';
import { notificationService } from '../services/notification.service';
import { formatCurrency, formatDate } from '../utils/format';

const buildPublicPath = (filePath?: string) => {
  if (!filePath) return undefined;
  const normalized = filePath.replace(process.cwd(), '').replace(/\\/g, '/');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const buildPayload = (req: Request, options?: { isUpdate?: boolean }) => {
  const payload: any = {};

  if (req.body.ticketName !== undefined) {
    payload.ticketName = req.body.ticketName;
  }

  if (req.body.categoryId !== undefined) {
    payload.categoryId =
      req.body.categoryId === '' || req.body.categoryId === null
        ? null
        : req.body.categoryId;
  }

  if (req.body.paymentDate !== undefined) {
    const parsedDate = req.body.paymentDate
      ? new Date(req.body.paymentDate)
      : undefined;
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      payload.paymentDate = parsedDate;
    }
  }

  if (req.body.phase !== undefined) {
    payload.phase = req.body.phase;
  }

  if (req.body.amount !== undefined) {
    const parsedAmount = Number(req.body.amount);
    if (!Number.isNaN(parsedAmount)) {
      payload.amount = parsedAmount;
    }
  }

  if (req.body.description !== undefined) {
    payload.description = req.body.description;
  }

  if (req.body.status !== undefined) {
    payload.status = req.body.status;
  }

  if (req.file) {
    payload.billImageUrl = buildPublicPath(req.file.path);
  } else if (options?.isUpdate && req.body.removeBillImage === 'true') {
    payload.billImageUrl = null;
  }

  return payload;
};

export class AdvancePaymentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = buildPayload(req);
      data.paymentDate = data.paymentDate || new Date();
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
      const data = buildPayload(req, { isUpdate: true });
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

