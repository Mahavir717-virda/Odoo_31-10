import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const navLinks = [
    { label: 'Overview', to: '/portal', end: true },
    { label: 'My Subscriptions', to: '/portal/subscriptions' },
    { label: 'My Invoices', to: '/portal/invoices' },
  ];

  const initial = (user?.name || user?.email || 'C').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Customer Portal Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="Brightloop" className="h-9 w-auto max-w-[140px] object-contain" />
                <span className="hidden sm:inline-block text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Customer Portal
                </span>
              </div>

              {/* Navigation Items */}
              <nav className="hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 pr-2 border-r border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold flex items-center justify-center text-xs border border-amber-200">
                  {initial}
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-gray-900 leading-tight">
                    {user?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-gray-400 leading-tight">
                    {user?.company || user?.email || 'Acme Corp'}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 hover:border-red-200 text-xs rounded-xl"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Mobile Navigation bar */}
          <div className="flex md:hidden border-t border-gray-100 py-2 space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-xs font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children || <Outlet />}
      </main>

      {/* Portal Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Brightloop Subscription ERP. Customer Self-Service Portal.</p>
        </div>
      </footer>
    </div>
  );
}
