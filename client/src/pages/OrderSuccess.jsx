import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { orderApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { formatINR, statusTone } from '../utils/format';

export default function OrderSuccess() {
  const { id } = useParams();
  const { settings } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderApi.get(id);
        setOrder(res.data.data.order);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="container-app py-10">Loading receipt...</div>;
  if (!order) return <div className="container-app py-10">Order not found</div>;

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="mb-4 flex flex-wrap gap-2 no-print">
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print Order
        </button>
        <Link to={`/orders/${order._id}`} className="btn btn-primary">Track order</Link>
      </div>
      <div className="print-area card-soft p-6 md:p-8">
        <h1 className="font-display text-2xl font-800 text-brand-800">
          {settings?.shopName || 'Sri Balaji Cool Drinks & General Store'}
        </h1>
        <p className="text-emerald-700 font-semibold mt-2">Order placed successfully</p>
        <div className="mt-4 grid gap-1 text-sm">
          <p><strong>Order:</strong> {order.orderNumber}</p>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString('en-IN')}</p>
          <p><strong>Payment:</strong> {order.paymentMethod} · <span className={`badge ${statusTone(order.paymentStatus)}`}>{order.paymentStatus}</span></p>
          <p><strong>Status:</strong> <span className={`badge ${statusTone(order.orderStatus)}`}>{order.orderStatus}</span></p>
          <p><strong>Type:</strong> {order.orderType}</p>
        </div>
        <div className="mt-4 text-sm">
          <p className="font-semibold">Deliver to</p>
          <p>{order.deliveryAddress?.fullName} · {order.deliveryAddress?.mobile}</p>
          <p>{order.deliveryAddress?.addressLine}, {order.deliveryAddress?.area} {order.deliveryAddress?.pincode}</p>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i._id} className="border-b border-brand-50">
                <td className="py-2">{i.productName} ({i.variantName})</td>
                <td>{i.quantity}</td>
                <td>{formatINR(i.unitPrice)}</td>
                <td className="text-right">{formatINR(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{formatINR(order.deliveryCharge)}</span></div>
          <div className="flex justify-between font-display text-lg font-700"><span>Total</span><span>{formatINR(order.totalAmount)}</span></div>
        </div>
      </div>
    </div>
  );
}
