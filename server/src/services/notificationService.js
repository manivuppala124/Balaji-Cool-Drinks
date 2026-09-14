import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const notifyUser = async ({ userId, title, message, type = 'SYSTEM', link = '', meta = {} }) => {
  if (!userId) return null;
  return Notification.create({ userId, title, message, type, link, meta });
};

export const notifyAdmins = async ({ title, message, type = 'SYSTEM', link = '', meta = {} }) => {
  const admins = await User.find({ role: 'admin', isBlocked: false }).select('_id');
  if (!admins.length) return [];
  const docs = admins.map((a) => ({
    userId: a._id,
    title,
    message,
    type,
    link,
    meta,
  }));
  return Notification.insertMany(docs);
};
