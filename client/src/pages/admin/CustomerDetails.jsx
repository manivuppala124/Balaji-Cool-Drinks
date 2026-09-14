import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { formatINR, statusTone, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

export default function CustomerDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.customer(id);
      setData(res.data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load customer');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body, msg) => {
    try {
      await adminApi.updateCustomer(id, body);
      toast.success(msg);
      load();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  if (loading) return <div className="skeleton h-80" />;
  if (!data?.customer) {
    return (
      <EmptyState
        title="Customer not found"
        actionLabel="Back to customers"
        to="/admin/customers"
      />
    );
  }

  const { customer, orders, stats } = data;

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/customers" className="rounded-xl bg-brand-50 p-2 text-brand-800">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-800">{customer.fullName}</h1>
            <p className="text-sm text-muted">
              {customer.mobile}
              {customer.email ? ` · ${customer.email}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() =>
              patch(
                { customerType: 'WHOLESALE', wholesaleApproved: true },
                'Marked as wholesale'
              )
            }
          >
            Mark wholesale
          </button>
          <button
            type="button"
            className="btn btn-danger text-sm"
            onClick={() =>
              patch(
                { isBlocked: !customer.isBlocked },
                customer.isBlocked ? 'Unblocked' : 'Blocked'
              )
            }
          >
            {customer.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Type" value={customer.customerType} />
        <Stat
          label="Wholesale"
          value={customer.wholesaleApproved ? 'Approved' : customer.wholesaleCustomer ? 'Pending' : 'No'}
        />
        <Stat label="Orders" value={stats?.orderCount || 0} />
        <Stat label="Total spent" value={formatINR(stats?.totalSpent)} />
      </div>

      <div className="card-soft p-4">
        <h2 className="font-display font-700">Addresses</h2>
        {!customer.addresses?.length ? (
          <p className="mt-2 text-sm text-muted">No saved addresses</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {customer.addresses.map((a) => (
              <li key={a._id} className="rounded-xl border border-brand-50 p-3 text-sm">
                <p className="font-semibold">
                  {a.label} {a.isDefault ? '· Default' : ''}
                </p>
                <p>
                  {a.fullName} · {a.mobile}
                </p>
                <p className="text-muted">
                  {a.addressLine}
                  {a.area ? `, ${a.area}` : ''}
                </p>
                <p className="text-muted">
                  {[a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card-soft overflow-hidden">
        <div className="border-b border-brand-50 px-4 py-3">
          <h2 className="font-display font-700">Order history</h2>
        </div>
        {!orders?.length ? (
          <p className="p-4 text-sm text-muted">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-brand-50/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-brand-50">
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/admin/orders/${o._id}`}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-2.5">{o.orderType}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('badge', statusTone(o.orderStatus))}>{o.orderStatus}</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold">{formatINR(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-700">{value}</p>
    </div>
  );
}
