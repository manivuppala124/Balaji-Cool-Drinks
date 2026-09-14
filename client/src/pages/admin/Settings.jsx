import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Clock,
  FileText,
  HelpCircle,
  IndianRupee,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Truck,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../services/endpoints';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/format';

export default function Settings() {
  const { setSettings: updateGlobalSettings } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'delivery' | 'policies'

  const [form, setForm] = useState({
    shopName: '',
    shopLogo: '',
    shopAddress: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    googleMapsUrl: '',
    openingTime: '08:00',
    closingTime: '22:00',
    weeklyHoliday: '',
    about: '',
    terms: '',
    privacy: '',
    refundPolicy: '',
    minimumOrderAmount: 0,
    deliveryAvailable: true,
    deliveryCharge: 20,
    freeDeliveryThreshold: 500,
    allowCashOrders: true,
    allowUpiOrders: true,
    allowWholesaleOrders: true,
    requireWholesaleApproval: true,
    deliveryAreas: '',
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.settings();
      const s = res.data.data.settings || {};
      setForm({
        shopName: s.shopName || '',
        shopLogo: s.shopLogo || '',
        shopAddress: s.shopAddress || '',
        phoneNumber: s.phoneNumber || '',
        whatsappNumber: s.whatsappNumber || '',
        email: s.email || '',
        googleMapsUrl: s.googleMapsUrl || '',
        openingTime: s.openingTime || '08:00',
        closingTime: s.closingTime || '22:00',
        weeklyHoliday: s.weeklyHoliday || '',
        about: s.about || '',
        terms: s.terms || '',
        privacy: s.privacy || '',
        refundPolicy: s.refundPolicy || '',
        minimumOrderAmount: s.minimumOrderAmount ?? 0,
        deliveryAvailable: s.deliveryAvailable !== false,
        deliveryCharge: s.deliveryCharge ?? 20,
        freeDeliveryThreshold: s.freeDeliveryThreshold ?? 500,
        allowCashOrders: s.allowCashOrders !== false,
        allowUpiOrders: s.allowUpiOrders !== false,
        allowWholesaleOrders: s.allowWholesaleOrders !== false,
        requireWholesaleApproval: Boolean(s.requireWholesaleApproval),
        deliveryAreas: Array.isArray(s.deliveryAreas) ? s.deliveryAreas.join(', ') : '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load shop settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        minimumOrderAmount: Number(form.minimumOrderAmount) || 0,
        deliveryCharge: Number(form.deliveryCharge) || 0,
        freeDeliveryThreshold: Number(form.freeDeliveryThreshold) || 0,
        deliveryAreas: form.deliveryAreas
          ? form.deliveryAreas
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };

      const res = await adminApi.updateSettings(payload);
      const updated = res.data.data.settings;
      if (updateGlobalSettings) {
        updateGlobalSettings(updated);
      }
      toast.success('Shop settings updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-800 text-ink">Store Settings</h1>
          <p className="text-sm text-muted">Configure store identity, delivery rules & customer policies</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-primary text-sm shadow-sm"
        >
          <Save size={16} /> {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-100 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-brand-700 text-brand-800 font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Building2 size={16} /> Store Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'delivery'
              ? 'border-brand-700 text-brand-800 font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <Truck size={16} /> Order & Delivery
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('policies')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition ${
            activeTab === 'policies'
              ? 'border-brand-700 text-brand-800 font-bold'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          <FileText size={16} /> Content & Policies
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: STORE PROFILE */}
        {activeTab === 'profile' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card-soft p-5 space-y-4 md:col-span-2">
              <h2 className="font-display font-700 text-base flex items-center gap-2 text-ink">
                <Building2 size={18} className="text-brand-700" /> Basic Details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shop Name *</label>
                  <input
                    type="text"
                    name="shopName"
                    value={form.shopName}
                    onChange={handleChange}
                    className="input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Shop Logo URL</label>
                  <input
                    type="url"
                    name="shopLogo"
                    value={form.shopLogo}
                    onChange={handleChange}
                    placeholder="https://..."
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Shop Address</label>
                <textarea
                  name="shopAddress"
                  rows={2}
                  value={form.shopAddress}
                  onChange={handleChange}
                  placeholder="Street, Landmark, City, Pincode"
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="card-soft p-5 space-y-4">
              <h2 className="font-display font-700 text-base flex items-center gap-2 text-ink">
                <Phone size={18} className="text-brand-700" /> Contact Numbers
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="9999999999"
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Ordering Number
                </label>
                <p className="text-[11px] text-muted mb-1.5">
                  Used dynamically for the customer &quot;Contact on WhatsApp&quot; button
                </p>
                <input
                  type="text"
                  name="whatsappNumber"
                  value={form.whatsappNumber}
                  onChange={handleChange}
                  placeholder="9999999999"
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="contact@sribalaji.store"
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Google Maps URL</label>
                <input
                  type="url"
                  name="googleMapsUrl"
                  value={form.googleMapsUrl}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/?q=..."
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="card-soft p-5 space-y-4">
              <h2 className="font-display font-700 text-base flex items-center gap-2 text-ink">
                <Clock size={18} className="text-brand-700" /> Business Hours
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Opening Time</label>
                  <input
                    type="time"
                    name="openingTime"
                    value={form.openingTime}
                    onChange={handleChange}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Closing Time</label>
                  <input
                    type="time"
                    name="closingTime"
                    value={form.closingTime}
                    onChange={handleChange}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Holiday</label>
                <input
                  type="text"
                  name="weeklyHoliday"
                  value={form.weeklyHoliday}
                  onChange={handleChange}
                  placeholder="e.g. Sunday or None"
                  className="input text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER & DELIVERY RULES */}
        {activeTab === 'delivery' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card-soft p-5 space-y-4">
              <h2 className="font-display font-700 text-base flex items-center gap-2 text-ink">
                <Truck size={18} className="text-brand-700" /> Delivery Settings
              </h2>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 bg-white cursor-pointer">
                <input
                  type="checkbox"
                  name="deliveryAvailable"
                  checked={form.deliveryAvailable}
                  onChange={handleChange}
                  className="h-4 w-4 rounded accent-brand-700"
                />
                <span className="text-sm font-semibold">Enable Store Delivery</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="deliveryCharge"
                    value={form.deliveryCharge}
                    onChange={handleChange}
                    className="input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="freeDeliveryThreshold"
                    value={form.freeDeliveryThreshold}
                    onChange={handleChange}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  name="minimumOrderAmount"
                  value={form.minimumOrderAmount}
                  onChange={handleChange}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Served Delivery Localities
                </label>
                <p className="text-[11px] text-muted mb-1.5">Comma-separated list of areas/colonies</p>
                <textarea
                  name="deliveryAreas"
                  rows={2}
                  value={form.deliveryAreas}
                  onChange={handleChange}
                  placeholder="e.g. Market Road, Gandhi Nagar, Teachers Colony"
                  className="input text-sm"
                />
              </div>
            </div>

            <div className="card-soft p-5 space-y-4">
              <h2 className="font-display font-700 text-base flex items-center gap-2 text-ink">
                <ShieldCheck size={18} className="text-brand-700" /> Ordering & Payment Permissions
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowCashOrders"
                    checked={form.allowCashOrders}
                    onChange={handleChange}
                    className="h-4 w-4 rounded accent-brand-700"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Allow Cash at Store</span>
                    <span className="text-xs text-muted">Customer pays in cash upon pickup or delivery</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowUpiOrders"
                    checked={form.allowUpiOrders}
                    onChange={handleChange}
                    className="h-4 w-4 rounded accent-brand-700"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Allow UPI Payment Selection</span>
                    <span className="text-xs text-muted">
                      Direct UPI transfer without gateway; admin marks PAID
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="allowWholesaleOrders"
                    checked={form.allowWholesaleOrders}
                    onChange={handleChange}
                    className="h-4 w-4 rounded accent-brand-700"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Enable Wholesale Mode</span>
                    <span className="text-xs text-muted">Permit bulk case and piece wholesale orders</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-brand-100 bg-white cursor-pointer">
                  <input
                    type="checkbox"
                    name="requireWholesaleApproval"
                    checked={form.requireWholesaleApproval}
                    onChange={handleChange}
                    className="h-4 w-4 rounded accent-brand-700"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Require Wholesale Verification</span>
                    <span className="text-xs text-muted">
                      When enabled, only verified accounts can buy wholesale. When disabled, all customers can order in wholesale mode.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONTENT & POLICIES */}
        {activeTab === 'policies' && (
          <div className="card-soft p-5 space-y-5">
            <h2 className="font-display font-700 text-base flex items-center gap-2 text-ink">
              <FileText size={18} className="text-brand-700" /> Store Policy Pages Content
            </h2>
            <p className="text-xs text-muted">
              These texts are displayed directly on customer-facing policy pages and footer links.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">About the Store</label>
              <textarea
                name="about"
                rows={3}
                value={form.about}
                onChange={handleChange}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions</label>
              <textarea
                name="terms"
                rows={3}
                value={form.terms}
                onChange={handleChange}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Privacy Policy</label>
              <textarea
                name="privacy"
                rows={3}
                value={form.privacy}
                onChange={handleChange}
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Refund & Cancellation Policy
              </label>
              <textarea
                name="refundPolicy"
                rows={3}
                value={form.refundPolicy}
                onChange={handleChange}
                className="input text-sm"
              />
            </div>
          </div>
        )}

        {/* Sticky Bottom Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-100/70">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary px-6 text-sm shadow-md"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
