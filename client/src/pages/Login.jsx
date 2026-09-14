import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error('Enter mobile/email and password');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login({ identifier: identifier.trim(), password });
      toast.success('Welcome back');
      navigate(user?.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-10 animate-fade-up">
      <div className="w-full max-w-md card-soft p-6 md:p-8">
        <h1 className="font-display text-3xl font-700 text-ink">Login</h1>
        <p className="mt-1 text-muted">Use your mobile number or email</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Mobile or email
            <input
              className="input mt-1"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="9876543210 or you@email.com"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              type="password"
              className="input mt-1"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
