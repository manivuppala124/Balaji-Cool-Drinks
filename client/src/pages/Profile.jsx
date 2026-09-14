import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, KeyRound, LogOut, MapPin, Package } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, loading, logout, refreshUser, isWholesale } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pwd, setPwd] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true, state: { from: { pathname: '/profile' } } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (loading || !user) {
    return (
      <div className="container-app py-16 grid place-items-center text-brand-700 font-semibold">
        Loading profile...
      </div>
    );
  }

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile({
        fullName: fullName.trim(),
        email: email.trim() || undefined,
      });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      await authApi.changePassword(pwd);
      toast.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-700 text-ink">Profile</h1>
          <p className="mt-1 text-muted">{user.mobile}</p>
          {isWholesale ? (
            <span className="badge mt-2 bg-accent-500 text-white">Wholesale customer</span>
          ) : (
            <span className="badge mt-2 bg-brand-100 text-brand-800">Retail customer</span>
          )}
        </div>
        <button
          type="button"
          className="btn btn-secondary text-red-600"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/orders" className="card-soft flex items-center gap-3 p-4 hover:shadow-md">
          <Package className="text-brand-700" /> Orders
        </Link>
        <Link to="/addresses" className="card-soft flex items-center gap-3 p-4 hover:shadow-md">
          <MapPin className="text-brand-700" /> Addresses
        </Link>
        <Link
          to="/notifications"
          className="card-soft flex items-center gap-3 p-4 hover:shadow-md"
        >
          <Bell className="text-brand-700" /> Notifications
        </Link>
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="card-soft flex items-center gap-3 p-4 text-left hover:shadow-md"
        >
          <KeyRound className="text-brand-700" /> Change password
        </button>
      </div>

      <form onSubmit={onSave} className="mt-8 card-soft max-w-xl space-y-4 p-5">
        <h2 className="font-display text-lg font-700">Edit profile</h2>
        <label className="block text-sm font-semibold">
          Full name
          <input
            className="input mt-1"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold">
          Mobile
          <input className="input mt-1 bg-brand-50/50" value={user.mobile || ''} disabled />
        </label>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      {showPassword ? (
        <form onSubmit={onChangePassword} className="mt-6 card-soft max-w-xl space-y-4 p-5">
          <h2 className="font-display text-lg font-700">Change password</h2>
          <label className="block text-sm font-semibold">
            Current password
            <input
              type="password"
              className="input mt-1"
              value={pwd.currentPassword}
              onChange={(e) => setPwd((s) => ({ ...s, currentPassword: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold">
            New password
            <input
              type="password"
              className="input mt-1"
              value={pwd.newPassword}
              onChange={(e) => setPwd((s) => ({ ...s, newPassword: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-semibold">
            Confirm new password
            <input
              type="password"
              className="input mt-1"
              value={pwd.confirmPassword}
              onChange={(e) => setPwd((s) => ({ ...s, confirmPassword: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={pwdSaving}>
            {pwdSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
