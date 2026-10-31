import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchInvoices } from '../../invoices/api';
import { getSubscription, updateSubscriptionStatus } from '../api';
import SubscriptionLines from '../components/SubscriptionLines';

const NEXT_STATUS = {
  DRAFT: 'QUOTATION',
  QUOTATION: 'CONFIRMED',
  CONFIRMED: 'ACTIVE',
  ACTIVE: 'CLOSED',
};

const STAGES = [
  { key: 'DRAFT', label: 'Draft', desc: 'Creation & lines' },
  { key: 'QUOTATION', label: 'Quotation', desc: 'Quote generated' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Approved by client' },
  { key: 'ACTIVE', label: 'Active', desc: 'Recurring billing' },
  { key: 'CLOSED', label: 'Closed', desc: 'Ended / Terminated' },
];

export default function SubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmTransition, setConfirmTransition] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [subscriptionData, invoiceResponse] = await Promise.all([
        getSubscription(id),
        fetchInvoices({ page: 1, limit: 10, subscription_id: id }),
      ]);
      setSubscription(subscriptionData);
      setInvoices(invoiceResponse.data || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load subscription details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async () => {
    const next = NEXT_STATUS[String(subscription?.status).toUpperCase()];
    if (!next || actionBusy) return;
    setActionBusy(true);
    try {
      setSubscription(await updateSubscriptionStatus(id, next));
      setConfirmTransition(false);
      toast({
        title: 'Status updated',
        description: `Subscription moved to ${next.toLowerCase()}.`,
        variant: 'success',
      });
    } catch (actionError) {
      toast({
        title: 'Unable to update status',
        description: actionError.message,
        variant: 'danger',
      });
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center p-12 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading subscription details...</span>
        </div>
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
          className="px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="w-full font-sans pb-12 max-w-4xl text-center py-16">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Not Found</h2>
        <p className="text-sm text-gray-500 mb-4">This subscription may have been removed or is unavailable.</p>
        <Link to="/subscriptions" className="text-blue-600 hover:underline text-sm font-semibold">
          Return to Subscriptions
        </Link>
      </div>
    );
  }

  const status = String(subscription.status ?? '').toUpperCase();
  const nextStatus = NEXT_STATUS[status];
  const canEdit = ['DRAFT', 'QUOTATION'].includes(status);
  const currentStageIndex = STAGES.findIndex((s) => s.key === status);

  const getStatusBadge = (st) => {
    switch (st) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CLOSED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'QUOTATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getCustomerInitials = (name) => {
    if (!name) return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStageHelpText = (st) => {
    switch (st) {
      case 'DRAFT':
        return 'Review parameters and line items. When ready, advance to Quotation to prepare customer quote.';
      case 'QUOTATION':
        return 'Quote has been prepared for the customer. Advance to Confirmed once client approves terms.';
      case 'CONFIRMED':
        return 'Contract confirmed. Advance to Active to begin recurring scheduled billing cycles.';
      case 'ACTIVE':
        return 'Recurring billing is active. Invoices will be automatically generated according to plan schedule.';
      case 'CLOSED':
        return 'This subscription contract is closed and no further recurring invoices will be generated.';
      default:
        return '';
    }
  };

  return (
    <div className="w-full font-sans pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/subscriptions" className="hover:text-blue-600 transition">
          Subscriptions
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {subscription.number || `SUB-${id}`}
        </span>
      </div>

      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
              {subscription.number ?? `Subscription #${id}`}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold border ${getStatusBadge(
                status
              )}`}
            >
              {status}
            </span>
          </div>
          <p className="text-[14px] text-gray-500 mt-1">
            {subscription.customer_name} • {subscription.plan_name} • Started {formatDate(subscription.start_date)}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canEdit && (
            <button
              onClick={() => navigate(`/subscriptions/${id}/edit`)}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[13px] hover:bg-gray-50 transition shadow-sm"
            >
              Edit
            </button>
          )}
          {nextStatus && (
            <button
              disabled={actionBusy}
              onClick={() => setConfirmTransition(true)}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50"
            >
              Move to {nextStatus.toLowerCase()}
            </button>
          )}
        </div>
      </div>

      {/* Modern Lifecycle Stepper / Pipeline */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-4">
          <span className="text-gray-900 font-bold text-[14px]">Lifecycle Progress</span>
          <span className="text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            Current Stage: {status}
          </span>
        </div>

        <div className="relative">
          <div className="grid grid-cols-5 gap-2 relative z-10">
            {STAGES.map((stage, idx) => {
              const isPast = currentStageIndex > -1 && idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      isPast
                        ? 'bg-[#2563EB] text-white border-2 border-[#2563EB]'
                        : isCurrent
                        ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 border-2 border-white'
                        : 'bg-white text-gray-400 border-2 border-[#E2E8F0]'
                    }`}
                  >
                    {isPast ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[12px] font-semibold tracking-tight ${
                      isCurrent
                        ? 'text-blue-600 font-bold'
                        : isPast
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="hidden md:block text-[11px] text-gray-400 mt-0.5">
                    {stage.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stepper connecting background bar */}
          <div className="absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-[#E2E8F0] -z-0">
            <div
              className="h-full bg-[#2563EB] transition-all duration-300"
              style={{
                width:
                  currentStageIndex >= 0
                    ? `${(currentStageIndex / (STAGES.length - 1)) * 100}%`
                    : '0%',
              }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column SaaS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview & Parameters Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
            <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3 mb-5">
              Overview & Parameters
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-[13px]">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Customer</dt>
                <dd className="mt-1 font-semibold text-gray-900">{subscription.customer_name}</dd>
                <span className="text-[11px] text-gray-400">ID: #{subscription.customer_id}</span>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Plan</dt>
                <dd className="mt-1 font-semibold text-gray-900">{subscription.plan_name}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Recurring</dt>
                <dd className="mt-1 font-bold text-gray-900 text-[15px]">{formatMoney(subscription.total)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Payment Terms</dt>
                <dd className="mt-1 font-semibold text-gray-900">{subscription.payment_terms_days} days</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Start Date</dt>
                <dd className="mt-1 font-semibold text-gray-900">{formatDate(subscription.start_date)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Expiry Date</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {subscription.expiry_date ? formatDate(subscription.expiry_date) : 'No expiry (Ongoing)'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Next Billing</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Quotation Valid Until</dt>
                <dd className="mt-1 font-semibold text-gray-900">
                  {subscription.quotation_valid_until ? formatDate(subscription.quotation_valid_until) : '—'}
                </dd>
              </div>

              {subscription.notes && (
                <div className="sm:col-span-2 lg:col-span-4 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl mt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Notes & Terms
                  </div>
                  <dd className="text-gray-700 text-[13px] leading-relaxed whitespace-pre-wrap">
                    {subscription.notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Subscription Lines Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-gray-900">Subscription Lines</h2>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {subscription.lines?.length || 0} {subscription.lines?.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <SubscriptionLines lines={subscription.lines ?? []} />
          </div>

          {/* Linked Invoices Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
            <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-gray-900">Recent Invoices</h2>
                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
                </span>
              </div>
              <button
                onClick={() => navigate(`/invoices?subscription_id=${id}`)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
              >
                View All Invoices →
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
                No invoices generated for this subscription yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Invoice #</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700 bg-white">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        onClick={() => navigate(`/invoices/${inv.id}`)}
                        className="hover:bg-[#F6F9FF] cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-semibold text-blue-600">{inv.number}</td>
                        <td className="py-3 px-4">{formatDate(inv.invoice_date)}</td>
                        <td className="py-3 px-4">{formatDate(inv.due_date)}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{formatMoney(inv.total)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                              String(inv.status).toUpperCase() === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column / Sidebar (col-span-1) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recurring Financial Summary Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-1">Billing Summary</h3>
            <p className="text-[12px] text-gray-400 mb-4">Recurring contract rate and terms</p>

            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                Total Recurring Amount
              </span>
              <div className="text-[28px] font-bold text-blue-900 mt-0.5 leading-tight">
                {formatMoney(subscription.total)}
              </div>
              <span className="text-[12px] text-blue-600 mt-1 block">
                {subscription.plan_name} cycle
              </span>
            </div>

            <div className="space-y-2.5 text-[13px] border-b border-[#EEF2F7] pb-4 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Billing Terms</span>
                <span className="font-semibold text-gray-800">{subscription.payment_terms_days} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contract Status</span>
                <span className="font-semibold text-gray-800">{status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Next Billing</span>
                <span className="font-semibold text-gray-800">
                  {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'Pending activation'}
                </span>
              </div>
            </div>

            {/* Stage Action Box */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div className="text-[12px] font-bold text-gray-900 mb-1">
                Stage: {status}
              </div>
              <p className="text-[12px] text-gray-500 mb-3 leading-relaxed">
                {getStageHelpText(status)}
              </p>
              {nextStatus && (
                <button
                  disabled={actionBusy}
                  onClick={() => setConfirmTransition(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50"
                >
                  Move to {nextStatus.toLowerCase()} →
                </button>
              )}
            </div>
          </div>

          {/* Customer Summary Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-4">Customer Account</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#FEF3C7] text-[#B45309] font-bold text-base flex items-center justify-center shrink-0 border border-amber-200">
                {getCustomerInitials(subscription.customer_name)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-[14px] truncate">
                  {subscription.customer_name}
                </div>
                <div className="text-[12px] text-gray-400">
                  Customer ID: #{subscription.customer_id}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#EEF2F7] space-y-2">
              <button
                onClick={() => navigate(`/invoices?customer_id=${subscription.customer_id}`)}
                className="w-full text-left text-xs font-semibold text-blue-600 hover:text-blue-800 transition py-1"
              >
                View all customer invoices →
              </button>
              <button
                onClick={() => navigate(`/subscriptions?customer_id=${subscription.customer_id}`)}
                className="w-full text-left text-xs font-semibold text-blue-600 hover:text-blue-800 transition py-1"
              >
                View other subscriptions for this customer →
              </button>
            </div>
          </div>

          {/* Quick Navigation Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
            <h3 className="text-[14px] font-bold text-gray-900 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link to="/subscriptions" className="text-gray-600 hover:text-blue-600 font-medium transition flex items-center gap-1.5">
                  <span>←</span> All Subscriptions
                </Link>
              </li>
              <li>
                <Link to="/templates" className="text-gray-600 hover:text-blue-600 font-medium transition flex items-center gap-1.5">
                  <span>📄</span> Quotation Templates
                </Link>
              </li>
              <li>
                <Link to="/plans" className="text-gray-600 hover:text-blue-600 font-medium transition flex items-center gap-1.5">
                  <span>🏷️</span> Plans & Pricing
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmTransition}
        onConfirm={advance}
        onCancel={() => setConfirmTransition(false)}
        title="Update subscription status?"
        message={`Move this subscription from ${status} to ${nextStatus?.toLowerCase()}?`}
        confirmLabel={actionBusy ? 'Updating...' : 'Confirm'}
      />
    </div>
  );
}
