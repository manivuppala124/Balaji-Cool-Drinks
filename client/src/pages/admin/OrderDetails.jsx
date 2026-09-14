import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatINR, statusTone, cn, ORDER_STEPS } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

const NEXT_LABELS = {
  CONFIRMED: 'Confirm',
  PROCESSING: 'Process',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancel',
};

const FLOW = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderDetails() {
  const { id } = useParams();
  const { settings } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.order(id);
      const o = res.data.data.order;
      setOrder(o);
      setNotes(o.adminNotes || '');
    } catch (err) {
      toast.error(err.message || 'Failed to load order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (status) => {
    if (status === 'CANCELLED' && !cancelReason.trim()) {
      toast.error('Enter a cancellation reason');
      return;
    }
    setBusy(true);
    try {
      const res = await adminApi.updateOrderStatus(id, {
        status,
        note: status === 'CANCELLED' ? cancelReason : '',
        cancellationReason: cancelReason,
      });
      setOrder(res.data.data.order);
      toast.success(`Order marked ${status}`);
      setCancelReason('');
    } catch (err) {
      toast.error(err.message || 'Status update failed');
    } finally {
      setBusy(false);
    }
  };

  const markUpiPaid = async () => {
    setBusy(true);
    try {
      const res = await adminApi.updatePayment(id, { paymentStatus: 'PAID' });
      setOrder(res.data.data.order);
      toast.success('Payment marked as PAID');
    } catch (err) {
      toast.error(err.message || 'Payment update failed');
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      const res = await adminApi.updateNotes(id, { adminNotes: notes });
      setOrder(res.data.data.order);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save notes');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="skeleton h-96" />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been removed."
        actionLabel="Back to orders"
        to="/admin/orders"
      />
    );
  }

  const next = FLOW[order.orderStatus] || [];
  const addr = order.deliveryAddress || {};
  const stepIndex = ORDER_STEPS.indexOf(order.orderStatus);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/orders" className="rounded-xl bg-brand-50 p-2 text-brand-800">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-800">{order.orderNumber}</h1>
            <p className="text-sm text-muted">
              {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : ''}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-secondary text-sm" onClick={() => window.print()}>
          <Printer size={16} /> Print invoice
        </button>
      </div>

      <div className="print-area space-y-5">
        <div className="card-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xl font-800 text-brand-800">
                {settings?.shopName || 'Sri Balaji Cool Drinks & General Store'}
              </p>
              <p className="mt-1 text-sm text-muted">{settings?.shopAddress}</p>
              <p className="text-sm text-muted">Phone: {settings?.phoneNumber || '—'}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">Invoice / Order</p>
              <p>{order.orderNumber}</p>
              <p className="mt-2">
                <span className={cn('badge', statusTone(order.orderStatus))}>{order.orderStatus}</span>
              </p>
            </div>
          </div>

          <div className="no-print mt-6 flex flex-wrap gap-2">
            {ORDER_STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  'badge',
                  i <= stepIndex && order.orderStatus !== 'CANCELLED'
                    ? 'bg-brand-700 text-white'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {s.replaceAll('_', ' ')}
              </span>
            ))}
            {order.orderStatus === 'CANCELLED' && (
              <span className={cn('badge', statusTone('CANCELLED'))}>CANCELLED</span>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card-soft p-4 lg:col-span-2">
            <h2 className="font-display text-lg font-700">Items</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Unit</th>
                    <th className="py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item._id || `${item.productId}-${item.variantId}`} className="border-t border-brand-50">
                      <td className="py-2.5">
                        <span className="font-semibold">{item.productName}</span>
                        <span className="block text-xs text-muted">
                          {item.variantName}
                          {item.sellingUnit === 'CASE' ? ` · ${item.casesOrdered} case(s)` : ''}
                        </span>
                      </td>
                      <td className="py-2.5">{item.quantity}</td>
                      <td className="py-2.5">{formatINR(item.unitPrice)}</td>
                      <td className="py-2.5 font-semibold">{formatINR(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-1 border-t border-brand-50 pt-4 text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              <Row label="Discount" value={formatINR(order.discount)} />
              <Row label="Delivery" value={formatINR(order.deliveryCharge)} />
              <Row label="Total" value={formatINR(order.totalAmount)} bold />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-soft p-4 text-sm">
              <h3 className="font-display font-700">Customer / Delivery</h3>
              <p className="mt-2 font-semibold">{addr.fullName || '—'}</p>
              <p className="text-muted">{addr.mobile}</p>
              <p className="mt-2">
                {addr.addressLine}
                {addr.area ? `, ${addr.area}` : ''}
              </p>
              <p>
                {[addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
              </p>
              <p className="mt-3">
                Type: <strong>{order.orderType}</strong>
              </p>
              <p>
                Payment: <strong>{order.paymentMethod}</strong>{' '}
                <span className={cn('badge', statusTone(order.paymentStatus))}>
                  {order.paymentStatus}
                </span>
              </p>
              {order.customerNotes ? (
                <p className="mt-3 rounded-xl bg-brand-50 p-3 text-xs">
                  Customer note: {order.customerNotes}
                </p>
              ) : null}
              {order.cancellationReason ? (
                <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                  Cancel reason: {order.cancellationReason}
                </p>
              ) : null}
            </div>

            <div className="card-soft no-print space-y-3 p-4">
              <h3 className="font-display font-700">Actions</h3>
              <div className="flex flex-wrap gap-2">
                {next
                  .filter((s) => s !== 'CANCELLED')
                  .map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      className="btn btn-primary text-sm"
                      onClick={() => updateStatus(s)}
                    >
                      {NEXT_LABELS[s] || s}
                    </button>
                  ))}
                {order.paymentMethod === 'UPI' && order.paymentStatus !== 'PAID' && (
                  <button
                    type="button"
                    disabled={busy}
                    className="btn btn-secondary text-sm"
                    onClick={markUpiPaid}
                  >
                    Mark UPI Paid
                  </button>
                )}
              </div>
              {next.includes('CANCELLED') && (
                <div className="space-y-2 border-t border-brand-50 pt-3">
                  <input
                    className="input"
                    placeholder="Cancellation reason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    className="btn btn-danger w-full text-sm"
                    onClick={() => updateStatus('CANCELLED')}
                  >
                    Cancel order
                  </button>
                </div>
              )}
            </div>

            <div className="card-soft no-print p-4">
              <h3 className="font-display font-700">Admin notes</h3>
              <textarea
                className="input mt-2 min-h-24"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes…"
              />
              <button
                type="button"
                className="btn btn-secondary mt-2 w-full text-sm"
                disabled={busy}
                onClick={saveNotes}
              >
                <Save size={16} /> Save notes
              </button>
            </div>
          </div>
        </div>

        {order.statusHistory?.length > 0 && (
          <div className="card-soft no-print p-4">
            <h3 className="font-display font-700">Status history</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {order.statusHistory.map((h, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 border-b border-brand-50 pb-2">
                  <span className={cn('badge', statusTone(h.status))}>{h.status}</span>
                  <span className="text-muted">
                    {h.at ? new Date(h.at).toLocaleString('en-IN') : ''}
                  </span>
                  {h.note ? <span>· {h.note}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={cn('flex justify-between', bold && 'text-base font-700')}>
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
