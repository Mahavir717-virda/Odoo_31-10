import { useEffect, useState } from 'react';

import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { getSubscription, updateSubscriptionStatus, NEXT_STATUS_ACTION } from '../api';
import StatusStepper from '../components/StatusStepper';
import SubscriptionLines from '../components/SubscriptionLines';

const STATUS_VARIANTS = {
  active: 'success',
  draft: 'default',
  quotation: 'info',
  confirmed: 'default',
  closed: 'danger',
  paused: 'warning',
  expired: 'danger',
  cancelled: 'default',
};

const PAYMENT_VARIANTS = {
  paid: 'success',
  unpaid: 'danger',
  partial: 'warning',
  refunded: 'info',
};

export default function SubscriptionDetailPage({ subscriptionId }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSubscription(subscriptionId)
      .then((response) => setSubscription(response.data))
      .catch((err) => setError(err.message || 'Failed to load subscription.'))
      .finally(() => setLoading(false));
  }, [subscriptionId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-gray-500">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <EmptyState title="Subscription not found" description="The subscription you requested does not exist." />
    );
  }

  const nextAction = NEXT_STATUS_ACTION[subscription.status] ?? null;
  const canTransition = Boolean(nextAction) && subscription.status !== 'paused';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription #{subscription.id}</h1>
          <p className="text-gray-600">
            {subscription.customer_name} • {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={STATUS_VARIANTS[subscription.status] ?? 'default'}>
            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
          </Badge>
          <Badge variant={PAYMENT_VARIANTS[subscription.payment_status] ?? 'default'}>
            {subscription.payment_status.charAt(0).toUpperCase() + subscription.payment_status.slice(1)}
          </Badge>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer</h3>
            <p className="text-gray-900">{subscription.customer_name}</p>
            <p className="text-sm text-gray-500 mt-1">{subscription.customer_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Plan</h3>
            <p className="text-gray-900">
              {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Status: {subscription.status}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Amounts</h3>
            <p className="text-gray-900">{formatMoney(subscription.total)}</p>
            <p className="text-sm text-gray-500 mt-1">Total including tax</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Start Date</h3>
            <p className="text-gray-900">{formatDate(subscription.start_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">End Date</h3>
            <p className="text-gray-900">{formatDate(subscription.end_date)}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Next Billing</h3>
            <p className="text-gray-900">
              {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Line Items</h3>
        <SubscriptionLines lines={subscription.lines} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Status</h3>
        <StatusStepper
          status={subscription.status}
          onStatusChange={canTransition ? (nextStatus) => {
            updateSubscriptionStatus(subscription.id, nextStatus)
              .then(() => {
                setSubscription((prev) => ({ ...prev, status: nextStatus }));
              })
              .catch((err) => {
                console.error(err);
              });
          } : undefined}
        />
        {subscription.status === 'paused' && (
          <p className="mt-3 text-sm text-gray-500">
            This subscription is paused. No status transitions are available while paused.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Related Invoices</h3>
        <div className="text-sm text-gray-500 text-center py-8">
          No invoices linked to this subscription yet.
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm">
            View Invoices
          </Button>
        </div>
      </Card>
    </div>
  );
}
