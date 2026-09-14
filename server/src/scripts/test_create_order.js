import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { createOrder } from '../controllers/orderController.js';

const run = async () => {
  await connectDB();

  // Find or create customer
  let customer = await User.findOne({ role: 'customer' });
  if (!customer) {
    customer = await User.create({
      fullName: 'Test Customer',
      mobile: '9876543210',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
      wholesaleApproved: false,
    });
  }

  // Pick a retail item: Sprite 250 ml
  const sprite = await Product.findOne({ name: 'Sprite' });
  const sprite250 = sprite.variants.find((v) => v.name === '250 ml');

  // Pick a wholesale case item: Tata Water 1 L
  const tataWater = await Product.findOne({ name: 'Tata Water' });
  const tata1L = tataWater.variants.find((v) => v.name === '1 L');

  const spriteInitialStock = sprite250.stockQuantity;
  const tataInitialStock = tata1L.stockQuantity;

  console.log(`Initial Stock - Sprite 250ml: ${spriteInitialStock}, Tata Water 1L: ${tataInitialStock}`);

  const req = {
    user: customer,
    body: {
      orderType: 'WHOLESALE',
      paymentMethod: 'CASH',
      deliveryAddress: {
        fullName: 'Test Customer',
        mobile: '9876543210',
        addressLine: 'Door 1-23, Main Road',
        area: 'Gandhi Nagar',
        landmark: 'Near Balaji Temple',
        pincode: '500001',
        city: 'Hyderabad',
        state: 'Telangana',
      },
      customerNotes: 'Please ring bell',
      idempotencyKey: `test-${Date.now()}`,
      items: [
        {
          productId: sprite._id,
          variantId: sprite250._id,
          quantity: 2, // 2 bottles
          sellingUnit: 'PIECE',
          orderMode: 'RETAIL',
        },
        {
          productId: tataWater._id,
          variantId: tata1L._id,
          quantity: 1, // 1 case
          sellingUnit: 'CASE',
          casesOrdered: 1,
          orderMode: 'WHOLESALE',
        },
      ],
    },
  };

  let responseData = null;
  let responseStatus = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await createOrder(req, res);

  console.log('Order created successfully!');
  console.log('Response Status:', responseStatus || 200);
  console.log('Order Number:', responseData?.data?.order?.orderNumber);
  console.log('Order Type:', responseData?.data?.order?.orderType);
  console.log('Subtotal:', responseData?.data?.order?.subtotal);
  console.log('Delivery Charge:', responseData?.data?.order?.deliveryCharge);
  console.log('Total Amount:', responseData?.data?.order?.totalAmount);
  console.log('Items Count:', responseData?.data?.order?.items?.length);

  for (const item of responseData?.data?.order?.items || []) {
    console.log(
      `  - ${item.productName} (${item.variantName}): qty=${item.quantity}, unitPrice=₹${item.unitPrice}, sellingUnit=${item.sellingUnit}, casesOrdered=${item.casesOrdered}, subtotal=₹${item.subtotal}, orderMode=${item.orderMode}`
    );
  }

  // Verify stock deduction
  const updatedSprite = await Product.findOne({ name: 'Sprite' });
  const updatedSprite250 = updatedSprite.variants.find((v) => v.name === '250 ml');
  const updatedTata = await Product.findOne({ name: 'Tata Water' });
  const updatedTata1L = updatedTata.variants.find((v) => v.name === '1 L');

  console.log(`Updated Stock - Sprite 250ml: ${updatedSprite250.stockQuantity} (expected ${spriteInitialStock - 2})`);
  console.log(`Updated Stock - Tata Water 1L: ${updatedTata1L.stockQuantity} (expected ${tataInitialStock - 12})`);

  // Clean up the test order
  if (responseData?.data?.order?._id) {
    await Order.findByIdAndDelete(responseData.data.order._id);
    console.log('Cleaned up test order document.');
  }

  // Restore stocks
  updatedSprite250.stockQuantity = spriteInitialStock;
  await updatedSprite.save();
  updatedTata1L.stockQuantity = tataInitialStock;
  await updatedTata.save();
  console.log('Restored initial stocks.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Order creation failed:', err);
  process.exit(1);
});
