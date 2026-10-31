import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isMockEnabled } from '../../api/mockHelper';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout, switchMockRole } = useAuth();
  const navigate = useNavigate();
  const mockActive = isMockEnabled();

  const handleLogout = async () => {
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

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Open sidebar"
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

      {/* Right User Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Quick Mock Role Switcher in Topbar */}
        {mockActive && (
          <div className="hidden md:flex items-center space-x-1.5 bg-gray-100 p-1 rounded-lg">
            <span className="text-xs font-medium text-gray-500 px-1.5">Switch Role:</span>
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

        {/* Current User Pill */}
        {user && (
          <div className="flex items-center space-x-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm border border-indigo-200">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 leading-none">{user.name}</p>
              <div className="mt-1">
                <Badge variant={getRoleVariant(user.role)} size="sm">
                  {userRoleUpper}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
          Logout
        </Button>
      </div>
    </header>
  );
}
