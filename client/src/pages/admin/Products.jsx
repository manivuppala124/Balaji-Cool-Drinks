import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Plus, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, productApi, categoryApi } from '../../services/endpoints';
import { formatINR, cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Products() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    categoryApi
      .list({ activeOnly: 'false' })
      .then((res) => setCategories(res.data.data.categories || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.list({
        page,
        limit: 20,
        search: search || undefined,
        category: category || undefined,
        activeOnly: 'false',
        sort: 'newest',
      });
      setItems(res.data.data.items || []);
      setPagination(res.data.data.pagination);
      setSelected([]);
    } catch (err) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAll = (checked) => {
    setSelected(checked ? items.map((p) => p._id) : []);
  };

  const toggleOne = (id) => {
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const bulk = async (action) => {
    if (!selected.length) {
      toast.error('Select at least one product');
      return;
    }
    try {
      await productApi.bulk({ ids: selected, action });
      toast.success(action === 'activate' ? 'Products activated' : 'Products deactivated');
      load();
    } catch (err) {
      toast.error(err.message || 'Bulk update failed');
    }
  };

  const exportCsv = async () => {
    try {
      const res = await adminApi.exportProducts();
      downloadBlob(res.data, 'products.csv');
      toast.success('Products exported');
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await adminApi.importProducts(fd, true);
      setPreview(res.data.data);
      toast.success(`Preview ready · ${res.data.data.totalRows} rows`);
    } catch (err) {
      toast.error(err.message || 'Preview failed');
      setPreview(null);
      e.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!fileRef.current) {
      toast.error('Choose a CSV file again to import');
      return;
    }
    const file = fileRef.current.files?.[0];
    if (!file) {
      toast.error('Select the CSV file to import');
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await adminApi.importProducts(fd, false);
      const r = res.data.data.results || res.data.data;
      toast.success(
        `Imported ${r.success?.length || 0} · failed ${r.failed?.length || 0}`
      );
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-800">Products</h1>
          <p className="text-sm text-muted">{pagination.total || 0} products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary text-sm" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button type="button" className="btn btn-secondary text-sm" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
          <Link to="/admin/products/new" className="btn btn-primary text-sm">
            <Plus size={16} /> Add product
          </Link>
        </div>
      </div>

      <div className="card-soft grid gap-3 p-4 md:grid-cols-4">
        <input
          className="input md:col-span-2"
          placeholder="Search name, brand, SKU, barcode…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="input"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary text-sm" onClick={() => bulk('activate')}>
            Activate
          </button>
          <button type="button" className="btn btn-secondary text-sm" onClick={() => bulk('deactivate')}>
            Deactivate
          </button>
        </div>
      </div>

      <div className="card-soft p-4">
        <h2 className="font-display font-700">Import CSV</h2>
        <p className="mt-1 text-sm text-muted">
          Upload a products CSV, preview rows, then confirm import.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="text-sm" onChange={onFile} />
          <button
            type="button"
            className="btn btn-primary text-sm"
            disabled={!preview || importing}
            onClick={confirmImport}
          >
            <Upload size={16} /> {importing ? 'Importing…' : 'Confirm import'}
          </button>
        </div>
        {preview?.preview?.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <p className="mb-2 text-xs text-muted">
              Showing {preview.preview.length} of {preview.totalRows} rows
            </p>
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-brand-50 text-muted">
                <tr>
                  {Object.keys(preview.preview[0]).map((k) => (
                    <th key={k} className="px-2 py-2">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.preview.map((row, i) => (
                  <tr key={i} className="border-t border-brand-50">
                    {Object.keys(preview.preview[0]).map((k) => (
                      <td key={k} className="px-2 py-1.5">
                        {String(row[k] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
            <EmptyState
              title="No products"
              description="Add your first product or import a CSV."
              actionLabel="Add product"
              to="/admin/products/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-brand-50/70 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.length === items.length && items.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const activeVariants = (p.variants || []).filter((v) => v.isActive !== false);
                  const stock = activeVariants.reduce((s, v) => s + (v.stockQuantity || 0), 0);
                  const prices = activeVariants
                    .map((v) => v.retailPrice)
                    .filter((v) => v != null);
                  const minPrice = prices.length ? Math.min(...prices) : null;
                  return (
                    <tr key={p._id} className="border-t border-brand-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(p._id)}
                          onChange={() => toggleOne(p._id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{p.name}</span>
                        <span className="block text-xs text-muted">{p.brand}</span>
                      </td>
                      <td className="px-4 py-3">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3">{activeVariants.length}</td>
                      <td className="px-4 py-3">{stock}</td>
                      <td className="px-4 py-3">{formatINR(minPrice)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'badge',
                            p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
