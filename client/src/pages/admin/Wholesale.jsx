import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { adminApi, productApi } from '../../services/endpoints';
import { formatINR, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

export default function Wholesale() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, prodRes] = await Promise.all([
        adminApi.customers({ type: 'WHOLESALE', limit: 100 }),
        productApi.list({ activeOnly: 'false', limit: 100 }),
      ]);
      setCustomers(custRes.data.data.items || []);
      const all = prodRes.data.data.items || [];
      setProducts(
        all
          .map((p) => ({
            ...p,
            wholesaleVariants: (p.variants || []).filter(
              (v) =>
                v.isActive !== false &&
                (v.wholesalePrice != null ||
                  v.wholesaleCasePrice != null ||
                  v.wholesalePackSize != null)
            ),
          }))
          .filter((p) => p.wholesaleVariants.length > 0)
      );
    } catch (err) {
      toast.error(err.message || 'Failed to load wholesale data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id, approved) => {
    try {
      await adminApi.updateCustomer(id, {
        wholesaleApproved: approved,
        customerType: approved ? 'WHOLESALE' : undefined,
      });
      toast.success(approved ? 'Wholesale approved' : 'Approval revoked');
      load();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-800">Wholesale</h1>
        <p className="text-sm text-muted">Wholesale customers and case-pack pricing</p>
      </div>

      <section className="card-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-50 px-4 py-3">
          <h2 className="font-display font-700">Wholesale customers</h2>
          <Link to="/admin/customers?type=WHOLESALE" className="text-sm font-semibold text-brand-700">
            All customers
          </Link>
        </div>
        {!customers.length ? (
          <div className="p-4">
            <EmptyState title="No wholesale customers" description="Mark customers as wholesale from the customers page." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-brand-50/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">Orders</th>
                  <th className="px-4 py-2.5">Spent</th>
                  <th className="px-4 py-2.5">Approval</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c._id} className="border-t border-brand-50">
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/admin/customers/${c._id}`}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {c.fullName}
                      </Link>
                      <span className="block text-xs text-muted">{c.mobile}</span>
                    </td>
                    <td className="px-4 py-2.5">{c.orderCount || 0}</td>
                    <td className="px-4 py-2.5">{formatINR(c.totalSpent)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          'badge',
                          c.wholesaleApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        )}
                      >
                        {c.wholesaleApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        className="text-xs font-semibold text-brand-700"
                        onClick={() => approve(c._id, !c.wholesaleApproved)}
                      >
                        {c.wholesaleApproved ? 'Revoke' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-soft overflow-hidden">
        <div className="border-b border-brand-50 px-4 py-3">
          <h2 className="font-display font-700">Products with wholesale / case packs</h2>
        </div>
        {!products.length ? (
          <div className="p-4">
            <EmptyState
              title="No wholesale pricing set"
              description="Edit a product to add pack size and case price."
              actionLabel="Products"
              to="/admin/products"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-brand-50/60 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">Variant</th>
                  <th className="px-4 py-2.5">Piece</th>
                  <th className="px-4 py-2.5">Pack</th>
                  <th className="px-4 py-2.5">Case</th>
                  <th className="px-4 py-2.5">Min qty</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {products.flatMap((p) =>
                  p.wholesaleVariants.map((v) => (
                    <tr key={`${p._id}-${v._id}`} className="border-t border-brand-50">
                      <td className="px-4 py-2.5 font-semibold">{p.name}</td>
                      <td className="px-4 py-2.5">{v.name}</td>
                      <td className="px-4 py-2.5">{formatINR(v.wholesalePrice)}</td>
                      <td className="px-4 py-2.5">
                        {v.wholesalePackSize
                          ? `${v.wholesalePackSize} ${v.wholesalePackUnit || 'pcs'}`
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">{formatINR(v.wholesaleCasePrice)}</td>
                      <td className="px-4 py-2.5">{v.minWholesaleQty ?? 1}</td>
                      <td className="px-4 py-2.5">{v.stockQuantity}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
