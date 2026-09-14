import Notification from '../models/Notification.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = { userId: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  success(res, {
    items,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!n) throw new AppError('Notification not found', 404);
  n.isRead = true;
  await n.save();
  success(res, { notification: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  success(res, null, 'All notifications marked as read');
});
