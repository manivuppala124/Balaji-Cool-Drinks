import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';

const pricingCatalog = {
  'Sprite': {
    'Sprite 2.25 L': { name: '2.25 L', retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 6, wholesaleCasePrice: 460 },
    'Sprite 1.25 L': { name: '1.25 L', retailPrice: 70, mrp: 70, wholesalePrice: 60, wholesalePackSize: 12, wholesaleCasePrice: 710 },
    'Sprite 750 ml': { name: '750 ml', retailPrice: 40, mrp: 40, wholesalePrice: 34, wholesalePackSize: 24, wholesaleCasePrice: 800 },
    '2.25 L': { retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 6, wholesaleCasePrice: 460 },
    '1.25 L': { retailPrice: 70, mrp: 70, wholesalePrice: 60, wholesalePackSize: 12, wholesaleCasePrice: 710 },
    '750 ml': { retailPrice: 40, mrp: 40, wholesalePrice: 34, wholesalePackSize: 24, wholesaleCasePrice: 800 },
    '250 ml': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Thums Up': {
    '2.25 L': { retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 6, wholesaleCasePrice: 460 },
    '1.25 L': { retailPrice: 70, mrp: 70, wholesalePrice: 60, wholesalePackSize: 12, wholesaleCasePrice: 710 },
    '750 ml': { retailPrice: 40, mrp: 40, wholesalePrice: 34, wholesalePackSize: 24, wholesaleCasePrice: 800 },
    '250 ml': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Limca': {
    '400 ml': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Fanta': {
    '400 ml': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Tata Water': {
    '2 L': { retailPrice: 30, mrp: 30, wholesalePrice: 24, wholesalePackSize: 9, wholesaleCasePrice: 210 },
    '1 L': { retailPrice: 20, mrp: 20, wholesalePrice: 15, wholesalePackSize: 12, wholesaleCasePrice: 180 },
    '500 ml': { retailPrice: 10, mrp: 10, wholesalePrice: 8, wholesalePackSize: 24, wholesaleCasePrice: 180 },
  },
  'Bisleri': {
    '250 ml': { retailPrice: 10, mrp: 10, wholesalePrice: 8, wholesalePackSize: 24, wholesaleCasePrice: 180 },
  },
  'Clear Water': {
    '250 ml': { retailPrice: 6, mrp: 6, wholesalePrice: 4.5, wholesalePackSize: 48, wholesaleCasePrice: 200 },
  },
  'Woya Water': {
    '2 L': { retailPrice: 30, mrp: 30, wholesalePrice: 24, wholesalePackSize: 9, wholesaleCasePrice: 210 },
    '1 L': { retailPrice: 20, mrp: 20, wholesalePrice: 15, wholesalePackSize: 12, wholesaleCasePrice: 180 },
    '500 ml': { retailPrice: 10, mrp: 10, wholesalePrice: 8, wholesalePackSize: 24, wholesaleCasePrice: 180 },
  },
  'Tata Gluco': {
    'Standard': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
  },
  'Campa': {
    'Black ₹10': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
    'Orange ₹10': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
    'Green ₹10': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
    'Black ₹20': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
    'Orange ₹20': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
    'Green ₹20': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Masqati Badam Milk': {
    'Glass': { retailPrice: 40, mrp: 40, wholesalePrice: 35, wholesalePackSize: 12, wholesaleCasePrice: 420 },
  },
  'Jersey Badam Milk': {
    '₹20': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
    '₹40': { retailPrice: 40, mrp: 40, wholesalePrice: 35, wholesalePackSize: 24, wholesaleCasePrice: 820 },
  },
  'ORS': {
    'Orange': { retailPrice: 32, mrp: 32, wholesalePrice: 27, wholesalePackSize: 24, wholesaleCasePrice: 640 },
    'Apple': { retailPrice: 32, mrp: 32, wholesalePrice: 27, wholesalePackSize: 24, wholesaleCasePrice: 640 },
  },
  'Bindu Zeera Soda': {
    'Standard': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
  },
  'Frooti': {
    'Tetra': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 50, wholesaleCasePrice: 420 },
    'Pet': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 40, wholesaleCasePrice: 340 },
  },
  'Fizz': {
    'Standard': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
  },
  'Smoodh Chocolate': {
    'Standard': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesaleCasePrice: 200 },
  },
  'Real Zeera Soda': {
    'Standard': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Maaza Tetra': {
    'Tetra': { retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 50, wholesaleCasePrice: 420 },
  },
  'Sting': {
    'Standard': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Mountain Dew': {
    'Standard': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
  },
  'Maaza': {
    '250 ml': { retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesaleCasePrice: 400 },
    '1.25 L': { retailPrice: 75, mrp: 75, wholesalePrice: 65, wholesalePackSize: 12, wholesaleCasePrice: 760 },
    '1.5 L': { retailPrice: 95, mrp: 95, wholesalePrice: 82, wholesalePackSize: 12, wholesaleCasePrice: 960 },
  },
  'Pulpy Orange': {
    '250 ml': { retailPrice: 25, mrp: 25, wholesalePrice: 21, wholesalePackSize: 24, wholesaleCasePrice: 500 },
    '1 L': { retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 12, wholesaleCasePrice: 920 },
  },
};

const run = async () => {
  await connectDB();

  const products = await Product.find();
  console.log(`Found ${products.length} products to check/update.`);

  let updatedCount = 0;
  for (const product of products) {
    const catalog = pricingCatalog[product.name];
    let modified = false;

    for (const variant of product.variants) {
      const p = catalog?.[variant.name];
      if (p) {
        if (p.name) variant.name = p.name;
        if (p.retailPrice != null) variant.retailPrice = p.retailPrice;
        if (p.mrp != null) variant.mrp = p.mrp;
        if (p.wholesalePrice != null) variant.wholesalePrice = p.wholesalePrice;
        if (p.wholesalePackSize != null) variant.wholesalePackSize = p.wholesalePackSize;
        if (p.wholesaleCasePrice != null) variant.wholesaleCasePrice = p.wholesaleCasePrice;
        variant.allowPieceSaleWholesale = true;
        if (!variant.stockQuantity || variant.stockQuantity <= 0) variant.stockQuantity = 50;
        modified = true;
      } else {
        const rp = variant.retailPrice || variant.mrp || 20;
        if (!variant.retailPrice) variant.retailPrice = rp;
        if (!variant.mrp) variant.mrp = rp;
        if (!variant.wholesalePackSize) variant.wholesalePackSize = 24;
        if (!variant.wholesalePrice) variant.wholesalePrice = Number((rp * 0.85).toFixed(2));
        if (!variant.wholesaleCasePrice) variant.wholesaleCasePrice = Number((variant.wholesalePrice * variant.wholesalePackSize).toFixed(2));
        variant.allowPieceSaleWholesale = true;
        if (!variant.stockQuantity || variant.stockQuantity <= 0) variant.stockQuantity = 50;
        modified = true;
      }
    }

    if (modified) {
      await product.save();
      updatedCount++;
    }
  }

  console.log(`Updated pricing for ${updatedCount} products.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Error updating pricing:', err);
  process.exit(1);
});
