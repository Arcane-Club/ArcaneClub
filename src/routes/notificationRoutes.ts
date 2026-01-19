import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { getNotifications, markRead } from '../controllers/notificationController';

const router = Router();

router.use(authMiddleware);
router.get('/', getNotifications);
router.put('/:id/read', markRead);

export default router;
