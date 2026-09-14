import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-brand-700 font-semibold">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children || <Outlet />;
}

export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-brand-700 font-semibold">
        Loading admin...
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children || <Outlet />;
}

export function GuestOnly({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;
  return children;
}
