import { getShopSettings, clearSettingsCache } from '../services/settingsService.js';
import AppError, { asyncHandler, success } from '../utils/AppError.js';
import { createAuditLog } from '../services/auditService.js';

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await getShopSettings();
  success(res, { settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getShopSettings(true);
  const allowed = [
    'shopName',
    'shopLogo',
    'shopAddress',
    'phoneNumber',
    'whatsappNumber',
    'email',
    'googleMapsUrl',
    'openingTime',
    'closingTime',
    'weeklyHoliday',
    'about',
    'terms',
    'privacy',
    'refundPolicy',
    'minimumOrderAmount',
    'deliveryAvailable',
    'deliveryCharge',
    'freeDeliveryThreshold',
    'allowCashOrders',
    'allowUpiOrders',
    'allowWholesaleOrders',
    'requireWholesaleApproval',
    'deliveryAreas',
  ];

  const old = {};
  const neu = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      old[key] = settings[key];
      settings[key] = req.body[key];
      neu[key] = req.body[key];
    }
  });

  await settings.save();
  clearSettingsCache();

  await createAuditLog({
    adminId: req.user._id,
    action: 'UPDATE_SETTINGS',
    entity: 'ShopSettings',
    entityId: settings._id,
    oldValue: old,
    newValue: neu,
    ip: req.ip,
  });

  success(res, { settings }, 'Settings updated');
});

export const uploadImageUrl = asyncHandler(async (req, res) => {
  // Abstraction: accept URL now; Cloudinary can be wired when credentials exist
  const { url } = req.body;
  if (!url) throw new AppError('Image URL is required', 400);
  success(res, { url }, 'Image URL saved');
});
