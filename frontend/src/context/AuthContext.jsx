import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { isMockEnabled, mockResponse } from '../api/mockHelper';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export const MOCK_USERS = {
  admin: {
    id: 1,
    name: 'Admin User',
    email: 'admin@brightloop.test',
    role: 'ADMIN',
    company: 'Brightloop Admin',
    phone: '+1-555-0100',
    is_active: true,
  },
  staff: {
    id: 2,
    name: 'Staff Member',
    email: 'staff@brightloop.test',
    role: 'STAFF',
    company: 'Brightloop Operations',
    phone: '+1-555-0150',
    is_active: true,
  },
  customer: {
    id: 3,
    name: 'Acme Corp Contact',
    email: 'customer1@acme.test',
    role: 'CUSTOMER',
    company: 'Acme Corporation',
    phone: '+1-555-0101',
    address: '100 Acme Way, Metropolis',
    is_active: true,
  },
  customer2: {
    id: 4,
    name: 'Globex Contact',
    email: 'customer2@globex.test',
    role: 'CUSTOMER',
    company: 'Globex Inc',
    phone: '+1-555-0102',
    address: '200 Globex Blvd, Silicon City',
    is_active: true,
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
          const storedUser = localStorage.getItem(STORAGE_KEYS.auth_user);
          const activeUser = storedUser ? JSON.parse(storedUser) : MOCK_USERS.admin;
          const meResponse = await mockResponse({ user: activeUser }, 100);
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
          let matchedKey = 'admin';
          if (role) {
            matchedKey = String(role).toLowerCase();
          } else if (email) {
            const lowerEmail = email.toLowerCase();
            if (lowerEmail.includes('customer2') || lowerEmail.includes('globex')) {
              matchedKey = 'customer2';
            } else if (lowerEmail.includes('customer') || lowerEmail.includes('acme')) {
              matchedKey = 'customer';
            } else if (lowerEmail.includes('staff')) {
              matchedKey = 'staff';
            } else {
              matchedKey = 'admin';
            }
          }

          const mockUser = {
            ...(MOCK_USERS[matchedKey] || MOCK_USERS.admin),
            email: email || MOCK_USERS[matchedKey]?.email,
          };
          const mockToken = `mock-token-${String(mockUser.role).toLowerCase()}-${Date.now()}`;

          await mockResponse(null, 200);
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
            name: payload?.name || payload?.fullName || 'New Customer',
            email: payload?.email,
            role: 'CUSTOMER',
            company: payload?.company || '',
            phone: payload?.phone || '',
            is_active: true,
            created_at: new Date().toISOString(),
          };
          const mockToken = `mock-token-customer-${Date.now()}`;

          await mockResponse(null, 250);
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
    (targetRole) => {
      const key = String(targetRole).toLowerCase();
      const targetUser = MOCK_USERS[key] || MOCK_USERS.admin;
      const targetToken = `mock-token-${String(targetUser.role).toLowerCase()}-${Date.now()}`;
      persistSession(targetToken, targetUser);
    },
    [persistSession]
  );

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
      switchMockRole,
      isAdmin,
      isStaff,
      isCustomer,
      // Helper checking if user has staff privileges (admin or staff)
      isStaffOrAdmin: isAdmin || isStaff,
    }),
    [user, token, isLoading, login, register, logout, hasRole, switchMockRole, isAdmin, isStaff, isCustomer]
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
