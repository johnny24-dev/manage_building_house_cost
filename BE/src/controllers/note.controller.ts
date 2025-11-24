import { Request, Response, NextFunction } from 'express';
import { noteService } from '../services/note.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';

export class NoteController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const note = await noteService.create(req.body);
      return sendSuccess(res, SuccessCode.CREATED, note);
    } catch (error) {
      next(error);
    }
  }

  static async findAllByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const notes = await noteService.findAllByCategoryId(categoryId);
      return sendSuccess(res, SuccessCode.SUCCESS, notes);
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const note = await noteService.findById(id);
      return sendSuccess(res, SuccessCode.SUCCESS, note);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const note = await noteService.update(id, req.body);
      return sendSuccess(res, SuccessCode.UPDATED, note);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await noteService.delete(id);
      return sendSuccess(res, SuccessCode.DELETED);
    } catch (error) {
      next(error);
    }
  }
}

