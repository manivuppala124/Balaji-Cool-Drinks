import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const INITIAL = {
  fullName: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
  address: '',
  area: '',
  landmark: '',
  pincode: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.mobile.trim() || !form.password) {
      toast.error('Full name, mobile and password are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        fullName: form.fullName.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
        address: form.address.trim() || undefined,
        area: form.area.trim() || undefined,
        landmark: form.landmark.trim() || undefined,
        pincode: form.pincode.trim() || undefined,
      });
      toast.success('Account created');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-app py-10 animate-fade-up">
      <div className="mx-auto max-w-2xl card-soft p-6 md:p-8">
        <h1 className="font-display text-3xl font-700 text-ink">Create account</h1>
        <p className="mt-1 text-muted">Join Sri Balaji Cool Drinks & General Store</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold sm:col-span-2">
            Full name *
            <input className="input mt-1" value={form.fullName} onChange={set('fullName')} />
          </label>
          <label className="block text-sm font-semibold">
            Mobile *
            <input
              className="input mt-1"
              value={form.mobile}
              onChange={set('mobile')}
              placeholder="10-digit mobile"
            />
          </label>
          <label className="block text-sm font-semibold">
            Email (optional)
            <input
              type="email"
              className="input mt-1"
              value={form.email}
              onChange={set('email')}
            />
          </label>
          <label className="block text-sm font-semibold">
            Password *
            <input
              type="password"
              className="input mt-1"
              value={form.password}
              onChange={set('password')}
            />
          </label>
          <label className="block text-sm font-semibold">
            Confirm password *
            <input
              type="password"
              className="input mt-1"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
            />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Address
            <input className="input mt-1" value={form.address} onChange={set('address')} />
          </label>
          <label className="block text-sm font-semibold">
            Area
            <input className="input mt-1" value={form.area} onChange={set('area')} />
          </label>
          <label className="block text-sm font-semibold">
            Landmark
            <input className="input mt-1" value={form.landmark} onChange={set('landmark')} />
          </label>
          <label className="block text-sm font-semibold sm:col-span-2">
            Pincode
            <input className="input mt-1" value={form.pincode} onChange={set('pincode')} />
          </label>
          <button
            type="submit"
            className="btn btn-primary sm:col-span-2"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
