import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';

export class SearchController {
  /**
   * Tìm kiếm tất cả
   */
  static async searchAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string || '';
      const results = await searchService.searchAll(query);
      return sendSuccess(res, SuccessCode.SUCCESS, results);
    } catch (error) {
      next(error);
    }
  }
}
