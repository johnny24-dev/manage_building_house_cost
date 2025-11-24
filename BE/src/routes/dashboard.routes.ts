import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Lấy tổng hợp thông tin dashboard
 * @access  Private (Viewer và Super Admin đều có thể xem)
 */
router.get('/summary', DashboardController.getSummary);

/**
 * @route   GET /api/dashboard/report
 * @desc    Lấy báo cáo chi tiết
 * @access  Private (Viewer và Super Admin đều có thể xem)
 */
router.get('/report', DashboardController.getReportSummary);

/**
 * @route   GET /api/dashboard/report/export
 * @desc    Xuất báo cáo chi tiết (CSV)
 * @access  Private (Viewer và Super Admin đều có thể xem)
 */
router.get('/report/export', DashboardController.exportReport);

export default router;

