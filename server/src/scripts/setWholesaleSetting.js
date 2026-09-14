import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import ShopSettings from '../models/ShopSettings.js';

const run = async () => {
  await connectDB();
  const settings = await ShopSettings.findOne();
  if (settings) {
    console.log('Previous requireWholesaleApproval:', settings.requireWholesaleApproval);
    settings.requireWholesaleApproval = false;
    await settings.save();
    console.log('Successfully set requireWholesaleApproval to:', settings.requireWholesaleApproval);
  } else {
    const created = await ShopSettings.create({ requireWholesaleApproval: false });
    console.log('Created ShopSettings with requireWholesaleApproval:', created.requireWholesaleApproval);
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
