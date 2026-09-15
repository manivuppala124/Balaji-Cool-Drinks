import Order from '../models/Order.js';
import Product from '../models/Product.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';

const resolveRange = (query) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  let from = start;
  let to = new Date(now);

  switch (query.range) {
    case 'today':
      break;
    case 'yesterday': {
      from = new Date(start);
      from.setDate(from.getDate() - 1);
      to = new Date(start);
      to.setMilliseconds(-1);
      break;
    }
    case 'last7':
      from.setDate(from.getDate() - 6);
      break;
    case 'last30':
      from.setDate(from.getDate() - 29);
      break;
    case 'thisMonth':
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth': {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    }
    case 'year':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (!query.from || !query.to) throw new AppError('from and to required for custom range', 400);
      from = new Date(query.from);
      to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      break;
    default:
      from.setDate(from.getDate() - 29);
  }

  return { from, to };
};

export const getSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveRange(req.query);
  const match = {
    createdAt: { $gte: from, $lte: to },
    orderStatus: { $ne: 'CANCELLED' },
  };

  const [summary, byDay, byPayment, byType, byStatus] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grossSales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
          deliveryFees: { $sum: '$deliveryCharge' },
          discounts: { $sum: '$discount' },
        },
      },
    ]),
    Order.aggregate([
      { $match: match },
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
      { $match: match },
      {
        $group: {
          _id: '$paymentMethod',
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$orderType',
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
  ]);

  const s = summary[0] || {
    grossSales: 0,
    orders: 0,
    avgOrderValue: 0,
    deliveryFees: 0,
    discounts: 0,
  };

  success(res, {
    range: { from, to },
    summary: {
      ...s,
      netSales: s.grossSales - (s.discounts || 0),
      cashOrders: byPayment.find((p) => p._id === 'CASH')?.orders || 0,
      upiOrders: byPayment.find((p) => p._id === 'UPI')?.orders || 0,
      retailRevenue: byType.find((t) => t._id === 'RETAIL')?.sales || 0,
      wholesaleRevenue: byType.find((t) => t._id === 'WHOLESALE')?.sales || 0,
    },
    byDay,
    byPayment,
    byType,
    byStatus,
  });
});

export const getProductSalesReport = asyncHandler(async (req, res) => {
  const { from, to } = resolveRange(req.query);
  const items = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: from, $lte: to },
        orderStatus: { $ne: 'CANCELLED' },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: {
          productName: '$items.productName',
          variantName: '$items.variantName',
        },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
      },
    },
    { $sort: { revenue: -1 } },
  ]);
  success(res, { range: { from, to }, items });
});

export const getInventoryReport = asyncHandler(async (_req, res) => {
  const products = await Product.find({ isActive: true })
    .populate('category', 'name')
    .select('name brand category variants');

  const items = [];
  for (const p of products) {
    for (const v of p.variants.filter((x) => x.isActive)) {
      let status = 'IN_STOCK';
      if (v.stockQuantity <= 0) status = 'OUT_OF_STOCK';
      else if (v.stockQuantity <= v.lowStockThreshold) status = 'LOW_STOCK';
      items.push({
        product: p.name,
        brand: p.brand,
        category: p.category?.name,
        variant: v.name,
        sku: v.sku,
        stock: v.stockQuantity,
        threshold: v.lowStockThreshold,
        status,
        retailPrice: v.retailPrice,
        wholesalePrice: v.wholesalePrice,
        stockValue: (v.retailPrice || 0) * v.stockQuantity,
      });
    }
  }

  success(res, { items });
});

export const exportOrdersCsv = asyncHandler(async (req, res) => {
  const { from, to } = resolveRange(req.query);
  const orders = await Order.find({
    createdAt: { $gte: from, $lte: to },
  })
    .populate('customerId', 'fullName mobile')
    .sort({ createdAt: -1 });

  const header = [
    'Order Number',
    'Date',
    'Source',
    'Customer',
    'Mobile',
    'Type',
    'Payment Method',
    'Payment Breakdown',
    'Payment Status',
    'Order Status',
    'Subtotal',
    'Delivery',
    'Total',
  ];
  const rows = orders.map((o) =>
    [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.orderSource || 'ONLINE',
      o.orderSource === 'IN_STORE' ? (o.inStoreCustomer?.fullName || 'Walk-in') : (o.customerId?.fullName || ''),
      o.orderSource === 'IN_STORE' ? (o.inStoreCustomer?.mobile || '') : (o.customerId?.mobile || ''),
      o.orderType,
      o.paymentMethod,
      o.paymentSplit?.length ? o.paymentSplit.map((s) => `${s.method}: ₹${s.amount}`).join('; ') : o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.subtotal,
      o.deliveryCharge,
      o.totalAmount,
    ]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(',')
  );

  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.send(csv);
});

export const exportProductsCsv = asyncHandler(async (_req, res) => {
  const products = await Product.find().populate('category', 'name');
  const header = [
    'Product Name',
    'Brand',
    'Category',
    'Variant',
    'Size',
    'Unit',
    'MRP',
    'Retail Price',
    'Wholesale Price',
    'Wholesale Pack Size',
    'Wholesale Pack Unit',
    'Wholesale Case Price',
    'Minimum Wholesale Quantity',
    'Stock',
    'Low Stock Threshold',
    'SKU',
    'Barcode',
  ];
  const rows = [];
  for (const p of products) {
    for (const v of p.variants) {
      rows.push(
        [
          p.name,
          p.brand,
          p.category?.name || '',
          v.name,
          v.volume ?? '',
          v.unit,
          v.mrp ?? '',
          v.retailPrice ?? '',
          v.wholesalePrice ?? '',
          v.wholesalePackSize ?? '',
          v.wholesalePackUnit || '',
          v.wholesaleCasePrice ?? '',
          v.minWholesaleQty ?? '',
          v.stockQuantity,
          v.lowStockThreshold,
          v.sku,
          v.barcode,
        ]
          .map((x) => `"${String(x).replaceAll('"', '""')}"`)
          .join(',')
      );
    }
  }
  const csv = [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.send(csv);
});
