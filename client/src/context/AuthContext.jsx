import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, settingsApi } from '../services/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const token = localStorage.getItem('sb_token');
      const settingsRes = await settingsApi.get();
      setSettings(settingsRes.data.data.settings);
      if (token) {
        const me = await authApi.me();
        setUser(me.data.data.user);
      } else {
        setUser(null);
      }
    } catch {
      localStorage.removeItem('sb_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const login = async (payload, isAdmin = false) => {
    const res = isAdmin
      ? await authApi.adminLogin(payload)
      : await authApi.login(payload);
    localStorage.setItem('sb_token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const register = async (payload) => {
    const res = await authApi.register(payload);
    localStorage.setItem('sb_token', res.data.data.token);
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const logout = () => {
    localStorage.removeItem('sb_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await authApi.me();
    setUser(me.data.data.user);
    return me.data.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      settings,
      setSettings,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAdmin: user?.role === 'admin',
      isWholesale:
        user?.wholesaleCustomer ||
        user?.customerType === 'WHOLESALE' ||
        user?.wholesaleApproved,
    }),
    [user, settings, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
