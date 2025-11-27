import { Router } from 'express';
import { CostController } from '../controllers/cost.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';
import { billUpload } from '../middleware/billUpload.middleware';

const router = Router();
router.use(authenticate);

// Viewer có thể xem
router.get('/', CostController.findAll);
router.get('/:id', CostController.findById);

// Chỉ super admin mới có quyền tạo/sửa/xóa
router.post(
  '/',
  requireSuperAdmin,
  billUpload.single('billImage'),
  CostController.create
);
router.put(
  '/:id',
  requireSuperAdmin,
  billUpload.single('billImage'),
  CostController.update
);
router.delete('/:id', requireSuperAdmin, CostController.delete);

export default router;

