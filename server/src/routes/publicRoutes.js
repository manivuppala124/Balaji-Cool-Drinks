import { Router } from 'express';
import * as settings from '../controllers/settingsController.js';
import * as notification from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/settings', settings.getSettings);

router.get('/notifications', requireAuth, notification.getNotifications);
router.put('/notifications/read-all', requireAuth, notification.markAllRead);
router.put('/notifications/:id/read', requireAuth, notification.markRead);

export default router;
