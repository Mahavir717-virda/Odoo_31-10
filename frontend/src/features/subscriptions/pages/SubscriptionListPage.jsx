import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { normalizeListResponse } from '../../../api/featureUtils';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchSubscriptions, updateSubscriptionStatus } from '../api';

const TRANSITIONS = { DRAFT: 'QUOTATION', QUOTATION: 'CONFIRMED', CONFIRMED: 'ACTIVE', ACTIVE: 'CLOSED' };
const STATUS_COLORS = { ACTIVE: 'success', DRAFT: 'default', QUOTATION: 'info', CONFIRMED: 'info', CLOSED: 'danger' };

export default function SubscriptionListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [customersError, setCustomersError] = useState('');
  const [transitionTarget, setTransitionTarget] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const loadList = useCallback((params) => fetchSubscriptions(params), []);
  const list = usePaginatedList(loadList);

  useEffect(() => {
    let active = true;
    axiosClient.get('/users', { params: { page: 1, limit: 100, role: 'CUSTOMER' } })
      .then((response) => active && setCustomers(normalizeListResponse(response).data))
      .catch((error) => active && setCustomersError(error.message || 'Unable to load customer filters.'));
    return () => { active = false; };
  }, []);

  const updateStatus = async () => {
    if (!transitionTarget || transitioning) return;
    setTransitioning(true);
    try {
      await updateSubscriptionStatus(transitionTarget.id, transitionTarget.status);
      toast({ title: 'Status updated', description: `Subscription moved to ${transitionTarget.status.toLowerCase()}.`, variant: 'success' });
      setTransitionTarget(null);
      list.refresh();
    } catch (error) {
      toast({ title: 'Unable to update status', description: error.message, variant: 'danger' });
    } finally {
      setTransitioning(false);
    }
  };

  const columns = [
    { key: 'number', label: 'Subscription' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'plan_name', label: 'Plan' },
    { key: 'status', label: 'Status', format: (value) => <Badge variant={STATUS_COLORS[String(value).toUpperCase()] ?? 'default'}>{String(value ?? '').replaceAll('_', ' ')}</Badge> },
    { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
    { key: 'start_date', label: 'Start date', format: (value) => formatDate(value) },
    { key: 'expiry_date', label: 'Expiry date', format: (value) => value ? formatDate(value) : '—' },
    { key: 'next_billing_date', label: 'Next billing', format: (value) => value ? formatDate(value) : '—' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => {
        const status = String(row.status).toUpperCase();
        const nextStatus = TRANSITIONS[status];
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); navigate(`/subscriptions/${row.id}`); }}>View</Button>
            {['DRAFT', 'QUOTATION'].includes(status) && <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); navigate(`/subscriptions/${row.id}/edit`); }}>Edit</Button>}
            {nextStatus && <Button size="sm" onClick={(event) => { event.stopPropagation(); setTransitionTarget({ id: row.id, number: row.number, status: nextStatus }); }}>{nextStatus === 'ACTIVE' ? 'Activate' : nextStatus === 'CLOSED' ? 'Close' : `Move to ${nextStatus.toLowerCase()}`}</Button>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1><p className="text-gray-600">Manage subscription lifecycle and billing.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/subscriptions/new')}>Create from template</Button>
          <Button onClick={() => navigate('/subscriptions/new')}>Create subscription</Button>
        </div>
      </div>
      {list.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{list.error.message}</p>}
      {customersError && <p className="text-sm text-amber-800" role="status">{customersError}</p>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <SearchInput value={list.search} onChange={list.set_search} placeholder="Search..." className="lg:col-span-2" />
        <Select id="sub-status" label="Status" value={list.filters.status ?? ''} onChange={(event) => list.set_filters({ ...list.filters, status: event.target.value || undefined })} options={Object.keys(STATUS_COLORS).map((value) => ({ value, label: value }))} placeholder="All statuses" />
        <Select id="sub-customer" label="Customer" value={list.filters.customer_id ?? ''} onChange={(event) => list.set_filters({ ...list.filters, customer_id: event.target.value || undefined })} options={customers.map((customer) => ({ value: String(customer.id), label: customer.name }))} placeholder="All customers" />
        <Input id="sub-from" label="Start date from" type="date" value={list.filters.from ?? ''} onChange={(event) => list.set_filters({ ...list.filters, from: event.target.value || undefined })} />
        <Input id="sub-to" label="Start date to" type="date" value={list.filters.to ?? ''} onChange={(event) => list.set_filters({ ...list.filters, to: event.target.value || undefined })} />
      </div>
      <Table columns={columns} data={list.data} loading={list.loading} rowKey="id" emptyMessage="No subscriptions found." onRowClick={(row) => navigate(`/subscriptions/${row.id}`)} />
      <Pagination page={list.page} pageSize={list.page_size} total={list.total} onChange={list.set_page} onPageSizeChange={list.set_page_size} />
      <ConfirmDialog
        open={Boolean(transitionTarget)}
        onConfirm={updateStatus}
        onCancel={() => setTransitionTarget(null)}
        title="Update subscription status?"
        message={transitionTarget ? `Move ${transitionTarget.number} to ${transitionTarget.status.toLowerCase()}?` : ''}
        confirmLabel={transitioning ? 'Updating...' : 'Confirm'}
      />
    </div>
  );
}
