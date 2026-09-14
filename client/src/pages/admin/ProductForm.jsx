import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { productApi, categoryApi } from '../../services/endpoints';

const emptyVariant = () => ({
  name: '',
  volume: '',
  unit: 'ml',
  retailPrice: '',
  mrp: '',
  wholesalePrice: '',
  wholesalePackSize: '',
  wholesalePackUnit: 'pieces',
  wholesaleCasePrice: '',
  minWholesaleQty: 1,
  allowPieceSaleWholesale: true,
  stockQuantity: 0,
  lowStockThreshold: 10,
  sku: '',
  barcode: '',
  isActive: true,
  isAvailable: true,
  isFeatured: false,
});

const toNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const serializeVariant = (v) => ({
  ...(v._id ? { _id: v._id } : {}),
  name: v.name.trim(),
  volume: toNum(v.volume),
  unit: v.unit || '',
  retailPrice: toNum(v.retailPrice),
  mrp: toNum(v.mrp),
  wholesalePrice: toNum(v.wholesalePrice),
  wholesalePackSize: toNum(v.wholesalePackSize),
  wholesalePackUnit: v.wholesalePackUnit || 'pieces',
  wholesaleCasePrice: toNum(v.wholesaleCasePrice),
  minWholesaleQty: toNum(v.minWholesaleQty) || 1,
  allowPieceSaleWholesale: Boolean(v.allowPieceSaleWholesale),
  stockQuantity: toNum(v.stockQuantity) || 0,
  lowStockThreshold: toNum(v.lowStockThreshold) ?? 10,
  sku: v.sku || '',
  barcode: v.barcode || '',
  isActive: v.isActive !== false,
  isAvailable: v.isAvailable !== false,
  isFeatured: Boolean(v.isFeatured),
});

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    images: '',
    tags: '',
    isActive: true,
    isFeatured: false,
  });
  const [variants, setVariants] = useState([emptyVariant()]);
  const [removedVariantIds, setRemovedVariantIds] = useState([]);

  useEffect(() => {
    categoryApi
      .list({ activeOnly: 'false' })
      .then((res) => setCategories(res.data.data.categories || []))
      .catch((err) => toast.error(err.message || 'Failed to load categories'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await productApi.get(id);
        if (!alive) return;
        const p = res.data.data.product;
        setForm({
          name: p.name || '',
          brand: p.brand || '',
          category: p.category?._id || p.category || '',
          description: p.description || '',
          images: (p.images || []).join(', '),
          tags: (p.tags || []).join(', '),
          isActive: p.isActive !== false,
          isFeatured: Boolean(p.isFeatured),
        });
        setVariants(
          (p.variants || []).length
            ? p.variants.map((v) => ({
                ...emptyVariant(),
                ...v,
                volume: v.volume ?? '',
                retailPrice: v.retailPrice ?? '',
                mrp: v.mrp ?? '',
                wholesalePrice: v.wholesalePrice ?? '',
                wholesalePackSize: v.wholesalePackSize ?? '',
                wholesaleCasePrice: v.wholesaleCasePrice ?? '',
                minWholesaleQty: v.minWholesaleQty ?? 1,
                stockQuantity: v.stockQuantity ?? 0,
                lowStockThreshold: v.lowStockThreshold ?? 10,
              }))
            : [emptyVariant()]
        );
      } catch (err) {
        toast.error(err.message || 'Product not found');
        navigate('/admin/products');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit, navigate]);

  const setVariant = (index, patch) => {
    setVariants((list) => list.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const removeVariant = (index) => {
    const v = variants[index];
    if (v?._id) setRemovedVariantIds((ids) => [...ids, v._id]);
    setVariants((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category) {
      toast.error('Name and category are required');
      return;
    }
    if (!variants.some((v) => v.name.trim())) {
      toast.error('Add at least one variant with a name');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        category: form.category,
        description: form.description,
        images: form.images
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      if (!isEdit) {
        payload.variants = variants.filter((v) => v.name.trim()).map(serializeVariant);
        const res = await productApi.create(payload);
        toast.success('Product created');
        navigate(`/admin/products/${res.data.data.product._id}/edit`);
        return;
      }

      await productApi.update(id, payload);

      for (const vid of removedVariantIds) {
        await productApi.deleteVariant(id, vid);
      }

      for (const v of variants.filter((x) => x.name.trim())) {
        const body = serializeVariant(v);
        if (v._id) {
          const { _id, ...rest } = body;
          await productApi.updateVariant(id, _id, rest);
        } else {
          await productApi.addVariant(id, body);
        }
      }

      toast.success('Product updated');
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-96" />;

  return (
    <form onSubmit={onSubmit} className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="rounded-xl bg-brand-50 p-2 text-brand-800">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-800">
              {isEdit ? 'Edit product' : 'Add product'}
            </h1>
            <p className="text-sm text-muted">Retail + wholesale variant pricing</p>
          </div>
        </div>
        <button type="submit" className="btn btn-primary text-sm" disabled={saving}>
          <Save size={16} /> {saving ? 'Saving…' : 'Save product'}
        </button>
      </div>

      <div className="card-soft grid gap-4 p-4 md:grid-cols-2">
        <label className="text-sm font-semibold md:col-span-2">
          Name *
          <input
            className="input mt-1.5"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="text-sm font-semibold">
          Brand
          <input
            className="input mt-1.5"
            value={form.brand}
            onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
          />
        </label>
        <label className="text-sm font-semibold">
          Category *
          <select
            className="input mt-1.5"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Description
          <textarea
            className="input mt-1.5 min-h-24"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </label>
        <label className="text-sm font-semibold">
          Images (comma-separated URLs)
          <input
            className="input mt-1.5"
            value={form.images}
            onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
          />
        </label>
        <label className="text-sm font-semibold">
          Tags (comma-separated)
          <input
            className="input mt-1.5"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
          />
          Featured
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-700">Variants</h2>
          <button
            type="button"
            className="btn btn-secondary text-sm"
            onClick={() => setVariants((list) => [...list, emptyVariant()])}
          >
            <Plus size={16} /> Add variant
          </button>
        </div>

        {variants.map((v, index) => (
          <div key={v._id || index} className="card-soft grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="flex items-center justify-between md:col-span-3 lg:col-span-4">
              <p className="font-semibold">Variant {index + 1}</p>
              <button
                type="button"
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                onClick={() => removeVariant(index)}
                disabled={variants.length <= 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Field label="Name *" value={v.name} onChange={(val) => setVariant(index, { name: val })} />
            <Field label="Volume / Size" value={v.volume} onChange={(val) => setVariant(index, { volume: val })} />
            <Field label="Unit" value={v.unit} onChange={(val) => setVariant(index, { unit: val })} />
            <Field label="Retail price" type="number" value={v.retailPrice} onChange={(val) => setVariant(index, { retailPrice: val })} />
            <Field label="MRP" type="number" value={v.mrp} onChange={(val) => setVariant(index, { mrp: val })} />
            <Field label="Wholesale price" type="number" value={v.wholesalePrice} onChange={(val) => setVariant(index, { wholesalePrice: val })} />
            <Field label="Pack size" type="number" value={v.wholesalePackSize} onChange={(val) => setVariant(index, { wholesalePackSize: val })} />
            <Field label="Pack unit" value={v.wholesalePackUnit} onChange={(val) => setVariant(index, { wholesalePackUnit: val })} />
            <Field label="Case price" type="number" value={v.wholesaleCasePrice} onChange={(val) => setVariant(index, { wholesaleCasePrice: val })} />
            <Field label="Min wholesale qty" type="number" value={v.minWholesaleQty} onChange={(val) => setVariant(index, { minWholesaleQty: val })} />
            <Field label="Stock" type="number" value={v.stockQuantity} onChange={(val) => setVariant(index, { stockQuantity: val })} />
            <Field label="Low stock threshold" type="number" value={v.lowStockThreshold} onChange={(val) => setVariant(index, { lowStockThreshold: val })} />
            <Field label="SKU" value={v.sku} onChange={(val) => setVariant(index, { sku: val })} />
            <Field label="Barcode" value={v.barcode} onChange={(val) => setVariant(index, { barcode: val })} />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={v.allowPieceSaleWholesale !== false}
                onChange={(e) => setVariant(index, { allowPieceSaleWholesale: e.target.checked })}
              />
              Allow piece sale (wholesale)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={v.isActive !== false}
                onChange={(e) => setVariant(index, { isActive: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={v.isAvailable !== false}
                onChange={(e) => setVariant(index, { isAvailable: e.target.checked })}
              />
              Available
            </label>
          </div>
        ))}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        className="input mt-1.5"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
