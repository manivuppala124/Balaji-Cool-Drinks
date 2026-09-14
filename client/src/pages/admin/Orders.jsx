import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { formatINR, statusTone, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

const STATUS_OPTIONS = [
  '',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const emptyFilters = {
  orderNumber: '',
  orderStatus: '',
  paymentStatus: '',
  paymentMethod: '',
  orderType: '',
  from: '',
  to: '',
  sort: 'newest',
};

export default function Orders() {
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, sort: applied.sort };
      Object.entries(applied).forEach(([k, v]) => {
        if (k !== 'sort' && v) params[k] = v;
      });
      const res = await adminApi.orders(params);
      setData(res.data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
    setApplied({ ...filters });
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-800">Orders</h1>
          <p className="text-sm text-muted">{data.pagination?.total || 0} total</p>
        </div>
        <button type="button" className="btn btn-secondary text-sm" onClick={load}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <form onSubmit={applyFilters} className="card-soft grid gap-3 p-4 md:grid-cols-4 lg:grid-cols-6">
        <input
          className="input"
          placeholder="Order number"
          value={filters.orderNumber}
          onChange={(e) => setFilters((f) => ({ ...f, orderNumber: e.target.value }))}
        />
        <select
          className="input"
          value={filters.orderStatus}
          onChange={(e) => setFilters((f) => ({ ...f, orderStatus: e.target.value }))}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s || 'All statuses'}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={filters.paymentStatus}
          onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
        >
          <option value="">All payments</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="NOT_APPLICABLE">NOT_APPLICABLE</option>
        </select>
        <select
          className="input"
          value={filters.paymentMethod}
          onChange={(e) => setFilters((f) => ({ ...f, paymentMethod: e.target.value }))}
        >
          <option value="">All methods</option>
          <option value="CASH">CASH</option>
          <option value="UPI">UPI</option>
        </select>
        <select
          className="input"
          value={filters.orderType}
          onChange={(e) => setFilters((f) => ({ ...f, orderType: e.target.value }))}
        >
          <option value="">All types</option>
          <option value="RETAIL">RETAIL</option>
          <option value="WHOLESALE">WHOLESALE</option>
        </select>
        <select
          className="input"
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount_high">Amount high</option>
          <option value="amount_low">Amount low</option>
        </select>
        <input
          type="date"
          className="input"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
        />
        <input
          type="date"
          className="input"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
        />
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="btn btn-primary text-sm">
            <Filter size={16} /> Apply
          </button>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => {
              setFilters(emptyFilters);
              setApplied(emptyFilters);
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        ) : !data.items?.length ? (
          <div className="p-4">
            <EmptyState title="No orders found" description="Try adjusting filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-brand-50/70 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o) => (
                  <tr key={o._id} className="border-t border-brand-50 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${o._id}`}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {o.customerId?.fullName || '—'}
                      <span className="block text-xs text-muted">{o.customerId?.mobile}</span>
                    </td>
                    <td className="px-4 py-3">{o.orderType}</td>
                    <td className="px-4 py-3">
                      <span className="block">{o.paymentMethod}</span>
                      <span className={cn('badge mt-1', statusTone(o.paymentStatus))}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', statusTone(o.orderStatus))}>{o.orderStatus}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatINR(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.pagination?.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="btn btn-secondary text-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {data.pagination.page} of {data.pagination.pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            disabled={page >= data.pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
