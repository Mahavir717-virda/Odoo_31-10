import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { deleteTemplate, fetchTemplates } from '../api';

export default function TemplateListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = String(user?.role).toUpperCase() === 'ADMIN';
  const [deleteTarget, setDeleteTarget] = useState(null);
  const loadTemplates = useCallback((params) => fetchTemplates(params), []);
  const list = usePaginatedList(loadTemplates);

  const removeTemplate = async () => {
    try {
      await deleteTemplate(deleteTarget.id);
      toast({ title: 'Deleted', description: 'Quotation template deleted.', variant: 'success' });
      setDeleteTarget(null);
      list.refresh();
    } catch (error) {
      toast({ title: 'Unable to delete template', description: error.message, variant: 'danger' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(list.total / list.page_size));

  return (
    <div className="w-full font-sans pb-12">
      {/* Top Header matching SaaS screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Quotation Templates
            </h1>
            {isAdmin && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-500">
            Define reusable subscription quotations, product bundles, and default billing terms.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/templates/new"
            className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] px-5 py-2.5 rounded-xl shadow-sm transition"
          >
            + Create Template
          </Link>
        )}
      </div>

      {/* Toolbar / Search Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        {list.error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
            {list.error.message}
          </div>
        )}

        <div className="max-w-md">
          <label htmlFor="search-template-input" className="block text-[12px] font-semibold text-gray-700 mb-1">
            Search Templates
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              id="search-template-input"
              type="text"
              value={list.search}
              onChange={(e) => list.set_search(e.target.value)}
              placeholder="Search by template or plan name..."
              className="w-full pl-9 pr-3.5 h-10 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Template Name</th>
                <th className="py-3 px-4">Recurring Plan</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                {isAdmin && <th className="py-3 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {list.loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-gray-400">
                    Loading quotation templates...
                  </td>
                </tr>
              ) : list.data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-gray-400">
                    No quotation templates found.
                  </td>
                </tr>
              ) : (
                list.data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => navigate(`/templates/${row.id}`)}
                    className="hover:bg-[#F6F9FF] transition cursor-pointer"
                  >
                    <td className="py-3.5 px-5 font-semibold text-gray-900">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-blue-600">
                      {row.plan_name || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {row.validity_days} days
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {row.payment_terms_days} days
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
                    <td className="py-3.5 px-4 text-gray-500 text-[12px]">
                      {formatDate(row.created_at)}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/templates/${row.id}`)}
                            className="text-gray-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                            title="Edit Template"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(row)}
                            className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                            title="Delete Template"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* SaaS Pagination Footer */}
        <div className="px-5 py-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-[13px] text-gray-500">
          <div>
            Showing: <span className="font-semibold text-gray-900">{list.data.length}</span> of <span className="font-semibold text-gray-900">{list.total}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Lines per page</span>
              <span className="font-semibold text-gray-900">{list.page_size}</span>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => list.set_page(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                    p === list.page
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onConfirm={removeTemplate}
        onCancel={() => setDeleteTarget(null)}
        title="Delete quotation template?"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
