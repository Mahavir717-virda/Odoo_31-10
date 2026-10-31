import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import PaymentHistory from '../../payments/components/PaymentHistory';
import RecordPaymentModal from '../../payments/components/RecordPaymentModal';
import { getInvoice, isOverdue } from '../api';
import InvoiceActions from '../components/InvoiceActions';
import InvoiceTotals from '../components/InvoiceTotals';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentRefresh, setPaymentRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInvoice(await getInvoice(id));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load invoice.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrint = () => window.print();

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
        <p className="text-sm text-gray-500 mb-4">This invoice may have been removed or is unavailable.</p>
        <Link to="/invoices" className="text-blue-600 hover:underline text-sm font-semibold">
          Return to Invoices
        </Link>
      </div>
    );
  }

  const status = String(invoice.status ?? '').toUpperCase();
  const overdue = isOverdue(invoice);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="w-full font-sans pb-12 print:pb-0">
      {/* Breadcrumb Navigation matching screenshot */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2 print:hidden">
        <Link to="/invoices" className="hover:text-blue-600 transition">
          Invoices
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          {invoice.number}
        </span>
      </div>

      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
              Invoice {invoice.number}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${getStatusBadge(
                status
              )}`}
            >
              {status}
            </span>
            {overdue && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                Overdue
              </span>
            )}
          </div>
          <p className="text-[14px] text-gray-500 mt-1">
            {invoice.customer_name} • Subscription {invoice.subscription_number || '—'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[13px] hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={() => navigate('/invoices')}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[13px] transition"
          >
            Return to Invoices
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-8 mb-6 max-w-5xl">
        <h2 className="text-[14px] font-semibold text-gray-900 border-b border-[#EEF2F7] pb-3 mb-5">
          Invoice Overview
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-[13px]">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Customer Details</dt>
            <dd className="mt-1 font-bold text-gray-900 text-[14px]">{invoice.customer_name}</dd>
            {invoice.customer_email && <dd className="text-gray-500 mt-0.5">{invoice.customer_email}</dd>}
            {invoice.customer_company && <dd className="text-gray-500">{invoice.customer_company}</dd>}
            {invoice.customer_phone && <dd className="text-gray-500">{invoice.customer_phone}</dd>}
            {invoice.customer_address && <dd className="text-gray-500">{invoice.customer_address}</dd>}
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Subscription</dt>
            <dd className="mt-1 font-semibold text-gray-900 text-[14px]">{invoice.subscription_number || 'None'}</dd>
            {invoice.subscription_id && (
              <Link
                to={`/subscriptions/${invoice.subscription_id}`}
                className="text-blue-600 hover:underline text-xs mt-1 inline-block"
              >
                View Subscription →
              </Link>
            )}
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Billing Dates</dt>
            <dd className="mt-1 text-gray-700">Invoice: <span className="font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</span></dd>
            <dd className="text-gray-700">Due: <span className="font-semibold text-gray-900">{formatDate(invoice.due_date)}</span></dd>
            {invoice.period_start && invoice.period_end && (
              <dd className="text-gray-500 text-xs mt-1">
                Period: {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
              </dd>
            )}
          </div>
        </dl>
      </div>

      {/* Invoice Lines Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden mb-6 max-w-5xl">
        <div className="p-5 border-b border-[#E2E8F0]">
          <h2 className="text-[14px] font-semibold text-gray-900">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Unit Price</th>
                <th className="py-3 px-4">Tax</th>
                <th className="py-3 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {(invoice.lines ?? []).map((line) => (
                <tr key={line.id} className="hover:bg-[#F6F9FF] transition">
                  <td className="py-3.5 px-5 font-medium text-gray-900">
                    {line.description || line.product_name}
                  </td>
                  <td className="py-3.5 px-4">{line.quantity}</td>
                  <td className="py-3.5 px-4">{formatMoney(line.unit_price)}</td>
                  <td className="py-3.5 px-4 text-gray-500">
                    {line.tax_rate}% ({formatMoney(line.tax_amount)})
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold text-gray-900">
                    {formatMoney(Number(line.amount) + Number(line.tax_amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discounts if any */}
      {invoice.discounts?.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 mb-6 max-w-5xl">
          <h2 className="text-[14px] font-semibold text-gray-900 border-b border-[#EEF2F7] pb-2 mb-3">
            Applied Discounts
          </h2>
          <ul className="space-y-2 text-[13px]">
            {invoice.discounts.map((discount) => (
              <li key={discount.id} className="flex justify-between items-center py-1">
                <span className="font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {discount.discount_name}
                </span>
                <span className="font-semibold text-emerald-700">-{formatMoney(discount.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Totals Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-8 mb-6 max-w-5xl">
        <h2 className="text-[14px] font-semibold text-gray-900 border-b border-[#EEF2F7] pb-3 mb-4">
          Invoice Balance & Totals
        </h2>
        <InvoiceTotals invoice={invoice} />
      </div>

      {/* Actions & Payment History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 print:hidden">
          <h2 className="text-[14px] font-semibold text-gray-900 border-b border-[#EEF2F7] pb-3 mb-4">
            Available Actions
          </h2>
          <InvoiceActions
            invoice={invoice}
            onSuccess={(action) => (action === 'record_payment' ? setPaymentOpen(true) : load())}
          />
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
          <h2 className="text-[14px] font-semibold text-gray-900 border-b border-[#EEF2F7] pb-3 mb-4">
            Payment History
          </h2>
          <PaymentHistory key={`${invoice.id}-${paymentRefresh}`} invoiceId={invoice.id} />
        </div>
      </div>

      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        invoice={invoice}
        onSuccess={async () => {
          setPaymentOpen(false);
          setPaymentRefresh((current) => current + 1);
          await load();
        }}
      />
    </div>
  );
}
