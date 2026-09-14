import mongoose from 'mongoose';
import { INVENTORY_TYPES } from '../config/constants.js';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    type: { type: String, enum: INVENTORY_TYPES, required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceId: { type: String, default: '' },
    note: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ createdAt: -1 });

const InventoryTransaction = mongoose.model(
  'InventoryTransaction',
  inventoryTransactionSchema
);
export default InventoryTransaction;
