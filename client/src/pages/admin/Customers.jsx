import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { formatINR, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

export default function Customers() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [blocked, setBlocked] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.customers({
        page,
        limit: 20,
        search: search || undefined,
        type: type || undefined,
        blocked: blocked || undefined,
      });
      setItems(res.data.data.items || []);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, search, type, blocked]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id, data, okMsg) => {
    try {
      await adminApi.updateCustomer(id, data);
      toast.success(okMsg);
      load();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-800">Customers</h1>
        <p className="text-sm text-muted">{pagination.total || 0} customers</p>
      </div>

      <div className="card-soft grid gap-3 p-4 md:grid-cols-4">
        <input
          className="input md:col-span-2"
          placeholder="Search name, mobile, email…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input"
          value={type}
          onChange={(e) => {
            setPage(1);
            setType(e.target.value);
          }}
        >
          <option value="">All types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
        </select>
        <select
          className="input"
          value={blocked}
          onChange={(e) => {
            setPage(1);
            setBlocked(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="p-4">
            <EmptyState title="No customers" description="No matches for current filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-brand-50/70 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Spent</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id} className="border-t border-brand-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/customers/${c._id}`}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {c.fullName}
                      </Link>
                      <span className="block text-xs text-muted">{c.mobile}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.customerType}
                      {c.wholesaleApproved ? (
                        <span className="ml-1 badge bg-accent-500/15 text-accent-600">Approved</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{c.orderCount || 0}</td>
                    <td className="px-4 py-3">{formatINR(c.totalSpent)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'badge',
                          c.isBlocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        )}
                      >
                        {c.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand-700"
                          onClick={() =>
                            patch(
                              c._id,
                              {
                                customerType: 'WHOLESALE',
                                wholesaleApproved: true,
                              },
                              'Marked as wholesale'
                            )
                          }
                        >
                          Mark wholesale
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600"
                          onClick={() =>
                            patch(
                              c._id,
                              { isBlocked: !c.isBlocked },
                              c.isBlocked ? 'Customer unblocked' : 'Customer blocked'
                            )
                          }
                        >
                          {c.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
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
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
