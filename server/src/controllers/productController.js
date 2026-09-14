import Product from '../models/Product.js';
import Category from '../models/Category.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { escapeRegex } from '../utils/helpers.js';
import { createAuditLog } from '../services/auditService.js';
import slugify from 'slugify';

const buildProductFilter = (query) => {
  const filter = {};
  if (query.activeOnly !== 'false') filter.isActive = true;

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = new RegExp(`^${escapeRegex(query.brand)}$`, 'i');
  if (query.featured === 'true') filter.isFeatured = true;
  if (query.tag) filter.tags = query.tag;

  if (query.search) {
    const s = escapeRegex(query.search.trim());
    filter.$or = [
      { name: new RegExp(s, 'i') },
      { brand: new RegExp(s, 'i') },
      { tags: new RegExp(s, 'i') },
      { 'variants.name': new RegExp(s, 'i') },
      { 'variants.sku': new RegExp(s, 'i') },
      { 'variants.barcode': new RegExp(s, 'i') },
    ];
  }

  if (query.barcode) {
    filter['variants.barcode'] = query.barcode;
  }

  if (query.minPrice || query.maxPrice) {
    filter.variants = {
      $elemMatch: {
        isActive: true,
        retailPrice: {
          ...(query.minPrice ? { $gte: Number(query.minPrice) } : {}),
          ...(query.maxPrice ? { $lte: Number(query.maxPrice) } : {}),
        },
      },
    };
  }

  if (query.availability === 'in_stock') {
    filter.variants = {
      ...(filter.variants || {}),
      $elemMatch: {
        ...((filter.variants && filter.variants.$elemMatch) || {}),
        stockQuantity: { $gt: 0 },
        isActive: true,
      },
    };
  }

  return filter;
};

const sortMap = {
  newest: { createdAt: -1 },
  popular: { salesCount: -1, createdAt: -1 },
  name: { name: 1 },
  price_asc: { 'variants.retailPrice': 1 },
  price_desc: { 'variants.retailPrice': -1 },
};

export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const filter = buildProductFilter(req.query);

  if (req.query.categorySlug) {
    const cat = await Category.findOne({ slug: req.query.categorySlug, isActive: true });
    if (cat) filter.category = cat._id;
    else filter.category = null;
  }

  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  success(res, {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

export const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  const product = await Product.findOne(
    isObjectId ? { $or: [{ _id: id }, { slug: id }] } : { slug: id }
  ).populate('category', 'name slug');

  if (!product || (!product.isActive && req.user?.role !== 'admin')) {
    throw new AppError('Product not found', 404);
  }
  success(res, { product });
});

export const searchSuggestions = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return success(res, { suggestions: [] });

  const s = escapeRegex(q);
  const products = await Product.find({
    isActive: true,
    $or: [
      { name: new RegExp(s, 'i') },
      { brand: new RegExp(s, 'i') },
      { 'variants.name': new RegExp(s, 'i') },
      { 'variants.sku': new RegExp(s, 'i') },
      { 'variants.barcode': new RegExp(`^${s}$`, 'i') },
    ],
  })
    .select('name brand slug images variants.name variants.retailPrice')
    .limit(8);

  success(res, {
    suggestions: products.map((p) => ({
      id: p._id,
      name: p.name,
      brand: p.brand,
      slug: p.slug,
      image: p.images?.[0] || '',
      minPrice: Math.min(
        ...p.variants.filter((v) => v.isActive && v.retailPrice != null).map((v) => v.retailPrice),
        Infinity
      ),
    })),
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (!data.name || !data.category) {
    throw new AppError('Product name and category are required', 400);
  }
  if (data.slug) data.slug = slugify(data.slug, { lower: true, strict: true });

  const product = await Product.create(data);
  await createAuditLog({
    adminId: req.user._id,
    action: 'CREATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    newValue: { name: product.name },
    ip: req.ip,
  });
  success(res, { product }, 'Product created', 201);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  const old = { name: product.name, isActive: product.isActive };
  const fields = [
    'name',
    'brand',
    'category',
    'description',
    'images',
    'tags',
    'isActive',
    'isFeatured',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) product[f] = req.body[f];
  });
  if (req.body.name) {
    product.slug = slugify(req.body.name, { lower: true, strict: true });
  }

  await product.save();
  await createAuditLog({
    adminId: req.user._id,
    action: 'UPDATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    oldValue: old,
    newValue: { name: product.name, isActive: product.isActive },
    ip: req.ip,
  });
  success(res, { product }, 'Product updated');
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  product.isActive = false;
  await product.save();
  await createAuditLog({
    adminId: req.user._id,
    action: 'DEACTIVATE_PRODUCT',
    entity: 'Product',
    entityId: product._id,
    ip: req.ip,
  });
  success(res, { product }, 'Product deactivated');
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const source = await Product.findById(req.params.id);
  if (!source) throw new AppError('Product not found', 404);

  const copy = source.toObject();
  delete copy._id;
  delete copy.createdAt;
  delete copy.updatedAt;
  copy.name = `${copy.name} (Copy)`;
  copy.slug = undefined;
  copy.salesCount = 0;
  copy.variants = (copy.variants || []).map((v) => {
    const nv = { ...v };
    delete nv._id;
    nv.sku = nv.sku ? `${nv.sku}-COPY` : '';
    nv.barcode = '';
    return nv;
  });

  const product = await Product.create(copy);
  success(res, { product }, 'Product duplicated', 201);
});

export const addVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  if (!req.body.name) throw new AppError('Variant name is required', 400);
  product.variants.push(req.body);
  await product.save();
  success(res, { product }, 'Variant added', 201);
});

export const updateVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const variant = product.variants.id(req.params.variantId);
  if (!variant) throw new AppError('Variant not found', 404);

  const oldPrice = {
    retailPrice: variant.retailPrice,
    wholesalePrice: variant.wholesalePrice,
    wholesaleCasePrice: variant.wholesaleCasePrice,
    wholesalePackSize: variant.wholesalePackSize,
  };

  Object.keys(req.body).forEach((key) => {
    if (key !== '_id') variant[key] = req.body[key];
  });
  await product.save();

  await createAuditLog({
    adminId: req.user._id,
    action: 'UPDATE_VARIANT',
    entity: 'ProductVariant',
    entityId: variant._id,
    oldValue: oldPrice,
    newValue: {
      retailPrice: variant.retailPrice,
      wholesalePrice: variant.wholesalePrice,
      wholesaleCasePrice: variant.wholesaleCasePrice,
      wholesalePackSize: variant.wholesalePackSize,
    },
    ip: req.ip,
  });

  success(res, { product }, 'Variant updated');
});

export const deleteVariant = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const variant = product.variants.id(req.params.variantId);
  if (!variant) throw new AppError('Variant not found', 404);
  variant.isActive = false;
  await product.save();
  success(res, { product }, 'Variant deactivated');
});

export const bulkUpdateProducts = asyncHandler(async (req, res) => {
  const { ids, action, categoryId, isActive } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    throw new AppError('Product ids are required', 400);
  }

  const update = {};
  if (action === 'activate') update.isActive = true;
  if (action === 'deactivate') update.isActive = false;
  if (action === 'setCategory' && categoryId) update.category = categoryId;
  if (typeof isActive === 'boolean') update.isActive = isActive;

  const result = await Product.updateMany({ _id: { $in: ids } }, { $set: update });
  success(res, { modified: result.modifiedCount }, 'Bulk update completed');
});
