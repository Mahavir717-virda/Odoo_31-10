import { useState } from 'react';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import StaffFormModal from '../components/StaffFormModal';
import { getStaffList, createStaff } from '../api';

export default function StaffListPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data,
    total,
    page,
    pageSize,
    search,
    loading,
    error,
    setPage,
    setSearch,
    load,
  } = usePaginatedList(getStaffList);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    await createStaff(formData);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full font-sans pb-12">
      {/* Top Header matching SaaS screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Staff Directory
            </h1>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>
          <p className="text-[14px] text-gray-500">
            Manage administrative staff accounts, organizational departments, and access roles.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] px-5 py-2.5 rounded-xl shadow-sm transition"
        >
          + Add Staff Member
        </button>
      </div>

      {/* Toolbar / Search Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{error.message}</span>
            <button
              onClick={load}
              className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        <div className="max-w-md">
          <label htmlFor="search-staff-input" className="block text-[12px] font-semibold text-gray-700 mb-1">
            Search Staff
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="search-staff-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name or email..."
              className="w-full pl-9 pr-3.5 h-10 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Phone</th>
                <th className="py-3 px-5 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Loading staff directory...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const isAdminRole = String(row.role).toUpperCase() === 'ADMIN';
                  const initial = row.name ? row.name[0].toUpperCase() : 'U';
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-[#F6F9FF] transition"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-950">{row.name}</div>
                            <div className="text-[12px] text-gray-400">{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isAdminRole
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {String(row.role).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-900 font-medium">{row.company || 'Operations'}</div>
                        {row.phone && <div className="text-gray-400 text-[12px]">{row.phone}</div>}
                      </td>
                      <td className="py-3.5 px-5 text-right text-gray-500 text-[12px]">
                        {formatDate(row.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* SaaS Pagination Footer */}
        <div className="px-5 py-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-[13px] text-gray-500">
          <div>
            Showing: <span className="font-semibold text-gray-900">{data.length}</span> of <span className="font-semibold text-gray-900">{total}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Lines per page</span>
              <span className="font-semibold text-gray-900">{pageSize}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                    p === page
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'bg-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StaffFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
