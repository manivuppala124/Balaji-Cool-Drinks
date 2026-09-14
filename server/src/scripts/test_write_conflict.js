import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { createOrder } from '../controllers/orderController.js';

const run = async () => {
  await connectDB();
  console.log('Testing against:', mongoose.connection.host);

  const customer = await User.findOne({ role: 'customer' });
  const sprite = await Product.findOne({ name: 'Sprite' });
  const tataWater = await Product.findOne({ name: 'Tata Water' });

  const sprite250 = sprite.variants.find((v) => v.name === '250 ml');
  const sprite750 = sprite.variants.find((v) => v.name === '750 ml');
  const tata1L = tataWater.variants.find((v) => v.name === '1 L');

  console.log('\n--- Test 1: Order with 2 variants of the SAME product (Previous Write Conflict trigger) ---');
  const makeOrderReq = (items) => ({
    user: customer,
    body: {
      orderType: 'WHOLESALE',
      paymentMethod: 'CASH',
      deliveryAddress: {
        fullName: 'Test Customer',
        mobile: '9876543210',
        addressLine: 'Door 1-23',
        area: 'Gandhi Nagar',
        pincode: '500001',
      },
      idempotencyKey: `stress-${Date.now()}-${Math.random()}`,
      items,
    },
  });

  const makeMockRes = () => {
    let responseData = null;
    let responseStatus = 200;
    return {
      res: {
        status(code) {
          responseStatus = code;
          return this;
        },
        json(data) {
          responseData = data;
          return this;
        },
      },
      getData: () => responseData,
      getStatus: () => responseStatus,
    };
  };

  // Test 1: Order containing 2 variants of Sprite in the same cart
  const { res: res1, getData: getData1 } = makeMockRes();
  await createOrder(
    makeOrderReq([
      {
        productId: sprite._id,
        variantId: sprite250._id,
        quantity: 1,
        sellingUnit: 'PIECE',
        orderMode: 'RETAIL',
      },
      {
        productId: sprite._id,
        variantId: sprite750._id,
        quantity: 1,
        sellingUnit: 'PIECE',
        orderMode: 'RETAIL',
      },
    ]),
    res1
  );

  const order1 = getData1()?.data?.order;
  console.log('Test 1 Success! Order Number:', order1?.orderNumber, 'Total:', order1?.totalAmount);
  if (order1?._id) await Order.findByIdAndDelete(order1._id);

  console.log('\n--- Test 2: 3 Concurrent Orders Placed Simultaneously ---');
  const concurrentPromises = [1, 2, 3].map(async (i) => {
    const { res, getData } = makeMockRes();
    await createOrder(
      makeOrderReq([
        {
          productId: tataWater._id,
          variantId: tata1L._id,
          quantity: 1,
          sellingUnit: 'CASE',
          casesOrdered: 1,
          orderMode: 'WHOLESALE',
        },
      ]),
      res
    );
    const ord = getData()?.data?.order;
    console.log(`Concurrent Order #${i} Success: ${ord?.orderNumber}`);
    if (ord?._id) await Order.findByIdAndDelete(ord._id);
    return ord;
  });

  await Promise.all(concurrentPromises);
  console.log('\nAll concurrent orders placed without any write conflicts!');

  // Restore stock
  const freshSprite = await Product.findOne({ name: 'Sprite' });
  for (const v of freshSprite.variants) v.stockQuantity = 60;
  await freshSprite.save();

  const freshTata = await Product.findOne({ name: 'Tata Water' });
  for (const v of freshTata.variants) v.stockQuantity = 40;
  await freshTata.save();

  console.log('Stock restored. Everything verified.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Test Failed with Error:', err);
  process.exit(1);
});
