import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/admin/login', auth.adminLogin);
router.post('/logout', auth.logout);
router.get('/me', requireAuth, auth.me);
router.put('/profile', requireAuth, auth.updateProfile);
router.put('/change-password', requireAuth, auth.changePassword);
router.post('/addresses', requireAuth, auth.addAddress);
router.put('/addresses/:addressId', requireAuth, auth.updateAddress);
router.delete('/addresses/:addressId', requireAuth, auth.deleteAddress);
router.put('/addresses/:addressId/default', requireAuth, auth.setDefaultAddress);

export default router;
