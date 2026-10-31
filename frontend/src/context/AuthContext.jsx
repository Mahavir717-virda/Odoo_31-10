import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { getPayload } from '../api/featureUtils';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.auth_token) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEYS.auth_user);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Sync state to LocalStorage
  const persistSession = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    try {
      if (newToken) {
        localStorage.setItem(STORAGE_KEYS.auth_token, newToken);
      } else {
        localStorage.removeItem(STORAGE_KEYS.auth_token);
      }

      if (newUser) {
        localStorage.setItem(STORAGE_KEYS.auth_user, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.auth_user);
      }
    } catch {
      // LocalStorage access errors handled safely
    }
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => persistSession(null, null);
    window.addEventListener('app:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('app:auth-expired', handleAuthExpired);
  }, [persistSession]);

  // Check /auth/me on initial mount if token exists
  useEffect(() => {
    let isMounted = true;

    async function checkAuthMe() {
      const storedToken = localStorage.getItem(STORAGE_KEYS.auth_token);
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get('/auth/me');
        const payload = getPayload(response);
        const userData = payload?.user ?? payload;
        if (isMounted) {
          setUser(userData);
          localStorage.setItem(STORAGE_KEYS.auth_user, JSON.stringify(userData));
        }
      } catch (err) {
        if (isMounted) {
          if (err?.status === 401) {
            persistSession(null, null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuthMe();

    return () => {
      isMounted = false;
    };
  }, [persistSession]);

  // Login handler
  const login = useCallback(
    async ({ email, password }) => {
      setIsLoading(true);
      try {
        const response = await axiosClient.post('/auth/login', { email, password });
        const payload = getPayload(response);
        const resToken = payload?.token;
        const resUser = payload?.user;
        if (!resToken || !resUser) {
          throw new Error('The server returned an invalid login response.');
        }

        persistSession(resToken, resUser);
        return { user: resUser, token: resToken };
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  // Register handler
  const register = useCallback(
    async (payload) => {
      setIsLoading(true);
      try {
        const response = await axiosClient.post('/auth/register', payload);
        const result = getPayload(response);
        const resToken = result?.token;
        const resUser = result?.user;
        if (!resToken || !resUser) {
          throw new Error('The server returned an invalid registration response.');
        }

        persistSession(resToken, resUser);
        return { user: resUser, token: resToken };
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => persistSession(null, null), [persistSession]);

  // Role checking helper with case-insensitive normalization
  const hasRole = useCallback(
    (allowedRoles) => {
      if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
        return true;
      }
      if (!user || !user.role) {
        return false;
      }
      const userRoleLower = String(user.role).toLowerCase();
      if (Array.isArray(allowedRoles)) {
        return allowedRoles.some((r) => String(r).toLowerCase() === userRoleLower);
      }
      return String(allowedRoles).toLowerCase() === userRoleLower;
    },
    [user]
  );

  const userRoleLower = String(user?.role || '').toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const isStaff = userRoleLower === 'staff';
  const isCustomer = userRoleLower === 'customer';

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      hasRole,
      isAdmin,
      isStaff,
      isCustomer,
      // Helper checking if user has staff privileges (admin or staff)
      isStaffOrAdmin: isAdmin || isStaff,
    }),
    [user, token, isLoading, login, register, logout, hasRole, isAdmin, isStaff, isCustomer]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
