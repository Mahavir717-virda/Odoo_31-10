import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import UsageProgress from '../components/UsageProgress';
import { getDiscounts, deleteDiscount } from '../api';

export default function DiscountListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [selectedScope, setSelectedScope] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    setPage,
    setSearch: setPaginatedSearch,
    setFilters: setPaginatedFilters,
    load,
  } = usePaginatedList(getDiscounts);

  const updateFilter = (key, value) => {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    setFilters(next);
    setPaginatedFilters(next);
  };

  const handleScopeChange = (e) => {
    const val = e.target.value;
    setSelectedScope(val);
    updateFilter('scope', val || undefined);
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    updateFilter('state', val || undefined);
  };

  const handleDeleteClick = (e, row) => {
    e.stopPropagation();
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setActionError(err?.message || 'Failed to delete discount.');
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusBadges = (row) => {
    const today = new Date().toISOString().slice(0, 10);
    const isExpired = Boolean(row.end_date && row.end_date < today);
    const isExhausted = Boolean(
      row.usage_limit !== null &&
      row.usage_limit !== undefined &&
      row.usage_limit > 0 &&
      (row.used_count || 0) >= row.usage_limit
    );

    if (!row.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          Inactive
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Expired
        </span>
      );
    }

    if (isExhausted) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          Exhausted
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Active
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="w-full font-sans pb-12">
      {/* Top Header matching SaaS screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Discounts & Coupons
            </h1>
            {isAdmin && (
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                ADMIN
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-500">
            Configure promotional campaigns, percentage and fixed discounts, and usage limits.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/discounts/new"
            className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] px-5 py-2.5 rounded-xl shadow-sm transition"
          >
            + Create Discount
          </Link>
        )}
      </div>

      {/* Toolbar & Filters Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        {(error || actionError) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{actionError || error?.message || 'Failed to load discounts.'}</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="discount-search-input" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Search Code or Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="discount-search-input"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPaginatedSearch(e.target.value);
                }}
                placeholder="Search discounts..."
                className="w-full pl-9 pr-3.5 h-11 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="discount-scope-filter" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Scope
            </label>
            <select
              id="discount-scope-filter"
              value={selectedScope}
              onChange={handleScopeChange}
              className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All Scopes</option>
              <option value="SUBSCRIPTION">Subscription Level Only</option>
              <option value="PRODUCTS">Specific Products Only</option>
            </select>
          </div>

          <div>
            <label htmlFor="discount-state-filter" className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Status / State
            </label>
            <select
              id="discount-state-filter"
              value={selectedState}
              onChange={handleStateChange}
              className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="exhausted">Exhausted</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Code & Scope</th>
                <th className="py-3 px-4">Benefit</th>
                <th className="py-3 px-4">Requirements</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4">Redemption Progress</th>
                <th className="py-3 px-4">Status</th>
                {isAdmin && <th className="py-3 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-gray-400">
                    Loading discounts...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-gray-400">
                    No discounts found matching your criteria.
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const hasMinPurchase = row.min_purchase && Number(row.min_purchase) > 0;
                  const hasMinQty = row.min_quantity && Number(row.min_quantity) > 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/discounts/${row.id}`)}
                      className="hover:bg-[#F6F9FF] transition cursor-pointer"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 text-[13px]">
                            {row.name}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {row.scope === 'PRODUCTS'
                              ? `Products Only (${row.product_ids?.length || 0})`
                              : 'Subscription Plan'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {row.type === 'PERCENT' ? `${row.value}% OFF` : `${formatMoney(row.value)} OFF`}
                        <div className="text-[11px] text-gray-400 font-normal">
                          {row.type === 'PERCENT' ? 'Percentage' : 'Fixed discount'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px]">
                        {!hasMinPurchase && !hasMinQty ? (
                          <span className="text-gray-400">None</span>
                        ) : (
                          <div>
                            {hasMinPurchase && (
                              <div>Min: <span className="font-semibold text-gray-800">{formatMoney(row.min_purchase)}</span></div>
                            )}
                            {hasMinQty && (
                              <div>Min Qty: <span className="font-semibold text-gray-800">{row.min_quantity}</span></div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-gray-600">
                        <div>From: <span className="font-medium text-gray-800">{formatDate(row.start_date)}</span></div>
                        <div>To: <span className="font-medium text-gray-800">{formatDate(row.end_date)}</span></div>
                      </td>
                      <td className="py-3.5 px-4">
                        <UsageProgress used={row.used_count} limit={row.usage_limit} />
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadges(row)}</td>
                      {isAdmin && (
                        <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/discounts/${row.id}`)}
                              className="text-gray-600 hover:text-blue-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
                              title="Edit Discount"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(e, row)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                              title="Delete Discount"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Discount"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Customers will no longer be able to apply this discount.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
