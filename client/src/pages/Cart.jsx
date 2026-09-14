import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { formatINR } from '../utils/format';

export default function Cart() {
  const { items, updateQuantity, removeItem, clearCart, subtotal, mode } = useCart();
  const { settings } = useAuth();
  const navigate = useNavigate();

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
        <EmptyState title="Your cart is empty" description="Add cool drinks, water or wholesale packs to continue." actionLabel="Browse products" to="/products" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-800 text-brand-800">Cart</h1>
          <p className="text-muted">
            Browsing mode: <span className="font-semibold text-brand-700">{mode}</span> · You can mix Retail and Wholesale items
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={clearCart}>Clear cart</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={`${item.variantId}-${item.sellingUnit}-${item.mode || 'RETAIL'}`} className="card-soft p-4 flex flex-wrap gap-4 items-center">
              <div className="h-16 w-16 rounded-xl bg-brand-50 grid place-items-center font-display font-700 text-brand-700 overflow-hidden">
                {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : item.productName.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-display font-700">{item.productName}</span>
                  {item.sellingUnit === 'CASE' ? (
                    <span className="inline-block rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      Wholesale Case
                    </span>
                  ) : item.mode === 'WHOLESALE' ? (
                    <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      Wholesale Piece
                    </span>
                  ) : (
                    <span className="inline-block rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 border border-brand-200">
                      Retail Piece
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {item.variantName}
                  {item.sellingUnit === 'CASE'
                    ? ` · ${item.casesOrdered} case(s) (${item.packSize} ${item.packUnit || 'pcs'}/case)`
                    : ''}
                </p>
                <p className="font-semibold text-brand-800">{formatINR(item.unitPrice)} each</p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const step = item.sellingUnit === 'CASE' && item.packSize ? item.packSize : 1;
                  return (
                    <>
                      <button
                        type="button"
                        className="rounded-lg border p-1 hover:bg-brand-50"
                        onClick={() => updateQuantity(item.variantId, item.sellingUnit, item.quantity - step, item.mode)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-12 text-center font-semibold text-sm">
                        {item.sellingUnit === 'CASE'
                          ? `${item.casesOrdered} cs`
                          : item.quantity}
                      </span>
                      <button
                        type="button"
                        className="rounded-lg border p-1 hover:bg-brand-50"
                        onClick={() => updateQuantity(item.variantId, item.sellingUnit, item.quantity + step, item.mode)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </>
                  );
                })()}
              </div>
              <p className="font-display font-700 w-24 text-right">{formatINR(item.subtotal)}</p>
              <button type="button" className="text-red-600" onClick={() => removeItem(item.variantId, item.sellingUnit, item.mode)}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        <aside className="card-soft p-5 h-fit sticky top-24">
          <h2 className="font-display text-xl font-700">Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatINR(delivery)}</span></div>
            <div className="flex justify-between border-t pt-2 font-display text-lg font-700">
              <span>Total</span><span>{formatINR(total)}</span>
            </div>
          </div>
          <button type="button" className="btn btn-primary mt-5 w-full" onClick={() => navigate('/checkout')}>
            Checkout
          </button>
          <Link to="/products" className="btn btn-secondary mt-2 w-full">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
