import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Briefcase,
  AlertTriangle,
  PackageX,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { formatINR, statusTone, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

const PIE_COLORS = ['#0d9488', '#f59e0b', '#0f766e', '#d97706', '#14b8a6'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesRange, setSalesRange] = useState('7');

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await adminApi.dashboard();
      setData(res.data.data);
    } catch (err) {
      if (!silent) toast.error(err.message || 'Failed to load dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 30000);
    return () => clearInterval(t);
  }, [load]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        description="Could not load live store metrics."
      />
    );
  }

  const { cards, charts, recentOrders, lowStockList, outOfStockList } = data;
  const salesData =
    salesRange === '7' ? charts?.sales7Days || [] : charts?.sales30Days || [];
  const topProducts = (charts?.topProducts || []).map((p) => ({
    name: p._id || 'Unknown',
    qty: p.qty,
    revenue: p.revenue,
  }));
  const retailWholesale = (charts?.retailVsWholesale || []).map((r) => ({
    name: r._id || 'Other',
    value: r.revenue,
    orders: r.orders,
  }));

  const cardItems = [
    { label: "Today's Sales", value: formatINR(cards.todaySales), icon: IndianRupee },
    { label: "Today's Orders", value: cards.todayOrders, icon: ShoppingBag },
    { label: 'Pending', value: cards.pendingOrders, icon: Clock },
    { label: 'Delivered', value: cards.completedOrders, icon: CheckCircle2 },
    { label: 'Cancelled', value: cards.cancelledOrders, icon: XCircle },
    { label: 'Customers', value: cards.totalCustomers, icon: Users },
    { label: 'Wholesale', value: cards.wholesaleCustomers, icon: Briefcase },
    { label: 'Low Stock', value: cards.lowStockItems, icon: AlertTriangle },
    { label: 'Out of Stock', value: cards.outOfStockItems, icon: PackageX },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-800 text-brand-900">Dashboard</h1>
          <p className="text-sm text-muted">Live store overview · refreshes every 30s</p>
        </div>
        <button type="button" className="btn btn-secondary text-sm" onClick={() => load()}>
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cardItems.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card-soft p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-1 font-display text-xl font-700 text-brand-900">{value}</p>
              </div>
              <span className="rounded-xl bg-brand-50 p-2 text-brand-700">
                <Icon size={18} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-soft p-4 xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-700">Sales trend</h2>
            <div className="flex rounded-xl bg-brand-50 p-1 text-xs font-bold">
              <button
                type="button"
                className={cn(
                  'rounded-lg px-3 py-1.5',
                  salesRange === '7' && 'bg-brand-700 text-white'
                )}
                onClick={() => setSalesRange('7')}
              >
                7 days
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-lg px-3 py-1.5',
                  salesRange === '30' && 'bg-brand-700 text-white'
                )}
                onClick={() => setSalesRange('30')}
              >
                30 days
              </button>
            </div>
          </div>
          {salesData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No sales in this period</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v, name) => (name === 'sales' ? formatINR(v) : v)} />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card-soft p-4">
          <h2 className="mb-3 font-display text-lg font-700">Retail vs Wholesale</h2>
          {retailWholesale.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">No revenue split yet</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={retailWholesale}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name }) => name}
                  >
                    {retailWholesale.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card-soft p-4">
        <h2 className="mb-3 font-display text-lg font-700">Top products</h2>
        {topProducts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No product sales yet</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, name) => (name === 'revenue' ? formatINR(v) : v)} />
                <Legend />
                <Bar dataKey="qty" fill="#0d9488" name="Qty" radius={[0, 6, 6, 0]} />
                <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-soft overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-50 px-4 py-3">
            <h2 className="font-display text-lg font-700">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-700">
              View all
            </Link>
          </div>
          {recentOrders?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-brand-50/60 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2.5">Order</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Total</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o._id} className="border-t border-brand-50/80">
                      <td className="px-4 py-2.5">
                        <Link
                          to={`/admin/orders/${o._id}`}
                          className="font-semibold text-brand-800 hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        {o.customerId?.fullName || '—'}
                        <span className="block text-xs text-muted">{o.customerId?.mobile}</span>
                      </td>
                      <td className="px-4 py-2.5">{o.orderType}</td>
                      <td className="px-4 py-2.5 font-semibold">{formatINR(o.totalAmount)}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn('badge', statusTone(o.orderStatus))}>
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-muted">No orders yet</p>
          )}
        </div>

        <div className="space-y-4">
          <StockPanel title="Low stock" items={lowStockList} tone="amber" />
          <StockPanel title="Out of stock" items={outOfStockList} tone="red" />
        </div>
      </div>
    </div>
  );
}

function StockPanel({ title, items, tone }) {
  return (
    <div className="card-soft p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-700">{title}</h3>
        <Link to="/admin/inventory" className="text-xs font-semibold text-brand-700">
          Inventory
        </Link>
      </div>
      {!items?.length ? (
        <p className="text-sm text-muted">None</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li
              key={`${item.product}-${item.variant}-${i}`}
              className="flex items-start justify-between gap-2 text-sm"
            >
              <span>
                <span className="font-semibold">{item.product}</span>
                <span className="block text-xs text-muted">{item.variant}</span>
              </span>
              <span
                className={cn(
                  'badge shrink-0',
                  tone === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                )}
              >
                {item.stock ?? 0}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
