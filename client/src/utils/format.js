export const formatINR = (amount) => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export const getStockLabel = (variant) => {
  if (!variant) return { label: 'Unavailable', tone: 'bg-slate-100 text-slate-600' };
  if (!variant.isActive || !variant.isAvailable) {
    return { label: 'Unavailable', tone: 'bg-slate-100 text-slate-600' };
  }
  if (variant.stockQuantity <= 0) {
    return { label: 'Out of Stock', tone: 'bg-red-100 text-red-700' };
  }
  if (variant.stockQuantity <= variant.lowStockThreshold) {
    return { label: 'Low Stock', tone: 'bg-amber-100 text-amber-800' };
  }
  return { label: 'In Stock', tone: 'bg-emerald-100 text-emerald-800' };
};

export const statusTone = (status) => {
  const map = {
    PENDING: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-sky-100 text-sky-800',
    PROCESSING: 'bg-indigo-100 text-indigo-800',
    READY: 'bg-teal-100 text-teal-800',
    OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
    DELIVERED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-700',
    PAID: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-700',
    NOT_APPLICABLE: 'bg-slate-100 text-slate-600',
    IN_STOCK: 'bg-emerald-100 text-emerald-800',
    LOW_STOCK: 'bg-amber-100 text-amber-800',
    OUT_OF_STOCK: 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export const ORDER_STEPS = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
