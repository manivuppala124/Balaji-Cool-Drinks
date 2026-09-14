import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { createAuditLog } from '../services/auditService.js';
import { notifyAdmins } from '../services/notificationService.js';

export const getInventory = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .select('name brand category images variants')
    .sort({ name: 1 });

  const rows = [];
  for (const p of products) {
    for (const v of p.variants) {
      if (!v.isActive) continue;
      let status = 'IN_STOCK';
      if (v.stockQuantity <= 0) status = 'OUT_OF_STOCK';
      else if (v.stockQuantity <= v.lowStockThreshold) status = 'LOW_STOCK';

      if (req.query.status && req.query.status !== status) continue;
      if (req.query.search) {
        const s = req.query.search.toLowerCase();
        const hay = `${p.name} ${v.name} ${v.sku} ${v.barcode}`.toLowerCase();
        if (!hay.includes(s)) continue;
      }

      rows.push({
        productId: p._id,
        productName: p.name,
        brand: p.brand,
        category: p.category,
        image: p.images?.[0] || '',
        variantId: v._id,
        variantName: v.name,
        sku: v.sku,
        barcode: v.barcode,
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        status,
        retailPrice: v.retailPrice,
        wholesalePrice: v.wholesalePrice,
        wholesalePackSize: v.wholesalePackSize,
        wholesaleCasePrice: v.wholesaleCasePrice,
      });
    }
  }

  success(res, { items: rows });
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const { productId, action, quantity, note = '' } = req.body;
  const { variantId } = req.params;

  if (!productId) throw new AppError('productId is required', 400);
  if (!['add', 'remove', 'set'].includes(action)) {
    throw new AppError('action must be add, remove, or set', 400);
  }
  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 0) throw new AppError('Invalid quantity', 400);

  const product = await Product.findById(productId);
  if (!product) throw new AppError('Product not found', 404);
  const variant = product.variants.id(variantId);
  if (!variant) throw new AppError('Variant not found', 404);

  const previousStock = variant.stockQuantity;
  let newStock = previousStock;
  if (action === 'add') newStock = previousStock + qty;
  if (action === 'remove') {
    if (qty > previousStock) throw new AppError('Cannot remove more than available stock', 400);
    newStock = previousStock - qty;
  }
  if (action === 'set') newStock = qty;

  variant.stockQuantity = newStock;
  await product.save();

  const delta = newStock - previousStock;
  const txn = await InventoryTransaction.create({
    productId: product._id,
    variantId: variant._id,
    type: 'MANUAL_ADJUSTMENT',
    quantity: delta,
    previousStock,
    newStock,
    referenceId: '',
    note,
    createdBy: req.user._id,
  });

  await createAuditLog({
    adminId: req.user._id,
    action: 'ADJUST_STOCK',
    entity: 'Inventory',
    entityId: variant._id,
    oldValue: { stock: previousStock },
    newValue: { stock: newStock, action },
    ip: req.ip,
  });

  if (newStock <= 0) {
    await notifyAdmins({
      title: 'Out of stock',
      message: `${product.name} · ${variant.name} is out of stock`,
      type: 'STOCK',
      link: '/admin/inventory',
    });
  } else if (newStock <= variant.lowStockThreshold) {
    await notifyAdmins({
      title: 'Low stock alert',
      message: `${product.name} · ${variant.name} is low (${newStock} left)`,
      type: 'STOCK',
      link: '/admin/inventory',
    });
  }

  success(res, { product, variant, transaction: txn }, 'Stock updated');
});

export const getInventoryHistory = asyncHandler(async (req, res) => {
  const { variantId } = req.params;
  const items = await InventoryTransaction.find({ variantId })
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 })
    .limit(100);
  success(res, { items });
});

export const bulkUpdateStock = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || !updates.length) {
    throw new AppError('updates array required', 400);
  }

  const results = [];
  for (const u of updates) {
    const product = await Product.findById(u.productId);
    if (!product) {
      results.push({ ...u, success: false, message: 'Product not found' });
      continue;
    }
    const variant = product.variants.id(u.variantId);
    if (!variant) {
      results.push({ ...u, success: false, message: 'Variant not found' });
      continue;
    }
    const previousStock = variant.stockQuantity;
    variant.stockQuantity = Number(u.stockQuantity);
    await product.save();
    await InventoryTransaction.create({
      productId: product._id,
      variantId: variant._id,
      type: 'MANUAL_ADJUSTMENT',
      quantity: variant.stockQuantity - previousStock,
      previousStock,
      newStock: variant.stockQuantity,
      note: 'Bulk stock update',
      createdBy: req.user._id,
    });
    results.push({ ...u, success: true });
  }

  success(res, { results }, 'Bulk stock update completed');
});
