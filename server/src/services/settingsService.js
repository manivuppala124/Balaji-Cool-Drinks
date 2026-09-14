import ShopSettings from '../models/ShopSettings.js';

let cached = null;
let cachedAt = 0;
const TTL = 30_000;

export const getShopSettings = async (force = false) => {
  const now = Date.now();
  if (!force && cached && now - cachedAt < TTL) return cached;

  let settings = await ShopSettings.findOne();
  if (!settings) {
    settings = await ShopSettings.create({});
  }
  cached = settings;
  cachedAt = now;
  return settings;
};

export const clearSettingsCache = () => {
  cached = null;
  cachedAt = 0;
};

export const calcDeliveryCharge = (settings, subtotalAfterDiscount) => {
  if (!settings.deliveryAvailable) return 0;
  if (
    settings.freeDeliveryThreshold > 0 &&
    subtotalAfterDiscount >= settings.freeDeliveryThreshold
  ) {
    return 0;
  }
  return Number(settings.deliveryCharge) || 0;
};
