import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isMockEnabled } from '../../api/mockHelper';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, switchMockRole } = useAuth();
  const navigate = useNavigate();
  const mockActive = isMockEnabled();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const userRoleUpper = String(user?.role || '').toUpperCase();

  const getRoleVariant = (roleStr) => {
    switch (String(roleStr).toUpperCase()) {
      case 'ADMIN':
        return 'danger';
      case 'STAFF':
        return 'primary';
      case 'CUSTOMER':
        return 'success';
      default:
        return 'default';
    }
  };

  const initial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger below 768px */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Open sidebar drawer"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Environment Badge */}
        {mockActive && (
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Mock Mode (Seed Data)
          </span>
        )}
      </div>

      {/* Right User Actions & Consistent User Menu */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Mock Role Switcher (Tablet and Desktop) */}
        {mockActive && (
          <div className="hidden lg:flex items-center space-x-1.5 bg-gray-100 p-1 rounded-lg">
            <span className="text-xs font-medium text-gray-500 px-1.5">Role:</span>
            {[
              { role: 'admin', label: 'Admin' },
              { role: 'staff', label: 'Staff' },
              { role: 'customer', label: 'Customer' },
            ].map(({ role, label }) => (
              <button
                key={role}
                type="button"
                onClick={() => switchMockRole(role)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  String(user?.role).toLowerCase() === role
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* User Menu Dropdown Anchor */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-expanded={menuOpen}
            aria-label="Open user profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-none truncate max-w-[120px]">
                {user?.name || 'Guest'}
              </p>
              <div className="mt-1">
                <Badge variant={getRoleVariant(user?.role)} size="sm">
                  {userRoleUpper}
                </Badge>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${
                menuOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Consistent Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || '—'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={getRoleVariant(user?.role)} size="sm">
                    {userRoleUpper}
                  </Badge>
                  {user?.company && (
                    <span className="text-[11px] text-gray-500 truncate">{user.company}</span>
                  )}
                </div>
              </div>

              {/* Mobile Quick Switcher if mock */}
              {mockActive && (
                <div className="px-4 py-2 border-b border-gray-100 lg:hidden">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Switch Mock Role
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { role: 'admin', label: 'Admin' },
                      { role: 'staff', label: 'Staff' },
                      { role: 'customer', label: 'Portal' },
                    ].map(({ role, label }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          switchMockRole(role);
                          setMenuOpen(false);
                        }}
                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                          String(user?.role).toLowerCase() === role
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Actions */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Direct Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="hidden sm:inline-flex text-xs"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}
