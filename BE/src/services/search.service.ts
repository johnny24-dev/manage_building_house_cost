import { AppDataSource } from '../config/database';
import { Cost } from '../entities/Cost.entity';
import { CostCategory } from '../entities/CostCategory.entity';
import { AdvancePayment } from '../entities/AdvancePayment.entity';
import { DesignFile } from '../entities/DesignFile.entity';
import { Like } from 'typeorm';

export const searchService = {
  /**
   * Tìm kiếm tất cả hạng mục (Chi phí, Hạng mục, Tạm ứng, File thiết kế)
   */
  async searchAll(query: string) {
    const q = query.trim();
    if (!q) {
      return { costs: [], categories: [], advancePayments: [], files: [] };
    }

    const costRepository = AppDataSource.getRepository(Cost);
    const categoryRepository = AppDataSource.getRepository(CostCategory);
    const advanceRepository = AppDataSource.getRepository(AdvancePayment);
    const fileRepository = AppDataSource.getRepository(DesignFile);

    const likeQuery = `%${q}%`;

    // 1. Tìm kiếm chi phí
    const costs = await costRepository.find({
      where: [
        { description: Like(likeQuery) }
      ],
      relations: ['category'],
      take: 5,
    });

    // 2. Tìm kiếm hạng mục
    const categories = await categoryRepository.find({
      where: [
        { name: Like(likeQuery) },
        { note: Like(likeQuery) }
      ],
      take: 5,
    });

    // 3. Tìm kiếm tạm ứng
    const advances = await advanceRepository.find({
      where: [
        { ticketName: Like(likeQuery) },
        { description: Like(likeQuery) }
      ],
      relations: ['category'],
      take: 5,
    });

    // 4. Tìm kiếm file thiết kế
    const files = await fileRepository.find({
      where: [
        { originalName: Like(likeQuery) },
        { fileName: Like(likeQuery) }
      ],
      take: 5,
    });

    // Định dạng dữ liệu khớp với định dạng frontend mong muốn
    const formattedCosts = costs.map(item => ({
      id: item.id,
      type: 'cost',
      title: item.description,
      description: `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)} - Ngày: ${new Date(item.date).toLocaleDateString('vi-VN')}`,
      category: item.category?.name || 'Không xác định',
      href: '/costs',
    }));

    const formattedCategories = categories.map(item => ({
      id: item.id,
      type: 'category',
      title: item.name,
      description: `Dự toán: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total || 0)} ${item.note ? `- Ghi chú: ${item.note}` : ''}`,
      href: '/categories',
    }));

    const formattedAdvances = advances.map(item => ({
      id: item.id,
      type: 'advance',
      title: item.ticketName,
      description: `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)} - Đợt: ${item.phase}`,
      href: '/advance',
    }));

    const formattedFiles = files.map(item => {
      const sizeKB = item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : 'Không rõ dung lượng';
      return {
        id: item.id,
        type: 'file',
        title: item.originalName || item.fileName,
        description: `Dung lượng: ${sizeKB} - Tải lên: ${new Date(item.uploadedAt).toLocaleDateString('vi-VN')}`,
        href: '/files',
      };
    });

    return {
      costs: formattedCosts,
      categories: formattedCategories,
      advancePayments: formattedAdvances,
      files: formattedFiles,
    };
  }
};
