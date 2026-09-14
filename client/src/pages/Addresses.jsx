import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

const EMPTY_FORM = {
  label: 'Home',
  fullName: '',
  mobile: '',
  addressLine: '',
  area: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  isDefault: false,
};

export default function Addresses() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true, state: { from: { pathname: '/addresses' } } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user && !form.fullName && !form.mobile) {
      setForm((s) => ({
        ...s,
        fullName: user.fullName || '',
        mobile: user.mobile || '',
      }));
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="container-app py-16 grid place-items-center text-brand-700 font-semibold">
        Loading addresses...
      </div>
    );
  }

  const addresses = user.addresses || [];

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((s) => ({ ...s, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      fullName: user.fullName || '',
      mobile: user.mobile || '',
    });
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label || 'Home',
      fullName: addr.fullName || '',
      mobile: addr.mobile || '',
      addressLine: addr.addressLine || '',
      area: addr.area || '',
      landmark: addr.landmark || '',
      pincode: addr.pincode || '',
      city: addr.city || '',
      state: addr.state || '',
      isDefault: Boolean(addr.isDefault),
    });
    setShowForm(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile || !form.addressLine || !form.pincode) {
      toast.error('Full name, mobile, address and pincode are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await authApi.updateAddress(editingId, form);
        toast.success('Address updated');
      } else {
        await authApi.addAddress(form);
        toast.success('Address added');
      }
      await refreshUser();
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await authApi.deleteAddress(id);
      await refreshUser();
      toast.success('Address deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const onDefault = async (id) => {
    try {
      await authApi.setDefaultAddress(id);
      await refreshUser();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not set default');
    }
  };

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-700 text-ink">Addresses</h1>
          <p className="mt-1 text-muted">Saved delivery locations</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add address
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="mt-6 card-soft grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="font-display text-lg font-700 sm:col-span-2">
            {editingId ? 'Edit address' : 'New address'}
          </h2>
          {[
            ['label', 'Label'],
            ['fullName', 'Full name'],
            ['mobile', 'Mobile'],
            ['addressLine', 'Address line'],
            ['area', 'Area'],
            ['landmark', 'Landmark'],
            ['pincode', 'Pincode'],
            ['city', 'City'],
            ['state', 'State'],
          ].map(([key, label]) => (
            <label
              key={key}
              className={`block text-sm font-semibold ${
                key === 'addressLine' ? 'sm:col-span-2' : ''
              }`}
            >
              {label}
              <input className="input mt-1" value={form[key]} onChange={set(key)} />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} />
            Set as default
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {addresses.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <article key={a._id} className="card-soft p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-700">
                    {a.label || 'Address'}
                    {a.isDefault ? (
                      <span className="badge ml-2 bg-brand-100 text-brand-800">Default</span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {a.fullName} · {a.mobile}
                    <br />
                    {a.addressLine}
                    {a.area ? `, ${a.area}` : ''}
                    {a.landmark ? ` · ${a.landmark}` : ''}
                    <br />
                    {a.city ? `${a.city}, ` : ''}
                    {a.state ? `${a.state} ` : ''}
                    {a.pincode}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-secondary text-sm" onClick={() => openEdit(a)}>
                  <Pencil size={14} /> Edit
                </button>
                {!a.isDefault ? (
                  <button
                    type="button"
                    className="btn btn-secondary text-sm"
                    onClick={() => onDefault(a._id)}
                  >
                    <Star size={14} /> Default
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-secondary text-sm text-red-600"
                  onClick={() => onDelete(a._id)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No saved addresses"
            description="Add a delivery address for faster checkout."
          />
          <div className="mt-4 text-center">
            <Link to="/profile" className="text-sm font-semibold text-brand-700">
              Back to profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
