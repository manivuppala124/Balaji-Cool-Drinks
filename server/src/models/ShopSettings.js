import mongoose from 'mongoose';

const shopSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'Sri Balaji Cool Drinks & General Store',
    },
    shopLogo: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    googleMapsUrl: { type: String, default: '' },
    openingTime: { type: String, default: '08:00' },
    closingTime: { type: String, default: '22:00' },
    weeklyHoliday: { type: String, default: '' },
    about: {
      type: String,
      default:
        'Your neighbourhood retail and wholesale store for cool drinks, water, juices, dairy drinks, and general store essentials.',
    },
    terms: { type: String, default: 'Orders once confirmed are subject to store availability and delivery schedule.' },
    privacy: {
      type: String,
      default: 'We use your contact and address details only to fulfill orders and improve service.',
    },
    refundPolicy: {
      type: String,
      default:
        'Cancellations are accepted before dispatch. Damaged or incorrect items can be reported within 24 hours of delivery.',
    },
    minimumOrderAmount: { type: Number, default: 0 },
    deliveryAvailable: { type: Boolean, default: true },
    deliveryCharge: { type: Number, default: 20 },
    freeDeliveryThreshold: { type: Number, default: 500 },
    allowCashOrders: { type: Boolean, default: true },
    allowUpiOrders: { type: Boolean, default: true },
    allowWholesaleOrders: { type: Boolean, default: true },
    requireWholesaleApproval: { type: Boolean, default: false },
    deliveryAreas: [{ type: String }],
  },
  { timestamps: true }
);

const ShopSettings = mongoose.model('ShopSettings', shopSettingsSchema);
export default ShopSettings;
