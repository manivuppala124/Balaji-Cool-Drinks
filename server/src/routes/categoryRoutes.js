import { Router } from 'express';
import * as category from '../controllers/categoryController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', category.getCategories);
router.get('/:slug', optionalAuth, category.getCategoryBySlug);
router.post('/', requireAuth, requireAdmin, category.createCategory);
router.put('/reorder', requireAuth, requireAdmin, category.reorderCategories);
router.put('/:id', requireAuth, requireAdmin, category.updateCategory);
router.delete('/:id', requireAuth, requireAdmin, category.deleteCategory);

export default router;
