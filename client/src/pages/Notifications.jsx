import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { notificationApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';

export default function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true, state: { from: { pathname: '/notifications' } } });
    }
  }, [authLoading, user, navigate]);

  const load = async (p = page) => {
    try {
      setLoading(true);
      const res = await notificationApi.list({ page: p, limit: 20 });
      setItems(res.data.data.items || []);
      setUnreadCount(res.data.data.unreadCount || 0);
      setPagination(res.data.data.pagination || { page: 1, pages: 1 });
    } catch (err) {
      setItems([]);
      toast.error(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const markOne = async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not mark as read');
    }
  };

  const markAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container-app py-16 grid place-items-center text-brand-700 font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <div className="container-app py-8 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-700 text-ink">Notifications</h1>
          <p className="mt-1 text-muted">
            {unreadCount ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={markAll}>
            <CheckCheck size={16} /> Mark all read
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <ul className="mt-6 space-y-3">
            {items.map((n) => (
              <li
                key={n._id}
                className={`card-soft p-4 ${n.isRead ? 'opacity-80' : 'border-brand-200'}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    <Bell size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-ink">{n.title}</p>
                      <span className="text-xs text-muted">
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleString('en-IN')
                          : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{n.message}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {n.link ? (
                        <Link to={n.link} className="text-sm font-semibold text-brand-700">
                          Open
                        </Link>
                      ) : null}
                      {!n.isRead ? (
                        <button
                          type="button"
                          className="text-sm font-semibold text-muted"
                          onClick={() => markOne(n._id)}
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {pagination.pages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-muted">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No notifications"
            description="Order updates will appear here."
            actionLabel="Go shopping"
            to="/products"
          />
        </div>
      )}
    </div>
  );
}
