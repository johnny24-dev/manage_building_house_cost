import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Áp dụng middleware xác thực cho tất cả các truy vấn tìm kiếm
router.use(authenticate);

/**
 * @route   GET /api/search
 * @desc    Tìm kiếm chi phí, hạng mục, tạm ứng và file thiết kế
 * @access  Private
 */
router.get('/', SearchController.searchAll);

export default router;
