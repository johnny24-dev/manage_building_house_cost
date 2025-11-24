import { Router } from 'express';
import { DesignFileController } from '../controllers/designFile.controller';
import { authenticate, requireSuperAdmin, authenticateOptional } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public endpoint để xem file PDF (có thể có token trong query)
router.get('/file/:id', authenticateOptional, DesignFileController.streamFile);

// Các route khác cần authentication
router.use(authenticate);

// Viewer có thể xem
router.get('/', DesignFileController.findAll);
router.get('/:id', DesignFileController.findById);

// Chỉ super admin mới có quyền upload/xóa
router.post('/upload', requireSuperAdmin, upload.single('file'), DesignFileController.upload);
router.delete('/:id', requireSuperAdmin, DesignFileController.delete);

export default router;

