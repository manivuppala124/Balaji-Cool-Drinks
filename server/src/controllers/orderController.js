import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { getNextSequence } from '../models/Counter.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { ORDER_STATUS_FLOW } from '../config/constants.js';
import { getShopSettings, calcDeliveryCharge } from '../services/settingsService.js';
import { notifyAdmins, notifyUser } from '../services/notificationService.js';
import { createAuditLog } from '../services/auditService.js';
import { runWithOptionalTransaction } from '../utils/helpers.js';

const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`order-${year}`);
  return `SB-${year}-${String(seq).padStart(6, '0')}`;
};

export const resolveItemPricing = (
  product,
  variant,
  user,
  orderType,
  sellingUnit,
  quantityOrCases,
  settings
) => {
  if (!product.isActive) throw new AppError(`${product.name} is unavailable`, 400);
  if (!variant.isActive || !variant.isAvailable) {
    throw new AppError(`${product.name} (${variant.name}) is unavailable`, 400);
  }

  if (orderType === 'WHOLESALE') {
    if (settings?.requireWholesaleApproval) {
      const eligible =
        user?.wholesaleCustomer ||
        user?.customerType === 'WHOLESALE' ||
        user?.wholesaleApproved;
      if (!eligible) {
        throw new AppError('Wholesale ordering requires an approved wholesale account', 403);
      }
    }

    const packSize = variant.wholesalePackSize || 1;
    if (sellingUnit === 'CASE') {
      const casePrice =
        variant.wholesaleCasePrice != null
          ? variant.wholesaleCasePrice
          : variant.wholesalePrice != null
            ? Number((variant.wholesalePrice * packSize).toFixed(2))
            : variant.retailPrice != null
              ? Number((variant.retailPrice * packSize * 0.9).toFixed(2))
              : null;

      if (casePrice == null) {
        throw new AppError(`Wholesale case pricing not available for ${product.name} ${variant.name}`, 400);
      }
      const cases = Math.max(1, Number(quantityOrCases) || 1);
      if (variant.minWholesaleQty && cases < variant.minWholesaleQty) {
        throw new AppError(
          `Minimum wholesale order for ${product.name} ${variant.name} is ${variant.minWholesaleQty} case(s)`,
          400
        );
      }
      const pieceQty = cases * packSize;
      return {
        quantity: pieceQty,
        casesOrdered: cases,
        unitPrice: Number((casePrice / packSize).toFixed(2)),
        lineTotal: Number((casePrice * cases).toFixed(2)),
        packSize,
        packUnit: variant.wholesalePackUnit || 'pieces',
        sellingUnit: 'CASE',
      };
    }

    // piece-based wholesale
    const piecePrice =
      variant.wholesalePrice != null
        ? variant.wholesalePrice
        : variant.wholesaleCasePrice != null && packSize
          ? Number((variant.wholesaleCasePrice / packSize).toFixed(2))
          : variant.retailPrice != null
            ? Number((variant.retailPrice * 0.95).toFixed(2))
            : null;

    if (piecePrice == null) {
      throw new AppError(`Wholesale price not available for ${product.name} ${variant.name}`, 400);
    }
    const qty = Number(quantityOrCases);
    if (!qty || qty < 1) throw new AppError('Invalid quantity', 400);
    return {
      quantity: qty,
      casesOrdered: 0,
      unitPrice: piecePrice,
      lineTotal: Number((piecePrice * qty).toFixed(2)),
      packSize: packSize || null,
      packUnit: variant.wholesalePackUnit || '',
      sellingUnit: 'PIECE',
    };
  }

  // RETAIL
  if (variant.retailPrice == null) {
    throw new AppError(`Retail price not set for ${product.name} ${variant.name}`, 400);
  }
  const qty = Number(quantityOrCases);
  if (!qty || qty < 1) throw new AppError('Invalid quantity', 400);
  return {
    quantity: qty,
    casesOrdered: 0,
    unitPrice: variant.retailPrice,
    lineTotal: Number((variant.retailPrice * qty).toFixed(2)),
    packSize: null,
    packUnit: '',
    sellingUnit: 'PIECE',
  };
};

export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    paymentMethod,
    deliveryAddress,
    customerNotes = '',
    orderType = 'RETAIL',
    idempotencyKey,
  } = req.body;

  if (!Array.isArray(items) || !items.length) {
    throw new AppError('Cart is empty', 400);
  }
  if (!['CASH', 'UPI'].includes(paymentMethod)) {
    throw new AppError('Payment method must be CASH or UPI', 400);
  }
  if (!deliveryAddress?.addressLine || !deliveryAddress?.pincode || !deliveryAddress?.mobile) {
    throw new AppError('Complete delivery address is required', 400);
  }

  const settings = await getShopSettings();
  if (paymentMethod === 'CASH' && !settings.allowCashOrders) {
    throw new AppError('Cash orders are currently disabled', 400);
  }
  if (paymentMethod === 'UPI' && !settings.allowUpiOrders) {
    throw new AppError('UPI orders are currently disabled', 400);
  }
  if (orderType === 'WHOLESALE' && !settings.allowWholesaleOrders) {
    throw new AppError('Wholesale ordering is currently disabled', 400);
  }
  if (
    orderType === 'WHOLESALE' &&
    settings.requireWholesaleApproval &&
    !(req.user.wholesaleApproved || req.user.customerType === 'WHOLESALE')
  ) {
    throw new AppError('Wholesale account approval required', 403);
  }

  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey, customerId: req.user._id });
    if (existing) {
      return success(res, { order: existing }, 'Order already created');
    }
  }

  const order = await runWithOptionalTransaction(async (session) => {
    const orderItems = [];
    let subtotal = 0;
    const orderNumber = await generateOrderNumber();
    const productMap = new Map();

    for (const cartItem of items) {
      let product = productMap.get(String(cartItem.productId));
      if (!product) {
        product = session
          ? await Product.findById(cartItem.productId).session(session)
          : await Product.findById(cartItem.productId);
        if (!product) throw new AppError('Product not found', 404);
        productMap.set(String(cartItem.productId), product);
      }

      const variant = product.variants.id(cartItem.variantId);
      if (!variant) throw new AppError('Variant not found', 404);

      const itemOrderType =
        cartItem.orderMode ||
        (cartItem.sellingUnit === 'CASE' ? 'WHOLESALE' : orderType);

      const priced = resolveItemPricing(
        product,
        variant,
        req.user,
        itemOrderType,
        cartItem.sellingUnit || 'PIECE',
        cartItem.sellingUnit === 'CASE' ? cartItem.casesOrdered || cartItem.quantity : cartItem.quantity,
        settings
      );

      if (variant.stockQuantity < priced.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stockQuantity}`,
          400
        );
      }

      const previousStock = variant.stockQuantity;
      variant.stockQuantity -= priced.quantity;
      product.salesCount = (product.salesCount || 0) + priced.quantity;

      await InventoryTransaction.create(
        [
          {
            productId: product._id,
            variantId: variant._id,
            type: 'SALE',
            quantity: -priced.quantity,
            previousStock,
            newStock: variant.stockQuantity,
            referenceId: orderNumber,
            createdBy: req.user._id,
          },
        ],
        session ? { session } : {}
      );

      orderItems.push({
        productId: product._id,
        variantId: variant._id,
        productName: product.name,
        brand: product.brand,
        variantName: variant.name,
        sku: variant.sku || '',
        barcode: variant.barcode || '',
        image: product.images?.[0] || '',
        quantity: priced.quantity,
        unitPrice: priced.unitPrice,
        mrp: variant.mrp,
        subtotal: priced.lineTotal,
        orderMode: itemOrderType,
        sellingUnit: priced.sellingUnit,
        casesOrdered: priced.casesOrdered,
        packSize: priced.packSize,
        packUnit: priced.packUnit,
      });
      subtotal += priced.lineTotal;
    }

    // Save each affected product document only once to prevent write conflicts
    for (const prod of productMap.values()) {
      await prod.save(session ? { session } : {});
    }

    const discount = 0;
    const afterDiscount = subtotal - discount;
    if (settings.minimumOrderAmount > 0 && afterDiscount < settings.minimumOrderAmount) {
      throw new AppError(`Minimum order amount is ₹${settings.minimumOrderAmount}`, 400);
    }

    const deliveryCharge = calcDeliveryCharge(settings, afterDiscount);
    const totalAmount = Number((afterDiscount + deliveryCharge).toFixed(2));

    const finalOrderType = orderItems.some(
      (i) => i.orderMode === 'WHOLESALE' || i.sellingUnit === 'CASE'
    )
      ? 'WHOLESALE'
      : 'RETAIL';

    const [createdOrder] = await Order.create(
      [
        {
          orderNumber,
          customerId: req.user._id,
          items: orderItems,
          orderType: finalOrderType,
          subtotal,
          discount,
          deliveryCharge,
          totalAmount,
          paymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          deliveryAddress,
          customerNotes,
          idempotencyKey: idempotencyKey || undefined,
          statusHistory: [
            {
              status: 'PENDING',
              note: 'Order placed',
              changedBy: req.user._id,
              at: new Date(),
            },
          ],
        },
      ],
      session ? { session } : {}
    );

    return createdOrder;
  });

  await notifyAdmins({
    title: 'New order received',
    message: `Order ${order.orderNumber} · ₹${order.totalAmount} · ${order.orderType}`,
    type: order.orderType === 'WHOLESALE' ? 'WHOLESALE' : 'ORDER',
    link: `/admin/orders/${order._id}`,
    meta: { orderId: order._id, orderNumber: order.orderNumber },
  });

  await notifyUser({
    userId: req.user._id,
    title: 'Order placed',
    message: `Your order ${order.orderNumber} has been placed successfully.`,
    type: 'ORDER',
    link: `/orders/${order._id}`,
    meta: { orderId: order._id },
  });

  success(res, { order }, 'Order placed successfully', 201);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const filter = { customerId: req.user._id };
  if (req.query.status) filter.orderStatus = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);

  success(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const getMyOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (String(order.customerId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new AppError('Not authorized to view this order', 403);
  }
  success(res, { order });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = {};

  if (req.query.orderNumber) filter.orderNumber = new RegExp(req.query.orderNumber, 'i');
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.orderStatus) filter.orderStatus = req.query.orderStatus;
  if (req.query.orderType) filter.orderType = req.query.orderType;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    amount_high: { totalAmount: -1 },
    amount_low: { totalAmount: 1 },
  };
  const sort = sortOptions[req.query.sort] || sortOptions.newest;

  const [items, total] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'fullName mobile email customerType')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  success(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = '', cancellationReason = '' } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);

  const allowed = ORDER_STATUS_FLOW[order.orderStatus] || [];
  if (!allowed.includes(status)) {
    throw new AppError(
      `Cannot change status from ${order.orderStatus} to ${status}`,
      400
    );
  }

  const previous = order.orderStatus;
  order.orderStatus = status;
  if (status === 'CANCELLED') {
    order.cancellationReason = cancellationReason || note || 'Cancelled by admin';
  }
  order.statusHistory.push({
    status,
    note,
    changedBy: req.user._id,
    at: new Date(),
  });

  if (status === 'CANCELLED' && !['DELIVERED'].includes(previous)) {
    await runWithOptionalTransaction(async (session) => {
      const productMap = new Map();
      for (const item of order.items) {
        let product = productMap.get(String(item.productId));
        if (!product) {
          product = session
            ? await Product.findById(item.productId).session(session)
            : await Product.findById(item.productId);
          if (product) productMap.set(String(item.productId), product);
        }
        if (!product) continue;
        const variant = product.variants.id(item.variantId);
        if (!variant) continue;

        const previousStock = variant.stockQuantity;
        variant.stockQuantity += item.quantity;

        await InventoryTransaction.create(
          [
            {
              productId: product._id,
              variantId: variant._id,
              type: 'CANCELLED_ORDER',
              quantity: item.quantity,
              previousStock,
              newStock: variant.stockQuantity,
              referenceId: order.orderNumber,
              note: order.cancellationReason,
              createdBy: req.user._id,
            },
          ],
          session ? { session } : {}
        );
      }
      for (const prod of productMap.values()) {
        await prod.save(session ? { session } : {});
      }
      await order.save(session ? { session } : {});
    });
  } else {
    await order.save();
  }

  await createAuditLog({
    adminId: req.user._id,
    action: 'UPDATE_ORDER_STATUS',
    entity: 'Order',
    entityId: order._id,
    oldValue: { status: previous },
    newValue: { status },
    ip: req.ip,
  });

  const statusMessages = {
    CONFIRMED: 'Your order has been confirmed',
    PROCESSING: 'Your order is being processed',
    READY: 'Your order is ready',
    OUT_FOR_DELIVERY: 'Your order is out for delivery',
    DELIVERED: 'Your order has been delivered',
    CANCELLED: 'Your order has been cancelled',
  };

  await notifyUser({
    userId: order.customerId,
    title: `Order ${status.toLowerCase().replaceAll('_', ' ')}`,
    message: `${statusMessages[status] || 'Order updated'} · ${order.orderNumber}`,
    type: status === 'CANCELLED' ? 'CANCELLATION' : 'ORDER',
    link: `/orders/${order._id}`,
  });

  success(res, { order }, 'Order status updated');
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (!['PENDING', 'PAID', 'FAILED', 'NOT_APPLICABLE'].includes(paymentStatus)) {
    throw new AppError('Invalid payment status', 400);
  }

  const old = order.paymentStatus;
  order.paymentStatus = paymentStatus;
  await order.save();

  await createAuditLog({
    adminId: req.user._id,
    action: 'UPDATE_PAYMENT_STATUS',
    entity: 'Order',
    entityId: order._id,
    oldValue: { paymentStatus: old },
    newValue: { paymentStatus },
    ip: req.ip,
  });

  if (paymentStatus === 'PAID') {
    await notifyUser({
      userId: order.customerId,
      title: 'Payment received',
      message: `Payment for order ${order.orderNumber} marked as paid.`,
      type: 'PAYMENT',
      link: `/orders/${order._id}`,
    });
  }

  success(res, { order }, 'Payment status updated');
});

export const updateAdminNotes = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  order.adminNotes = req.body.adminNotes || '';
  await order.save();
  success(res, { order }, 'Admin notes updated');
});
// Order controller clean
