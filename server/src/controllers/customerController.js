import User from '../models/User.js';
import Order from '../models/Order.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { createAuditLog } from '../services/auditService.js';
import { escapeRegex } from '../utils/helpers.js';

export const getCustomers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const filter = { role: 'customer' };

  if (req.query.type === 'WHOLESALE') {
    filter.$or = [{ customerType: 'WHOLESALE' }, { wholesaleCustomer: true }];
  }
  if (req.query.type === 'RETAIL') filter.customerType = 'RETAIL';
  if (req.query.blocked === 'true') filter.isBlocked = true;
  if (req.query.blocked === 'false') filter.isBlocked = false;
  if (req.query.search) {
    const s = escapeRegex(req.query.search);
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { fullName: new RegExp(s, 'i') },
          { mobile: new RegExp(s, 'i') },
          { email: new RegExp(s, 'i') },
        ],
      },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  const customerIds = users.map((u) => u._id);
  const stats = await Order.aggregate([
    { $match: { customerId: { $in: customerIds }, orderStatus: { $ne: 'CANCELLED' } } },
    {
      $group: {
        _id: '$customerId',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
  ]);
  const statsMap = Object.fromEntries(stats.map((s) => [String(s._id), s]));

  const items = users.map((u) => ({
    ...u.toObject(),
    orderCount: statsMap[String(u._id)]?.orderCount || 0,
    totalSpent: statsMap[String(u._id)]?.totalSpent || 0,
  }));

  success(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 } });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'customer') throw new AppError('Customer not found', 404);

  const orders = await Order.find({ customerId: user._id }).sort({ createdAt: -1 }).limit(50);
  const totals = await Order.aggregate([
    { $match: { customerId: user._id, orderStatus: { $ne: 'CANCELLED' } } },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
  ]);

  success(res, {
    customer: user,
    orders,
    stats: totals[0] || { orderCount: 0, totalSpent: 0 },
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'customer') throw new AppError('Customer not found', 404);

  const old = {
    customerType: user.customerType,
    isBlocked: user.isBlocked,
    wholesaleApproved: user.wholesaleApproved,
  };

  if (req.body.customerType) {
    user.customerType = req.body.customerType;
    user.wholesaleCustomer = req.body.customerType === 'WHOLESALE';
  }
  if (typeof req.body.wholesaleApproved === 'boolean') {
    user.wholesaleApproved = req.body.wholesaleApproved;
    if (req.body.wholesaleApproved) {
      user.customerType = 'WHOLESALE';
      user.wholesaleCustomer = true;
    }
  }
  if (typeof req.body.isBlocked === 'boolean') user.isBlocked = req.body.isBlocked;
  if (req.body.fullName) user.fullName = req.body.fullName;

  await user.save();

  await createAuditLog({
    adminId: req.user._id,
    action: 'UPDATE_CUSTOMER',
    entity: 'User',
    entityId: user._id,
    oldValue: old,
    newValue: {
      customerType: user.customerType,
      isBlocked: user.isBlocked,
      wholesaleApproved: user.wholesaleApproved,
    },
    ip: req.ip,
  });

  success(res, { customer: user }, 'Customer updated');
});
