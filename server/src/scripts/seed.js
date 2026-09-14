import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ShopSettings from '../models/ShopSettings.js';

const categoriesSeed = [
  { name: 'Cool Drinks', order: 1 },
  { name: 'Water', order: 2 },
  { name: 'Juices', order: 3 },
  { name: 'Milk & Dairy Drinks', order: 4 },
  { name: 'Energy Drinks', order: 5 },
  { name: 'Soda', order: 6 },
  { name: 'ORS & Health Drinks', order: 7 },
  { name: 'Disposables', order: 8 },
  { name: 'General Store', order: 9 },
  { name: 'Other', order: 10 },
];

const v = (partial) => ({
  unit: '',
  mrp: null,
  retailPrice: null,
  wholesalePrice: null,
  wholesalePackSize: null,
  wholesalePackUnit: 'pieces',
  wholesaleCasePrice: null,
  minWholesaleQty: 1,
  allowPieceSaleWholesale: true,
  stockQuantity: 50,
  lowStockThreshold: 10,
  sku: '',
  barcode: '',
  isActive: true,
  isAvailable: true,
  isFeatured: false,
  ...partial,
});

const productsSeed = (cats) => {
  const c = (name) => cats[name]._id;

  return [
    {
      name: 'Sprite',
      brand: 'Coca-Cola',
      category: c('Cool Drinks'),
      isFeatured: true,
      tags: ['soft drink', 'lemon'],
      variants: [
        v({ name: '2.25 L', volume: 2.25, unit: 'L', retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 6, wholesalePackUnit: 'bottles', wholesaleCasePrice: 460, stockQuantity: 60 }),
        v({ name: '1.25 L', volume: 1.25, unit: 'L', retailPrice: 70, mrp: 70, wholesalePrice: 60, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 710, stockQuantity: 50 }),
        v({ name: '750 ml', volume: 750, unit: 'ml', retailPrice: 40, mrp: 40, wholesalePrice: 34, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 800, stockQuantity: 80 }),
        v({ name: '250 ml', volume: 250, unit: 'ml', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 100 }),
      ],
    },
    {
      name: 'Thums Up',
      brand: 'Coca-Cola',
      category: c('Cool Drinks'),
      isFeatured: true,
      tags: ['cola'],
      variants: [
        v({ name: '2.25 L', volume: 2.25, unit: 'L', retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 6, wholesalePackUnit: 'bottles', wholesaleCasePrice: 460, stockQuantity: 60 }),
        v({ name: '1.25 L', volume: 1.25, unit: 'L', retailPrice: 70, mrp: 70, wholesalePrice: 60, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 710, stockQuantity: 50 }),
        v({ name: '750 ml', volume: 750, unit: 'ml', retailPrice: 40, mrp: 40, wholesalePrice: 34, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 800, stockQuantity: 80 }),
        v({ name: '250 ml', volume: 250, unit: 'ml', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 100 }),
      ],
    },
    {
      name: 'Limca',
      brand: 'Coca-Cola',
      category: c('Cool Drinks'),
      variants: [
        v({ name: '400 ml', volume: 400, unit: 'ml', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Fanta',
      brand: 'Coca-Cola',
      category: c('Cool Drinks'),
      variants: [
        v({ name: '400 ml', volume: 400, unit: 'ml', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Tata Water',
      brand: 'Tata',
      category: c('Water'),
      tags: ['mineral water'],
      variants: [
        v({ name: '2 L', volume: 2, unit: 'L', retailPrice: 30, mrp: 30, wholesalePrice: 24, wholesalePackSize: 9, wholesalePackUnit: 'bottles', wholesaleCasePrice: 210, stockQuantity: 40 }),
        v({ name: '1 L', volume: 1, unit: 'L', retailPrice: 20, mrp: 20, wholesalePrice: 15, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 180, stockQuantity: 40 }),
        v({ name: '500 ml', volume: 500, unit: 'ml', retailPrice: 10, mrp: 10, wholesalePrice: 8, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 180, stockQuantity: 60 }),
      ],
    },
    {
      name: 'Bisleri',
      brand: 'Bisleri',
      category: c('Water'),
      variants: [
        v({ name: '250 ml', volume: 250, unit: 'ml', retailPrice: 10, mrp: 10, wholesalePrice: 8, wholesalePackSize: 24, wholesalePackUnit: 'pieces', wholesaleCasePrice: 180, stockQuantity: 120 }),
      ],
    },
    {
      name: 'Clear Water',
      brand: 'Clear',
      category: c('Water'),
      variants: [
        v({ name: '250 ml', volume: 250, unit: 'ml', retailPrice: 6, mrp: 6, wholesalePrice: 4.5, wholesalePackSize: 48, wholesalePackUnit: 'pieces', wholesaleCasePrice: 200, stockQuantity: 96 }),
      ],
    },
    {
      name: 'Woya Water',
      brand: 'Woya',
      category: c('Water'),
      variants: [
        v({ name: '2 L', volume: 2, unit: 'L', retailPrice: 30, mrp: 30, wholesalePrice: 24, wholesalePackSize: 9, wholesalePackUnit: 'bottles', wholesaleCasePrice: 210, stockQuantity: 50 }),
        v({ name: '1 L', volume: 1, unit: 'L', retailPrice: 20, mrp: 20, wholesalePrice: 15, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 180, stockQuantity: 50 }),
        v({ name: '500 ml', volume: 500, unit: 'ml', retailPrice: 10, mrp: 10, wholesalePrice: 8, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 180, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Tata Gluco',
      brand: 'Tata',
      category: c('Energy Drinks'),
      isFeatured: true,
      variants: [
        v({ name: 'Standard', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 200, stockQuantity: 80 }),
      ],
    },
    {
      name: 'Campa',
      brand: 'Campa',
      category: c('Cool Drinks'),
      isFeatured: true,
      tags: ['campa'],
      variants: [
        v({ name: 'Black ₹10', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 200, stockQuantity: 50 }),
        v({ name: 'Orange ₹10', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 200, stockQuantity: 50 }),
        v({ name: 'Green ₹10', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 200, stockQuantity: 50 }),
        v({ name: 'Black ₹20', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
        v({ name: 'Orange ₹20', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
        v({ name: 'Green ₹20', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Masqati Badam Milk',
      brand: 'Masqati',
      category: c('Milk & Dairy Drinks'),
      variants: [
        v({ name: 'Glass', retailPrice: 40, mrp: 40, wholesalePrice: 35, wholesalePackSize: 12, wholesalePackUnit: 'glasses', wholesaleCasePrice: 420, unit: 'glass', stockQuantity: 30 }),
      ],
    },
    {
      name: 'Jersey Badam Milk',
      brand: 'Jersey',
      category: c('Milk & Dairy Drinks'),
      variants: [
        v({ name: '₹20', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 40 }),
        v({ name: '₹40', retailPrice: 40, mrp: 40, wholesalePrice: 35, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 820, stockQuantity: 40 }),
      ],
    },
    {
      name: 'ORS',
      brand: 'ORS',
      category: c('ORS & Health Drinks'),
      tags: ['health'],
      variants: [
        v({ name: 'Orange', retailPrice: 32, mrp: 32, wholesalePrice: 27, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 640, stockQuantity: 50 }),
        v({ name: 'Apple', retailPrice: 32, mrp: 32, wholesalePrice: 27, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 640, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Bindu Zeera Soda',
      brand: 'Bindu',
      category: c('Soda'),
      variants: [
        v({ name: 'Standard', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 200, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Frooti',
      brand: 'Parle Agro',
      category: c('Juices'),
      isFeatured: true,
      variants: [
        v({ name: 'Tetra', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 50, wholesalePackUnit: 'pieces', wholesaleCasePrice: 420, stockQuantity: 100 }),
        v({ name: 'Pet', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 40, wholesalePackUnit: 'pieces', wholesaleCasePrice: 340, stockQuantity: 80 }),
      ],
    },
    {
      name: 'Fizz',
      brand: 'Fizz',
      category: c('Cool Drinks'),
      variants: [
        v({ name: 'Standard', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 200, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Smoodh Chocolate',
      brand: 'Smoodh',
      category: c('Milk & Dairy Drinks'),
      variants: [
        v({ name: 'Standard', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 24, wholesalePackUnit: 'pieces', wholesaleCasePrice: 200, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Real Zeera Soda',
      brand: 'Real',
      category: c('Soda'),
      variants: [
        v({ name: 'Standard', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Maaza Tetra',
      brand: 'Coca-Cola',
      category: c('Juices'),
      variants: [
        v({ name: 'Tetra', retailPrice: 10, mrp: 10, wholesalePrice: 8.5, wholesalePackSize: 50, wholesalePackUnit: 'pieces', wholesaleCasePrice: 420, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Sting',
      brand: 'PepsiCo',
      category: c('Energy Drinks'),
      isFeatured: true,
      variants: [
        v({ name: 'Standard', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Mountain Dew',
      brand: 'PepsiCo',
      category: c('Cool Drinks'),
      variants: [
        v({ name: 'Standard', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Maaza',
      brand: 'Coca-Cola',
      category: c('Juices'),
      isFeatured: true,
      variants: [
        v({ name: '250 ml', volume: 250, unit: 'ml', retailPrice: 20, mrp: 20, wholesalePrice: 17, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 400, stockQuantity: 50 }),
        v({ name: '1.25 L', volume: 1.25, unit: 'L', retailPrice: 75, mrp: 75, wholesalePrice: 65, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 760, stockQuantity: 50 }),
        v({ name: '1.5 L', volume: 1.5, unit: 'L', retailPrice: 95, mrp: 95, wholesalePrice: 82, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 960, stockQuantity: 50 }),
      ],
    },
    {
      name: 'Pulpy Orange',
      brand: 'Minute Maid',
      category: c('Juices'),
      variants: [
        v({ name: '250 ml', volume: 250, unit: 'ml', retailPrice: 25, mrp: 25, wholesalePrice: 21, wholesalePackSize: 24, wholesalePackUnit: 'bottles', wholesaleCasePrice: 500, stockQuantity: 50 }),
        v({ name: '1 L', volume: 1, unit: 'L', retailPrice: 90, mrp: 90, wholesalePrice: 78, wholesalePackSize: 12, wholesalePackUnit: 'bottles', wholesaleCasePrice: 920, stockQuantity: 50 }),
      ],
    },
  ];
};

const seed = async () => {
  await connectDB();

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'Store Admin';
  const mobile = process.env.SEED_ADMIN_MOBILE || '9999999999';

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
  }

  console.log('Clearing existing catalog data...');
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
  ]);

  let settings = await ShopSettings.findOne();
  if (!settings) {
    settings = await ShopSettings.create({
      shopName: 'Sri Balaji Cool Drinks & General Store',
      shopAddress: 'Local Market Area, India',
      phoneNumber: mobile,
      whatsappNumber: mobile,
      email,
      openingTime: '08:00',
      closingTime: '22:00',
      deliveryCharge: 20,
      freeDeliveryThreshold: 500,
      minimumOrderAmount: 0,
      allowWholesaleOrders: true,
      requireWholesaleApproval: false,
      deliveryAreas: ['Local Area', 'Nearby Colonies'],
    });
  } else {
    settings.allowWholesaleOrders = true;
    settings.requireWholesaleApproval = false;
    await settings.save();
  }

  const catDocs = {};
  for (const cat of categoriesSeed) {
    const doc = await Category.create(cat);
    catDocs[cat.name] = doc;
  }
  console.log(`Created ${categoriesSeed.length} categories`);

  const products = productsSeed(catDocs);
  for (const p of products) {
    await Product.create(p);
  }
  console.log(`Created ${products.length} products`);

  let admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
  if (!admin) {
    admin = await User.create({
      fullName: name,
      email: email.toLowerCase(),
      mobile,
      password: await bcrypt.hash(password, 12),
      role: 'admin',
    });
    console.log(`Admin created: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  console.log('Seed completed successfully');
  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
