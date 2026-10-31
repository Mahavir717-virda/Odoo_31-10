import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/subscriptions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName = user?.name || 'Admin User';
  const displayRole = user?.role ? String(user.role).toUpperCase() : 'ADMIN';
  const initial = displayName.charAt(0).toUpperCase() || 'A';

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 sm:px-8 text-[13px] sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-4">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 rounded-xl md:hidden hover:bg-gray-100 hover:text-gray-900 focus:outline-none transition"
          aria-label="Open sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Global Quick Search Bar */}
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-gray-400 w-64 md:w-80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 focus-within:bg-white transition shadow-xs">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search subscriptions, plans, invoices..."
            className="bg-transparent border-0 text-gray-900 text-xs w-full focus:outline-none placeholder-gray-400"
          />
          <kbd className="hidden lg:inline-block text-[10px] bg-white border border-[#CBD5E1] text-gray-400 px-1.5 py-0.5 rounded font-mono shadow-2xs">
            ↵
          </kbd>
        </div>

        {/* System Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold">Live System</span>
        </div>
      </div>

      {/* Right: Quick Actions & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Create Action Button */}
        <button
          type="button"
          onClick={() => navigate('/subscriptions/new')}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] rounded-xl text-xs font-semibold transition shadow-xs"
        >
          <span>+</span>
          <span>New Subscription</span>
        </button>

        {/* Notifications Icon with Popup */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition relative"
            title="Notifications"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-[#EEF2F7] mb-2">
                <span className="text-xs font-bold text-gray-900">Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer" onClick={() => setShowNotifications(false)}>
                  Dismiss
                </span>
              </div>
              <div className="space-y-2 text-xs text-gray-600 py-1">
                <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100">
                  <div className="font-semibold text-blue-900">All services active</div>
                  <div className="text-[11px] text-blue-700 mt-0.5">Recurring billing engine running normally.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-[1px] bg-[#E2E8F0]" />

        {/* User Account Info */}
        <div className="flex items-center gap-2.5 pl-1">
          <span className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold flex items-center justify-center text-xs border border-amber-200 shrink-0 shadow-2xs">
            {initial}
          </span>
          <div className="hidden sm:block text-left leading-tight">
            <div className="font-semibold text-gray-900 text-[13px]">
              {displayName}
            </div>
            <div className="text-[11px] text-gray-400 font-normal">
              Brightloop Admin
            </div>
          </div>
          <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
            {displayRole}
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
          title="Sign out of Brightloop"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
