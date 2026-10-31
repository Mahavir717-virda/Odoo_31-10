import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F3F6FB] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area - Full Width */}
      <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden bg-[#F3F6FB]">
        <Topbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto px-6 sm:px-8 lg:px-10 py-7 w-full">
          <div className="w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
