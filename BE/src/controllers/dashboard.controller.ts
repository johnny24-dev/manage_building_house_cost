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
   * Xuất báo cáo chi tiết (Excel)
   */
  static async exportReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, buffer } = await dashboardService.generateReportExcel();
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

