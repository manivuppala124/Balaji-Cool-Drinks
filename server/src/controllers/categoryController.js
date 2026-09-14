import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { createAuditLog } from '../services/auditService.js';
import slugify from 'slugify';

export const getCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.activeOnly !== 'false') filter.isActive = true;
  const categories = await Category.find(filter).sort({ order: 1, name: 1 });
  success(res, { categories });
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category || (!category.isActive && req.user?.role !== 'admin')) {
    throw new AppError('Category not found', 404);
  }
  success(res, { category });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description = '', image = '', order = 0, isActive = true } = req.body;
  if (!name) throw new AppError('Category name is required', 400);
  const category = await Category.create({ name, description, image, order, isActive });
  await createAuditLog({
    adminId: req.user._id,
    action: 'CREATE_CATEGORY',
    entity: 'Category',
    entityId: category._id,
    newValue: { name },
    ip: req.ip,
  });
  success(res, { category }, 'Category created', 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  ['name', 'description', 'image', 'order', 'isActive'].forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  if (req.body.name) category.slug = slugify(req.body.name, { lower: true, strict: true });
  await category.save();
  success(res, { category }, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const inUse = await Product.countDocuments({ category: category._id, isActive: true });
  if (inUse > 0) {
    category.isActive = false;
    await category.save();
    return success(res, { category }, 'Category deactivated (has products)');
  }
  await category.deleteOne();
  success(res, null, 'Category deleted');
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) throw new AppError('orderedIds array required', 400);
  await Promise.all(
    orderedIds.map((id, index) => Category.findByIdAndUpdate(id, { order: index }))
  );
  const categories = await Category.find().sort({ order: 1 });
  success(res, { categories }, 'Categories reordered');
});
