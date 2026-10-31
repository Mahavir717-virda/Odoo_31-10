import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import PlanActions from '../components/PlanActions';
import {
  getPlans,
  deletePlan,
  closePlan,
  togglePausePlan,
  renewPlan,
} from '../api';

export default function PlanListPage() {
  const navigate = useNavigate();

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'danger',
    action: null,
  });

  const {
    data,
    total,
    page,
    pageSize,
    search,
    loading,
    setPage,
    setSearch,
    load,
  } = usePaginatedList(getPlans);

  // Close plan with confirmation
  const handleRequestClose = (plan) => {
    setConfirmModal({
      open: true,
      title: 'Close Subscription Plan',
      message: `Are you sure you want to CLOSE the plan "${plan.name}"? New subscription orders will no longer be allowed on this plan.`,
      confirmLabel: 'Close Plan',
      confirmVariant: 'danger',
      action: async () => {
        await closePlan(plan.id);
        load();
      },
    });
  };

  // Pause / Resume with confirmation
  const handleRequestTogglePause = (plan) => {
    const isCurrentlyActive = plan.status === 'ACTIVE';
    setConfirmModal({
      open: true,
      title: isCurrentlyActive ? 'Pause Subscription Plan' : 'Resume Subscription Plan',
      message: isCurrentlyActive
        ? `Are you sure you want to PAUSE "${plan.name}"? Billing runs for this plan will be temporarily suspended.`
        : `Resume "${plan.name}" to ACTIVE status?`,
      confirmLabel: isCurrentlyActive ? 'Pause Plan' : 'Resume Plan',
      confirmVariant: isCurrentlyActive ? 'danger' : 'primary',
      action: async () => {
        await togglePausePlan(plan.id);
        load();
      },
    });
  };

  // Renew plan with confirmation
  const handleRequestRenew = (plan) => {
    setConfirmModal({
      open: true,
      title: 'Renew Subscription Plan',
      message: `Are you sure you want to RENEW "${plan.name}"? Its status will be reactivated and end date extended.`,
      confirmLabel: 'Renew Plan',
      confirmVariant: 'primary',
      action: async () => {
        await renewPlan(plan.id);
        load();
      },
    });
  };

  // Delete plan with confirmation
  const handleRequestDelete = (id) => {
    setConfirmModal({
      open: true,
      title: 'Delete Subscription Plan',
      message: 'Are you sure you want to delete this plan? Existing subscription records referencing it may be affected.',
      confirmLabel: 'Delete Plan',
      confirmVariant: 'danger',
      action: async () => {
        await deletePlan(id);
        load();
      },
    });
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'CLOSED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Plan Name',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">
            {row.billing_period} • Min Qty: {row.min_quantity}
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => (
        <span className="font-bold text-gray-900">
          {formatMoney(row.price)}
          <span className="text-xs font-normal text-gray-500 lowercase">
            /{row.billing_period?.slice(0, -2) || 'cycle'}
          </span>
        </span>
      ),
    },
    {
      key: 'dates',
      label: 'Availability Dates',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div>From: <span className="font-medium text-gray-800">{formatDate(row.start_date)}</span></div>
          <div>
            Until:{' '}
            <span className="font-medium text-gray-800">
              {row.end_date ? formatDate(row.end_date) : 'Open / Ongoing'}
            </span>
            {row.auto_close && (
              <span className="ml-1 text-[10px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                Auto-close
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'flags',
      label: 'Flags',
      render: (row) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          {row.closable && (
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
              Closable
            </span>
          )}
          {row.pausable && (
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Pausable
            </span>
          )}
          {row.renewable && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Renewable
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={getStatusVariant(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Lifecycle Actions',
      render: (row) => (
        <PlanActions
          plan={row}
          onEdit={(p) => navigate(`/plans/${p.id}`)}
          onClosePlan={handleRequestClose}
          onTogglePause={handleRequestTogglePause}
          onRenew={handleRequestRenew}
          onDelete={handleRequestDelete}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Plans (Admin Only)"
        description="Configure recurring billing frequencies, minimum order thresholds, and lifecycle flags."
        actions={
          <Link to="/plans/new">
            <Button variant="primary">+ Create Plan</Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search plans by name..."
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No subscription plans configured."
          onRowClick={(row) => navigate(`/plans/${row.id}`)}
        />

        <div className="mt-4 pt-3 border-t border-gray-100">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={(p) => setPage(p)}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={async () => {
          if (confirmModal.action) {
            await confirmModal.action();
          }
          setConfirmModal((prev) => ({ ...prev, open: false }));
        }}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
