import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import useDebounce from '../../../hooks/useDebounce';
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
  const { toast } = useToast();

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'danger',
    action: null,
  });

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const {
    data,
    total,
    page,
    page_size: pageSize,
    loading,
    error,
    set_page: setPage,
    set_search: setSearch,
    load,
  } = usePaginatedList(getPlans);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Close plan with confirmation
  const handleRequestClose = (plan) => {
    setConfirmModal({
      open: true,
      title: 'Close Subscription Plan',
      message: `Are you sure you want to CLOSE the plan "${plan.name}"? New subscription orders will no longer be allowed on this plan.`,
      confirmLabel: 'Close Plan',
      confirmVariant: 'danger',
      action: async () => {
        try {
          await closePlan(plan.id);
          toast({
            title: 'Plan Closed',
            description: `Plan "${plan.name}" has been closed.`,
            variant: 'warning',
          });
          load();
        } catch (err) {
          toast({
            title: 'Action Failed',
            description: err.message || 'Failed to close plan.',
            variant: 'danger',
          });
        }
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
        try {
          await togglePausePlan(plan.id);
          toast({
            title: isCurrentlyActive ? 'Plan Paused' : 'Plan Resumed',
            description: `Plan status updated to ${isCurrentlyActive ? 'PAUSED' : 'ACTIVE'}.`,
            variant: 'success',
          });
          load();
        } catch (err) {
          toast({
            title: 'Action Failed',
            description: err.message || 'Failed to update plan status.',
            variant: 'danger',
          });
        }
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
        try {
          await renewPlan(plan.id);
          toast({
            title: 'Plan Renewed',
            description: `Plan "${plan.name}" renewed and reactivated.`,
            variant: 'success',
          });
          load();
        } catch (err) {
          toast({
            title: 'Action Failed',
            description: err.message || 'Failed to renew plan.',
            variant: 'danger',
          });
        }
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
        try {
          await deletePlan(id);
          toast({
            title: 'Plan Deleted',
            description: 'Plan removed successfully.',
            variant: 'success',
          });
          load();
        } catch (err) {
          toast({
            title: 'Action Failed',
            description: err.message || 'Failed to delete plan.',
            variant: 'danger',
          });
        }
      },
    });
  };

  const handleModalConfirm = async () => {
    if (confirmModal.action) {
      await confirmModal.action();
    }
    setConfirmModal((prev) => ({ ...prev, open: false, action: null }));
  };

  const columns = [
    {
      key: 'name',
      label: 'Plan Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900">{row.name}</span>
          <div className="text-xs text-gray-500">Min Qty: {row.min_quantity}</div>
        </div>
      ),
    },
    {
      key: 'pricing',
      label: 'Price & Period',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900">{formatMoney(row.price)}</span>
          <span className="text-xs text-gray-500"> / {row.billing_period.toLowerCase()}</span>
        </div>
      ),
    },
    {
      key: 'validity',
      label: 'Validity Range',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div>From: {formatDate(row.start_date)}</div>
          <div>To: {row.end_date ? formatDate(row.end_date) : 'Open-ended'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        let variant = 'default';
        if (row.status === 'ACTIVE') variant = 'success';
        else if (row.status === 'PAUSED') variant = 'warning';
        else if (row.status === 'CLOSED') variant = 'danger';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
    {
      key: 'lifecycle',
      label: 'Capabilities',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.closable && <Badge variant="default" className="text-[10px]">Closable</Badge>}
          {row.pausable && <Badge variant="default" className="text-[10px]">Pausable</Badge>}
          {row.renewable && <Badge variant="default" className="text-[10px]">Renewable</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <PlanActions
            plan={row}
            onEdit={() => navigate(`/plans/${row.id}`)}
            onClosePlan={() => handleRequestClose(row)}
            onTogglePause={() => handleRequestTogglePause(row)}
            onRenew={() => handleRequestRenew(row)}
            onDelete={() => handleRequestDelete(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Configure recurring billing plans, lifecycle rules (pause, close, renew), and period tiers."
        actions={
          <Link to="/plans/new">
            <Button variant="primary">+ Create Plan</Button>
          </Link>
        }
      />

      {/* Error state banner with retry */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm flex items-center justify-between text-red-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error.message || 'Failed to load plans.'}</span>
          </div>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={searchInput}
            onChange={(val) => setSearchInput(val)}
            placeholder="Search plans by name..."
          />
        </div>

        {/* Horizontally scrollable table */}
        <div className="w-full overflow-x-auto">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage={
              <div className="py-8 text-center">
                <p className="text-gray-500 font-medium">No subscription plans found.</p>
                <p className="text-xs text-gray-400 mt-1">Configure your first billing plan to start selling subscriptions.</p>
                <Link to="/plans/new">
                  <Button size="sm" variant="outline" className="mt-3">
                    + Create Plan
                  </Button>
                </Link>
              </div>
            }
            onRowClick={(row) => navigate(`/plans/${row.id}`)}
          />
        </div>

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
        onConfirm={handleModalConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false, action: null }))}
      />
    </div>
  );
}
