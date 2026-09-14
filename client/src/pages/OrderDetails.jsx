import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { orderApi } from '../services/endpoints';
import OrderTracker from '../components/OrderTracker';
import { formatINR, statusTone } from '../utils/format';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderApi.get(id);
        setOrder(res.data.data.order);
      } catch (err) {
        toast.error(err.message || 'Failed to load order');
      }
    })();
  }, [id]);

  if (!order) return <div className="container-app py-10">Loading...</div>;

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-800 text-brand-800">{order.orderNumber}</h1>
          <p className="text-muted">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <span className={`badge ${statusTone(order.orderStatus)}`}>{order.orderStatus}</span>
      </div>

      <div className="mt-6">
        <OrderTracker status={order.orderStatus} statusHistory={order.statusHistory} />
        {order.orderStatus === 'CANCELLED' && order.cancellationReason ? (
          <p className="mt-4 text-sm text-red-700">Cancelled: {order.cancellationReason}</p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card-soft p-5">
          <h2 className="font-display text-xl font-700">Items</h2>
          <div className="mt-3 space-y-2 text-sm">
            {order.items.map((i) => (
              <div key={i._id} className="flex justify-between gap-2 border-b border-brand-50 py-2">
                <span>{i.productName} ({i.variantName}) × {i.quantity}</span>
                <span className="font-semibold">{formatINR(i.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{formatINR(order.deliveryCharge)}</span></div>
            <div className="flex justify-between font-700"><span>Total</span><span>{formatINR(order.totalAmount)}</span></div>
          </div>
        </div>
        <div className="card-soft p-5 text-sm space-y-2">
          <h2 className="font-display text-xl font-700">Delivery & payment</h2>
          <p>{order.deliveryAddress?.fullName} · {order.deliveryAddress?.mobile}</p>
          <p>{order.deliveryAddress?.addressLine}, {order.deliveryAddress?.area} {order.deliveryAddress?.pincode}</p>
          <p>Payment: {order.paymentMethod} · {order.paymentStatus}</p>
          <p>Type: {order.orderType}</p>
          {order.customerNotes ? <p>Notes: {order.customerNotes}</p> : null}
        </div>
      </div>
    </div>
  );
}
