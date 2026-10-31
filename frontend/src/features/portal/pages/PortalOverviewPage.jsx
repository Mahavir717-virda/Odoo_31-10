import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchMyInvoices, fetchMySubscriptions } from '../api';

const INVOICE_STATUS_STYLES = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function PortalOverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subsRes, invRes] = await Promise.all([
        fetchMySubscriptions().catch(() => []),
        fetchMyInvoices().catch(() => []),
      ]);
      setSubscriptions(Array.isArray(subsRes) ? subsRes : []);
      setInvoices(Array.isArray(invRes) ? invRes : []);
    } catch (err) {
      setError(err?.message || 'Unable to load portal account data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'CONFIRMED'
  );

  const monthlyRecurring = activeSubs.reduce((acc, s) => {
    return acc + (Number(s.total_amount) || Number(s.plan_price) || 0);
  }, 0);

  const nextBillingDate =
    activeSubs.find((s) => s.next_billing_date)?.next_billing_date ||
    activeSubs.find((s) => s.expiry_date)?.expiry_date ||
    null;

  const unpaidInvoices = invoices.filter(
    (i) => i.payment_status !== 'PAID' && i.status !== 'CANCELLED' && i.status !== 'DRAFT'
  );

  const unpaidTotal = unpaidInvoices.reduce((acc, i) => {
    return acc + (Number(i.amount_due) || Number(i.total_amount) || 0);
  }, 0);

  const customerName = user?.name || 'Customer';
  const initial = (customerName || 'C').charAt(0).toUpperCase();

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Hero Welcome & Actions Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Account Active
            </span>
          </div>
          <h1 className="text-[26px] sm:text-[30px] font-bold text-gray-950 tracking-tight leading-tight">
            Welcome back, {customerName}
          </h1>
          <p className="text-[14px] text-gray-500 mt-1 max-w-2xl">
            Manage your recurring service subscriptions, review invoices, check upcoming billing cycles, and download receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/portal/subscriptions')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>My Subscriptions</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/portal/invoices')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#DCE3EE] hover:bg-gray-50 text-gray-700 text-xs font-semibold transition shadow-xs"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>My Invoices</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadData} className="font-semibold underline ml-3">
            Retry
          </button>
        </div>
      )}

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscriptions */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
            <span>ACTIVE SERVICES</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
          </div>
          <div className="text-[26px] font-bold text-gray-950 leading-tight">
            {loading ? '—' : activeSubs.length}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>{subscriptions.length} total contracts on file</span>
          </div>
        </div>

        {/* Card 2: Recurring Total */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
            <span>RECURRING BILLING</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-[26px] font-bold text-gray-950 leading-tight">
            {loading ? '—' : formatMoney(monthlyRecurring)}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            Standard monthly billing rate
          </div>
        </div>

        {/* Card 3: Next Billing Date */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
            <span>NEXT BILLING DATE</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <div className="text-[20px] sm:text-[22px] font-bold text-gray-950 leading-tight">
            {loading ? '—' : nextBillingDate ? formatDate(nextBillingDate) : 'Ongoing / Auto'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Automated invoice generation
          </div>
        </div>

        {/* Card 4: Invoices Status */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-2">
            <span>OUTSTANDING BALANCE</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </span>
          </div>
          <div className="text-[26px] font-bold text-gray-950 leading-tight">
            {loading ? '—' : unpaidInvoices.length > 0 ? formatMoney(unpaidTotal) : '$0.00'}
          </div>
          <div className="text-xs mt-1">
            {unpaidInvoices.length > 0 ? (
              <span className="text-amber-600 font-semibold">{unpaidInvoices.length} unpaid invoice(s)</span>
            ) : (
              <span className="text-emerald-600 font-semibold">All invoices paid in full ✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column SaaS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Subscriptions & Recent Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscriptions Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#EEF2F7] flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-gray-950">Active Subscriptions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Recurring plans and contracted SaaS services</p>
              </div>
              <Link
                to="/portal/subscriptions"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                View all ({subscriptions.length}) &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-gray-400">Loading subscriptions...</div>
            ) : activeSubs.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">No active subscriptions found</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Your account currently does not have any active subscriptions. Contact our team to activate a plan.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EEF2F7]">
                {activeSubs.slice(0, 4).map((sub) => {
                  const planName = sub.plan?.name || sub.plan_name || 'Standard Plan';
                  const billingPeriod = sub.plan?.billing_period || sub.billing_period || 'MONTHLY';
                  const recurringPrice = Number(sub.total_amount) || Number(sub.plan?.price) || 0;
                  const status = sub.status || 'ACTIVE';

                  return (
                    <div
                      key={sub.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[15px] text-gray-900">{planName}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                            {billingPeriod}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                            {status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>Subscription Ref: <strong className="text-gray-700">SUB-{String(sub.id).padStart(4, '0')}</strong></span>
                          <span>Started: <strong>{formatDate(sub.start_date)}</strong></span>
                          <span>Next Billing: <strong>{sub.next_billing_date ? formatDate(sub.next_billing_date) : 'Ongoing'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                        <span className="text-[18px] font-bold text-blue-900">
                          {formatMoney(recurringPrice)}
                          <small className="text-xs font-normal text-gray-400 ml-1">/{billingPeriod.toLowerCase().replace('ly', '')}</small>
                        </span>
                        <Link
                          to="/portal/subscriptions"
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          Manage Plan &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Invoices Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-[#EEF2F7] flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-gray-950">Recent Invoices & Receipts</h2>
                <p className="text-xs text-gray-400 mt-0.5">Billing statements and payment confirmations</p>
              </div>
              <Link
                to="/portal/invoices"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                View all ({invoices.length}) &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-gray-400">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800">No invoices generated yet</p>
                <p className="text-xs text-gray-400 mt-1">Invoices will appear here once generated on renewal cycles.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#EEF2F7] text-gray-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Invoice #</th>
                      <th className="px-5 py-3.5">Issue Date</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F7]">
                    {invoices.slice(0, 5).map((inv) => {
                      const status = String(inv.payment_status || inv.status || 'PAID').toUpperCase();
                      const statusClass = INVOICE_STATUS_STYLES[status] || 'bg-gray-100 text-gray-700 border-gray-200';
                      const invNumber = inv.invoice_number || `INV-${String(inv.id).padStart(4, '0')}`;

                      return (
                        <tr key={inv.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="px-5 py-3.5 font-bold text-gray-900">
                            {invNumber}
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">
                            {formatDate(inv.created_at || inv.date)}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-gray-900">
                            {formatMoney(inv.total_amount)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${statusClass}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              to={`/portal/invoices/${inv.id}`}
                              className="font-semibold text-blue-600 hover:text-blue-800 transition"
                            >
                              View &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Profile & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
            <h3 className="text-[15px] font-bold text-gray-950 mb-1">Account & Billing Profile</h3>
            <p className="text-xs text-gray-400 mb-5">Primary customer record and contact details</p>

            <div className="flex items-center gap-3.5 pb-5 border-b border-[#EEF2F7]">
              <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-lg flex items-center justify-center border border-amber-200 shrink-0 shadow-2xs">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-[15px] text-gray-900 truncate">
                  {customerName}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user?.company || 'Personal Customer'}
                </div>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Verified Customer
                </span>
              </div>
            </div>

            <div className="space-y-3.5 pt-4 text-xs">
              <div>
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                  Email Address
                </span>
                <span className="font-medium text-gray-900 break-all">{user?.email || '—'}</span>
              </div>

              <div>
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                  Company / Organization
                </span>
                <span className="font-medium text-gray-900">{user?.company || 'None specified'}</span>
              </div>

              <div>
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                  Phone Number
                </span>
                <span className="font-medium text-gray-900">{user?.phone || 'None provided'}</span>
              </div>

              {user?.address && (
                <div>
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-0.5">
                    Billing Address
                  </span>
                  <span className="font-medium text-gray-900">{user.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts & Support Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-[15px] font-bold text-gray-950 mb-1">Billing Support</h3>
            <p className="text-xs text-gray-400">Need help updating plans, payment methods, or invoices?</p>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-2 text-blue-900">
              <div className="font-bold">Brightloop Care Team</div>
              <p className="text-blue-700 text-[11px] leading-relaxed">
                Our support team is available 24/7 to assist with subscription upgrades, renewals, and invoice modifications.
              </p>
              <a
                href="mailto:billing@brightloop.test"
                className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 underline text-xs pt-1"
              >
                <span>Email Billing Support &rarr;</span>
              </a>
            </div>

            <div className="pt-2 border-t border-[#EEF2F7] space-y-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 px-3 rounded-xl border border-[#DCE3EE] text-gray-700 hover:bg-gray-50 text-xs font-semibold transition text-center flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Account Statement</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

