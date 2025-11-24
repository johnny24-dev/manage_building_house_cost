import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';
import { SuccessCode } from '../constants/statusCodes';

export class DashboardController {
  /**
   * Lấy tổng hợp thông tin dashboard
   */
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await dashboardService.getSummary();
      return sendSuccess(res, SuccessCode.SUCCESS, summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lấy báo cáo chi tiết
   */
  static async getReportSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await dashboardService.getReportSummary();
      return sendSuccess(res, SuccessCode.SUCCESS, report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Xuất báo cáo chi tiết (CSV)
   */
  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, content } = await dashboardService.generateReportCSV();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(content);
    } catch (error) {
      next(error);
    }
  }
}

