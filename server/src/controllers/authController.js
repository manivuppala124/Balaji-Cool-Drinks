import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { signToken, isValidIndianMobile } from '../utils/helpers.js';

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

export const register = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobile,
    email,
    password,
    confirmPassword,
    address,
    area,
    landmark,
    pincode,
  } = req.body;

  if (!fullName || !mobile || !password) {
    throw new AppError('Full name, mobile and password are required', 400);
  }
  if (!isValidIndianMobile(mobile)) {
    throw new AppError('Enter a valid 10-digit Indian mobile number', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }
  if (confirmPassword && password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const existing = await User.findOne({
    $or: [{ mobile }, ...(email ? [{ email: email.toLowerCase() }] : [])],
  });
  if (existing) {
    throw new AppError('An account with this mobile/email already exists', 409);
  }

  const hashed = await bcrypt.hash(password, 12);
  const addresses = [];
  if (address && pincode) {
    addresses.push({
      label: 'Home',
      fullName,
      mobile,
      addressLine: address,
      area: area || '',
      landmark: landmark || '',
      pincode,
      isDefault: true,
    });
  }

  const user = await User.create({
    fullName,
    mobile,
    email: email ? email.toLowerCase() : undefined,
    password: hashed,
    role: 'customer',
    addresses,
  });

  const token = signToken({ id: user._id, role: user.role });
  success(res, { user: sanitizeUser(user), token }, 'Registration successful', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, mobile, email, password } = req.body;
  const loginId = (identifier || mobile || email || '').trim();

  if (!loginId || !password) {
    throw new AppError('Mobile/email and password are required', 400);
  }

  const query = isValidIndianMobile(loginId)
    ? { mobile: loginId }
    : { email: loginId.toLowerCase() };

  const user = await User.findOne(query).select('+password');
  if (!user) throw new AppError('Invalid credentials', 401);
  if (user.isBlocked) throw new AppError('Your account has been blocked. Contact the store.', 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid credentials', 401);

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role });
  success(res, { user: sanitizeUser(user), token }, 'Login successful');
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { identifier, email, mobile, password } = req.body;
  const loginId = (identifier || email || mobile || '').trim();
  if (!loginId || !password) {
    throw new AppError('Email/mobile and password are required', 400);
  }

  const query = isValidIndianMobile(loginId)
    ? { mobile: loginId, role: 'admin' }
    : { email: loginId.toLowerCase(), role: 'admin' };

  const user = await User.findOne(query).select('+password');
  if (!user) throw new AppError('Invalid admin credentials', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid admin credentials', 401);

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role });
  success(res, { user: sanitizeUser(user), token }, 'Admin login successful');
});

export const logout = asyncHandler(async (_req, res) => {
  success(res, null, 'Logged out');
});

export const me = asyncHandler(async (req, res) => {
  success(res, { user: sanitizeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['fullName', 'email'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  if (req.body.email) req.user.email = req.body.email.toLowerCase();
  await req.user.save();
  success(res, { user: sanitizeUser(req.user) }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required', 400);
  }
  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters', 400);
  }
  if (confirmPassword && newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  const user = await User.findById(req.user._id).select('+password');
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError('Current password is incorrect', 400);

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  success(res, null, 'Password changed successfully');
});

export const addAddress = asyncHandler(async (req, res) => {
  const { fullName, mobile, addressLine, area, landmark, pincode, label, city, state, isDefault } =
    req.body;
  if (!fullName || !mobile || !addressLine || !pincode) {
    throw new AppError('Full name, mobile, address and pincode are required', 400);
  }
  if (!isValidIndianMobile(mobile)) {
    throw new AppError('Enter a valid Indian mobile number', 400);
  }

  if (isDefault || req.user.addresses.length === 0) {
    req.user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  req.user.addresses.push({
    label: label || 'Home',
    fullName,
    mobile,
    addressLine,
    area: area || '',
    landmark: landmark || '',
    pincode,
    city: city || '',
    state: state || '',
    isDefault: Boolean(isDefault) || req.user.addresses.length === 0,
  });
  await req.user.save();
  success(res, { addresses: req.user.addresses }, 'Address added', 201);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new AppError('Address not found', 404);

  Object.assign(address, req.body);
  if (req.body.isDefault) {
    req.user.addresses.forEach((a) => {
      a.isDefault = String(a._id) === String(address._id);
    });
  }
  await req.user.save();
  success(res, { addresses: req.user.addresses }, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new AppError('Address not found', 404);
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && req.user.addresses.length) {
    req.user.addresses[0].isDefault = true;
  }
  await req.user.save();
  success(res, { addresses: req.user.addresses }, 'Address deleted');
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw new AppError('Address not found', 404);
  req.user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(address._id);
  });
  await req.user.save();
  success(res, { addresses: req.user.addresses }, 'Default address updated');
});
