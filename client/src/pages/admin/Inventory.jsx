import { useCallback, useEffect, useState } from 'react';
import { History, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { formatINR, statusTone, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [adjust, setAdjust] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.inventory({
        search: search || undefined,
        status: status || undefined,
      });
      setItems(res.data.data.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openHistory = async (row) => {
    setHistory(row);
    try {
      const res = await adminApi.stockHistory(row.variantId);
      setHistoryRows(res.data.data.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load history');
      setHistoryRows([]);
    }
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    if (!adjust) return;
    setBusy(true);
    try {
      await adminApi.adjustStock(adjust.variantId, {
        productId: adjust.productId,
        action: adjust.action,
        quantity: Number(adjust.quantity),
        note: adjust.note || '',
      });
      toast.success('Stock updated');
      setAdjust(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Adjustment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-800">Inventory</h1>
        <p className="text-sm text-muted">{items.length} active variants</p>
      </div>

      <div className="card-soft grid gap-3 p-4 md:grid-cols-3">
        <input
          className="input md:col-span-2"
          placeholder="Search product, variant, SKU, barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All stock statuses</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </div>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="p-4">
            <EmptyState title="No inventory rows" description="No variants match these filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-brand-50/70 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Threshold</th>
                  <th className="px-4 py-3">Retail</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.variantId} className="border-t border-brand-50">
                    <td className="px-4 py-3">
                      <span className="font-semibold">{row.productName}</span>
                      <span className="block text-xs text-muted">{row.variantName}</span>
                    </td>
                    <td className="px-4 py-3">{row.sku || '—'}</td>
                    <td className="px-4 py-3 font-semibold">{row.stockQuantity}</td>
                    <td className="px-4 py-3">{row.lowStockThreshold}</td>
                    <td className="px-4 py-3">{formatINR(row.retailPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('badge', statusTone(row.status))}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand-700"
                          onClick={() =>
                            setAdjust({
                              ...row,
                              action: 'add',
                              quantity: '',
                              note: '',
                            })
                          }
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          className="text-xs font-semibold text-muted"
                          onClick={() => openHistory(row)}
                        >
                          <History size={14} className="inline" /> History
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

      {adjust && (
        <Modal title={`Adjust · ${adjust.productName} / ${adjust.variantName}`} onClose={() => setAdjust(null)}>
          <form onSubmit={submitAdjust} className="space-y-3">
            <p className="text-sm text-muted">Current stock: {adjust.stockQuantity}</p>
            <select
              className="input"
              value={adjust.action}
              onChange={(e) => setAdjust((a) => ({ ...a, action: e.target.value }))}
            >
              <option value="add">Add</option>
              <option value="remove">Remove</option>
              <option value="set">Set to</option>
            </select>
            <input
              className="input"
              type="number"
              min="0"
              required
              placeholder="Quantity"
              value={adjust.quantity}
              onChange={(e) => setAdjust((a) => ({ ...a, quantity: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Note (optional)"
              value={adjust.note}
              onChange={(e) => setAdjust((a) => ({ ...a, note: e.target.value }))}
            />
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? 'Saving…' : 'Update stock'}
            </button>
          </form>
        </Modal>
      )}

      {history && (
        <Modal
          title={`History · ${history.productName} / ${history.variantName}`}
          onClose={() => {
            setHistory(null);
            setHistoryRows([]);
          }}
        >
          {!historyRows.length ? (
            <p className="text-sm text-muted">No transactions yet</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
              {historyRows.map((h) => (
                <li key={h._id} className="rounded-xl border border-brand-50 p-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{h.type}</span>
                    <span className="text-xs text-muted">
                      {h.createdAt ? new Date(h.createdAt).toLocaleString('en-IN') : ''}
                    </span>
                  </div>
                  <p className="mt-1">
                    Δ {h.quantity} · {h.previousStock} → {h.newStock}
                  </p>
                  {h.note ? <p className="text-xs text-muted">{h.note}</p> : null}
                  <p className="text-xs text-muted">{h.createdBy?.fullName || ''}</p>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div className="card-soft w-full max-w-lg p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-700">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-brand-50">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
