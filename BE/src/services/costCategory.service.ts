import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CostCategory, CostCategoryType } from '../entities/CostCategory.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';

const getCostCategoryRepository = () => {
  return AppDataSource.getRepository(CostCategory);
};

export interface CreateCostCategoryDto {
  name: string; // Tên hạng mục (bắt buộc)
  total?: number; // Dự tính chi phí (optional)
  note?: string; // Ghi chú (optional)
  type?: CostCategoryType; // Loại chi phí (optional)
  quantity?: number; // Deprecated
  unitPrice?: number; // Deprecated
}

export interface UpdateCostCategoryDto {
  name?: string;
  total?: number; // Dự tính chi phí
  note?: string; // Ghi chú
  type?: CostCategoryType;
  quantity?: number; // Deprecated
  unitPrice?: number; // Deprecated
}

export const costCategoryService = {
  /**
   * Tạo cost category mới
   */
  async create(data: CreateCostCategoryDto): Promise<CostCategory> {
    const repository = getCostCategoryRepository();
    
    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Tên hạng mục là bắt buộc');
    }

    // Tính total nếu có quantity và unitPrice (backward compatibility)
    let total = data.total;
    if (!total && data.quantity && data.unitPrice) {
      total = data.quantity * data.unitPrice;
    }

    const category = repository.create({
      name: data.name.trim(),
      total: total || 0,
      note: data.note?.trim() || null,
      type: data.type || CostCategoryType.PHAT_SINH, // Default type
      quantity: data.quantity || null,
      unitPrice: data.unitPrice || null,
    } as DeepPartial<CostCategory>);
    return await repository.save(category);
  },

  /**
   * Lấy tất cả cost categories
   */
  async findAll(): Promise<CostCategory[]> {
    const repository = getCostCategoryRepository();
    return await repository.find({
      relations: ['notes'],
      order: { createdAt: 'DESC' },
    });
  },

  /**
   * Lấy cost category theo ID
   */
  async findById(id: string): Promise<CostCategory> {
    const repository = getCostCategoryRepository();
    const category = await repository.findOne({
      where: { id },
      relations: ['notes'],
    });

    if (!category) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy hạng mục chi phí');
    }

    return category;
  },

  /**
   * Cập nhật cost category
   */
  async update(id: string, data: UpdateCostCategoryDto): Promise<CostCategory> {
    const repository = getCostCategoryRepository();
    const category = await this.findById(id);

    // Validate name nếu có
    if (data.name !== undefined && (!data.name || data.name.trim() === '')) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Tên hạng mục không được để trống');
    }

    // Tính lại total nếu có thay đổi quantity hoặc unitPrice (backward compatibility)
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const quantity = data.quantity ?? category.quantity;
      const unitPrice = data.unitPrice ?? category.unitPrice;
      if (quantity && unitPrice) {
        data.total = quantity * unitPrice;
      }
    }

    // Cập nhật các trường
    if (data.name !== undefined) {
      category.name = data.name.trim();
    }
    if (data.total !== undefined) {
      category.total = data.total;
    }
    if (data.note !== undefined) {
      category.note = data.note?.trim() || null;
    }
    if (data.type !== undefined) {
      category.type = data.type;
    }

    return await repository.save(category);
  },

  /**
   * Xóa cost category
   */
  async delete(id: string): Promise<CostCategory> {
    const repository = getCostCategoryRepository();
    const category = await this.findById(id);
    await repository.remove(category);
    return category;
  },
};

