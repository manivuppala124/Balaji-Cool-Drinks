import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Search,
  ShoppingCart,
  UserRound,
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productApi } from '../services/endpoints';
import { formatINR } from '../utils/format';

export default function CustomerShell({ children }) {
  const { user, settings, logout } = useAuth();
  const { count, mode, setMode } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await productApi.suggestions(q.trim());
        setSuggestions(res.data.data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current?.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const shopName = settings?.shopName || 'Sri Balaji Cool Drinks & General Store';
  const wa = settings?.whatsappNumber;

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-brand-100/70 bg-white/90 backdrop-blur-md no-print">
        <div className="container-app flex items-center gap-3 py-3">
          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
          <Link to="/" className="min-w-0 flex-1 md:flex-none">
            <p className="font-display text-lg md:text-2xl font-800 leading-tight text-brand-800 truncate">
              {shopName}
            </p>
            <p className="text-[11px] text-muted hidden sm:block">Retail + Wholesale Store</p>
          </Link>

          <div className="hidden md:flex items-center gap-2 rounded-full bg-brand-50 p-1">
            <button
              type="button"
              onClick={() => setMode('RETAIL')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                mode === 'RETAIL' ? 'bg-brand-700 text-white' : 'text-brand-800'
              }`}
            >
              Retail
            </button>
            <button
              type="button"
              onClick={() => setMode('WHOLESALE')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                mode === 'WHOLESALE' ? 'bg-accent-500 text-white' : 'text-brand-800'
              }`}
            >
              Wholesale
            </button>
          </div>

          <div className="relative hidden md:block w-[340px]" ref={boxRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              className="input pl-9"
              placeholder="Search drinks, water, juices..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/products?search=${encodeURIComponent(q)}`);
                  setSuggestions([]);
                }
              }}
            />
            {suggestions.length > 0 && (
              <div className="absolute mt-2 w-full overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-xl">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-brand-50"
                    onClick={() => {
                      navigate(`/products/${s.slug}`);
                      setSuggestions([]);
                      setQ('');
                    }}
                  >
                    <span>
                      <span className="font-semibold">{s.name}</span>
                      <span className="block text-xs text-muted">{s.brand}</span>
                    </span>
                    <span className="text-sm font-semibold text-brand-700">
                      {s.minPrice !== Infinity ? formatINR(s.minPrice) : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-brand-900">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            <NavLink to="/products">Shop</NavLink>
            <NavLink to="/wholesale">Wholesale</NavLink>
            <NavLink
              to="/admin/login"
              className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50/80 px-2.5 py-1 text-xs font-bold text-brand-800 transition hover:bg-brand-100"
            >
              <ShieldCheck size={14} /> Admin
            </NavLink>
          </nav>

          <Link to="/cart" className="relative rounded-xl bg-brand-50 p-2.5 text-brand-800">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <Link
            to={user ? '/profile' : '/login'}
            className="rounded-xl bg-brand-700 p-2.5 text-white"
          >
            <UserRound size={20} />
          </Link>
        </div>

        {menuOpen && (
          <div className="border-t border-brand-50 bg-white px-4 py-3 md:hidden">
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode('RETAIL')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                  mode === 'RETAIL' ? 'bg-brand-700 text-white' : 'bg-brand-50'
                }`}
              >
                Retail
              </button>
              <button
                type="button"
                onClick={() => setMode('WHOLESALE')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                  mode === 'WHOLESALE' ? 'bg-accent-500 text-white' : 'bg-brand-50'
                }`}
              >
                Wholesale
              </button>
            </div>
            <div className="grid gap-2 text-sm font-semibold">
              <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/categories" onClick={() => setMenuOpen(false)}>Categories</Link>
              <Link to="/products" onClick={() => setMenuOpen(false)}>Shop</Link>
              <Link to="/wholesale" onClick={() => setMenuOpen(false)}>Wholesale</Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
              <Link
                to="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-1.5 font-bold text-brand-800"
              >
                <ShieldCheck size={16} /> Admin Login
              </Link>
              {user ? (
                <button
                  type="button"
                  className="text-left text-red-600"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      {wa ? (
        <a
          href={`https://wa.me/91${String(wa).replace(/\D/g, '').slice(-10)}`}
          target="_blank"
          rel="noreferrer"
          className="no-print fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg md:bottom-6"
        >
          <MessageCircle size={18} /> WhatsApp
        </a>
      ) : null}

      <nav className="no-print fixed bottom-0 inset-x-0 z-40 border-t border-brand-100 bg-white/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 text-[11px] font-semibold text-muted">
          <Link to="/" className="flex flex-col items-center gap-1 py-2.5 text-brand-800">
            <Home size={18} /> Home
          </Link>
          <Link to="/categories" className="flex flex-col items-center gap-1 py-2.5">
            <LayoutGrid size={18} /> Categories
          </Link>
          <Link to="/products" className="flex flex-col items-center gap-1 py-2.5">
            <Search size={18} /> Search
          </Link>
          <Link to="/cart" className="relative flex flex-col items-center gap-1 py-2.5">
            <ShoppingCart size={18} />
            Cart
            {count > 0 && (
              <span className="absolute right-4 top-1 h-4 min-w-4 rounded-full bg-accent-500 px-1 text-[10px] text-white text-center">
                {count}
              </span>
            )}
          </Link>
          <Link to={user ? '/profile' : '/login'} className="flex flex-col items-center gap-1 py-2.5">
            <UserRound size={18} /> Profile
          </Link>
        </div>
      </nav>
    </div>
  );
}
