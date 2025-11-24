import { Request, Response, NextFunction } from 'express';
import { capitalAllocationService } from '../services/capitalAllocation.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';

export class CapitalAllocationController {
  static async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await capitalAllocationService.upsert(req.body);
      return sendSuccess(res, SuccessCode.CREATED, allocation);
    } catch (error) {
      next(error);
    }
  }

  static async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await capitalAllocationService.findOne();
      return sendSuccess(res, SuccessCode.SUCCESS, allocation);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await capitalAllocationService.update(req.body);
      return sendSuccess(res, SuccessCode.UPDATED, allocation);
    } catch (error) {
      next(error);
    }
  }
}

