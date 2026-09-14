import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderApi } from '../services/endpoints';
import { formatINR } from '../utils/format';

export default function Checkout() {
  const { user, settings, refreshUser } = useAuth();
  const { items, mode, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerNotes, setCustomerNotes] = useState('');
  const [addressId, setAddressId] = useState(user?.addresses?.find((a) => a.isDefault)?._id || user?.addresses?.[0]?._id || '');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const selected = useMemo(
    () => user?.addresses?.find((a) => String(a._id) === String(addressId)),
    [user, addressId]
  );

  const delivery =
    settings?.deliveryAvailable === false
      ? 0
      : settings?.freeDeliveryThreshold && subtotal >= settings.freeDeliveryThreshold
        ? 0
        : Number(settings?.deliveryCharge || 0);
  const total = subtotal + delivery;

  if (!items.length) {
    return (
      <div className="container-app py-10">
        <div className="card-soft p-8 text-center">Cart is empty. Add products before checkout.</div>
      </div>
    );
  }

  const placeOrder = async () => {
    if (!selected) {
      toast.error('Select a delivery address');
      return;
    }
    setSubmitting(true);
    try {
      const idempotencyKey = `${user._id}-${Date.now()}-${items.length}`;
      const hasWholesale = items.some((i) => i.sellingUnit === 'CASE' || i.mode === 'WHOLESALE');
      const res = await orderApi.create({
        paymentMethod,
        orderType: hasWholesale ? 'WHOLESALE' : 'RETAIL',
        customerNotes,
        idempotencyKey,
        deliveryAddress: {
          fullName: selected.fullName,
          mobile: selected.mobile,
          addressLine: selected.addressLine,
          area: selected.area,
          landmark: selected.landmark,
          pincode: selected.pincode,
          city: selected.city,
          state: selected.state,
        },
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.sellingUnit === 'CASE' ? i.casesOrdered : i.quantity,
          sellingUnit: i.sellingUnit,
          casesOrdered: i.casesOrdered,
          orderMode: i.mode || (i.sellingUnit === 'CASE' ? 'WHOLESALE' : 'RETAIL'),
        })),
      });
      const order = res.data.data.order;
      clearCart();
      toast.success('Order placed');
      navigate(`/orders/success/${order._id}`);
    } catch (err) {
      toast.error(err.message || 'Order failed');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="container-app py-8 animate-fade-up">
      <h1 className="font-display text-3xl font-800 text-brand-800">Checkout</h1>
      <p className="text-muted">Review address, payment mode and confirm. No online payment gateway.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-4">
          <section className="card-soft p-5">
            <h2 className="font-display text-xl font-700">Customer</h2>
            <p className="mt-2">{user?.fullName}</p>
            <p className="text-sm text-muted">{user?.mobile}</p>
          </section>

          <section className="card-soft p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-700">Delivery address</h2>
              <button type="button" className="text-sm font-semibold text-brand-700" onClick={() => navigate('/addresses')}>
                Manage
              </button>
            </div>
            {!user?.addresses?.length ? (
              <p className="mt-3 text-muted">No addresses. Add one in profile/addresses.</p>
            ) : (
              <div className="mt-3 grid gap-2">
                {user.addresses.map((a) => (
                  <label key={a._id} className={`flex gap-3 rounded-xl border p-3 cursor-pointer ${String(addressId) === String(a._id) ? 'border-brand-700 bg-brand-50' : 'border-brand-100'}`}>
                    <input type="radio" name="address" checked={String(addressId) === String(a._id)} onChange={() => setAddressId(a._id)} />
                    <span>
                      <span className="font-semibold block">{a.label || 'Address'} · {a.fullName}</span>
                      <span className="text-sm text-muted">
                        {a.addressLine}, {a.area} {a.landmark} · {a.pincode} · {a.mobile}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="card-soft p-5">
            <h2 className="font-display text-xl font-700">Payment method</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {settings?.allowCashOrders !== false && (
                <button type="button" className={`rounded-xl border p-4 text-left ${paymentMethod === 'CASH' ? 'border-brand-700 bg-brand-50' : 'border-brand-100'}`} onClick={() => setPaymentMethod('CASH')}>
                  <p className="font-700">Cash at Store</p>
                  <p className="text-sm text-muted">Pay when you collect / on delivery arrangement</p>
                </button>
              )}
              {settings?.allowUpiOrders !== false && (
                <button type="button" className={`rounded-xl border p-4 text-left ${paymentMethod === 'UPI' ? 'border-brand-700 bg-brand-50' : 'border-brand-100'}`} onClick={() => setPaymentMethod('UPI')}>
                  <p className="font-700">UPI</p>
                  <p className="text-sm text-muted">Recorded as UPI — pay manually to the shop</p>
                </button>
              )}
            </div>
          </section>

          <section className="card-soft p-5">
            <h2 className="font-display text-xl font-700">Order notes</h2>
            <textarea className="input mt-3 min-h-24" placeholder="Example: Please deliver after 6 PM" value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
          </section>
        </div>

        <aside className="card-soft p-5 h-fit sticky top-24">
          <h2 className="font-display text-xl font-700">Order summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <div key={`${i.variantId}-${i.sellingUnit}-${i.mode || 'RETAIL'}`} className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{i.productName}</p>
                  <p className="text-xs text-muted">
                    {i.variantName} × {i.sellingUnit === 'CASE' ? `${i.casesOrdered} cs (${i.packSize} pcs/cs)` : `${i.quantity} pcs`}
                    {i.sellingUnit === 'CASE' ? ' · Wholesale' : i.mode === 'WHOLESALE' ? ' · Wholesale' : ' · Retail'}
                  </p>
                </div>
                <span className="font-semibold">{formatINR(i.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatINR(delivery)}</span></div>
            <div className="flex justify-between font-display text-lg font-700"><span>Total</span><span>{formatINR(total)}</span></div>
            <p className="text-xs text-muted">
              Order: {items.some((i) => i.sellingUnit === 'CASE' || i.mode === 'WHOLESALE') ? 'Wholesale/Mixed' : 'Retail'} · Pay: {paymentMethod}
            </p>
          </div>
          <button type="button" className="btn btn-primary mt-5 w-full" disabled={submitting} onClick={() => setConfirmOpen(true)}>
            Confirm Order
          </button>
        </aside>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="card-soft max-w-md w-full p-6">
            <h3 className="font-display text-xl font-700">Confirm order?</h3>
            <p className="mt-2 text-sm text-muted">Total {formatINR(total)} via {paymentMethod}. Prices are verified by the store server.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn btn-secondary flex-1" disabled={submitting} onClick={() => setConfirmOpen(false)}>Back</button>
              <button type="button" className="btn btn-primary flex-1" disabled={submitting} onClick={placeOrder}>
                {submitting ? 'Placing...' : 'Place order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
