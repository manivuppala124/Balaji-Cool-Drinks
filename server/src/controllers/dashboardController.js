import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { asyncHandler, success } from '../utils/AppError.js';

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const daysAgo = (n) => {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
};

export const getDashboard = asyncHandler(async (_req, res) => {
  const today = startOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nonCancelled = { orderStatus: { $ne: 'CANCELLED' } };

  const [
    todaySalesAgg,
    todayOrders,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    totalCustomers,
    wholesaleCustomers,
    products,
    last7,
    last30,
    topProducts,
    topCategories,
    retailVsWholesale,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow }, ...nonCancelled } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    Order.countDocuments({ orderStatus: 'PENDING' }),
    Order.countDocuments({ orderStatus: 'DELIVERED' }),
    Order.countDocuments({ orderStatus: 'CANCELLED' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({
      role: 'customer',
      $or: [{ customerType: 'WHOLESALE' }, { wholesaleCustomer: true }],
    }),
    Product.find({ isActive: true }).select('name variants'),
    Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo(6) }, ...nonCancelled } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: daysAgo(29) }, ...nonCancelled } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: nonCancelled },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      { $match: nonCancelled },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.name',
          revenue: { $sum: '$items.subtotal' },
          qty: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      { $match: nonCancelled },
      {
        $group: {
          _id: '$orderType',
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  let lowStock = 0;
  let outOfStock = 0;
  const lowStockItems = [];
  const outOfStockItems = [];

  for (const p of products) {
    for (const v of p.variants) {
      if (!v.isActive) continue;
      if (v.stockQuantity <= 0) {
        outOfStock += 1;
        outOfStockItems.push({ product: p.name, variant: v.name, stock: 0 });
      } else if (v.stockQuantity <= v.lowStockThreshold) {
        lowStock += 1;
        lowStockItems.push({
          product: p.name,
          variant: v.name,
          stock: v.stockQuantity,
          threshold: v.lowStockThreshold,
        });
      }
    }
  }

  const recentOrders = await Order.find()
    .populate('customerId', 'fullName mobile')
    .sort({ createdAt: -1 })
    .limit(8);

  success(res, {
    cards: {
      todaySales: todaySalesAgg[0]?.total || 0,
      todayOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalCustomers,
      wholesaleCustomers,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
    },
    charts: {
      sales7Days: last7,
      sales30Days: last30,
      topProducts,
      topCategories,
      retailVsWholesale,
    },
    recentOrders,
    lowStockList: lowStockItems.slice(0, 10),
    outOfStockList: outOfStockItems.slice(0, 10),
  });
});
