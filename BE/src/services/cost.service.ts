import { AppDataSource } from '../config/database';
import { Cost, CostStatus } from '../entities/Cost.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { costCategoryService } from './costCategory.service';
import fs from 'fs';
import path from 'path';

const getCostRepository = () => {
  return AppDataSource.getRepository(Cost);
};

export interface CreateCostDto {
  categoryId: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  status?: CostStatus;
  billImageUrl?: string | null;
}

export interface UpdateCostDto {
  categoryId?: string;
  description?: string;
  amount?: number;
  date?: string;
  status?: CostStatus;
  billImageUrl?: string | null;
}

const normalizePublicPath = (publicPath?: string | null): string | null => {
  if (!publicPath || publicPath.startsWith('http')) return null;
  const trimmed = publicPath.startsWith('/')
    ? publicPath.slice(1)
    : publicPath;
  return path.join(process.cwd(), trimmed);
};

const removeBillImage = async (billImageUrl?: string | null) => {
  const absolutePath = normalizePublicPath(billImageUrl);
  if (!absolutePath) return;

  try {
    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      console.log(`🗑️  Đã xóa bill image: ${absolutePath}`);
    }
  } catch (error) {
    console.error('⚠️  Không thể xóa bill image:', error);
  }
};

let schemaChecked = false;

export const ensureCostBillColumn = async (): Promise<void> => {
  if (schemaChecked) return;

  const queryRunner = AppDataSource.createQueryRunner();
  try {
    await queryRunner.connect();
    const columns: Array<{ name: string }> = await queryRunner.query(
      `PRAGMA table_info('costs')`
    );
    const hasColumn = columns.some(
      (column) => column.name === 'bill_image_url'
    );
    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE costs ADD COLUMN bill_image_url varchar`
      );
      console.log('✅ Added bill_image_url column to costs table');
    }
    schemaChecked = true;
  } catch (error) {
    console.error('⚠️  Không thể đảm bảo cột bill_image_url:', error);
  } finally {
    await queryRunner.release();
  }
};

export const costService = {
  /**
   * Tạo cost mới
   */
  async create(data: CreateCostDto): Promise<Cost> {
    const repository = getCostRepository();

    // Validate required fields
    if (!data.description || data.description.trim() === '') {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Mô tả là bắt buộc');
    }
    if (!data.amount || data.amount <= 0) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Số tiền phải lớn hơn 0');
    }
    if (!data.categoryId) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Hạng mục là bắt buộc');
    }

    // Kiểm tra category tồn tại
    await costCategoryService.findById(data.categoryId);

    const cost = repository.create({
      categoryId: data.categoryId,
      description: data.description.trim(),
      amount: data.amount,
      date: new Date(data.date),
      status: data.status || CostStatus.PENDING,
      billImageUrl: data.billImageUrl || null,
    });

    return await repository.save(cost);
  },

  /**
   * Lấy tất cả costs
   */
  async findAll(): Promise<Cost[]> {
    const repository = getCostRepository();
    return await repository.find({
      relations: ['category'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  },

  /**
   * Lấy costs theo categoryId
   */
  async findByCategoryId(categoryId: string): Promise<Cost[]> {
    // Kiểm tra category tồn tại
    await costCategoryService.findById(categoryId);

    const repository = getCostRepository();
    return await repository.find({
      where: { categoryId },
      relations: ['category'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  },

  /**
   * Lấy cost theo ID
   */
  async findById(id: string): Promise<Cost> {
    const repository = getCostRepository();
    const cost = await repository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!cost) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy chi phí');
    }

    return cost;
  },

  /**
   * Cập nhật cost
   */
  async update(id: string, data: UpdateCostDto): Promise<Cost> {
    const repository = getCostRepository();
    const cost = await this.findById(id);

    // Validate
    if (data.description !== undefined && (!data.description || data.description.trim() === '')) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Mô tả không được để trống');
    }
    if (data.amount !== undefined && data.amount <= 0) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Số tiền phải lớn hơn 0');
    }

    // Kiểm tra category nếu có thay đổi
    if (data.categoryId) {
      await costCategoryService.findById(data.categoryId);
    }

    // Cập nhật các trường
    if (data.description !== undefined) {
      cost.description = data.description.trim();
    }
    if (data.amount !== undefined) {
      cost.amount = data.amount;
    }
    if (data.date !== undefined) {
      cost.date = new Date(data.date);
    }
    if (data.status !== undefined) {
      cost.status = data.status;
    }
    if (data.categoryId !== undefined) {
      cost.categoryId = data.categoryId;
    }
    let previousBillImageUrl: string | null = null;
    if (data.billImageUrl !== undefined) {
      previousBillImageUrl = cost.billImageUrl;
      cost.billImageUrl = data.billImageUrl;
    }

    const updatedCost = await repository.save(cost);

    if (
      data.billImageUrl !== undefined &&
      previousBillImageUrl &&
      previousBillImageUrl !== data.billImageUrl
    ) {
      await removeBillImage(previousBillImageUrl);
    }

    return updatedCost;
  },

  /**
   * Xóa cost
   */
  async delete(id: string): Promise<Cost> {
    const repository = getCostRepository();
    const cost = await this.findById(id);
    await repository.remove(cost);
    await removeBillImage(cost.billImageUrl);
    return cost;
  },
};

