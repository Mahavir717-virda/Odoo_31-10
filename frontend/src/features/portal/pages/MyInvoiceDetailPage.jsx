import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { getMyInvoice } from '../api';
import ProfileCard from '../components/ProfileCard';

export default function MyInvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInvoice(await getMyInvoice(id));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load this invoice.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center p-12 text-gray-500 text-sm">
        Loading invoice details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full font-sans pb-12 max-w-4xl">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 mb-4" role="alert">
          {error}
        </div>
        <button
          onClick={load}
          className="px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="w-full font-sans pb-12 max-w-4xl text-center py-16">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
        <Link to="/portal/invoices" className="text-blue-600 hover:underline text-sm font-semibold">
          Return to My Invoices
        </Link>
      </div>
    );
  }

  const balance = Number(invoice.balance ?? Number(invoice.total) - Number(invoice.amount_paid));
  const isPaid = balance <= 0 || String(invoice.status).toUpperCase() === 'PAID';

  return (
    <div className="w-full font-sans pb-12 print:pb-0">
      {/* Breadcrumb Navigation matching screenshot */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2 print:hidden">
        <Link to="/portal/invoices" className="hover:text-blue-600 transition">
          My Invoices
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          {invoice.number}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Invoice {invoice.number}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${
                isPaid
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {isPaid ? 'PAID' : invoice.status}
            </span>
          </div>
          <p className="text-[14px] text-gray-500 mt-1">
            Subscription: {invoice.subscription_number || 'Standard Service'}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[13px] hover:bg-gray-50 transition print:hidden"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Invoice
        </button>
      </div>

      <div className="mb-6 max-w-4xl print:hidden">
        <ProfileCard user={user} />
      </div>

      {/* Balance Banner */}
      <div
        className={`max-w-4xl rounded-2xl p-5 mb-6 border ${
          isPaid
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {isPaid ? 'Payment Status' : 'Outstanding Balance'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {formatMoney(isPaid ? invoice.total : balance)}
            </p>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Total: <span className="font-semibold text-gray-900">{formatMoney(invoice.total)}</span></div>
            <div>Paid: <span className="font-semibold text-emerald-700">{formatMoney(invoice.amount_paid)}</span></div>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 mb-6 max-w-4xl">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Invoice Date</dt>
            <dd className="mt-1 font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Due Date</dt>
            <dd className="mt-1 font-semibold text-gray-900">{formatDate(invoice.due_date)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Customer</dt>
            <dd className="mt-1 font-semibold text-gray-900">{invoice.customer_name || user?.name}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</dt>
            <dd className="mt-1 text-gray-600">{invoice.customer_email || user?.email}</dd>
          </div>
        </dl>
      </div>

      {/* Line Items Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden mb-6 max-w-4xl">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="text-[14px] font-semibold text-gray-900">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Unit Price</th>
                <th className="py-2.5 px-3">Tax</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-gray-700">
              {(invoice.lines ?? []).map((line) => (
                <tr key={line.id} className="hover:bg-[#F6F9FF]">
                  <td className="py-2.5 px-4 font-semibold text-gray-900">
                    {line.description || line.product_name}
                  </td>
                  <td className="py-2.5 px-3">{line.quantity}</td>
                  <td className="py-2.5 px-3">{formatMoney(line.unit_price)}</td>
                  <td className="py-2.5 px-3 text-gray-500">
                    {line.tax_rate}% ({formatMoney(line.tax_amount)})
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                    {formatMoney(Number(line.amount) + Number(line.tax_amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Summary Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 max-w-4xl">
        <div className="max-w-xs ml-auto space-y-2 text-[13px]">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900">{formatMoney(invoice.subtotal)}</span>
          </div>
          {Number(invoice.discount_total || 0) > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discounts</span>
              <span>-{formatMoney(invoice.discount_total)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span className="font-semibold text-gray-900">{formatMoney(invoice.tax_total)}</span>
          </div>
          <div className="flex justify-between border-t border-[#EEF2F7] pt-2 font-bold text-gray-950 text-[15px]">
            <span>Total</span>
            <span>{formatMoney(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Paid</span>
            <span>{formatMoney(invoice.amount_paid)}</span>
          </div>
          <div className="flex justify-between border-t border-[#EEF2F7] pt-2 font-bold text-gray-950">
            <span>Balance Due</span>
            <span className={isPaid ? 'text-emerald-700' : 'text-rose-600'}>{formatMoney(balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
