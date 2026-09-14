import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Package,
  PackageX,
  RefreshCw,
  ShoppingBag,
  Briefcase,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, notificationApi } from '../../services/endpoints';
import { cn } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

const TYPE_ICONS = {
  ORDER: ShoppingBag,
  STOCK: AlertTriangle,
  WHOLESALE: Briefcase,
  CANCELLATION: PackageX,
  SYSTEM: Info,
};

const TYPE_COLORS = {
  ORDER: 'bg-emerald-100 text-emerald-800',
  STOCK: 'bg-amber-100 text-amber-800',
  WHOLESALE: 'bg-accent-100 text-accent-800',
  CANCELLATION: 'bg-red-100 text-red-700',
  SYSTEM: 'bg-sky-100 text-sky-800',
};

export default function AdminNotifications() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.notifications({
        page,
        limit: 20,
        unread: filterUnread ? 'true' : undefined,
      });
      setItems(res.data.data.items || []);
      setUnreadCount(res.data.data.unreadCount || 0);
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, filterUnread]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markOneAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-800 text-ink">Admin Notifications</h1>
            {unreadCount > 0 && (
              <span className="badge bg-amber-100 text-amber-800 font-bold text-xs">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-muted">Alerts for new orders, low inventory & shop activities</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary text-xs sm:text-sm"
            onClick={loadNotifications}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-primary text-xs sm:text-sm"
              onClick={markAllAsRead}
            >
              <CheckCheck size={16} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-brand-100 pb-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setFilterUnread(false);
          }}
          className={`rounded-xl px-3.5 py-1.5 transition ${
            !filterUnread
              ? 'bg-brand-700 text-white shadow-xs'
              : 'bg-white text-muted hover:text-ink'
          }`}
        >
          All Notifications
        </button>
        <button
          type="button"
          onClick={() => {
            setPage(1);
            setFilterUnread(true);
          }}
          className={`rounded-xl px-3.5 py-1.5 transition ${
            filterUnread
              ? 'bg-brand-700 text-white shadow-xs'
              : 'bg-white text-muted hover:text-ink'
          }`}
        >
          Unread Only {unreadCount > 0 ? `(${unreadCount})` : ''}
        </button>
      </div>

      {/* Notification List */}
      <div className="card-soft overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="p-8">
            <EmptyState
              title={filterUnread ? 'No unread notifications' : 'No notifications yet'}
              description={
                filterUnread
                  ? 'All admin notifications have been read.'
                  : 'Important store events will appear here.'
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-brand-100/60">
            {items.map((n) => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              const colorClass = TYPE_COLORS[n.type] || 'bg-slate-100 text-slate-700';

              return (
                <div
                  key={n._id}
                  className={cn(
                    'flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition',
                    n.isRead ? 'bg-white hover:bg-brand-50/30' : 'bg-brand-50/50 hover:bg-brand-50/80 font-medium'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', colorClass)}>
                      <Icon size={18} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cn('text-sm', n.isRead ? 'text-ink font-semibold' : 'text-brand-900 font-bold')}>
                          {n.title}
                        </p>
                        <span className={cn('badge text-[10px]', colorClass)}>
                          {n.type}
                        </span>
                        {!n.isRead && (
                          <span className="h-2 w-2 rounded-full bg-brand-600" />
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>

                      <p className="mt-1 text-[11px] text-muted">
                        {new Date(n.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {n.link && (
                      <Link
                        to={n.link}
                        className="btn btn-secondary py-1 px-3 text-xs"
                      >
                        View Details
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markOneAsRead(n._id)}
                        className="rounded-lg border border-brand-200/80 bg-white px-2.5 py-1 text-xs text-muted hover:text-ink hover:bg-brand-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary py-1 px-3"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary py-1 px-3"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
