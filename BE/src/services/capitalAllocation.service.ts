import { AppDataSource } from '../config/database';
import { CapitalAllocation } from '../entities/CapitalAllocation.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';

const getCapitalAllocationRepository = () => {
  return AppDataSource.getRepository(CapitalAllocation);
};

export interface CreateCapitalAllocationDto {
  totalBudget: number;
  phanThoPercent: number;
  hoanThienPercent: number;
  dienNuocPercent: number;
  noiThatPercent: number;
  phapLyPercent: number;
  phatSinhPercent: number;
  tamUngPercent: number;
}

export interface UpdateCapitalAllocationDto {
  totalBudget?: number;
  phanThoPercent?: number;
  hoanThienPercent?: number;
  dienNuocPercent?: number;
  noiThatPercent?: number;
  phapLyPercent?: number;
  phatSinhPercent?: number;
  tamUngPercent?: number;
}

export const capitalAllocationService = {
  /**
   * Tạo hoặc cập nhật capital allocation (chỉ có 1 record duy nhất)
   */
  async upsert(data: CreateCapitalAllocationDto): Promise<CapitalAllocation> {
    const repository = getCapitalAllocationRepository();

    // Tìm allocation hiện có (chỉ có 1 record)
    let allocation = await repository.findOne({
      where: {},
    });

    // Tính toán số tiền từ phần trăm
    const calculateAmount = (percent: number) => {
      return (data.totalBudget * percent) / 100;
    };

    if (allocation) {
      // Cập nhật
      Object.assign(allocation, {
        ...data,
        phanThoAmount: calculateAmount(data.phanThoPercent),
        hoanThienAmount: calculateAmount(data.hoanThienPercent),
        dienNuocAmount: calculateAmount(data.dienNuocPercent),
        noiThatAmount: calculateAmount(data.noiThatPercent),
        phapLyAmount: calculateAmount(data.phapLyPercent),
        phatSinhAmount: calculateAmount(data.phatSinhPercent),
        tamUngAmount: calculateAmount(data.tamUngPercent),
      });
    } else {
      // Tạo mới
      allocation = repository.create({
        ...data,
        phanThoAmount: calculateAmount(data.phanThoPercent),
        hoanThienAmount: calculateAmount(data.hoanThienPercent),
        dienNuocAmount: calculateAmount(data.dienNuocPercent),
        noiThatAmount: calculateAmount(data.noiThatPercent),
        phapLyAmount: calculateAmount(data.phapLyPercent),
        phatSinhAmount: calculateAmount(data.phatSinhPercent),
        tamUngAmount: calculateAmount(data.tamUngPercent),
      });
    }

    return await repository.save(allocation);
  },

  /**
   * Lấy capital allocation (chỉ có 1 record)
   */
  async findOne(): Promise<CapitalAllocation | null> {
    const repository = getCapitalAllocationRepository();
    return await repository.findOne({
      where: {},
    });
  },

  /**
   * Cập nhật capital allocation
   */
  async update(data: UpdateCapitalAllocationDto): Promise<CapitalAllocation> {
    const repository = getCapitalAllocationRepository();
    let allocation = await this.findOne();

    if (!allocation) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Chưa có phân bố vốn');
    }

    // Nếu có thay đổi totalBudget hoặc phần trăm, tính lại số tiền
    if (data.totalBudget || Object.keys(data).some(key => key.includes('Percent'))) {
      const totalBudget = data.totalBudget ?? allocation.totalBudget;
      const phanThoPercent = data.phanThoPercent ?? allocation.phanThoPercent;
      const hoanThienPercent = data.hoanThienPercent ?? allocation.hoanThienPercent;
      const dienNuocPercent = data.dienNuocPercent ?? allocation.dienNuocPercent;
      const noiThatPercent = data.noiThatPercent ?? allocation.noiThatPercent;
      const phapLyPercent = data.phapLyPercent ?? allocation.phapLyPercent;
      const phatSinhPercent = data.phatSinhPercent ?? allocation.phatSinhPercent;
      const tamUngPercent = data.tamUngPercent ?? allocation.tamUngPercent;

      Object.assign(allocation, {
        ...data,
        totalBudget,
        phanThoAmount: (totalBudget * phanThoPercent) / 100,
        hoanThienAmount: (totalBudget * hoanThienPercent) / 100,
        dienNuocAmount: (totalBudget * dienNuocPercent) / 100,
        noiThatAmount: (totalBudget * noiThatPercent) / 100,
        phapLyAmount: (totalBudget * phapLyPercent) / 100,
        phatSinhAmount: (totalBudget * phatSinhPercent) / 100,
        tamUngAmount: (totalBudget * tamUngPercent) / 100,
      });
    } else {
      Object.assign(allocation, data);
    }

    return await repository.save(allocation);
  },
};

