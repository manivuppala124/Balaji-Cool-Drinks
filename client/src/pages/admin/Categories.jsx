import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { categoryApi } from '../../services/endpoints';
import { cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

const blank = { name: '', description: '', image: '', isActive: true };

export default function Categories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoryApi.list({ activeOnly: 'false' });
      setItems(res.data.data.categories || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || '',
      description: c.description || '',
      image: c.image || '',
      isActive: c.isActive !== false,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(blank);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await categoryApi.update(editingId, form);
        toast.success('Category updated');
      } else {
        await categoryApi.create({ ...form, order: items.length });
        toast.success('Category created');
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete or deactivate this category?')) return;
    try {
      await categoryApi.remove(id);
      toast.success('Category removed');
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const move = async (index, dir) => {
    const next = [...items];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    try {
      const res = await categoryApi.reorder(next.map((c) => c._id));
      setItems(res.data.data.categories || next);
      toast.success('Order updated');
    } catch (err) {
      toast.error(err.message || 'Reorder failed');
      load();
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div>
        <h1 className="font-display text-2xl font-800">Categories</h1>
        <p className="text-sm text-muted">Create, edit, and reorder store categories</p>
      </div>

      <form onSubmit={onSubmit} className="card-soft grid gap-3 p-4 md:grid-cols-2">
        <h2 className="font-display font-700 md:col-span-2">
          {editingId ? 'Edit category' : 'Add category'}
        </h2>
        <input
          className="input"
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder="Image URL"
          value={form.image}
          onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
        />
        <textarea
          className="input min-h-20 md:col-span-2"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active
        </label>
        <div className="flex gap-2 md:justify-end">
          {editingId && (
            <button type="button" className="btn btn-secondary text-sm" onClick={resetForm}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary text-sm" disabled={saving}>
            {editingId ? <Save size={16} /> : <Plus size={16} />}
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </button>
        </div>
      </form>

      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-12" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="p-4">
            <EmptyState title="No categories" description="Create your first category above." />
          </div>
        ) : (
          <ul className="divide-y divide-brand-50">
            {items.map((c, index) => (
              <li key={c._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg bg-brand-50 p-1.5 text-brand-800 disabled:opacity-40"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-brand-50 p-1.5 text-brand-800 disabled:opacity-40"
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted">{c.description || c.slug}</p>
                </div>
                <span
                  className={cn(
                    'badge',
                    c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-700"
                  onClick={() => startEdit(c)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  onClick={() => remove(c._id)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
