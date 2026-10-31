import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchMyInvoices } from '../api';

const STATUS_COLORS = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function MyInvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setInvoices(await fetchMyInvoices());
    } catch (loadError) {
      setError(loadError.message || 'Unable to load invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="w-full font-sans pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/portal" className="hover:text-blue-600 transition flex items-center gap-1">
          <span>&larr;</span>
          <span>Overview</span>
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">My Invoices</span>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
            My Invoices
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Review billing records, payment statuses, and downloadable invoices.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[13px] hover:bg-gray-50 transition print:hidden shadow-xs"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Statements
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between shadow-xs" role="alert">
          <span>{error}</span>
          <button type="button" className="font-semibold underline ml-3" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {/* Table Card matching SaaS Design */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-5">Invoice #</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No invoices found linked to your account.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const statusKey = String(inv.status).toUpperCase();
                  const badgeClass = STATUS_COLORS[statusKey] || 'bg-gray-100 text-gray-700';
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                      className="hover:bg-[#F6F9FF] transition cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-semibold text-blue-600">
                        {inv.number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{formatDate(inv.date)}</td>
                      <td className="py-3.5 px-4">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900">{formatMoney(inv.total)}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-600">
                        {formatMoney(inv.balance_due ?? inv.total)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-blue-600 font-semibold hover:underline">
                          View &rarr;
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
