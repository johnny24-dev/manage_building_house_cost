import { Router } from 'express';
import { CostCategoryController } from '../controllers/costCategory.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Viewer có thể xem
router.get('/', CostCategoryController.findAll);
router.get('/:id', CostCategoryController.findById);

// Chỉ super admin mới có quyền tạo/sửa/xóa
router.post('/', requireSuperAdmin, CostCategoryController.create);
router.put('/:id', requireSuperAdmin, CostCategoryController.update);
router.delete('/:id', requireSuperAdmin, CostCategoryController.delete);

export default router;

