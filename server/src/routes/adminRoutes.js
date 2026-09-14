import { Router } from 'express';
import * as inventory from '../controllers/inventoryController.js';
import * as customer from '../controllers/customerController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as report from '../controllers/reportController.js';
import * as settings from '../controllers/settingsController.js';
import * as notification from '../controllers/notificationController.js';
import * as search from '../controllers/searchController.js';
import * as csvImport from '../controllers/importController.js';
import * as order from '../controllers/orderController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard', dashboard.getDashboard);
router.get('/search', search.adminGlobalSearch);

router.get('/orders', order.getAdminOrders);
router.get('/orders/:id', order.getMyOrderById);
router.put('/orders/:id/status', order.updateOrderStatus);
router.put('/orders/:id/payment', order.updatePaymentStatus);
router.put('/orders/:id/notes', order.updateAdminNotes);

router.get('/inventory', inventory.getInventory);
router.post('/inventory/:variantId/adjust', inventory.adjustInventory);
router.get('/inventory/:variantId/history', inventory.getInventoryHistory);
router.post('/inventory/bulk', inventory.bulkUpdateStock);

router.get('/customers', customer.getCustomers);
router.get('/customers/:id', customer.getCustomerById);
router.put('/customers/:id', customer.updateCustomer);

router.get('/reports/sales', report.getSalesReport);
router.get('/reports/products', report.getProductSalesReport);
router.get('/reports/inventory', report.getInventoryReport);
router.get('/reports/export/orders', report.exportOrdersCsv);
router.get('/reports/export/products', report.exportProductsCsv);

router.get('/settings', settings.getSettings);
router.put('/settings', settings.updateSettings);
router.post('/upload-url', settings.uploadImageUrl);

router.get('/notifications', notification.getNotifications);
router.put('/notifications/:id/read', notification.markRead);
router.put('/notifications/read-all', notification.markAllRead);

router.post('/products/import', upload.single('file'), csvImport.importProductsCsv);

export default router;
