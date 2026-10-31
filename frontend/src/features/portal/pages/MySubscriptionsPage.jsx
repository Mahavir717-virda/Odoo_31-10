import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import Table from '../../../components/ui/Table';
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

  useEffect(() => { load(); }, [load]);
  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'variant_label', label: 'Variant', format: (value) => value || '—' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unit_price', label: 'Unit price', format: (value) => formatMoney(value) },
    { key: 'amount', label: 'Subtotal', format: (value) => formatMoney(value) },
  ];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My subscriptions</h1><p className="text-gray-600">Review your customer-specific plans and line items.</p></div>
      <ProfileCard user={user} />
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}<button type="button" className="ml-3 underline" onClick={load}>Retry</button></p>}
      {loading ? <div className="flex min-h-64 items-center justify-center"><Spinner /></div> : subscriptions.length === 0 ? <p className="rounded-lg border border-gray-200 p-10 text-center text-gray-500">No subscriptions found.</p> : (
        <div className="space-y-5">
          {subscriptions.map((subscription) => <Card key={subscription.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><h2 className="text-lg font-semibold text-gray-900">{subscription.number}</h2><p className="text-sm text-gray-600">{subscription.plan_name}</p></div>
              <Badge variant={String(subscription.status).toUpperCase() === 'ACTIVE' ? 'success' : 'default'}>{subscription.status}</Badge>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div><dt className="text-gray-500">Start date</dt><dd>{formatDate(subscription.start_date)}</dd></div>
              <div><dt className="text-gray-500">Expiry</dt><dd>{subscription.expiry_date ? formatDate(subscription.expiry_date) : 'No expiry'}</dd></div>
              <div><dt className="text-gray-500">Next billing</dt><dd>{subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}</dd></div>
              <div><dt className="text-gray-500">Total</dt><dd className="font-semibold">{formatMoney(subscription.total)}</dd></div>
            </dl>
            <div className="mt-4 overflow-x-auto"><Table columns={columns} data={subscription.lines ?? []} rowKey="id" emptyMessage="No line items." /></div>
            {subscription.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-gray-600">{subscription.notes}</p>}
            <p className="mt-4 text-sm"><Link to={`/portal/invoices`} className="font-medium text-indigo-600 hover:underline">View related invoices</Link></p>
            {subscription.status === 'ACTIVE' && (subscription.plan_pausable || subscription.plan_closable) && <p className="mt-2 text-xs text-gray-500">Self-service pause, resume, and close actions are not currently available from the backend.</p>}
          </Card>)}
        </div>
      )}
    </div>
  );
}
