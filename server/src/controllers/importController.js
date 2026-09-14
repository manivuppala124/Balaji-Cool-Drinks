import { parse } from 'csv-parse/sync';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';

const num = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const importProductsCsv = asyncHandler(async (req, res) => {
  if (!req.file?.buffer && !req.body.csv) {
    throw new AppError('CSV file or csv text is required', 400);
  }

  const text = req.file?.buffer
    ? req.file.buffer.toString('utf8')
    : req.body.csv;

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (req.query.preview === 'true') {
    return success(res, { preview: records.slice(0, 50), totalRows: records.length });
  }

  const results = { success: [], failed: [] };
  const productCache = new Map();

  for (let i = 0; i < records.length; i += 1) {
    const row = records[i];
    const rowNum = i + 2;
    try {
      const name = row['Product Name'] || row.productName || row.name;
      const variantName = row.Variant || row.variant || row['Variant Name'];
      if (!name || !variantName) {
        throw new Error('Product Name and Variant are required');
      }

      const categoryName = row.Category || row.category || 'Other';
      let category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
      if (!category) {
        category = await Category.create({ name: categoryName, order: 99 });
      }

      const cacheKey = name.toLowerCase();
      let product = productCache.get(cacheKey) || (await Product.findOne({ name }));
      if (!product) {
        product = await Product.create({
          name,
          brand: row.Brand || row.brand || '',
          category: category._id,
          description: '',
          variants: [],
          tags: [],
        });
      }

      const variant = {
        name: variantName,
        volume: num(row.Size || row.volume),
        unit: row.Unit || row.unit || '',
        mrp: num(row.MRP || row.mrp),
        retailPrice: num(row['Retail Price'] || row.retailPrice),
        wholesalePrice: num(row['Wholesale Price'] || row.wholesalePrice),
        wholesalePackSize: num(row['Wholesale Pack Size'] || row.wholesalePackSize),
        wholesalePackUnit: row['Wholesale Pack Unit'] || row.wholesalePackUnit || 'pieces',
        wholesaleCasePrice: num(row['Wholesale Case Price'] || row.wholesaleCasePrice),
        minWholesaleQty: num(row['Minimum Wholesale Quantity'] || row.minWholesaleQty) || 1,
        stockQuantity: num(row.Stock || row.stock) || 0,
        lowStockThreshold: num(row['Low Stock Threshold'] || row.lowStockThreshold) || 10,
        sku: row.SKU || row.sku || '',
        barcode: row.Barcode || row.barcode || '',
        isActive: true,
        isAvailable: true,
      };

      const existingIdx = product.variants.findIndex(
        (v) => v.name.toLowerCase() === variantName.toLowerCase()
      );
      if (existingIdx >= 0) {
        Object.assign(product.variants[existingIdx], variant);
      } else {
        product.variants.push(variant);
      }
      product.brand = row.Brand || row.brand || product.brand;
      product.category = category._id;
      await product.save();
      productCache.set(cacheKey, product);
      results.success.push({ row: rowNum, name, variant: variantName });
    } catch (err) {
      results.failed.push({ row: rowNum, message: err.message, data: row });
    }
  }

  success(res, results, 'CSV import completed');
});
