import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { ToastProvider, useToast } from '../../../components/ui/Toast';
import { ConfirmProvider, useConfirm } from '../../../hooks/useConfirm';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchMySubscriptions, pauseSubscription, closeSubscription } from '../api';
import ProfileCard from '../components/ProfileCard';
import { CURRENT_CUSTOMER } from '../mock';

const STATUS_VARIANTS = {
  active: 'success',
  draft: 'default',
  quotation: 'info',
  confirmed: 'default',
  paused: 'warning',
  closed: 'danger',
  expired: 'danger',
  cancelled: 'default',
};

export default function MySubscriptionsPage() {
  const { toast } = useToast();
  const { open_confirm: openConfirm, close_confirm: closeConfirm, confirm } = useConfirm();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [action, setAction] = useState(null); // { id, type: 'pause' | 'close' }

  const mountedRef = useRef(true);

  const loadSubscriptions = useCallback(async () => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMySubscriptions();
      if (mountedRef.current) {
        setSubscriptions(response.data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setSubscriptions([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
    return () => {
      mountedRef.current = false;
    };
  }, [loadSubscriptions]);

  const handleAction = (subscription, type) => {
    setAction({ id: subscription.id, type });
    openConfirm({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Subscription`,
      message: `Are you sure you want to ${type} the subscription for "${subscription.customer_name}"?`,
      on_confirm: async () => {
        try {
          const response = type === 'pause'
            ? await pauseSubscription(action.id)
            : await closeSubscription(action.id);
          const updated = response.data;
          setSubscriptions((current) =>
            current.map((item) => (item.id === updated.id ? updated : item))
          );
          toast({
            title: `${type.charAt(0).toUpperCase() + type.slice(1)}d`,
            description: `Subscription ${type}d successfully.`,
            variant: 'success',
          });
        } catch (err) {
          toast({
            title: 'Error',
            description: err.message || `Failed to ${type} subscription.`,
            variant: 'danger',
          });
        } finally {
          closeConfirm();
          setAction(null);
        }
      },
      confirm_label: type.charAt(0).toUpperCase() + type.slice(1),
      cancelLabel: 'Cancel',
    });
  };

  const canPause = (subscription) =>
    subscription.status === 'active' && Boolean(subscription.actions?.can_pause);
  const canClose = (subscription) =>
    subscription.status === 'active' && Boolean(subscription.actions?.can_close);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <ToastProvider>
        <ConfirmProvider>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
              <p className="text-gray-600">Your active and past subscriptions.</p>
            </div>
            <div className="flex min-h-[400px] items-center justify-center text-gray-500">
              <Spinner />
            </div>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    );
  }

  if (error) {
    return (
      <ToastProvider>
        <ConfirmProvider>
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
            </div>
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
              {error.message}
            </div>
          </div>
        </ConfirmProvider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
              <p className="text-gray-600">Your active and past subscriptions.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
              Print
            </Button>
          </div>

          <ProfileCard user={CURRENT_CUSTOMER} />

          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
              {error.message}
            </div>
          )}

          {subscriptions.length === 0 ? (
            <div className="border rounded-lg p-12 text-center">
              <h3 className="text-sm font-semibold text-gray-900">No subscriptions found.</h3>
              <p className="text-sm text-gray-500 mt-1">You do not have any subscriptions yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className="flex flex-col h-full">
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Subscription #{subscription.id}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {subscription.customer_name}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[subscription.status] ?? 'default'}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold text-gray-500 uppercase">Plan</dt>
                        <dd className="text-gray-900">
                          {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">Status</dt>
                        <dd className="text-gray-900">{subscription.status}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">Amount</dt>
                        <dd className="text-gray-900">{formatMoney(subscription.amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">Payment</dt>
                        <dd className="text-gray-900">
                          {subscription.payment_status.charAt(0).toUpperCase() + subscription.payment_status.slice(1)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">Start Date</dt>
                        <dd className="text-gray-900">{formatDate(subscription.start_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">End Date</dt>
                        <dd className="text-gray-900">{formatDate(subscription.end_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-gray-500 uppercase">Next Billing</dt>
                        <dd className="text-gray-900">
                          {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : '—'}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-sm text-gray-500">
                      Related invoices:
                      <a
                        href="/portal/invoices"
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        View all invoices
                      </a>
                    </p>
                    <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-2">
                      {canPause(subscription) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={action?.id === subscription.id}
                          onClick={() => handleAction(subscription, 'pause')}
                        >
                          Pause
                        </Button>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" disabled>
                          Pause
                        </Button>
                      )}
                      {canClose(subscription) ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={action?.id === subscription.id}
                          onClick={() => handleAction(subscription, 'close')}
                        >
                          Close
                        </Button>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" disabled>
                          Close
                        </Button>
                      )}
                      <p className="text-xs text-gray-400 mt-2 sm:mt-0 sm:ml-auto">
                        Actions available only when the subscription is active and permitted.
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <ConfirmDialog
            open={action !== null}
            onConfirm={confirm}
            onCancel={closeConfirm}
            title="Confirm Action"
            message="Are you sure you want to perform this action?"
            confirmLabel={action?.type === 'close' ? 'Close Subscription' : 'Pause Subscription'}
            confirmVariant="danger"
          />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
