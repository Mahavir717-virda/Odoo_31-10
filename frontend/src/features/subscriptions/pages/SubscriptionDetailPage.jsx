import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchInvoices } from '../../invoices/api';
import { getSubscription, updateSubscriptionStatus } from '../api';
import SubscriptionLines from '../components/SubscriptionLines';

const NEXT_STATUS = { DRAFT: 'QUOTATION', QUOTATION: 'CONFIRMED', CONFIRMED: 'ACTIVE', ACTIVE: 'CLOSED' };

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
      setInvoices(invoiceResponse.data);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load subscription details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const advance = async () => {
    const next = NEXT_STATUS[String(subscription?.status).toUpperCase()];
    if (!next || actionBusy) return;
    setActionBusy(true);
    try {
      setSubscription(await updateSubscriptionStatus(id, next));
      setConfirmTransition(false);
      toast({ title: 'Status updated', description: `Subscription moved to ${next.toLowerCase()}.`, variant: 'success' });
    } catch (actionError) {
      toast({ title: 'Unable to update status', description: actionError.message, variant: 'danger' });
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner /></div>;
  if (error) return <div className="space-y-4"><p className="rounded border border-red-200 bg-red-50 p-3 text-red-800" role="alert">{error}</p><Button variant="outline" onClick={load}>Retry</Button></div>;
  if (!subscription) return <EmptyState title="Subscription not found" description="This subscription may have been removed or is unavailable to your account." />;

  const status = String(subscription.status ?? '').toUpperCase();
  const nextStatus = NEXT_STATUS[status];
  const canEdit = ['DRAFT', 'QUOTATION'].includes(status);
  const invoiceColumns = [
    { key: 'number', label: 'Invoice' },
    { key: 'invoice_date', label: 'Date', format: (value) => formatDate(value) },
    { key: 'due_date', label: 'Due', format: (value) => formatDate(value) },
    { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
    { key: 'status', label: 'Status', format: (value) => <Badge variant={String(value).toUpperCase() === 'PAID' ? 'success' : 'default'}>{value}</Badge> },
    { key: 'open', label: '', render: (invoice) => <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); navigate(`/invoices/${invoice.id}`); }}>View</Button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Link to="/subscriptions" className="text-sm text-indigo-600 hover:underline">Subscriptions</Link><h1 className="mt-2 text-2xl font-bold text-gray-900">{subscription.number ?? `Subscription #${id}`}</h1><p className="text-gray-600">{subscription.customer_name} · {subscription.plan_name}</p></div>
        <div className="flex flex-wrap gap-2"><Badge variant={status === 'ACTIVE' ? 'success' : status === 'CLOSED' ? 'danger' : 'info'}>{status}</Badge>{canEdit && <Button variant="outline" onClick={() => navigate(`/subscriptions/${id}/edit`)}>Edit</Button>}{nextStatus && <Button disabled={actionBusy} onClick={() => setConfirmTransition(true)}>{`Move to ${nextStatus.toLowerCase()}`}</Button>}</div>
      </div>
      <Card>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Customer</dt><dd className="mt-1 text-gray-900">{subscription.customer_name} (#{subscription.customer_id})</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Plan</dt><dd className="mt-1 text-gray-900">{subscription.plan_name}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Payment terms</dt><dd className="mt-1 text-gray-900">{subscription.payment_terms_days} days</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Start date</dt><dd className="mt-1 text-gray-900">{formatDate(subscription.start_date)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Expiry date</dt><dd className="mt-1 text-gray-900">{subscription.expiry_date ? formatDate(subscription.expiry_date) : 'No expiry'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Next billing</dt><dd className="mt-1 text-gray-900">{subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Total</dt><dd className="mt-1 text-gray-900">{formatMoney(subscription.total)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Quotation valid until</dt><dd className="mt-1 text-gray-900">{subscription.quotation_valid_until ? formatDate(subscription.quotation_valid_until) : '—'}</dd></div>
          {subscription.notes && <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-semibold uppercase text-gray-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap text-gray-900">{subscription.notes}</dd></div>}
        </dl>
      </Card>
      <Card><h2 className="mb-4 font-semibold text-gray-900">Subscription lines</h2><SubscriptionLines lines={subscription.lines ?? []} /></Card>
      <Card><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-gray-900">Recent invoices</h2><Button size="sm" variant="outline" onClick={() => navigate(`/invoices?subscription_id=${id}`)}>View invoices</Button></div><Table columns={invoiceColumns} data={invoices} rowKey="id" emptyMessage="No invoices are linked to this subscription yet." onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)} /></Card>
      <ol aria-label="Subscription status" className="flex flex-wrap gap-2 text-xs">
        {['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'].map((step) => <li key={step} className={`rounded-full border px-3 py-1 ${step === status ? 'border-indigo-600 bg-indigo-50 font-semibold text-indigo-700' : 'border-gray-200 text-gray-500'}`}>{step}</li>)}
      </ol>
      <ConfirmDialog
        open={confirmTransition}
        onConfirm={advance}
        onCancel={() => setConfirmTransition(false)}
        title="Update subscription status?"
        message={`Move this subscription to ${nextStatus?.toLowerCase()}?`}
        confirmLabel={actionBusy ? 'Updating...' : 'Confirm'}
      />
    </div>
  );
}
