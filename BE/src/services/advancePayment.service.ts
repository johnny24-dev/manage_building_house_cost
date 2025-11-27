import { AppDataSource } from '../config/database';
import { AdvancePayment, PaymentStatus } from '../entities/AdvancePayment.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { costCategoryService } from './costCategory.service';
import fs from 'fs';
import path from 'path';

const getAdvancePaymentRepository = () => {
  return AppDataSource.getRepository(AdvancePayment);
};

export interface CreateAdvancePaymentDto {
  ticketName: string;
  categoryId?: string | null;
  paymentDate: Date;
  phase: string;
  amount: number;
  description?: string;
  status?: PaymentStatus;
  billImageUrl?: string | null;
}

export interface UpdateAdvancePaymentDto {
  ticketName?: string;
  categoryId?: string | null;
  paymentDate?: Date;
  phase?: string;
  amount?: number;
  description?: string;
  status?: PaymentStatus;
  billImageUrl?: string | null;
}

const normalizePublicPath = (publicPath?: string | null): string | null => {
  if (!publicPath || publicPath.startsWith('http')) return null;
  const trimmed = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  return path.join(process.cwd(), trimmed);
};

const removeBillImage = async (billImageUrl?: string | null) => {
  const absolutePath = normalizePublicPath(billImageUrl);
  if (!absolutePath) return;

  try {
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      console.log(`🗑️  Đã xóa advance bill image: ${absolutePath}`);
    }
  } catch (error) {
    console.error('⚠️  Không thể xóa advance bill image:', error);
  }
};

let advanceSchemaChecked = false;

export const ensureAdvanceBillColumn = async (): Promise<void> => {
  if (advanceSchemaChecked) return;

  const queryRunner = AppDataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    const columns: Array<{ name: string }> = await queryRunner.query(
      `PRAGMA table_info('advance_payments')`
    );
    const hasColumn = columns.some((column) => column.name === 'bill_image_url');
    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE advance_payments ADD COLUMN bill_image_url varchar`
      );
      console.log('✅ Added bill_image_url column to advance_payments table');
    }
    advanceSchemaChecked = true;
  } catch (error) {
    console.error('⚠️  Không thể đảm bảo cột bill_image_url cho advance_payments:', error);
  } finally {
    await queryRunner.release();
  }
};

export const advancePaymentService = {
  /**
   * Tạo advance payment mới
   */
  async create(data: CreateAdvancePaymentDto): Promise<AdvancePayment> {
    const repository = getAdvancePaymentRepository();

    // Validate required fields
    if (!data.ticketName || data.ticketName.trim() === '') {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Tên phiếu là bắt buộc');
    }
    if (!data.amount || data.amount <= 0) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Số tiền phải lớn hơn 0');
    }
    if (!data.phase || data.phase.trim() === '') {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Đợt tạm ứng là bắt buộc');
    }

    // Kiểm tra category nếu có
    if (data.categoryId) {
      await costCategoryService.findById(data.categoryId);
    }

    const payment = repository.create({
      ticketName: data.ticketName.trim(),
      categoryId: data.categoryId || null,
      paymentDate: data.paymentDate,
      phase: data.phase.trim(),
      amount: data.amount,
      description: data.description?.trim(),
      status: data.status || PaymentStatus.PLANNED,
      billImageUrl: data.billImageUrl || null,
    });
    return await repository.save(payment);
  },

  /**
   * Lấy tất cả advance payments
   */
  async findAll(): Promise<AdvancePayment[]> {
    const repository = getAdvancePaymentRepository();
    return await repository.find({
      relations: ['category'],
      order: { paymentDate: 'DESC', createdAt: 'DESC' },
    });
  },

  /**
   * Lấy advance payment theo ID
   */
  async findById(id: string): Promise<AdvancePayment> {
    const repository = getAdvancePaymentRepository();
    const payment = await repository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!payment) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy tạm ứng');
    }

    return payment;
  },

  /**
   * Cập nhật advance payment
   */
  async update(id: string, data: UpdateAdvancePaymentDto): Promise<AdvancePayment> {
    const repository = getAdvancePaymentRepository();
    const payment = await this.findById(id);

    // Validate
    if (data.ticketName !== undefined && (!data.ticketName || data.ticketName.trim() === '')) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Tên phiếu không được để trống');
    }
    if (data.amount !== undefined && data.amount <= 0) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Số tiền phải lớn hơn 0');
    }
    if (data.phase !== undefined && (!data.phase || data.phase.trim() === '')) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Đợt tạm ứng không được để trống');
    }

    // Kiểm tra category nếu có thay đổi
    if (data.categoryId !== undefined) {
      if (data.categoryId) {
        await costCategoryService.findById(data.categoryId);
      }
      payment.categoryId = data.categoryId || null;
    }

    // Cập nhật các trường
    if (data.ticketName !== undefined) {
      payment.ticketName = data.ticketName.trim();
    }
    if (data.paymentDate !== undefined) {
      payment.paymentDate = data.paymentDate;
    }
    if (data.phase !== undefined) {
      payment.phase = data.phase.trim();
    }
    if (data.amount !== undefined) {
      payment.amount = data.amount;
    }
    if (data.description !== undefined) {
      payment.description = data.description?.trim();
    }
    if (data.status !== undefined) {
      payment.status = data.status;
    }
    let previousBillImageUrl: string | null = null;
    if (data.billImageUrl !== undefined) {
      previousBillImageUrl = payment.billImageUrl;
      payment.billImageUrl = data.billImageUrl;
    }

    const updatedPayment = await repository.save(payment);

    if (
      data.billImageUrl !== undefined &&
      previousBillImageUrl &&
      previousBillImageUrl !== data.billImageUrl
    ) {
      await removeBillImage(previousBillImageUrl);
    }

    return updatedPayment;
  },

  /**
   * Xóa advance payment
   */
  async delete(id: string): Promise<AdvancePayment> {
    const repository = getAdvancePaymentRepository();
    const payment = await this.findById(id);
    await repository.remove(payment);
    await removeBillImage(payment.billImageUrl);
    return payment;
  },

  /**
   * Lấy tổng hợp tạm ứng
   */
  async getSummary() {
    const repository = getAdvancePaymentRepository();
    const allPayments = await repository.find({
      select: ['id', 'amount', 'status', 'phase', 'paymentDate'],
      order: { paymentDate: 'DESC' },
    });

    let totalAdvancePaid = 0;
    let totalAdvancePlanned = 0;
    const paidList: Array<{ id: string; phase: string; amount: number; paymentDate: Date }> = [];
    const plannedList: Array<{ id: string; phase: string; amount: number; paymentDate: Date }> = [];

    allPayments.forEach((payment) => {
      const amount = Number(payment.amount) || 0;
      if (payment.status === PaymentStatus.PAID) {
        totalAdvancePaid += amount;
        paidList.push({
          id: payment.id,
          phase: payment.phase,
          amount,
          paymentDate: payment.paymentDate,
        });
      } else {
        totalAdvancePlanned += amount;
        plannedList.push({
          id: payment.id,
          phase: payment.phase,
          amount,
          paymentDate: payment.paymentDate,
        });
      }
    });

    return {
      totalAdvancePaid,
      totalAdvancePlanned,
      paidList: paidList.slice(0, 10), // Danh sách ngắn gọn (10 items gần nhất)
      plannedList: plannedList.slice(0, 10), // Danh sách ngắn gọn (10 items gần nhất)
    };
  },
};

