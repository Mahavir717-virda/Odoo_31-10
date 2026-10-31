import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../../../components/ui/Modal';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchPayments } from '../api';
import { fetchInvoices } from '../../invoices/api';
import RecordPaymentModal from '../components/RecordPaymentModal';

const METHODS = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];

export default function PaymentListPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [invoicePickerOpen, setInvoicePickerOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [invoiceLoadError, setInvoiceLoadError] = useState('');
  const loadList = useCallback((params) => fetchPayments(params), []);
  const list = usePaginatedList(loadList);
  const visibleTotal = useMemo(
    () => list.data.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0),
    [list.data]
  );

  const loadInvoicesForPayment = async () => {
    try {
      const response = await fetchInvoices({ page: 1, limit: 100, status: 'CONFIRMED' });
      setAvailableInvoices(response.data.filter((item) => Number(item.balance) > 0));
      setInvoiceLoadError('');
      setInvoicePickerOpen(true);
    } catch (error) {
      setInvoiceLoadError(error.message || 'Unable to load invoices.');
    }
  };

  const refreshAfterPayment = () => {
    setModalOpen(false);
    setInvoice(null);
    list.refresh();
  };

  const totalPages = Math.max(1, Math.ceil(list.total / list.page_size));

  return (
    <div className="w-full font-sans pb-12">
      {/* Top Header matching SaaS screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Payments
            </h1>
          </div>
          <p className="text-[14px] text-gray-500">
            View transaction logs, payment channels, and settled invoices.
          </p>
        </div>
        <button
          onClick={loadInvoicesForPayment}
          className="inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-[14px] px-5 py-2.5 rounded-xl shadow-sm transition"
        >
          + Record Payment
        </button>
      </div>

      {/* Filters & Search Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
        {invoiceLoadError && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
            {invoiceLoadError}
          </div>
        )}
        {list.error && (
          <div className="mb-4 p-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
            {list.error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="search-payment-input" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="search-payment-input"
                type="text"
                value={list.search}
                onChange={(e) => list.set_search(e.target.value)}
                placeholder="Search invoice or customer..."
                className="w-full pl-9 pr-3.5 h-10 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="filter-payment-method" className="block text-[12px] font-semibold text-gray-700 mb-1">
              Method
            </label>
            <select
              id="filter-payment-method"
              value={list.filters.method ?? ''}
              onChange={(e) => list.set_filters({ ...list.filters, method: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">All methods</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-payment-from" className="block text-[12px] font-semibold text-gray-700 mb-1">
              From Date
            </label>
            <input
              id="filter-payment-from"
              type="date"
              value={list.filters.from ?? ''}
              onChange={(e) => list.set_filters({ ...list.filters, from: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label htmlFor="filter-payment-to" className="block text-[12px] font-semibold text-gray-700 mb-1">
              To Date
            </label>
            <input
              id="filter-payment-to"
              type="date"
              value={list.filters.to ?? ''}
              onChange={(e) => list.set_filters({ ...list.filters, to: e.target.value || undefined })}
              className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-xl text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EEF2F7] flex items-center justify-between text-xs text-gray-500">
          <span>Filtered transactions</span>
          <span className="font-semibold text-gray-900 text-sm">
            Total Received: <span className="text-emerald-700 font-bold">{formatMoney(visibleTotal)}</span>
          </span>
        </div>
      </div>

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-5 text-right">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {list.loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Loading payments...
                  </td>
                </tr>
              ) : list.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No payments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                list.data.map((payment) => (
                  <tr
                    key={payment.id}
                    onClick={() => navigate(`/invoices/${payment.invoice_id}`)}
                    className="hover:bg-[#F6F9FF] transition cursor-pointer"
                  >
                    <td className="py-3.5 px-5 text-gray-600">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">
                      <Link
                        to={`/invoices/${payment.invoice_id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {payment.invoice_number ?? `Invoice #${payment.invoice_id}`}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {payment.customer_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {String(payment.method).replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatMoney(payment.amount)}
                    </td>
                    <td className="py-3.5 px-5 text-right text-gray-500 text-[12px]">
                      {payment.note || '—'}
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

      {/* Invoice Picker Modal */}
      <Modal
        open={invoicePickerOpen}
        onClose={() => {
          setInvoicePickerOpen(false);
          setInvoice(null);
        }}
        title="Choose an Invoice to Settle"
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="modal-select-invoice" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
              Confirmed Invoice with Outstanding Balance
            </label>
            <select
              id="modal-select-invoice"
              value={invoice ? String(invoice.id) : ''}
              onChange={(e) =>
                setInvoice(availableInvoices.find((item) => String(item.id) === e.target.value) ?? null)
              }
              className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            >
              <option value="">Select an invoice</option>
              {availableInvoices.map((item) => (
                <option key={item.id} value={String(item.id)}>
                  {item.number} • {item.customer_name} • {formatMoney(item.balance)} balance
                </option>
              ))}
            </select>
          </div>

          {availableInvoices.length === 0 && (
            <p className="text-xs text-gray-500 italic">
              There are no confirmed invoices with an outstanding balance.
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EEF2F7]">
            <button
              type="button"
              onClick={() => {
                setInvoicePickerOpen(false);
                setInvoice(null);
              }}
              className="px-4 py-2 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[13px] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!invoice}
              onClick={() => {
                setInvoicePickerOpen(false);
                setModalOpen(true);
              }}
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] disabled:opacity-50"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </Modal>

      <RecordPaymentModal
        invoice={invoice}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setInvoice(null);
        }}
        onSuccess={refreshAfterPayment}
      />
    </div>
  );
}
