import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isMockEnabled } from '../../api/mockHelper';
import { USER_ROLES } from '../../utils/constants';
import Badge from '../ui/Badge';

// Built-in navigation configuration mapped by role
const DEFAULT_NAV_ITEMS = [
  // Admin & Staff Navigation
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Subscriptions',
    path: '/subscriptions',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    label: 'Invoices',
    path: '/invoices',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    path: '/payments',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Products',
    path: '/products',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Plans',
    path: '/plans',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    label: 'Discounts',
    path: '/discounts',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    label: 'Taxes',
    path: '/taxes',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Quotation Templates',
    path: '/quotation-templates',
    roles: [USER_ROLES.admin, USER_ROLES.staff],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
    ),
  },
  {
    label: 'Staff Management',
    path: '/staff',
    roles: [USER_ROLES.admin],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  // Customer Portal Navigation
  {
    label: 'Portal Overview',
    path: '/portal',
    roles: [USER_ROLES.customer],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'My Subscriptions',
    path: '/portal/subscriptions',
    roles: [USER_ROLES.customer],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    label: 'My Invoices',
    path: '/portal/invoices',
    roles: [USER_ROLES.customer],
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

// Dynamically discover additional nav definitions from features/**/nav.js
function getDiscoveredNavItems() {
  try {
    const modules = import.meta.glob('../../features/**/nav.js', { eager: true });
    const items = [];
    for (const path in modules) {
      const mod = modules[path];
      const exported = mod.default || mod.navItems || mod.nav;
      if (Array.isArray(exported)) {
        items.push(...exported);
      } else if (exported && typeof exported === 'object' && exported.path) {
        items.push(exported);
      }
    }
    return items;
  } catch {
    return [];
  }
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasRole, switchMockRole } = useAuth();
  const mockActive = isMockEnabled();

  const discoveredItems = getDiscoveredNavItems();
  // Combine default with discovered, avoiding duplicate paths
  const allNavItems = [...DEFAULT_NAV_ITEMS];
  discoveredItems.forEach((item) => {
    if (!allNavItems.some((n) => n.path === item.path)) {
      allNavItems.push(item);
    }
  });

  const visibleNav = allNavItems.filter((item) => hasRole(item.roles));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-100 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              O
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Odoo Subscriptions</span>
          </div>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Active User / Role Badge */}
        <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'Not logged in'}</p>
            </div>
            {user?.role && (
              <Badge variant={user.role === USER_ROLES.admin ? 'danger' : user.role === USER_ROLES.staff ? 'primary' : 'success'}>
                {user.role}
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isOpen) onClose();
              }}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: Mock Role Switcher (in mock mode) */}
        {mockActive && (
          <div className="p-4 bg-slate-950/80 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Mock Mode</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300">
                Active
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[
                { role: USER_ROLES.admin, label: 'Admin' },
                { role: USER_ROLES.staff, label: 'Staff' },
                { role: USER_ROLES.customer, label: 'Portal' },
              ].map(({ role, label }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => switchMockRole(role)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    user?.role === role
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

