import mongoose from 'mongoose';
import slugify from 'slugify';

const variantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    volume: { type: Number, default: null },
    unit: { type: String, default: '', trim: true },
    retailPrice: { type: Number, default: null, min: 0 },
    mrp: { type: Number, default: null, min: 0 },
    wholesalePrice: { type: Number, default: null, min: 0 },
    wholesalePackSize: { type: Number, default: null, min: 1 },
    wholesalePackUnit: { type: String, default: 'pieces', trim: true },
    wholesaleCasePrice: { type: Number, default: null, min: 0 },
    minWholesaleQty: { type: Number, default: 1, min: 1 },
    allowPieceSaleWholesale: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    sku: { type: String, trim: true, default: '' },
    barcode: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true, timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    brand: { type: String, trim: true, default: '', index: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    description: { type: String, default: '' },
    images: [{ type: String }],
    variants: [variantSchema],
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('save', function generateSlug(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

productSchema.index({ name: 'text', brand: 'text', tags: 'text', 'variants.name': 'text' });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ 'variants.barcode': 1 });
productSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
