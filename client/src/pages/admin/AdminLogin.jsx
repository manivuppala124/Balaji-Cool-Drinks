import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form, true);
      if (user.role !== 'admin') {
        toast.error('Not an admin account');
        return;
      }
      toast.success('Admin login successful');
      navigate('/admin');
    } catch (err) {
      toast.error(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700">
      <form onSubmit={onSubmit} className="card-soft w-full max-w-md p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-600">Admin portal</p>
        <h1 className="font-display text-3xl font-800 text-brand-900 mt-1">Sri Balaji Store</h1>
        <p className="text-sm text-muted mt-2">Secure staff access — customers cannot register here.</p>
        <div className="mt-6 grid gap-3">
          <input className="input" placeholder="Admin email or mobile" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Admin sign in'}</button>
        </div>
      </form>
    </div>
  );
}
