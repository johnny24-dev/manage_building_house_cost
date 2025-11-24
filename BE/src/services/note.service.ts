import { AppDataSource } from '../config/database';
import { Note } from '../entities/Note.entity';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../constants/statusCodes';
import { costCategoryService } from './costCategory.service';

const getNoteRepository = () => {
  return AppDataSource.getRepository(Note);
};

export interface CreateNoteDto {
  content: string;
  categoryId: string;
}

export interface UpdateNoteDto {
  content?: string;
}

export const noteService = {
  /**
   * Tạo note mới
   */
  async create(data: CreateNoteDto): Promise<Note> {
    const repository = getNoteRepository();

    // Kiểm tra category tồn tại
    await costCategoryService.findById(data.categoryId);

    const note = repository.create(data);
    return await repository.save(note);
  },

  /**
   * Lấy tất cả notes của category
   */
  async findAllByCategoryId(categoryId: string): Promise<Note[]> {
    // Kiểm tra category tồn tại
    await costCategoryService.findById(categoryId);

    const repository = getNoteRepository();
    return await repository.find({
      where: { categoryId },
      order: { createdAt: 'DESC' },
    });
  },

  /**
   * Lấy note theo ID
   */
  async findById(id: string): Promise<Note> {
    const repository = getNoteRepository();
    const note = await repository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!note) {
      throw new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Không tìm thấy ghi chú');
    }

    return note;
  },

  /**
   * Cập nhật note
   */
  async update(id: string, data: UpdateNoteDto): Promise<Note> {
    const repository = getNoteRepository();
    const note = await this.findById(id);

    Object.assign(note, data);
    return await repository.save(note);
  },

  /**
   * Xóa note
   */
  async delete(id: string): Promise<void> {
    const repository = getNoteRepository();
    const note = await this.findById(id);
    await repository.remove(note);
  },
};

