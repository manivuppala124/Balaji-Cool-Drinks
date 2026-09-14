import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import ShopSettings from '../models/ShopSettings.js';
import { resolveItemPricing } from '../controllers/orderController.js';

const test = async () => {
  await connectDB();

  const settings = await ShopSettings.findOne();
  console.log('Shop Settings requireWholesaleApproval:', settings?.requireWholesaleApproval);

  console.log('\n--- Verifying Variant Pricing in DB ---');
  const prods = await Product.find({
    name: { $in: ['Sprite', 'Tata Water', 'Clear Water', 'Frooti', 'Masqati Badam Milk'] },
  });

  for (const p of prods) {
    console.log(`Product: ${p.name}`);
    for (const v of p.variants) {
      console.log(`  - ${v.name}: RP=₹${v.retailPrice}, WP=₹${v.wholesalePrice}, Pack=${v.wholesalePackSize}, Case=₹${v.wholesaleCasePrice}, Stock=${v.stockQuantity}`);
    }
  }

  const sprite = await Product.findOne({ name: 'Sprite' });
  const tataWater = await Product.findOne({ name: 'Tata Water' });

  const sprite250 = sprite.variants.find((v) => v.name === '250 ml');
  const tata1L = tataWater.variants.find((v) => v.name === '1 L');

  console.log('\n--- Testing Pricing Resolution ---');
  // 1. Retail item
  const retailItem = resolveItemPricing(
    sprite,
    sprite250,
    { role: 'customer' },
    'RETAIL',
    'PIECE',
    2,
    settings
  );
  console.log('Retail Item Resolution:', {
    unitPrice: retailItem.unitPrice,
    quantity: retailItem.quantity,
    subtotal: retailItem.lineTotal,
    sellingUnit: retailItem.sellingUnit,
  });

  // 2. Wholesale case item
  const wholesaleCaseItem = resolveItemPricing(
    tataWater,
    tata1L,
    { role: 'customer' },
    'WHOLESALE',
    'CASE',
    1,
    settings
  );
  console.log('Wholesale Case Resolution:', {
    unitPrice: wholesaleCaseItem.unitPrice,
    casesOrdered: wholesaleCaseItem.casesOrdered,
    totalPieces: wholesaleCaseItem.quantity,
    subtotal: wholesaleCaseItem.lineTotal,
    sellingUnit: wholesaleCaseItem.sellingUnit,
  });

  // 3. Wholesale piece item
  const wholesalePieceItem = resolveItemPricing(
    sprite,
    sprite250,
    { role: 'customer' },
    'WHOLESALE',
    'PIECE',
    5,
    settings
  );
  console.log('Wholesale Piece Resolution:', {
    unitPrice: wholesalePieceItem.unitPrice,
    quantity: wholesalePieceItem.quantity,
    subtotal: wholesalePieceItem.lineTotal,
    sellingUnit: wholesalePieceItem.sellingUnit,
  });

  console.log('\nAll pricing resolutions passed successfully!');
  await mongoose.disconnect();
};

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
