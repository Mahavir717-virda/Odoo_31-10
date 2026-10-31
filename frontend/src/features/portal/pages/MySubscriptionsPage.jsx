import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { getMySubscription, fetchMySubscriptions } from '../api';
import ProfileCard from '../components/ProfileCard';

export default function MySubscriptionsPage() {
  const { user } = useAuth();
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
      {/* Top Header matching SaaS layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
            My Subscriptions
          </h1>
          <p className="text-[14px] text-gray-500 mt-1">
            Review your active recurring plans, billing cycles, and contracted services.
          </p>
        </div>
      </div>

      <div className="mb-6 max-w-4xl">
        <ProfileCard user={user} />
      </div>

      {error && (
        <div className="mb-4 max-w-4xl p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button type="button" className="font-semibold underline ml-3" onClick={load}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center p-12 text-gray-500 text-sm">
          Loading your subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-12 text-center max-w-4xl">
          <p className="text-gray-400 text-sm">No subscriptions currently linked to your account.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
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
                    <p className="text-[13px] text-blue-600 font-medium">{subscription.plan_name}</p>
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
                    <dd className="mt-0.5 font-bold text-gray-950 text-[15px]">{formatMoney(subscription.total)}</dd>
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
                    className="text-[13px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Related Invoices →
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
