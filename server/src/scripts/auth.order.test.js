import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import app from '../../server.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ShopSettings from '../models/ShopSettings.js';

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.JWT_SECRET = 'testsecret';
  process.env.CLIENT_URL = 'http://localhost:5173';
  await mongoose.connect(mongo.getUri());
  await ShopSettings.create({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    if (collection.collectionName !== 'shopsettings') {
      await collection.deleteMany({});
    }
  }
});

describe('Auth & Orders', () => {
  test('registers and logs in customer', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      mobile: '9876543210',
      password: 'secret123',
      confirmPassword: 'secret123',
      address: 'Street 1',
      pincode: '500001',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({
      identifier: '9876543210',
      password: 'secret123',
    });
    expect(login.status).toBe(200);
  });

  test('blocks customer from admin routes', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      fullName: 'Cust',
      mobile: '9876543211',
      password: 'secret123',
    });
    const token = reg.body.data.token;
    const dash = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(dash.status).toBe(403);
  });

  test('creates order with server-side pricing and stock deduction', async () => {
    const cat = await Category.create({ name: 'Cool Drinks', order: 1 });
    const product = await Product.create({
      name: 'Sprite',
      brand: 'Coca-Cola',
      category: cat._id,
      variants: [
        {
          name: '250 ml',
          retailPrice: 20,
          mrp: 20,
          stockQuantity: 10,
          lowStockThreshold: 2,
          isActive: true,
          isAvailable: true,
        },
      ],
    });
    const variantId = product.variants[0]._id;

    const reg = await request(app).post('/api/auth/register').send({
      fullName: 'Buyer',
      mobile: '9876543212',
      password: 'secret123',
      address: 'Addr',
      pincode: '500001',
    });
    const token = reg.body.data.token;

    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentMethod: 'CASH',
        orderType: 'RETAIL',
        deliveryAddress: {
          fullName: 'Buyer',
          mobile: '9876543212',
          addressLine: 'Addr',
          pincode: '500001',
        },
        items: [
          {
            productId: product._id,
            variantId,
            quantity: 2,
            unitPrice: 1, // malicious frontend price must be ignored
          },
        ],
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.order.totalAmount).toBeGreaterThanOrEqual(40);
    expect(orderRes.body.data.order.items[0].unitPrice).toBe(20);

    const updated = await Product.findById(product._id);
    expect(updated.variants[0].stockQuantity).toBe(8);
  });

  test('admin login works', async () => {
    await User.create({
      fullName: 'Admin',
      email: 'admin@test.com',
      mobile: '9999999998',
      password: await bcrypt.hash('Admin@123', 12),
      role: 'admin',
    });
    const res = await request(app).post('/api/auth/admin/login').send({
      identifier: 'admin@test.com',
      password: 'Admin@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
  });
});
