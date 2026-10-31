import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { normalizeListResponse } from '../../../api/featureUtils';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchInvoices, isOverdue } from '../api';
import GenerateDueButton from '../components/GenerateDueButton';

const STATUSES = ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'];

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [customersError, setCustomersError] = useState('');
  const [counts, setCounts] = useState(null);
  const [countsRefresh, setCountsRefresh] = useState(0);
  const loadList = useCallback((params) => fetchInvoices(params), []);
  const list = usePaginatedList(loadList);
  const { filters, set_filters: setListFilters } = list;

  const appliedQueryRef = useRef(false);
  useEffect(() => {
    if (appliedQueryRef.current) return;
    const queryFilters = Object.fromEntries(
      ['subscription_id', 'status', 'overdue', 'from', 'to']
        .filter((key) => searchParams.has(key))
        .map((key) => [key, searchParams.get(key)])
    );
    if (Object.keys(queryFilters).length) {
      appliedQueryRef.current = true;
      setListFilters({ ...filters, ...queryFilters });
    } else {
      appliedQueryRef.current = true;
    }
  }, [searchParams, filters, setListFilters]);

  useEffect(() => {
    let active = true;
    axiosClient
      .get('/users', { params: { page: 1, limit: 100, role: 'CUSTOMER' } })
      .then((response) => active && setCustomers(normalizeListResponse(response).data))
      .catch((error) => active && setCustomersError(error.message || 'Unable to load customer filters.'));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      ...STATUSES.map((status) => fetchInvoices({ page: 1, limit: 1, status })),
      fetchInvoices({ page: 1, limit: 1, overdue: true }),
    ])
      .then((responses) => {
        if (active) setCounts([...responses.slice(0, -1).map((response) => response.total), responses.at(-1).total]);
      })
      .catch(() => active && setCounts(null));
    return () => {
      active = false;
    };
  }, [countsRefresh]);

  const refreshAfterGenerate = () => {
    list.refresh();
    setCountsRefresh((current) => current + 1);
  };

  const totalPages = Math.max(1, Math.ceil(list.total / list.page_size));

  return (
    <div className="w-full font-sans pb-12">
      {/* Top Header matching SaaS layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Invoices
            </h1>
          </div>
          <p className="text-[14px] text-gray-500">
            Review billing records, track overdue balances, and process recurring invoices.
          </p>
        </div>
        <div>
          <GenerateDueButton onSuccess={refreshAfterGenerate} />
        </div>
      </div>

      {/* Counts Pill Strip */}
      {counts && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          {['Draft', 'Confirmed', 'Paid', 'Overdue'].map((label, index) => {
            const countVal = counts[index] || 0;
            const isDanger = label === 'Overdue' && countVal > 0;
            return (
              <div
                key={label}
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-medium border flex items-center gap-2 ${
                  isDanger
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-[#E2E8F0] text-gray-700 shadow-sm'
                }`}
              >
                <span className="text-gray-500">{label}:</span>
                <span className={`font-bold ${isDanger ? 'text-rose-700' : 'text-gray-900'}`}>{countVal}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters & Search Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        {list.error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
            {list.error.message}
          </div>
        )}
        {customersError && (
          <div className="mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900">
            {customersError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search-invoice-input" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="search-invoice-input"
                type="text"
                value={list.search}
                onChange={(e) => list.set_search(e.target.value)}
                placeholder="Search invoice or customer..."
                className="w-full pl-9 pr-3.5 h-10 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-invoice-customer" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Customer
            </label>
            <select
              id="filter-invoice-customer"
              value={list.filters.customer_id ?? ''}
              onChange={(e) => list.set_filters({ ...list.filters, customer_id: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-invoice-status" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Status
            </label>
            <select
              id="filter-invoice-status"
              value={list.filters.status ?? ''}
              onChange={(e) => list.set_filters({ ...list.filters, status: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All statuses</option>
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-invoice-overdue" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Overdue
            </label>
            <select
              id="filter-invoice-overdue"
              value={list.filters.overdue ? 'true' : ''}
              onChange={(e) => list.set_filters({ ...list.filters, overdue: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All invoices</option>
              <option value="true">Overdue Only</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-invoice-from" className="block text-[12px] font-semibold text-gray-700 mb-1">
              From Date
            </label>
            <input
              id="filter-invoice-from"
              type="date"
              value={list.filters.from ?? ''}
              onChange={(e) => list.set_filters({ ...list.filters, from: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {list.loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : list.data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                list.data.map((inv) => {
                  const overdue = isOverdue(inv);
                  const statusStr = String(inv.status).toUpperCase();
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-[#F6F9FF] transition cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-semibold text-blue-600">
                        {inv.number}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        {inv.customer_name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-[12px]">
                        {inv.subscription_number || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-gray-600">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-gray-600">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">
                        {formatMoney(inv.amount_paid)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-semibold ${overdue ? 'text-rose-600' : 'text-gray-900'}`}>
                          {formatMoney(inv.balance)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              statusStr === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : statusStr === 'CANCELLED'
                                ? 'bg-gray-100 text-gray-600 border-gray-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {statusStr}
                          </span>
                          {overdue && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                        >
                          View
                        </button>
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
    </div>
  );
}
