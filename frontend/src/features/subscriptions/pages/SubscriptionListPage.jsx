import { useCallback, useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import SearchInput from '../../../components/ui/SearchInput';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { ToastProvider, useToast } from '../../../components/ui/Toast';
import { ConfirmProvider, useConfirm } from '../../../hooks/useConfirm';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import {
  fetchSubscriptions,
  updateSubscriptionStatus,
  NEXT_STATUS_ACTION,
} from '../api';
import { SUBSCRIPTION_STATUSES } from '../mock';
import SubscriptionFormPage from './SubscriptionFormPage';

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

export default function SubscriptionListPage() {
  const { toast } = useToast();
  const {
    open_confirm: openConfirm,
    close_confirm: closeConfirm,
    confirm,
  } = useConfirm();

  const [statusTransition, setStatusTransition] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formTemplate, setFormTemplate] = useState(null);

  const fetchList = useCallback(async (params) => {
    const response = await fetchSubscriptions(params);
    return response;
  }, []);

  const {
    data,
    total,
    page,
    page_size,
    search,
    filters,
    loading,
    error,
    set_page,
    set_page_size,
    set_search,
    set_filters,
    refresh,
  } = usePaginatedList(fetchList, { page_size: 10 });

  const handleStatusTransition = (subscription, nextStatus) => {
    setStatusTransition({ subscription, nextStatus });
    openConfirm({
      title: `Change status to ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}?`,
      message: `This will move subscription for "${subscription.customer_name}" to ${nextStatus}.`,
      on_confirm: async () => {
        try {
          await updateSubscriptionStatus(subscription.id, nextStatus);
          toast({
            title: 'Status Updated',
            description: `Subscription moved to ${nextStatus}.`,
            variant: 'success',
          });
          refresh();
        } catch (err) {
          toast({
            title: 'Error',
            description: err.message || 'Failed to update status.',
            variant: 'danger',
          });
        } finally {
          closeConfirm();
          setStatusTransition(null);
        }
      },
      confirm_label: 'Confirm',
      cancelLabel: 'Cancel',
    });
  };

  const handleCreate = () => {
    setFormTemplate(null);
    setOpenForm(true);
  };

  const handleFormSuccess = () => {
    setOpenForm(false);
    setFormTemplate(null);
    refresh();
    toast({ title: 'Created', description: 'Subscription created successfully.', variant: 'success' });
  };

  const columns = [
    { key: 'customer_name', label: 'Customer' },
    { key: 'plan', label: 'Plan' },
    { key: 'status', label: 'Status', format: (value) => (
      <Badge variant={STATUS_VARIANTS[value] ?? 'default'}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    )},
    { key: 'amount', label: 'Amount', format: (value) => formatMoney(value) },
    { key: 'payment_status', label: 'Payment', format: (value) => (
      <Badge variant={value === 'paid' ? 'success' : value === 'unpaid' ? 'danger' : 'warning'}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    )},
    { key: 'next_billing_date', label: 'Next Billing', format: (value) => formatDate(value) },
    {
      key: 'actions',
      label: 'Actions',
      format: (_, row) => {
        const next = NEXT_STATUS_ACTION[row.status];
        if (!next || row.status === 'paused') {
          return <span className="text-xs text-gray-400 italic">—</span>;
        }
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleStatusTransition(row, next.to)}
          >
            {next.label}
          </Button>
        );
      },
    },
  ];

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
              <p className="text-gray-600">Manage customer subscriptions and billing.</p>
            </div>
            <Button onClick={handleCreate}>Create Subscription</Button>
          </div>

          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
              Error: {error.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SearchInput
              value={search}
              onChange={set_search}
              placeholder="Search subscriptions..."
              className="md:col-span-2"
            />
            <Select
              label="Status"
              value={filters.status ?? ''}
              onChange={(event) =>
                set_filters({ ...filters, status: event.target.value || undefined })
              }
              placeholder="All statuses"
              options={SUBSCRIPTION_STATUSES}
            />
            <Input
              label="From Date"
              type="date"
              value={filters.start_date ?? ''}
              onChange={(event) =>
                set_filters({ ...filters, start_date: event.target.value || undefined })
              }
            />
            <Input
              label="To Date"
              type="date"
              value={filters.end_date ?? ''}
              onChange={(event) =>
                set_filters({ ...filters, end_date: event.target.value || undefined })
              }
            />
          </div>

          <Table
            columns={columns}
            data={data}
            loading={loading}
            rowKey="id"
            emptyMessage="No subscriptions found."
          />

          <Pagination
            page={page}
            pageSize={page_size}
            total={total}
            onChange={set_page}
            onPageSizeChange={set_page_size}
          />

          <Modal
            open={openForm}
            onClose={() => setOpenForm(false)}
            title={formTemplate ? 'Create from Template' : 'Create Subscription'}
            className="max-w-3xl"
          >
            <SubscriptionFormPage
              initialTemplate={formTemplate}
              onCancel={() => setOpenForm(false)}
              onSuccess={handleFormSuccess}
            />
          </Modal>

          <ConfirmDialog
            open={statusTransition !== null}
            onConfirm={confirm}
            onCancel={closeConfirm}
            title="Confirm Status Change"
            message="Are you sure you want to change this subscription status?"
          />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
