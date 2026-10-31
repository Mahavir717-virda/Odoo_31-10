import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { getMySubscription, fetchMySubscriptions } from '../api';

export default function MySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const summaries = await fetchMySubscriptions();
      const full = await Promise.all(summaries.map((subscription) => getMySubscription(subscription.id)));
      setSubscriptions(full);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load your subscriptions.');
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
        <span className="text-gray-900 font-semibold">My Subscriptions</span>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
            My Subscriptions
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Review your active recurring plans, billing frequencies, and contracted service line items.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between shadow-xs" role="alert">
          <span>{error}</span>
          <button type="button" className="font-semibold underline ml-3" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] bg-white border border-[#E2E8F0] rounded-2xl shadow-sm flex items-center justify-center p-12 text-gray-500 text-sm">
          Loading your subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">No subscriptions currently linked to your account</p>
          <p className="text-xs text-gray-400 mt-1">Please reach out to support if you recently ordered a recurring service.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((subscription) => {
            const status = String(subscription.status).toUpperCase();
            return (
              <div
                key={subscription.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EEF2F7] pb-4 mb-4">
                  <div>
                    <h2 className="text-[18px] font-bold text-gray-950">{subscription.number}</h2>
                    <p className="text-[13px] text-blue-600 font-semibold">{subscription.plan_name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${
                      status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px] mb-5">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Start Date</dt>
                    <dd className="mt-0.5 font-semibold text-gray-900">{formatDate(subscription.start_date)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Expiry Date</dt>
                    <dd className="mt-0.5 font-semibold text-gray-900">
                      {subscription.expiry_date ? formatDate(subscription.expiry_date) : 'No expiry'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Next Billing</dt>
                    <dd className="mt-0.5 font-semibold text-gray-900">
                      {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Recurring</dt>
                    <dd className="mt-0.5 font-bold text-gray-950 text-[16px]">{formatMoney(subscription.total)}</dd>
                  </div>
                </dl>

                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] mb-4">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Product</th>
                        <th className="py-2.5 px-3">Variant</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Unit Price</th>
                        <th className="py-2.5 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-gray-700">
                      {(subscription.lines ?? []).map((line) => (
                        <tr key={line.id} className="hover:bg-[#F6F9FF]">
                          <td className="py-2.5 px-4 font-semibold text-gray-900">{line.product_name}</td>
                          <td className="py-2.5 px-3 text-gray-500">{line.variant_label || '—'}</td>
                          <td className="py-2.5 px-3">{line.quantity}</td>
                          <td className="py-2.5 px-3">{formatMoney(line.unit_price)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-gray-900">{formatMoney(line.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {subscription.notes && (
                  <p className="text-[12px] text-gray-500 whitespace-pre-wrap bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] mb-3">
                    {subscription.notes}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Link
                    to="/portal/invoices"
                    className="text-[13px] font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    View Related Invoices &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
