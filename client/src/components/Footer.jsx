import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { settings } = useAuth();
  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';

  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-900 text-brand-50 no-print">
      <div className="container-app grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-display text-2xl font-700">{shopName}</h3>
          <p className="mt-3 max-w-md text-brand-100/80">{settings?.about}</p>
          <p className="mt-4 text-sm text-brand-100/70">{settings?.shopAddress}</p>
          <p className="text-sm text-brand-100/70">Phone: {settings?.phoneNumber || '—'}</p>
          <p className="text-sm text-brand-100/70">
            Hours: {settings?.openingTime || '08:00'} – {settings?.closingTime || '22:00'}
            {settings?.weeklyHoliday ? ` · Closed: ${settings.weeklyHoliday}` : ''}
          </p>
        </div>
        <div>
          <h4 className="font-display font-700">Quick Links</h4>
          <div className="mt-3 grid gap-2 text-sm text-brand-100/80">
            <Link to="/products">Shop</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/wholesale">Wholesale</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/admin/login" className="font-semibold text-accent-400 hover:underline">
              Admin Login
            </Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-700">Policies</h4>
          <div className="mt-3 grid gap-2 text-sm text-brand-100/80">
            <Link to="/policies/terms">Terms</Link>
            <Link to="/policies/privacy">Privacy</Link>
            <Link to="/policies/refund">Refund / Cancellation</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-xs text-brand-100/60">
        <div className="container-app flex flex-wrap items-center justify-between gap-2 text-center md:text-left">
          <span>© {new Date().getFullYear()} {shopName}. All rights reserved.</span>
          <Link to="/admin/login" className="text-brand-100/70 hover:text-white underline">
            Store Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
