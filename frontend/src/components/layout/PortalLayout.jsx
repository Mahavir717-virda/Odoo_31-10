import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    <div className="min-h-screen bg-[#F3F6FB] flex flex-col font-sans">
      {/* Top Customer Portal Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Logo & Navigation */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <div className="flex items-center space-x-3">
                <img
                  src="/logo.png"
                  alt="Brightloop"
                  className="h-10 w-auto max-w-[160px] sm:max-w-[190px] object-contain"
                />
                <span className="hidden sm:inline-block text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Customer Portal
                </span>
              </div>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center space-x-1.5">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-2xs'
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
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2.5 pr-2 sm:pr-3 border-r border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold flex items-center justify-center text-xs border border-amber-200 shrink-0 shadow-2xs">
                  {initial}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <div className="text-xs font-semibold text-gray-900">
                    {user?.name || 'Customer'}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {user?.company || user?.email || 'Valued Customer'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE3EE] text-gray-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200 font-semibold text-xs transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </button>
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
                  `px-3 py-1.5 rounded-lg text-xs font-medium transition ${
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
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-400">
          <p>© 2026 Brightloop Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span>Secure Customer Self-Service Portal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
