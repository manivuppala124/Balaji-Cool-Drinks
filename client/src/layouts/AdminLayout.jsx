import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Warehouse,
  Briefcase,
  Users,
  BarChart3,
  Bell,
  Settings,
  Search,
  LogOut,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/endpoints';
import { cn, formatINR } from '../utils/format';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/admin/wholesale', label: 'Wholesale', icon: Briefcase },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const MOBILE_PRIMARY = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
];

export default function AdminLayout() {
  const { user, logout, settings } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [unread, setUnread] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const searchRef = useRef(null);

  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks';

  useEffect(() => {
    let alive = true;
    const loadUnread = async () => {
      try {
        const res = await adminApi.notifications({ unread: 'true', limit: 1 });
        if (alive) setUnread(res.data.data.unreadCount || 0);
      } catch {
        /* ignore */
      }
    };
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await adminApi.search(q.trim());
        setResults(res.data.data);
      } catch {
        setResults(null);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e) => {
      if (!searchRef.current?.contains(e.target)) setResults(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
      isActive
        ? 'bg-brand-700 text-white shadow-sm'
        : 'text-brand-900/80 hover:bg-brand-50'
    );

  const goResult = (path) => {
    setQ('');
    setResults(null);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-canvas md:flex">
      <aside className="no-print hidden w-64 shrink-0 border-r border-brand-100/80 bg-white/90 md:flex md:flex-col">
        <div className="border-b border-brand-50 px-5 py-5">
          <p className="font-display text-lg font-800 leading-tight text-brand-800">Admin</p>
          <p className="mt-1 truncate text-xs text-muted">{shopName}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-brand-50 p-4">
          <p className="truncate text-sm font-semibold">{user?.fullName || 'Admin'}</p>
          <p className="truncate text-xs text-muted">{user?.mobile || user?.email}</p>
          <button
            type="button"
            className="btn btn-secondary mt-3 w-full text-sm"
            onClick={() => {
              logout();
              toast.success('Logged out');
              navigate('/admin/login');
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="no-print sticky top-0 z-30 border-b border-brand-100/70 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
            <div className="min-w-0 md:hidden">
              <p className="font-display text-base font-800 text-brand-800 truncate">Admin</p>
            </div>
            <div className="relative min-w-0 flex-1" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                className="input pl-9"
                placeholder="Search products, orders, customers…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {results && (
                <div className="absolute mt-2 max-h-[70vh] w-full overflow-auto rounded-2xl border border-brand-100 bg-white shadow-xl">
                  <ResultGroup
                    title="Orders"
                    empty={!results.orders?.length}
                    items={results.orders}
                    render={(o) => (
                      <button
                        key={o._id}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                        onClick={() => goResult(`/admin/orders/${o._id}`)}
                      >
                        <span className="font-semibold">{o.orderNumber}</span>
                        <span className="text-muted">{formatINR(o.totalAmount)}</span>
                      </button>
                    )}
                  />
                  <ResultGroup
                    title="Products"
                    empty={!results.products?.length}
                    items={results.products}
                    render={(p) => (
                      <button
                        key={p._id}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                        onClick={() => goResult(`/admin/products/${p._id}/edit`)}
                      >
                        <span>
                          <span className="font-semibold">{p.name}</span>
                          <span className="block text-xs text-muted">{p.brand}</span>
                        </span>
                      </button>
                    )}
                  />
                  <ResultGroup
                    title="Customers"
                    empty={!results.customers?.length}
                    items={results.customers}
                    render={(c) => (
                      <button
                        key={c._id}
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-brand-50"
                        onClick={() => goResult(`/admin/customers/${c._id}`)}
                      >
                        <span>
                          <span className="font-semibold">{c.fullName}</span>
                          <span className="block text-xs text-muted">{c.mobile}</span>
                        </span>
                      </button>
                    )}
                  />
                </div>
              )}
            </div>
            <Link
              to="/admin/notifications"
              className="relative rounded-xl bg-brand-50 p-2.5 text-brand-800"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{user?.fullName || 'Admin'}</p>
                <p className="text-[11px] text-muted">Administrator</p>
              </div>
              <button
                type="button"
                className="rounded-xl bg-brand-700 p-2.5 text-white"
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-6">
          <Outlet />
        </main>
      </div>

      <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4 text-[11px] font-semibold text-muted">
          {MOBILE_PRIMARY.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5',
                  isActive && 'text-brand-800'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            className={cn(
              'flex flex-col items-center gap-1 py-2.5',
              moreOpen && 'text-brand-800'
            )}
            onClick={() => setMoreOpen((v) => !v)}
          >
            {moreOpen ? <X size={18} /> : <MoreHorizontal size={18} />}
            More
          </button>
        </div>
        {moreOpen && (
          <div className="absolute bottom-full inset-x-0 mb-0 border-t border-brand-50 bg-white p-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              {NAV.filter((n) => !MOBILE_PRIMARY.some((m) => m.to === n.to)).map(
                ({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-900"
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                )
              )}
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700"
                onClick={() => {
                  logout();
                  setMoreOpen(false);
                  navigate('/admin/login');
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

function ResultGroup({ title, empty, items, render }) {
  return (
    <div className="border-b border-brand-50 last:border-0">
      <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted">
        {title}
      </p>
      {empty ? (
        <p className="px-4 pb-3 text-xs text-muted">No matches</p>
      ) : (
        items.map(render)
      )}
    </div>
  );
}
