import { Router } from 'express';
import { AdvancePaymentController } from '../controllers/advancePayment.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';
import { billUpload } from '../middleware/billUpload.middleware';

const router = Router();
router.use(authenticate);

// Viewer có thể xem
router.get('/summary', AdvancePaymentController.getSummary); // Phải đặt trước /:id
router.get('/', AdvancePaymentController.findAll);
router.get('/:id', AdvancePaymentController.findById);

// Chỉ super admin mới có quyền tạo/sửa/xóa
router.post(
  '/',
  requireSuperAdmin,
  billUpload.single('billImage'),
  AdvancePaymentController.create
);
router.put(
  '/:id',
  requireSuperAdmin,
  billUpload.single('billImage'),
  AdvancePaymentController.update
);
router.delete('/:id', requireSuperAdmin, AdvancePaymentController.delete);

export default router;

