import { AppDataSource } from '../config/database';
import { DesignFile } from '../entities/DesignFile.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import path from 'path';

const getDesignFileRepository = () => {
  return AppDataSource.getRepository(DesignFile);
};

export interface CreateDesignFileDto {
  fileName: string;
  originalName: string;
  filePath: string;
}

export const designFileService = {
  /**
   * Tạo design file mới từ file upload
   */
  async createFromUpload(
    file: Express.Multer.File
  ): Promise<DesignFile> {
    const repository = getDesignFileRepository();

    const designFile = repository.create({
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
    });

    return await repository.save(designFile);
  },

  /**
   * Tạo design file mới (legacy)
   */
  async create(data: CreateDesignFileDto): Promise<DesignFile> {
    const repository = getDesignFileRepository();
    const file = repository.create(data);
    return await repository.save(file);
  },

  /**
   * Lấy tất cả design files
   */
  async findAll(): Promise<DesignFile[]> {
    const repository = getDesignFileRepository();
    return await repository.find({
      order: { uploadedAt: 'DESC' },
    });
  },

  /**
   * Lấy design file theo ID
   */
  async findById(id: string): Promise<DesignFile> {
    const repository = getDesignFileRepository();
    const file = await repository.findOne({
      where: { id },
    });

    if (!file) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy file');
    }

    return file;
  },

  /**
   * Xóa design file
   */
  async delete(id: string): Promise<void> {
    const repository = getDesignFileRepository();
    const file = await this.findById(id);
    await repository.remove(file);
  },
};

