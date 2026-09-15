import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  DollarSign,
  User,
  Phone,
  Store,
  Layers,
  Percent,
  MessageCircle,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, categoryApi, productApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatINR, cn, getStockLabel } from '../../utils/format';
import { sendWhatsAppBillWithPdf, downloadInvoicePdf } from '../../utils/whatsappBill';

const PAYMENT_MODES = [
  { id: 'CASH', label: 'Cash' },
  { id: 'PHONEPE', label: 'PhonePe' },
  { id: 'UPI', label: 'UPI / QR' },
  { id: 'SPLIT', label: 'Split Payment' },
];

const SPLIT_METHODS = ['PHONEPE', 'CASH', 'UPI', 'GOOGLE_PAY', 'PAYTM', 'CARD'];

export default function POS() {
  const { settings } = useAuth();

  // Catalog State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerMobile, setCustomerMobile] = useState('');
  const [discount, setDiscount] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [splits, setSplits] = useState([
    { method: 'PHONEPE', amount: '', reference: '' },
    { method: 'CASH', amount: '', reference: '' },
  ]);

  // Submission & Receipt State
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [receiptMobile, setReceiptMobile] = useState('');

  // Load catalog on mount
  useEffect(() => {
    let alive = true;
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          productApi.list({ limit: 100, isActive: 'true' }),
          categoryApi.list(),
        ]);
        if (alive) {
          setProducts(prodRes.data.data.items || []);
          setCategories(catRes.data.data.categories || []);
        }
      } catch (err) {
        toast.error('Failed to load store catalog');
      } finally {
        if (alive) setLoadingCatalog(false);
      }
    };
    fetchCatalog();
    return () => {
      alive = false;
    };
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory && p.category?._id !== selectedCategory && p.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchVariant = p.variants?.some(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.sku?.toLowerCase().includes(q) ||
          v.barcode?.toLowerCase().includes(q)
      );
      return matchName || matchBrand || matchVariant;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = Math.max(0, Number(discount) || 0);
  const netTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

  // Split calculations
  const splitTotal = useMemo(() => {
    return splits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [splits]);

  const splitDifference = Math.round((netTotal - splitTotal) * 100) / 100;
  const isSplitBalanced = Math.abs(splitDifference) < 0.05;

  // Add Item to Cart
  const addToCart = (product, variant, sellingUnit = 'PIECE') => {
    const packSize = variant.wholesalePackSize || 1;
    const piecesPerUnit = sellingUnit === 'CASE' ? packSize : 1;

    // Price calculation
    let unitPrice = 0;
    if (sellingUnit === 'CASE') {
      unitPrice =
        variant.wholesaleCasePrice != null
          ? variant.wholesaleCasePrice
          : variant.wholesalePrice != null
            ? Number((variant.wholesalePrice * packSize).toFixed(2))
            : variant.retailPrice != null
              ? Number((variant.retailPrice * packSize * 0.9).toFixed(2))
              : 0;
    } else {
      unitPrice = variant.retailPrice ?? variant.mrp ?? 0;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.productId === product._id &&
          i.variantId === variant._id &&
          i.sellingUnit === sellingUnit
      );

      if (existingIdx > -1) {
        const current = prev[existingIdx];
        const nextQty = current.quantity + 1;
        const totalPiecesNeeded = nextQty * piecesPerUnit;

        if (variant.stockQuantity < totalPiecesNeeded) {
          toast.error(
            `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stockQuantity} pcs.`
          );
          return prev;
        }

        const updated = [...prev];
        updated[existingIdx] = {
          ...current,
          quantity: nextQty,
          subtotal: Number((nextQty * unitPrice).toFixed(2)),
        };
        return updated;
      }

      // New item
      if (variant.stockQuantity < piecesPerUnit) {
        toast.error(
          `Insufficient stock for ${product.name} (${variant.name}). Available: ${variant.stockQuantity} pcs.`
        );
        return prev;
      }

      return [
        ...prev,
        {
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          brand: product.brand,
          variantName: variant.name,
          image: product.images?.[0] || '',
          sellingUnit,
          packSize,
          unitPrice,
          mrp: variant.mrp,
          quantity: 1,
          subtotal: unitPrice,
          variantRef: variant,
        },
      ];
    });
  };

  // Update Cart Item Quantity
  const updateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    const piecesPerUnit = item.sellingUnit === 'CASE' ? item.packSize : 1;
    const totalPiecesNeeded = newQty * piecesPerUnit;

    if (item.variantRef.stockQuantity < totalPiecesNeeded) {
      toast.error(
        `Insufficient stock for ${item.productName}. Max available: ${Math.floor(
          item.variantRef.stockQuantity / piecesPerUnit
        )} ${item.sellingUnit === 'CASE' ? 'cases' : 'pieces'}`
      );
      return;
    }

    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: newQty,
        subtotal: Number((newQty * item.unitPrice).toFixed(2)),
      };
      return updated;
    });
  };

  // Remove from Cart
  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear Cart
  const clearCart = () => {
    if (cart.length > 0 && !window.confirm('Clear all items from current counter order?')) {
      return;
    }
    setCart([]);
    setDiscount(0);
    setAdminNotes('');
    setPaymentMethod('CASH');
    setSplits([
      { method: 'PHONEPE', amount: '', reference: '' },
      { method: 'CASH', amount: '', reference: '' },
    ]);
  };

  // Split helper presets
  const applyPresetSplit = (ratioPhonePe, ratioCash) => {
    if (netTotal <= 0) {
      toast.error('Add items to order before calculating split');
      return;
    }
    const pAmount = Number((netTotal * ratioPhonePe).toFixed(2));
    const cAmount = Number((netTotal - pAmount).toFixed(2));

    setPaymentMethod('SPLIT');
    setSplits([
      { method: 'PHONEPE', amount: pAmount, reference: '' },
      { method: 'CASH', amount: cAmount, reference: '' },
    ]);
    toast.success(
      `Split applied: PhonePe ₹${pAmount} (${Math.round(ratioPhonePe * 100)}%) + Cash ₹${cAmount} (${Math.round(ratioCash * 100)}%)`
    );
  };

  const updateSplit = (index, field, value) => {
    setSplits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addSplitRow = () => {
    const remaining = Math.max(0, netTotal - splitTotal);
    setSplits((prev) => [
      ...prev,
      {
        method: prev.some((s) => s.method === 'CASH') ? 'UPI' : 'CASH',
        amount: remaining > 0 ? Number(remaining.toFixed(2)) : '',
        reference: '',
      },
    ]);
  };

  const removeSplitRow = (index) => {
    if (splits.length <= 1) {
      toast.error('At least one payment split row is required');
      return;
    }
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  const fillRemainingSplit = (index) => {
    const otherSum = splits.reduce(
      (sum, s, idx) => (idx !== index ? sum + (Number(s.amount) || 0) : sum),
      0
    );
    const balance = Math.max(0, Number((netTotal - otherSum).toFixed(2)));
    updateSplit(index, 'amount', balance);
  };

  // Submit In-Store Order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add products to place an in-store order.');
      return;
    }

    if (paymentMethod === 'SPLIT') {
      if (!isSplitBalanced) {
        toast.error(
          `Payment split does not balance. Order Total: ₹${netTotal}, Allocated: ₹${splitTotal}. Difference: ₹${splitDifference}`
        );
        return;
      }
      for (const s of splits) {
        if (!s.amount || Number(s.amount) <= 0) {
          toast.error('All split rows must have an amount greater than 0');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          sellingUnit: item.sellingUnit,
          quantity:
            item.sellingUnit === 'CASE' ? item.quantity * item.packSize : item.quantity,
          casesOrdered: item.sellingUnit === 'CASE' ? item.quantity : 0,
          orderMode: item.sellingUnit === 'CASE' ? 'WHOLESALE' : 'RETAIL',
        })),
        orderType: cart.some((i) => i.sellingUnit === 'CASE') ? 'WHOLESALE' : 'RETAIL',
        customerName: customerName.trim() || 'Walk-in Customer',
        customerMobile: customerMobile.trim(),
        discount: discountAmount,
        paymentMethod,
        paymentReference: paymentMethod !== 'SPLIT' ? paymentReference : undefined,
        paymentSplit:
          paymentMethod === 'SPLIT'
            ? splits.map((s) => ({
                method: s.method,
                amount: Number(Number(s.amount).toFixed(2)),
                reference: s.reference || '',
              }))
            : undefined,
        adminNotes: adminNotes.trim(),
      };

      const res = await adminApi.createInStoreOrder(payload);
      const created = res.data.data.order;
      toast.success(`In-Store Order ${created.orderNumber} recorded!`);

      // Open receipt modal
      setCompletedOrder(created);
      setReceiptMobile(created.inStoreCustomer?.mobile || customerMobile || '');

      // Refresh products stock in background
      productApi.list({ limit: 100, isActive: 'true' }).then((r) => {
        setProducts(r.data.data.items || []);
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to record in-store order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewOrder = () => {
    setCompletedOrder(null);
    setReceiptMobile('');
    setCart([]);
    setCustomerName('Walk-in Customer');
    setCustomerMobile('');
    setDiscount(0);
    setAdminNotes('');
    setPaymentMethod('CASH');
    setPaymentReference('');
    setSplits([
      { method: 'PHONEPE', amount: '', reference: '' },
      { method: 'CASH', amount: '', reference: '' },
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white shadow-sm">
              <Store size={20} />
            </span>
            <h1 className="font-display text-2xl font-bold text-brand-900">
              In-Store POS / Counter Billing
            </h1>
          </div>
          <p className="text-xs text-muted">
            Record physical counter sales, manage instant inventory deduction & split payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/orders" className="btn btn-secondary text-sm">
            <ArrowLeft size={16} /> View Orders
          </Link>
          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="btn btn-secondary text-sm text-red-600 hover:bg-red-50"
          >
            <RotateCcw size={16} /> Clear Bill
          </button>
        </div>
      </div>

      {/* Main Grid: Left Catalog, Right Order Desk */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Side: Product Selector (7 cols) */}
        <div className="space-y-3 lg:col-span-7">
          {/* Search & Category Filter */}
          <div className="card-soft p-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                placeholder="Search products by name, brand, SKU or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={cn(
                  'rounded-full px-3 py-1 font-medium transition',
                  !selectedCategory
                    ? 'bg-brand-800 text-white'
                    : 'bg-brand-50 text-brand-800 hover:bg-brand-100'
                )}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setSelectedCategory(cat._id)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-3 py-1 font-medium transition',
                    selectedCategory === cat._id
                      ? 'bg-brand-800 text-white'
                      : 'bg-brand-50 text-brand-800 hover:bg-brand-100'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List */}
          <div className="card-soft h-[calc(100vh-280px)] overflow-y-auto p-3">
            {loadingCatalog ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-16 w-full" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center text-muted">
                <Store size={40} className="mb-2 opacity-30" />
                <p className="font-semibold">No matching products found</p>
                <p className="text-xs">Try a different search query or category filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="rounded-xl border border-brand-100 bg-white/70 p-3 shadow-xs transition hover:border-brand-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-contain bg-slate-50 p-1 border border-brand-50"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 font-bold text-xs">
                            {product.brand?.[0] || 'SB'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-display font-bold text-sm text-brand-950">
                            {product.name}
                          </h3>
                          <p className="text-xs text-muted">
                            {product.brand || 'Sri Balaji'} · {product.variants?.length || 0} variant(s)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Variant Actions */}
                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {product.variants?.map((variant) => {
                        const stockInfo = getStockLabel(variant);
                        const isOutOfStock = variant.stockQuantity <= 0;
                        const packSize = variant.wholesalePackSize || 1;
                        const casePrice =
                          variant.wholesaleCasePrice != null
                            ? variant.wholesaleCasePrice
                            : variant.wholesalePrice != null
                              ? Number((variant.wholesalePrice * packSize).toFixed(2))
                              : variant.retailPrice != null
                                ? Number((variant.retailPrice * packSize * 0.9).toFixed(2))
                                : null;

                        return (
                          <div
                            key={variant._id}
                            className={cn(
                              'flex flex-col justify-between rounded-lg border p-2 text-xs transition',
                              isOutOfStock
                                ? 'border-slate-200 bg-slate-50 opacity-60'
                                : 'border-brand-50 bg-brand-50/30 hover:bg-brand-50/70'
                            )}
                          >
                            <div className="flex items-center justify-between font-semibold">
                              <span>{variant.name}</span>
                              <span className={cn('badge text-[10px] py-0.5', stockInfo.tone)}>
                                {variant.stockQuantity} pcs
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between text-muted text-[11px]">
                              <div>
                                Piece: <strong className="text-brand-900">{formatINR(variant.retailPrice)}</strong>
                                {variant.mrp && variant.mrp > variant.retailPrice && (
                                  <span className="ml-1 line-through text-[10px] opacity-70">
                                    {formatINR(variant.mrp)}
                                  </span>
                                )}
                              </div>
                              {casePrice != null && (
                                <div>
                                  Case: <strong className="text-brand-900">{formatINR(casePrice)}</strong>{' '}
                                  <span className="text-[10px]">({packSize}p)</span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Add Piece vs Add Case */}
                            <div className="mt-2 flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={() => addToCart(product, variant, 'PIECE')}
                                className="flex-1 rounded-md bg-brand-700 py-1 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-50"
                              >
                                + Piece
                              </button>
                              {casePrice != null && (
                                <button
                                  type="button"
                                  disabled={variant.stockQuantity < packSize}
                                  onClick={() => addToCart(product, variant, 'CASE')}
                                  className="flex-1 rounded-md bg-accent-500 py-1 font-semibold text-white transition hover:bg-accent-600 disabled:opacity-50"
                                >
                                  + Case
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Billing Desk & Payment Desk (5 cols) */}
        <div className="space-y-3 lg:col-span-5">
          {/* Customer Details */}
          <div className="card-soft p-3 text-xs">
            <h2 className="mb-2 font-display font-bold text-sm text-brand-900 flex items-center gap-1.5">
              <User size={15} className="text-brand-700" /> Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium text-muted mb-0.5">Customer Name</label>
                <input
                  type="text"
                  placeholder="Walk-in Customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-muted mb-0.5">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  className="input py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Cart Table */}
          <div className="card-soft p-3">
            <div className="flex items-center justify-between border-b border-brand-50 pb-2">
              <h2 className="font-display font-bold text-sm text-brand-900 flex items-center gap-1.5">
                <ShoppingCart size={16} className="text-brand-700" /> Counter Order Items (
                {cart.reduce((a, b) => a + b.quantity, 0)})
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] font-semibold text-red-600 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center text-muted">
                <ShoppingCart size={32} className="mb-1 opacity-20" />
                <p className="font-medium text-xs">Bill is empty</p>
                <p className="text-[11px]">Click items on the left to add to bill</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-brand-50 text-xs">
                {cart.map((item, idx) => (
                  <div key={`${item.productId}-${item.variantId}-${item.sellingUnit}`} className="py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-brand-950">{item.productName}</p>
                      <p className="text-[11px] text-muted">
                        {item.variantName} ·{' '}
                        <span
                          className={cn(
                            'font-medium',
                            item.sellingUnit === 'CASE' ? 'text-accent-600' : 'text-brand-700'
                          )}
                        >
                          {item.sellingUnit === 'CASE'
                            ? `Case (${item.packSize} pcs)`
                            : 'Piece'}
                        </span>{' '}
                        @ {formatINR(item.unitPrice)}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-brand-200 bg-white text-brand-800 hover:bg-brand-50"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div className="text-right min-w-[65px]">
                      <p className="font-bold text-brand-900">{formatINR(item.subtotal)}</p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bill Summary */}
            <div className="mt-3 space-y-1.5 border-t border-brand-100 pt-2 text-xs">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ''}
                  placeholder="0"
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="input w-24 py-1 text-right text-xs"
                />
              </div>
              <div className="flex justify-between border-t border-brand-100 pt-1.5 text-sm font-bold text-brand-950">
                <span>Net Total</span>
                <span className="text-base text-brand-800">{formatINR(netTotal)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="card-soft p-3 text-xs space-y-3">
            <h2 className="font-display font-bold text-sm text-brand-900 flex items-center gap-1.5">
              <DollarSign size={15} className="text-brand-700" /> Payment Mode
            </h2>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setPaymentMethod(mode.id)}
                  className={cn(
                    'rounded-lg py-1.5 text-center font-semibold transition',
                    paymentMethod === mode.id
                      ? 'bg-brand-800 text-white shadow-xs'
                      : 'border border-brand-100 bg-white text-muted hover:border-brand-300'
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* If Single Payment Mode */}
            {paymentMethod !== 'SPLIT' && (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-2.5">
                <p className="text-muted">
                  Full payment of <strong className="text-brand-900">{formatINR(netTotal)}</strong> via{' '}
                  <span className="font-semibold text-brand-800">{paymentMethod}</span>.
                </p>
                {paymentMethod !== 'CASH' && (
                  <div className="mt-2">
                    <label className="block text-[11px] text-muted mb-0.5">
                      Transaction / UPI Ref (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI Ref / Bank UTR"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="input py-1 text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* If Split Payment Mode */}
            {paymentMethod === 'SPLIT' && (
              <div className="space-y-2 rounded-xl border border-brand-200 bg-brand-50/40 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-900">Split Payment Breakdown</span>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyPresetSplit(0.3, 0.7)}
                      className="rounded-md bg-brand-700 px-2 py-0.5 font-bold text-[10px] text-white hover:bg-brand-800"
                      title="Set 30% PhonePe and 70% Cash"
                    >
                      30% PhonePe / 70% Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetSplit(0.5, 0.5)}
                      className="rounded-md bg-brand-100 px-2 py-0.5 font-bold text-[10px] text-brand-800 hover:bg-brand-200"
                    >
                      50 / 50
                    </button>
                  </div>
                </div>

                {/* Split Rows */}
                <div className="space-y-1.5">
                  {splits.map((split, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-1.5">
                      <select
                        value={split.method}
                        onChange={(e) => updateSplit(sIdx, 'method', e.target.value)}
                        className="input w-28 py-1 text-xs"
                      >
                        {SPLIT_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={split.amount}
                          onChange={(e) => updateSplit(sIdx, 'amount', e.target.value)}
                          className="input pl-6 py-1 text-xs font-semibold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fillRemainingSplit(sIdx)}
                        title="Fill remaining balance"
                        className="rounded-md border border-brand-200 bg-white px-1.5 py-1 text-[10px] font-semibold text-brand-800 hover:bg-brand-50"
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSplitRow(sIdx)}
                        className="text-muted hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addSplitRow}
                  className="text-brand-800 font-semibold text-[11px] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add another payment mode
                </button>

                {/* Balance validation indicator */}
                <div
                  className={cn(
                    'mt-2 flex items-center justify-between rounded-lg p-2 text-xs font-semibold',
                    isSplitBalanced
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {isSplitBalanced ? (
                      <CheckCircle2 size={15} className="text-emerald-700" />
                    ) : (
                      <AlertCircle size={15} className="text-amber-700" />
                    )}
                    <span>
                      {isSplitBalanced
                        ? 'Split balanced with Order Total'
                        : `Allocated: ₹${splitTotal.toFixed(2)} / ₹${netTotal.toFixed(2)}`}
                    </span>
                  </div>
                  <span>
                    {isSplitBalanced
                      ? `₹${splitTotal.toFixed(2)}`
                      : `Diff: ₹${splitDifference.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <input
                type="text"
                placeholder="Admin order notes (optional)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="input py-1.5 text-xs"
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              disabled={submitting || cart.length === 0 || (paymentMethod === 'SPLIT' && !isSplitBalanced)}
              onClick={handleSubmitOrder}
              className="btn btn-primary w-full py-2.5 text-sm font-bold shadow-md"
            >
              {submitting ? (
                'Recording Sale...'
              ) : (
                <>
                  <CheckCircle2 size={18} /> Record & Print Bill ({formatINR(netTotal)})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Completed Order Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            {/* Thermal Style Receipt Content */}
            <div className="print-area font-mono text-xs">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
                  {settings?.shopName || 'SRI BALAJI COOL DRINKS'}
                </h2>
                <p className="text-[11px] text-slate-600">{settings?.shopAddress || 'Main Road'}</p>
                <p className="text-[11px] text-slate-600">
                  Phone: {settings?.phoneNumber || '—'}
                </p>
                <div className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-0.5 font-sans font-bold text-emerald-800 text-[11px]">
                  IN-STORE COUNTER SALE
                </div>
              </div>

              <div className="my-3 space-y-1 text-slate-700 text-[11px]">
                <div className="flex justify-between">
                  <span>Bill No:</span>
                  <span className="font-bold text-slate-900">{completedOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(completedOrder.createdAt || Date.now()).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{completedOrder.inStoreCustomer?.fullName || 'Walk-in'}</span>
                </div>
                {completedOrder.inStoreCustomer?.mobile && (
                  <div className="flex justify-between">
                    <span>Mobile:</span>
                    <span>{completedOrder.inStoreCustomer.mobile}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-t border-b border-dashed border-slate-300 py-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-500 uppercase">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Price</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-200">
                    {completedOrder.items?.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1">
                          <p className="font-semibold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.variantName} ({item.sellingUnit})
                          </p>
                        </td>
                        <td className="py-1 text-center font-bold">{item.quantity}</td>
                        <td className="py-1 text-right">₹{item.unitPrice}</td>
                        <td className="py-1 text-right font-bold">₹{item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payments */}
              <div className="my-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{completedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-₹{completedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-slate-300 pt-1 text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span>₹{completedOrder.totalAmount?.toFixed(2)}</span>
                </div>

                {/* Payment Breakdown */}
                <div className="mt-2 rounded-lg bg-slate-50 p-2 border border-slate-200">
                  <p className="font-bold text-[10px] uppercase text-slate-500">Payment Breakdown</p>
                  {completedOrder.paymentSplit?.length > 0 ? (
                    completedOrder.paymentSplit.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>{s.method}:</span>
                        <span className="font-bold">₹{s.amount?.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between text-[11px]">
                      <span>{completedOrder.paymentMethod}:</span>
                      <span className="font-bold">₹{completedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500">
                <p>Thank you for shopping at Sri Balaji Cool Drinks!</p>
                <p>Visit again!</p>
              </div>
            </div>

            {/* WhatsApp Bill Box */}
            <div className="no-print mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-left">
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                WhatsApp Bill to Customer (PDF + Text):
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={receiptMobile}
                  onChange={(e) => setReceiptMobile(e.target.value)}
                  className="input py-1.5 text-xs bg-white flex-1"
                />
                <button
                  type="button"
                  onClick={() => sendWhatsAppBillWithPdf(completedOrder, settings, receiptMobile)}
                  className="btn bg-[#25D366] text-white hover:bg-[#20bd5a] py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title="Send formatted bill and PDF invoice via WhatsApp"
                >
                  <MessageCircle size={15} /> WhatsApp Bill
                </button>
              </div>
              <p className="mt-1 text-[10px] text-emerald-700">
                Sends complete itemized bill text &amp; official PDF invoice to the customer's WhatsApp.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="no-print mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => downloadInvoicePdf(completedOrder, settings)}
                className="btn btn-secondary flex-1 py-2 text-xs font-semibold"
                title="Download official PDF invoice"
              >
                <Download size={15} /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary flex-1 py-2 text-xs font-semibold"
              >
                <Printer size={15} /> Print Receipt
              </button>
              <button
                type="button"
                onClick={handleStartNewOrder}
                className="btn btn-secondary flex-1 py-2 text-xs font-semibold"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
