import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

// Viewer có thể xem
router.get('/category/:categoryId', NoteController.findAllByCategory);
router.get('/:id', NoteController.findById);

// Chỉ super admin mới có quyền tạo/sửa/xóa
router.post('/', requireSuperAdmin, NoteController.create);
router.put('/:id', requireSuperAdmin, NoteController.update);
router.delete('/:id', requireSuperAdmin, NoteController.delete);

export default router;

