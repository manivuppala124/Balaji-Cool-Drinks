import { Router } from 'express';
import * as order from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, order.createOrder);
router.get('/my-orders', requireAuth, order.getMyOrders);
router.get('/:id', requireAuth, order.getMyOrderById);

export default router;
