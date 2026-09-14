import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Package } from 'lucide-react';
import { toast } from 'sonner';
import { productApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

export default function Wholesale() {
  const { settings, user } = useAuth();
  const { mode, setMode } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await productApi.list({ sort: 'popular', limit: 20, availability: 'in_stock' });
        if (alive) setItems(res.data.data.items || []);
      } catch (err) {
        if (alive) {
          setItems([]);
          toast.error(err.response?.data?.message || 'Failed to load products');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const wa = settings?.whatsappNumber;
  const phone = settings?.phoneNumber;
  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';

  return (
    <div className="animate-fade-up">
      <section className="relative overflow-hidden border-b border-brand-100">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900" />
        <div className="container-app relative py-14 text-white md:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-400">
            Wholesale & Bulk Supplies
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-4xl font-800 md:text-5xl">
            Case rates for shops, canteens & bulk buyers
          </h1>
          <p className="mt-4 max-w-xl text-brand-100/85">
            {shopName} supplies cool drinks, water bottles, juices, and essentials at wholesale case
            pricing. All customers can switch between Retail and Wholesale mode anytime.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {mode !== 'WHOLESALE' ? (
              <button
                type="button"
                className="btn bg-accent-500 hover:bg-accent-600 text-white font-bold"
                onClick={() => {
                  setMode('WHOLESALE');
                  toast.success('Switched to Wholesale mode');
                }}
              >
                Switch to Wholesale Mode
              </button>
            ) : (
              <span className="badge bg-accent-500/20 border border-accent-400 text-accent-200 px-3 py-1.5 text-sm font-bold">
                ✓ Currently in Wholesale Mode
              </span>
            )}
            <Link to="/products" className="btn btn-secondary border-white/30 text-white hover:bg-white/10">
              Browse All Products
            </Link>
          </div>
        </div>
      </section>

      <div className="container-app py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Open to all customers & retailers',
            'Order by full case with wholesale rates',
            'Cash or UPI at store / on delivery',
          ].map((text) => (
            <div key={text} className="rounded-2xl border border-brand-100 bg-white/80 p-5">
              <Package className="text-brand-700" size={22} />
              <p className="mt-3 font-semibold text-ink">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-700">Wholesale Catalogue</h2>
              <p className="text-muted text-sm">
                Current shopping mode:{' '}
                <span className="font-bold text-brand-800 uppercase">{mode}</span>
                {mode !== 'WHOLESALE' && ' (Prices shown below reflect Retail mode; switch to Wholesale to see case prices)'}
              </p>
            </div>
            {mode !== 'WHOLESALE' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setMode('WHOLESALE');
                  toast.success('Switched to Wholesale mode');
                }}
              >
                Switch to Wholesale Mode
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setMode('RETAIL');
                  toast.success('Switched to Retail mode');
                }}
              >
                Switch to Retail Mode
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded-2xl" />
              ))}
            </div>
          ) : items.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState title="No products available" actionLabel="Browse shop" to="/products" />
          )}
        </div>

        <div className="mt-12 card-soft max-w-2xl p-6">
          <h2 className="font-display text-xl font-700">Need Custom or Large Bulk Orders?</h2>
          <p className="mt-2 text-muted text-sm">
            For truckloads, party supplies, function orders, or questions about stock availability, reach out directly to Sri Balaji Store.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {wa ? (
              <a
                href={`https://wa.me/91${String(wa).replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(
                  'Hi, I have a wholesale enquiry for Sri Balaji Store.'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <MessageCircle size={16} /> WhatsApp Store
              </a>
            ) : null}
            {phone ? (
              <a href={`tel:${phone}`} className="btn btn-secondary">
                Call {phone}
              </a>
            ) : (
              <Link to="/contact" className="btn btn-secondary">
                Contact Store
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
