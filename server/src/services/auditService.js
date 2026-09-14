import AuditLog from '../models/AuditLog.js';

export const createAuditLog = async ({
  adminId,
  action,
  entity,
  entityId = '',
  oldValue = null,
  newValue = null,
  ip = '',
}) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      entity,
      entityId: String(entityId || ''),
      oldValue,
      newValue,
      ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
