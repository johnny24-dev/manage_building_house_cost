import { Router } from 'express';
import { CapitalAllocationController } from '../controllers/capitalAllocation.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Viewer có thể xem
router.get('/', CapitalAllocationController.findOne);

// Chỉ super admin mới có quyền tạo/sửa
router.post('/', requireSuperAdmin, CapitalAllocationController.upsert);
router.put('/', requireSuperAdmin, CapitalAllocationController.update);

export default router;

