import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { isMockEnabled, mockResponse } from '../api/mockHelper';
import { STORAGE_KEYS, USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export const MOCK_USERS = {
  [USER_ROLES.admin]: {
    id: 1,
    name: 'Admin User',
    email: 'admin@odoo.local',
    role: USER_ROLES.admin,
  },
  [USER_ROLES.staff]: {
    id: 2,
    name: 'Staff Specialist',
    email: 'staff@odoo.local',
    role: USER_ROLES.staff,
  },
  [USER_ROLES.customer]: {
    id: 3,
    name: 'Acme Corp (Customer)',
    email: 'customer@odoo.local',
    role: USER_ROLES.customer,
  },
};

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
        if (isMockEnabled()) {
          // If stored user exists, keep it, otherwise default to admin mock
          const storedUser = localStorage.getItem(STORAGE_KEYS.auth_user);
          const activeUser = storedUser ? JSON.parse(storedUser) : MOCK_USERS[USER_ROLES.admin];
          const meResponse = await mockResponse({ user: activeUser }, 150);
          if (isMounted) {
            setUser(meResponse.user);
            setIsLoading(false);
          }
          return;
        }

        const res = await axiosClient.get('/auth/me');
        const userData = res?.user || res?.data || res;
        if (isMounted) {
          setUser(userData);
          localStorage.setItem(STORAGE_KEYS.auth_user, JSON.stringify(userData));
        }
      } catch (err) {
        if (isMounted) {
          // If unauthenticated or token expired, clear session
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
    async ({ email, password, role }) => {
      setIsLoading(true);
      try {
        if (isMockEnabled()) {
          // Detect mock user role from email or argument
          let matchedRole = role || USER_ROLES.admin;
          if (email) {
            const lowerEmail = email.toLowerCase();
            if (lowerEmail.includes('customer')) {
              matchedRole = USER_ROLES.customer;
            } else if (lowerEmail.includes('staff')) {
              matchedRole = USER_ROLES.staff;
            } else if (lowerEmail.includes('admin')) {
              matchedRole = USER_ROLES.admin;
            }
          }

          const mockUser = {
            ...(MOCK_USERS[matchedRole] || MOCK_USERS[USER_ROLES.admin]),
            email: email || MOCK_USERS[matchedRole]?.email || 'user@odoo.local',
          };
          const mockToken = `mock-token-${matchedRole}-${Date.now()}`;

          await mockResponse(null, 300);
          persistSession(mockToken, mockUser);
          return { user: mockUser, token: mockToken };
        }

        const response = await axiosClient.post('/auth/login', { email, password });
        const resData = response?.data || response;
        const resToken = resData?.token || response?.token;
        const resUser = resData?.user || response?.user || resData;

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
        if (isMockEnabled()) {
          const registeredUser = {
            id: Date.now(),
            name: payload?.name || payload?.fullName || 'New User',
            email: payload?.email,
            role: payload?.role || USER_ROLES.customer,
          };
          const mockToken = `mock-token-${registeredUser.role}-${Date.now()}`;

          await mockResponse(null, 300);
          persistSession(mockToken, registeredUser);
          return { user: registeredUser, token: mockToken };
        }

        const response = await axiosClient.post('/auth/register', payload);
        const resData = response?.data || response;
        const resToken = resData?.token || response?.token;
        const resUser = resData?.user || response?.user || resData;

        persistSession(resToken, resUser);
        return { user: resUser, token: resToken };
      } finally {
        setIsLoading(false);
      }
    },
    [persistSession]
  );

  // Logout handler
  const logout = useCallback(async () => {
    try {
      if (!isMockEnabled()) {
        await axiosClient.post('/auth/logout').catch(() => {});
      }
    } finally {
      persistSession(null, null);
    }
  }, [persistSession]);

  // Switch mock role during testing/development
  const switchMockRole = useCallback(
    (role) => {
      const targetUser = MOCK_USERS[role] || MOCK_USERS[USER_ROLES.admin];
      const targetToken = `mock-token-${targetUser.role}-${Date.now()}`;
      persistSession(targetToken, targetUser);
    },
    [persistSession]
  );

  // Role checking helper
  const hasRole = useCallback(
    (allowedRoles) => {
      if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
        return true;
      }
      if (!user || !user.role) {
        return false;
      }
      if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(user.role);
      }
      return user.role === allowedRoles;
    },
    [user]
  );

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
      switchMockRole,
      isAdmin: user?.role === USER_ROLES.admin,
      isStaff: user?.role === USER_ROLES.staff || user?.role === USER_ROLES.admin,
      isCustomer: user?.role === USER_ROLES.customer,
    }),
    [user, token, isLoading, login, register, logout, hasRole, switchMockRole]
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

