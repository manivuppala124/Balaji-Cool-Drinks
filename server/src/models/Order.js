import mongoose from 'mongoose';
import {
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  ORDER_TYPES,
} from '../config/constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true },
    brand: { type: String, default: '' },
    variantName: { type: String, required: true },
    sku: { type: String, default: '' },
    barcode: { type: String, default: '' },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: null },
    subtotal: { type: Number, required: true, min: 0 },
    orderMode: { type: String, enum: ORDER_TYPES, default: 'RETAIL' },
    sellingUnit: { type: String, enum: ['PIECE', 'CASE'], default: 'PIECE' },
    casesOrdered: { type: Number, default: 0 },
    packSize: { type: Number, default: null },
    packUnit: { type: String, default: '' },
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    note: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    mobile: String,
    addressLine: String,
    area: String,
    landmark: String,
    pincode: String,
    city: String,
    state: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: { type: [orderItemSchema], required: true },
    orderType: { type: String, enum: ORDER_TYPES, default: 'RETAIL', index: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'PENDING',
      index: true,
    },
    deliveryAddress: { type: deliveryAddressSchema, required: true },
    customerNotes: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    cancellationReason: { type: String, default: '' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    idempotencyKey: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
