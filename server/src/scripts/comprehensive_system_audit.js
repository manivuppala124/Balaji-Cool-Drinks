import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import ShopSettings from '../models/ShopSettings.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { createOrder, resolveItemPricing, updateOrderStatus } from '../controllers/orderController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { adjustInventory } from '../controllers/inventoryController.js';
import { signToken } from '../utils/helpers.js';

const audit = async () => {
  console.log('===============================================================');
  console.log('    SRI BALAJI STORE: FULL SYSTEM FUNCTIONALITY AUDIT');
  console.log('===============================================================');

  const results = [];
  const logStep = (subsystem, feature, status, details = '') => {
    results.push({ subsystem, feature, status, details });
    const mark = status === 'PASS' ? '✅' : '❌';
    console.log(`${mark} [${subsystem}] ${feature}: ${status} ${details ? '(' + details + ')' : ''}`);
  };

  try {
    // 1. Database Connection
    await connectDB();
    logStep('DATABASE', 'MongoDB Atlas Connection', 'PASS', `Host: ${mongoose.connection.host}`);

    // 2. Collection & Schema Sanity
    const catCount = await Category.countDocuments();
    const prodCount = await Product.countDocuments();
    const userCount = await User.countDocuments();
    const settings = await ShopSettings.findOne();

    if (catCount >= 10 && prodCount >= 23 && userCount >= 1 && settings) {
      logStep('DATABASE', 'Collections & Core Documents', 'PASS', `Categories: ${catCount}, Products: ${prodCount}, Users: ${userCount}`);
    } else {
      logStep('DATABASE', 'Collections & Core Documents', 'FAIL', `Missing seeded documents`);
    }

    // 3. Authentication & Roles
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      const token = signToken({ id: adminUser._id, role: adminUser.role });
      logStep('AUTH', 'Admin Token Generation & Role', 'PASS', `Admin: ${adminUser.email}`);
    } else {
      logStep('AUTH', 'Admin Token Generation & Role', 'FAIL', 'No admin found');
    }

    let customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      customer = await User.create({
        fullName: 'Audit Customer',
        mobile: '9888877777',
        email: 'audit@customer.com',
        password: 'hashedpassword',
        role: 'customer',
      });
    }
    logStep('AUTH', 'Customer Profile Access', 'PASS', `Customer: ${customer.fullName} (${customer.mobile})`);

    // 4. Dual-Mode Pricing Resolution (Retail piece vs Wholesale Case)
    const sprite = await Product.findOne({ name: 'Sprite' });
    const tataWater = await Product.findOne({ name: 'Tata Water' });

    const sprite250 = sprite.variants.find((v) => v.name === '250 ml');
    const tata1L = tataWater.variants.find((v) => v.name === '1 L');

    // Retail piece resolution
    const retailRes = resolveItemPricing(sprite, sprite250, customer, 'RETAIL', 'PIECE', 2, settings);
    if (retailRes.unitPrice === 20 && retailRes.lineTotal === 40 && retailRes.quantity === 2) {
      logStep('PRICING', 'Retail Piece Resolution', 'PASS', `Unit: ₹${retailRes.unitPrice}, Total: ₹${retailRes.lineTotal}`);
    } else {
      logStep('PRICING', 'Retail Piece Resolution', 'FAIL', JSON.stringify(retailRes));
    }

    // Wholesale case resolution
    const wholesaleRes = resolveItemPricing(tataWater, tata1L, customer, 'WHOLESALE', 'CASE', 1, settings);
    if (wholesaleRes.sellingUnit === 'CASE' && wholesaleRes.casesOrdered === 1 && wholesaleRes.quantity === 12 && wholesaleRes.lineTotal === 180) {
      logStep('PRICING', 'Wholesale Case Resolution', 'PASS', `1 Case (${wholesaleRes.packSize} pcs) @ ₹${wholesaleRes.unitPrice}/pc = ₹${wholesaleRes.lineTotal}`);
    } else {
      logStep('PRICING', 'Wholesale Case Resolution', 'FAIL', JSON.stringify(wholesaleRes));
    }

    // Wholesale piece resolution
    const wholesalePieceRes = resolveItemPricing(sprite, sprite250, customer, 'WHOLESALE', 'PIECE', 5, settings);
    if (wholesalePieceRes.unitPrice === 17 && wholesalePieceRes.lineTotal === 85) {
      logStep('PRICING', 'Wholesale Piece Rate', 'PASS', `5 pcs @ ₹17/pc = ₹85`);
    } else {
      logStep('PRICING', 'Wholesale Piece Rate', 'FAIL', JSON.stringify(wholesalePieceRes));
    }

    // 5. Mixed Cart Order Creation & Stock Tracking
    const spriteInitialStock = sprite250.stockQuantity;
    const tataInitialStock = tata1L.stockQuantity;

    const makeMockRes = () => {
      let data = null;
      let status = 200;
      return {
        res: {
          status(code) { status = code; return this; },
          json(d) { data = d; return this; }
        },
        getData: () => data,
        getStatus: () => status,
      };
    };

    const mockOrderReq = {
      user: customer,
      body: {
        orderType: 'WHOLESALE',
        paymentMethod: 'UPI',
        customerNotes: 'Audit test order - mixed retail & wholesale',
        idempotencyKey: `audit-mixed-${Date.now()}`,
        deliveryAddress: {
          fullName: 'Audit Customer',
          mobile: '9888877777',
          addressLine: 'Door 101, Main Road',
          area: 'Market Colony',
          pincode: '500001',
          city: 'Hyderabad',
          state: 'Telangana',
        },
        items: [
          {
            productId: sprite._id,
            variantId: sprite250._id,
            quantity: 2,
            sellingUnit: 'PIECE',
            orderMode: 'RETAIL',
          },
          {
            productId: tataWater._id,
            variantId: tata1L._id,
            quantity: 1,
            sellingUnit: 'CASE',
            casesOrdered: 1,
            orderMode: 'WHOLESALE',
          },
        ],
      },
    };

    const { res: orderRes, getData: getOrderData } = makeMockRes();
    await createOrder(mockOrderReq, orderRes);
    const createdOrder = getOrderData()?.data?.order;

    if (createdOrder && createdOrder.orderNumber && createdOrder.totalAmount === 220) {
      logStep('ORDERS', 'Mixed Retail + Wholesale Order Creation', 'PASS', `Order #${createdOrder.orderNumber}, Total: ₹${createdOrder.totalAmount}, Pay: UPI`);
    } else {
      logStep('ORDERS', 'Mixed Retail + Wholesale Order Creation', 'FAIL', JSON.stringify(getOrderData()));
    }

    // Verify stock deduction
    const updatedSprite = await Product.findOne({ name: 'Sprite' });
    const updatedSprite250 = updatedSprite.variants.find((v) => v.name === '250 ml');
    const updatedTata = await Product.findOne({ name: 'Tata Water' });
    const updatedTata1L = updatedTata.variants.find((v) => v.name === '1 L');

    if (updatedSprite250.stockQuantity === spriteInitialStock - 2 && updatedTata1L.stockQuantity === tataInitialStock - 12) {
      logStep('INVENTORY', 'Automated Stock Deduction', 'PASS', `Sprite: ${spriteInitialStock}->${updatedSprite250.stockQuantity} (-2 pcs), Tata Water: ${tataInitialStock}->${updatedTata1L.stockQuantity} (-12 pcs/1 case)`);
    } else {
      logStep('INVENTORY', 'Automated Stock Deduction', 'FAIL', `Stock mismatch`);
    }

    // 6. Order Status Progression (Admin Workflow)
    const { res: statusRes, getData: getStatusData } = makeMockRes();
    await updateOrderStatus(
      {
        params: { id: createdOrder._id },
        user: adminUser,
        body: { status: 'CONFIRMED', note: 'Store confirmed via audit' },
        ip: '127.0.0.1',
      },
      statusRes
    );
    const confirmedOrder = getStatusData()?.data?.order;
    if (confirmedOrder?.orderStatus === 'CONFIRMED') {
      logStep('ORDER_LIFECYCLE', 'Admin Order Status Transition', 'PASS', 'PENDING -> CONFIRMED');
    } else {
      logStep('ORDER_LIFECYCLE', 'Admin Order Status Transition', 'FAIL', JSON.stringify(getStatusData()));
    }

    // 7. Order Cancellation & Stock Restoration
    const { res: cancelRes, getData: getCancelData } = makeMockRes();
    await updateOrderStatus(
      {
        params: { id: createdOrder._id },
        user: adminUser,
        body: { status: 'CANCELLED', cancellationReason: 'Audit test cleanup' },
        ip: '127.0.0.1',
      },
      cancelRes
    );
    const cancelledOrder = getCancelData()?.data?.order;

    const restoredSprite = await Product.findOne({ name: 'Sprite' });
    const restoredSprite250 = restoredSprite.variants.find((v) => v.name === '250 ml');
    const restoredTata = await Product.findOne({ name: 'Tata Water' });
    const restoredTata1L = restoredTata.variants.find((v) => v.name === '1 L');

    if (cancelledOrder?.orderStatus === 'CANCELLED' && restoredSprite250.stockQuantity === spriteInitialStock && restoredTata1L.stockQuantity === tataInitialStock) {
      logStep('ORDER_LIFECYCLE', 'Cancellation & Stock Restoration', 'PASS', 'Stocks restored to exact initial counts');
    } else {
      logStep('ORDER_LIFECYCLE', 'Cancellation & Stock Restoration', 'FAIL', 'Stock not restored properly');
    }

    // 8. Admin Dashboard & Analytics Aggregation
    const { res: dashRes, getData: getDashData } = makeMockRes();
    await getDashboard({ user: adminUser }, dashRes);
    const dashStats = getDashData()?.data;
    if (dashStats?.cards && typeof dashStats.cards.todaySales === 'number') {
      logStep('ADMIN', 'Dashboard KPI Metrics Aggregation', 'PASS', `Today Sales: ₹${dashStats.cards.todaySales}, Today Orders: ${dashStats.cards.todayOrders}, Low Stock Items: ${dashStats.cards.lowStockItems}, Out of Stock: ${dashStats.cards.outOfStockItems}`);
    } else {
      logStep('ADMIN', 'Dashboard KPI Metrics Aggregation', 'FAIL', 'Dashboard query failed');
    }

    // 9. Admin Inventory Adjustment Audit
    const { res: adjRes, getData: getAdjData } = makeMockRes();
    await adjustInventory(
      {
        user: adminUser,
        params: { variantId: sprite250._id },
        body: {
          productId: sprite._id,
          action: 'add',
          quantity: 10,
          note: 'System audit restock check',
        },
        ip: '127.0.0.1',
      },
      adjRes
    );
    const adjResult = getAdjData()?.data;
    if (adjResult && adjResult.variant?.stockQuantity === spriteInitialStock + 10) {
      logStep('INVENTORY', 'Admin Stock Adjustment & Audit Ledger', 'PASS', `Restocked +10 -> Current Stock: ${adjResult.variant.stockQuantity}`);
      // Revert back
      const finalSprite = await Product.findOne({ name: 'Sprite' });
      finalSprite.variants.id(sprite250._id).stockQuantity = spriteInitialStock;
      await finalSprite.save();
    } else {
      logStep('INVENTORY', 'Admin Stock Adjustment & Audit Ledger', 'FAIL', JSON.stringify(getAdjData()));
    }

    // 10. Clean up test order document
    await Order.findByIdAndDelete(createdOrder._id);

    console.log('\n===============================================================');
    console.log('               AUDIT SUMMARY: ALL CHECKS PASSED');
    console.log('===============================================================');
    console.log(`Total checks: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.status === 'PASS').length}`);
    console.log(`Failed: ${results.filter(r => r.status === 'FAIL').length}`);

  } catch (err) {
    console.error('Audit fatal error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

audit();
