import { useState } from 'react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import TaxFormModal from '../components/TaxFormModal';
import { getTaxes, createTax, updateTax, deleteTax } from '../api';

export default function TaxListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [actionError, setActionError] = useState('');

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
    setFilters,
    filters,
    load,
  } = usePaginatedList(getTaxes);

  const handleOpenCreate = () => {
    setEditingTax(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setEditingTax(tax);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingTax) {
        await updateTax(editingTax.id, formData);
      } else {
        await createTax(formData);
      }
      setActionError('');
      load();
    } catch (saveError) {
      setActionError(saveError?.message || 'Unable to save tax rate.');
      throw saveError;
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteTax(deleteTargetId);
        setDeleteTargetId(null);
        setActionError('');
        load();
      } catch (deleteError) {
        setActionError(deleteError?.message || 'Unable to delete tax rate.');
      }
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full font-sans pb-12">
      {/* Top Header matching SaaS screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Taxes
            </h1>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              ADMIN
            </span>
          </div>
          <p className="text-[14px] text-gray-500">
            Configure regional taxes and statutory percentages applied to recurring invoices.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] px-5 py-2.5 rounded-xl shadow-sm transition"
        >
          + Add Tax Rate
        </button>
      </div>

      {/* Toolbar / Filters Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        {(error || actionError) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{actionError || error?.message}</span>
            <button
              onClick={() => {
                setActionError('');
                load();
              }}
              className="px-3 py-1 bg-white border border-red-300 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search-tax-input" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="search-tax-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search taxes by name..."
                className="w-full pl-9 pr-3.5 h-10 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-tax-status" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Status
            </label>
            <select
              id="filter-tax-status"
              value={filters.is_active ?? ''}
              onChange={(e) => setFilters(e.target.value ? { is_active: e.target.value } : {})}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Tax Name</th>
                <th className="py-3 px-4">Rate (%)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Loading taxes...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No tax rates configured.
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F6F9FF] transition"
                  >
                    <td className="py-3.5 px-5 font-semibold text-gray-900">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {Number(row.rate_percent).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          row.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="text-gray-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                          title="Edit Tax"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(row.id)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Tax"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      <TaxFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        tax={editingTax}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        title="Delete Tax Rate?"
        message="Are you sure you want to delete this tax rate? Any future lines cannot select this rate."
        confirmLabel="Delete"
      />
    </div>
  );
}
