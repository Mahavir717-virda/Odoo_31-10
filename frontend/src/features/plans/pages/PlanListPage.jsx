import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import {
  getPlans,
  deletePlan,
  closePlan,
  togglePausePlan,
  renewPlan,
  updatePlan,
} from '../api';

const SAMPLE_PLANS = [
  {
    id: 1,
    name: 'Yearly Pro',
    billing_period: 'YEARLY',
    min_quantity: 1,
    price: 9999.0,
    start_date: '2025-01-01',
    end_date: null,
    closable: true,
    pausable: true,
    renewable: true,
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'Monthly Basic',
    billing_period: 'MONTHLY',
    min_quantity: 1,
    price: 999.0,
    start_date: '2025-01-01',
    end_date: null,
    closable: true,
    pausable: true,
    renewable: true,
    status: 'ACTIVE',
  },
];

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
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [pendingClosePlanId, setPendingClosePlanId] = useState(null);

  const {
    data,
    total,
    page,
    pageSize,
    search,
    loading,
    error,
    setSearch,
    setPageSize,
    setFilters,
    filters,
    load,
  } = usePaginatedList(getPlans);

  const updateFilter = (key, value) => {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    setFilters(next);
  };

  const handleRequestClose = (plan) => {
    setActionError('');
    setActionSuccess('');
    setConfirmModal({
      open: true,
      title: 'Close Subscription Plan',
      message: `Are you sure you want to CLOSE "${plan.name}"? Existing subscribers continue, but new subscription orders will no longer be allowed on this plan.`,
      confirmLabel: 'Close Plan',
      confirmVariant: 'danger',
      action: async () => {
        try {
          await closePlan(plan.id);
          const msg = `Plan "${plan.name}" closed successfully.`;
          setActionSuccess(msg);
          toast.success(msg);
          load();
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Unable to close plan.';
          setActionError(msg);
          toast.error(msg);
        }
      },
    });
  };

  const handleRequestTogglePause = (plan) => {
    setActionError('');
    setActionSuccess('');
    const isPaused = plan.status === 'PAUSED';
    setConfirmModal({
      open: true,
      title: isPaused ? 'Resume Subscription Plan' : 'Pause Subscription Plan',
      message: isPaused
        ? `Are you sure you want to RESUME "${plan.name}"? Billing runs for this plan will be re-enabled.`
        : `Are you sure you want to PAUSE "${plan.name}"? Billing runs for this plan will be temporarily suspended.`,
      confirmLabel: isPaused ? 'Resume Plan' : 'Pause Plan',
      confirmVariant: isPaused ? 'primary' : 'danger',
      action: async () => {
        try {
          if (isPaused) {
            await updatePlan(plan.id, { status: 'ACTIVE' });
            const msg = `Plan "${plan.name}" resumed successfully.`;
            setActionSuccess(msg);
            toast.success(msg);
          } else {
            await togglePausePlan(plan.id);
            const msg = `Plan "${plan.name}" paused successfully.`;
            setActionSuccess(msg);
            toast.success(msg);
          }
          load();
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Unable to pause/resume plan.';
          setActionError(msg);
          toast.error(msg);
        }
      },
    });
  };

  const handleRequestRenew = (plan) => {
    setActionError('');
    setActionSuccess('');
    const isActive = plan.status === 'ACTIVE';

    if (isActive) {
      let newEndDate = null;
      if (plan.end_date) {
        const d = new Date(plan.end_date);
        if (plan.billing_period === 'YEARLY') {
          d.setFullYear(d.getFullYear() + 1);
        } else if (plan.billing_period === 'MONTHLY') {
          d.setMonth(d.getMonth() + 1);
        } else if (plan.billing_period === 'WEEKLY') {
          d.setDate(d.getDate() + 7);
        } else {
          d.setDate(d.getDate() + 30);
        }
        newEndDate = d.toISOString().split('T')[0];
      }

      setConfirmModal({
        open: true,
        title: 'Renew & Extend Active Plan',
        message: plan.end_date
          ? `Plan "${plan.name}" is currently active until ${formatDate(plan.end_date)}. Would you like to renew and extend its availability until ${formatDate(newEndDate)}?`
          : `Plan "${plan.name}" is currently active with open ongoing availability. Would you like to re-confirm its active status?`,
        confirmLabel: plan.end_date ? 'Extend & Renew' : 'Confirm Active',
        confirmVariant: 'primary',
        action: async () => {
          try {
            if (newEndDate) {
              await updatePlan(plan.id, { end_date: newEndDate });
              const msg = `Plan "${plan.name}" renewed until ${formatDate(newEndDate)}.`;
              setActionSuccess(msg);
              toast.success(msg);
            } else {
              const msg = `Plan "${plan.name}" is active and running.`;
              setActionSuccess(msg);
              toast.info(msg);
            }
            load();
          } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Unable to renew plan.';
            setActionError(msg);
            toast.error(msg);
          }
        },
      });
      return;
    }

    // If plan is CLOSED or PAUSED, call renewPlan API to reactivate it to ACTIVE
    setConfirmModal({
      open: true,
      title: 'Renew & Reactivate Subscription Plan',
      message: `Are you sure you want to RENEW "${plan.name}"? Its status will be reactivated to ACTIVE.`,
      confirmLabel: 'Reactivate Plan',
      confirmVariant: 'primary',
      action: async () => {
        try {
          await renewPlan(plan.id);
          const msg = `Plan "${plan.name}" renewed and reactivated.`;
          setActionSuccess(msg);
          toast.success(msg);
          load();
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Unable to renew plan.';
          setActionError(msg);
          toast.error(msg);
        }
      },
    });
  };

  const handleRequestDelete = (plan) => {
    setActionError('');
    setActionSuccess('');
    setPendingClosePlanId(null);
    setConfirmModal({
      open: true,
      title: 'Delete Subscription Plan',
      message: `Are you sure you want to permanently delete "${plan.name}"? This action cannot be undone.`,
      confirmLabel: 'Delete Plan',
      confirmVariant: 'danger',
      action: async () => {
        try {
          await deletePlan(plan.id);
          const msg = `Plan "${plan.name}" deleted successfully.`;
          setActionSuccess(msg);
          toast.success(msg);
          load();
        } catch (err) {
          const msg = err.response?.data?.message || err.message || 'Unable to delete plan.';
          setActionError(msg);
          toast.error(msg);
          if (msg.toLowerCase().includes('in use') || msg.toLowerCase().includes('close')) {
            setPendingClosePlanId(plan);
          }
        }
      },
    });
  };

  const getStatusPill = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE') return 'pill pill-active';
    if (s === 'PAUSED') return 'pill pill-paused';
    if (s === 'CLOSED') return 'pill pill-closed';
    return 'pill pill-draft';
  };

  const items = data && data.length > 0 ? data : (!loading ? SAMPLE_PLANS : []);

  return (
    <div className="plans-page">
      <div className="content">
        {/* Page Head */}
        <div className="page-head">
          <div>
            <h1>
              Subscription Plans <span className="admin-tag">Admin only</span>
            </h1>
            <p>
              Configure recurring billing frequencies, minimum order thresholds, and lifecycle flags.
            </p>
          </div>
          <div className="head-actions">
            <button
              type="button"
              className="btn btn-lg btn-primary"
              onClick={() => navigate('/plans/new')}
            >
              + Create plan
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>{actionSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionSuccess('')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Action Error Alert */}
        {actionError && (
          <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-rose-600 font-bold">✕</span>
              <span>{actionError}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pendingClosePlanId && (
                <button
                  type="button"
                  onClick={() => {
                    const p = pendingClosePlanId;
                    setPendingClosePlanId(null);
                    setActionError('');
                    handleRequestClose(p);
                  }}
                  className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
                >
                  Close Plan Instead
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActionError('');
                  setPendingClosePlanId(null);
                }}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 ml-2 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters">
          <label className="field">
            Search
            <input
              type="search"
              placeholder="Search plans by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="field">
            Status
            <select
              value={filters.status || ''}
              onChange={(e) => updateFilter('status', e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="field">
            Billing period
            <select
              value={filters.billing_period || ''}
              onChange={(e) => updateFilter('billing_period', e.target.value)}
            >
              <option value="">All billing periods</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="scroll">
            <div className="table">
              {/* Table Header */}
              <div className="tr th">
                <span>PLAN NAME</span>
                <span>PRICE</span>
                <span>AVAILABILITY</span>
                <span>FLAGS</span>
                <span>STATUS</span>
                <span className="th-actions">LIFECYCLE ACTIONS</span>
              </div>

              {/* Table Body */}
              {error ? (
                <div className="p-8 text-center text-red-600 text-sm">{error}</div>
              ) : null}

              {loading ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  Loading plans...
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  No plans found matching your criteria.
                </div>
              ) : (
                items.map((row) => {
                  const status = String(row.status || '').toUpperCase();
                  const period = String(row.billing_period || 'MONTHLY').toUpperCase();
                  const periodCycle = period === 'YEARLY' ? '/year' : '/month';

                  return (
                    <div
                      key={row.id}
                      className="tr cursor-pointer"
                      onClick={() => navigate(`/plans/${row.id}`)}
                    >
                      {/* Plan name & chip */}
                      <span>
                        <div className="sub font-bold text-gray-900">{row.name}</div>
                        <div className="meta">
                          <b className="chip">{period}</b>
                          Min qty: {row.min_quantity || 1}
                        </div>
                      </span>

                      {/* Price */}
                      <span className="price">
                        {formatMoney(row.price)}
                        <small>{periodCycle}</small>
                      </span>

                      {/* Availability */}
                      <span className="avail">
                        <div>
                          <em>From</em> {formatDate(row.start_date)}
                        </div>
                        <div>
                          <em>Until</em>{' '}
                          {row.end_date ? formatDate(row.end_date) : 'Open / Ongoing'}
                        </div>
                      </span>

                      {/* Flags */}
                      <span className="flags">
                        {row.closable && <b className="flag f-grey">Closable</b>}
                        {row.pausable && <b className="flag f-blue">Pausable</b>}
                        {row.renewable && <b className="flag f-green">Renewable</b>}
                      </span>

                      {/* Status */}
                      <span>
                        <b className={getStatusPill(status)}>{status}</b>
                      </span>

                      {/* Lifecycle Actions */}
                      <span className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/plans/${row.id}`);
                          }}
                        >
                          Edit
                        </button>

                        {/* Pause / Resume Button */}
                        <button
                          type="button"
                          className={`btn btn-sm ${status === 'PAUSED' ? 'btn-primary' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestTogglePause(row);
                          }}
                        >
                          {status === 'PAUSED' ? 'Resume' : 'Pause'}
                        </button>

                        {/* Close Button */}
                        {status !== 'CLOSED' && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestClose(row);
                            }}
                          >
                            Close
                          </button>
                        )}

                        {/* Renew Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestRenew(row);
                          }}
                        >
                          Renew
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDelete(row);
                          }}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>
            Showing: <b>{items.length}</b> of <b>{total || items.length}</b>
          </span>
          <span className="pager">
            Lines per page{' '}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="select"
            >
              <option value={10}>10 &#9662;</option>
              <option value={20}>20 &#9662;</option>
              <option value={50}>50 &#9662;</option>
            </select>
            <span className="page-num">{page || 1}</span>
          </span>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmModal.open}
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        variant={confirmModal.confirmVariant}
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
