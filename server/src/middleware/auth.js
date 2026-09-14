import { verifyToken } from '../utils/helpers.js';
import User from '../models/User.js';
import AppError, { asyncHandler } from '../utils/AppError.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;

  if (!token) throw new AppError('Authentication required', 401);

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError('User not found', 401);
    if (user.isBlocked) throw new AppError('Account blocked', 403);
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      throw new AppError('Session expired. Please login again.', 401);
    }
    throw err;
  }
});

export const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }
  next();
};

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user && !user.isBlocked) req.user = user;
  } catch {
    // ignore invalid optional token
  }
  next();
});
