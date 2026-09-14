import { Router } from 'express';
import * as product from '../controllers/productController.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, product.getProducts);
router.get('/search/suggestions', product.searchSuggestions);
router.get('/:id', optionalAuth, product.getProductByIdOrSlug);

router.post('/', requireAuth, requireAdmin, product.createProduct);
router.put('/:id', requireAuth, requireAdmin, product.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, product.deleteProduct);
router.post('/:id/duplicate', requireAuth, requireAdmin, product.duplicateProduct);
router.post('/bulk', requireAuth, requireAdmin, product.bulkUpdateProducts);
router.post('/:id/variants', requireAuth, requireAdmin, product.addVariant);
router.put('/:id/variants/:variantId', requireAuth, requireAdmin, product.updateVariant);
router.delete('/:id/variants/:variantId', requireAuth, requireAdmin, product.deleteVariant);

export default router;
