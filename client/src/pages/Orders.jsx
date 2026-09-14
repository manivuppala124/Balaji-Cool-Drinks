import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { orderApi, productApi } from '../services/endpoints';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/EmptyState';
import { formatINR, statusTone } from '../utils/format';

export default function Orders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, clearCart, setMode } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const res = await orderApi.myOrders({ limit: 50 });
        setItems(res.data.data.items || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const reorder = async (order) => {
    try {
      clearCart();
      setMode(order.orderType || 'RETAIL');
      for (const line of order.items) {
        const res = await productApi.get(line.productId);
        const product = res.data.data.product;
        const variant = product.variants.find((v) => String(v._id) === String(line.variantId));
        if (!product?.isActive || !variant?.isActive || !variant?.isAvailable) {
          toast.error(`${line.productName} is unavailable now`);
          continue;
        }
        if (variant.stockQuantity < 1) {
          toast.error(`${line.productName} is out of stock`);
          continue;
        }
        const price =
          order.orderType === 'WHOLESALE'
            ? variant.wholesalePrice ?? variant.retailPrice
            : variant.retailPrice;
        if (price == null) {
          toast.error(`Price missing for ${line.productName}`);
          continue;
        }
        addItem({
          productId: product._id,
          variantId: variant._id,
          productName: product.name,
          variantName: variant.name,
          image: product.images?.[0] || '',
          mrp: variant.mrp,
          unitPrice: price,
          quantity: Math.min(line.quantity, variant.stockQuantity),
          stockQuantity: variant.stockQuantity,
          sellingUnit: 'PIECE',
        });
      }
      toast.success('Items added at current prices');
    } catch (err) {
      toast.error(err.message || 'Reorder failed');
    }
  };

  if (loading) return <div className="container-app py-10">Loading orders...</div>;
  if (!items.length) {
    return (
      <div className="container-app py-10">
        <EmptyState title="No orders yet" description="Your order history will appear here." actionLabel="Start shopping" to="/products" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 animate-fade-up">
      <h1 className="font-display text-3xl font-800 text-brand-800">My Orders</h1>
      <div className="mt-6 grid gap-3">
        {items.map((o) => (
          <div key={o._id} className="card-soft p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display font-700">{o.orderNumber}</p>
              <p className="text-sm text-muted">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
              <p className="mt-1 font-semibold">{formatINR(o.totalAmount)} · {o.paymentMethod}</p>
            </div>
            <span className={`badge ${statusTone(o.orderStatus)}`}>{o.orderStatus}</span>
            <div className="flex gap-2">
              <Link to={`/orders/${o._id}`} className="btn btn-secondary">View</Link>
              <button type="button" className="btn btn-primary" onClick={() => reorder(o)}>Reorder</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
