import { Router } from 'express';
import { authenticate, authenticateOptional } from '../middleware/auth.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

router.get('/', authenticate, NotificationController.list);
router.post('/read', authenticate, NotificationController.markRead);
router.post('/read/all', authenticate, NotificationController.markAllRead);
router.get('/stream', authenticateOptional, NotificationController.stream);

export default router;

