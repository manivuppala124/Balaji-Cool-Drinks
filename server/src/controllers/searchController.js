import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { asyncHandler, success } from '../utils/AppError.js';
import { escapeRegex } from '../utils/helpers.js';

export const adminGlobalSearch = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return success(res, { products: [], orders: [], customers: [] });
  const s = escapeRegex(q);

  const [products, orders, customers] = await Promise.all([
    Product.find({
      $or: [
        { name: new RegExp(s, 'i') },
        { brand: new RegExp(s, 'i') },
        { 'variants.sku': new RegExp(s, 'i') },
        { 'variants.barcode': new RegExp(s, 'i') },
      ],
    })
      .select('name brand slug images variants.name variants.stockQuantity')
      .limit(8),
    Order.find({
      $or: [{ orderNumber: new RegExp(s, 'i') }],
    })
      .populate('customerId', 'fullName mobile')
      .limit(8),
    User.find({
      role: 'customer',
      $or: [
        { fullName: new RegExp(s, 'i') },
        { mobile: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
      ],
    })
      .select('fullName mobile email customerType')
      .limit(8),
  ]);

  success(res, { products, orders, customers });
});
