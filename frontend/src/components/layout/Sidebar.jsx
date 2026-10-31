import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Navigation structure matching the icon set with clean styling
const NAV_SECTIONS = [
  {
    title: null, // Top-level item
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-4v-6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v6H4a1 1 0 0 1-1-1v-9.5z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'RESEARCH TOOL',
    items: [
      {
        label: 'Product Analytics',
        path: '/products',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          </svg>
        ),
      },
      {
        label: 'Subscriptions',
        path: '/subscriptions',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        ),
      },
      {
        label: 'Plans & Pricing',
        path: '/plans',
        roles: ['ADMIN', 'admin'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6" />
            <path d="M8.21 13.89L7 21l5-3 5 3-1.21-7.11" />
          </svg>
        ),
      },
      {
        label: 'Discounts',
        path: '/discounts',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'OTHER TOOLS',
    items: [
      {
        label: 'Invoices',
        path: '/invoices',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        ),
      },
      {
        label: 'Payments',
        path: '/payments',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22 6 12 13 2 6" />
          </svg>
        ),
      },
      {
        label: 'Quotation Templates',
        path: '/templates',
        roles: ['ADMIN', 'admin', 'STAFF', 'staff'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        ),
      },
      {
        label: 'Taxes',
        path: '/taxes',
        roles: ['ADMIN', 'admin'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
          </svg>
        ),
      },
      {
        label: 'Staff Management',
        path: '/staff',
        roles: ['ADMIN', 'admin'],
        icon: (
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, hasRole } = useAuth();

  const workspaceName = user?.name || 'Admin User';
  const workspaceSales = user?.role === 'CUSTOMER' ? 'Customer Account' : '2,540 Subscriptions';
  const initial = workspaceName.charAt(0).toUpperCase() || 'A';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[248px] bg-white border-r border-[#E2E8F0] p-[18px_14px] text-gray-700 transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between pb-4 pt-1 px-1">
          <Link to="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Brightloop"
              className="h-12 w-auto max-w-[200px] object-contain block"
            />
          </Link>
          <button
            type="button"
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Account Card */}
        <div className="flex items-center gap-2.5 p-2.5 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
          <span className="w-[34px] h-[34px] rounded-full bg-[#FEF3C7] text-[#B45309] font-bold flex items-center justify-center flex-shrink-0 text-xs">
            {initial}
          </span>
          <span className="truncate">
            <b className="block text-[13px] font-semibold text-gray-900 truncate leading-tight">
              {workspaceName}
            </b>
            <small className="block text-[12px] text-[#64748B] truncate leading-tight mt-0.5">
              {workspaceSales}
            </small>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-2.5 space-y-1 overflow-y-auto">
          {NAV_SECTIONS.map((section, idx) => {
            const visibleItems = section.items.filter((item) => hasRole(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title || idx}>
                {section.title && (
                  <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-[0.06em] pt-4 px-3 pb-1.5">
                    {section.title}
                  </div>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (isOpen) onClose();
                      }}
                      className={({ isActive }) =>
                        `group flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] transition-all ${
                          isActive
                            ? 'bg-[#EFF4FF] text-[#1D4ED8] font-semibold'
                            : 'text-[#475569] hover:bg-[#F1F5F9] font-normal'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="relative flex items-center justify-center flex-shrink-0">
                            <span
                              className={`flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                                isActive ? 'text-[#1D4ED8]' : 'text-[#64748B] group-hover:text-gray-900'
                              }`}
                            >
                              {item.icon}
                            </span>
                            {/* Mint dot for active item */}
                            {isActive && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                            )}
                          </div>
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Plan Card */}
        <div className="mt-auto p-3.5 border border-[#DBEAFE] bg-[#EFF6FF] rounded-xl">
          <div className="flex justify-between text-[13px] font-semibold text-gray-900">
            <span>Product Analytics</span>
            <span>4/10</span>
          </div>
          <div className="h-1.5 rounded-md bg-[#BFDBFE] mt-2 overflow-hidden">
            <i className="block w-[40%] h-full rounded-md bg-[#2563EB]" />
          </div>
          <a
            href="#upgrade"
            onClick={(e) => e.preventDefault()}
            className="block mt-2.5 text-[13px] font-semibold text-[#1D4ED8] hover:underline"
          >
            Upgrade Plan &rarr;
          </a>
        </div>
      </aside>
    </>
  );
}
