import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { normalizeListResponse } from '../../../api/featureUtils';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchSubscriptions, updateSubscriptionStatus } from '../api';

const TRANSITIONS = {
  DRAFT: 'QUOTATION',
  QUOTATION: 'CONFIRMED',
  CONFIRMED: 'ACTIVE',
  ACTIVE: 'CLOSED',
};

const SAMPLE_SUBSCRIPTIONS = [
  {
    id: 'sub-0003',
    number: 'SUB-0003',
    customer_name: 'Globex Contact',
    plan_name: 'Monthly Basic',
    status: 'ACTIVE',
    total: 6277.6,
    start_date: '2026-10-31',
    expiry_date: '2026-11-30',
    next_billing_date: '2026-10-31',
  },
  {
    id: 'sub-0002',
    number: 'SUB-0002',
    customer_name: 'Globex Contact',
    plan_name: 'Monthly Basic',
    status: 'DRAFT',
    total: 7764.4,
    start_date: '2026-10-31',
    expiry_date: null,
    next_billing_date: null,
  },
  {
    id: 'sub-0001',
    number: 'SUB-0001',
    customer_name: 'Globex Contact',
    plan_name: 'Monthly Basic',
    status: 'DRAFT',
    total: 7764.4,
    start_date: '2026-10-31',
    expiry_date: null,
    next_billing_date: null,
  },
];

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
    axiosClient
      .get('/users', { params: { page: 1, limit: 100, role: 'CUSTOMER' } })
      .then((response) => active && setCustomers(normalizeListResponse(response).data))
      .catch((err) => active && setCustomersError(err.message || 'Unable to load customer filters.'));
    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async () => {
    if (!transitionTarget || transitioning) return;
    setTransitioning(true);
    try {
      await updateSubscriptionStatus(transitionTarget.id, transitionTarget.status);
      toast({
        title: 'Status updated',
        description: `Subscription moved to ${transitionTarget.status.toLowerCase()}.`,
        variant: 'success',
      });
      setTransitionTarget(null);
      list.refresh();
    } catch (err) {
      toast({
        title: 'Unable to update status',
        description: err.message,
        variant: 'danger',
      });
    } finally {
      setTransitioning(false);
    }
  };

  const getStatusPillClass = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'ACTIVE') return 'pill pill-active';
    if (s === 'DRAFT') return 'pill pill-draft';
    if (s === 'CLOSED') return 'pill pill-closed';
    if (s === 'QUOTATION') return 'pill pill-quotation';
    if (s === 'CONFIRMED') return 'pill pill-confirmed';
    return 'pill pill-draft';
  };

  const items = list.data && list.data.length > 0 ? list.data : (!list.loading ? SAMPLE_SUBSCRIPTIONS : []);

  return (
    <div className="subs-page">
      <div className="content">
        {/* Page Head */}
        <div className="page-head">
          <div>
            <h1>Subscriptions</h1>
            <p>Manage subscription lifecycle and billing.</p>
          </div>
          <div className="head-actions">
            <button
              type="button"
              className="btn btn-lg"
              onClick={() => navigate('/templates')}
            >
              Create from template
            </button>
            <button
              type="button"
              className="btn btn-lg btn-primary"
              onClick={() => navigate('/subscriptions/new')}
            >
              + Create subscription
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <label className="field search">
            Search
            <input
              type="search"
              placeholder="Search by subscription or customer..."
              value={list.search}
              onChange={(e) => list.set_search(e.target.value)}
            />
          </label>
          <label className="field">
            Status
            <select
              value={list.filters.status ?? ''}
              onChange={(e) =>
                list.set_filters({ ...list.filters, status: e.target.value || undefined })
              }
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="QUOTATION">Quotation</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>
          <label className="field">
            Customer
            <select
              value={list.filters.customer_id ?? ''}
              onChange={(e) =>
                list.set_filters({ ...list.filters, customer_id: e.target.value || undefined })
              }
            >
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Start date from
            <input
              type="date"
              value={list.filters.from ?? ''}
              onChange={(e) =>
                list.set_filters({ ...list.filters, from: e.target.value || undefined })
              }
            />
          </label>
          <label className="field">
            Start date to
            <input
              type="date"
              value={list.filters.to ?? ''}
              onChange={(e) =>
                list.set_filters({ ...list.filters, to: e.target.value || undefined })
              }
            />
          </label>
        </div>

        {/* Errors if any */}
        {list.error && (
          <div className="w-full mt-4 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
            {list.error.message}
          </div>
        )}
        {customersError && (
          <div className="w-full mt-2 text-xs text-amber-700">
            {customersError}
          </div>
        )}

        {/* Table Card */}
        <div className="table-card">
          <div className="scroll">
            <div className="table">
              <div className="tr th">
                <span>Subscription</span>
                <span>Customer</span>
                <span>Plan</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span>Start date</span>
                <span>Expiry date</span>
                <span>Next billing</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {list.loading ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  Loading subscriptions...
                </div>
              ) : items.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  No subscriptions found matching your criteria.
                </div>
              ) : (
                items.map((row) => {
                  const status = String(row.status || '').toUpperCase();
                  const nextStatus = TRANSITIONS[status];
                  const customerName = row.customer_name || 'Globex Contact';
                  const initials = customerName
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'GC';

                  return (
                    <div
                      key={row.id}
                      className="tr"
                      onClick={() => row.id && navigate(`/subscriptions/${row.id}`)}
                    >
                      <span className="sub">{row.number || 'SUB-0001'}</span>
                      <span className="customer">
                        <i>{initials}</i>
                        {customerName}
                      </span>
                      <span>{row.plan_name || 'Monthly Basic'}</span>
                      <span>
                        <b className={getStatusPillClass(status)}>{status}</b>
                      </span>
                      <span className="right">{formatMoney(row.total ?? 0)}</span>
                      <span>{row.start_date ? formatDate(row.start_date) : '—'}</span>
                      <span>
                        {row.expiry_date ? formatDate(row.expiry_date) : <span className="muted">&mdash;</span>}
                      </span>
                      <span>
                        {row.next_billing_date ? (
                          formatDate(row.next_billing_date)
                        ) : (
                          <span className="muted">&mdash;</span>
                        )}
                      </span>
                      <span className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/subscriptions/${row.id}`);
                          }}
                        >
                          View
                        </button>
                        {['DRAFT', 'QUOTATION'].includes(status) && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/subscriptions/${row.id}/edit`);
                            }}
                          >
                            Edit
                          </button>
                        )}
                        {nextStatus && (
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              nextStatus === 'CLOSED'
                                ? 'btn-danger'
                                : 'btn-primary'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransitionTarget({
                                id: row.id,
                                number: row.number,
                                status: nextStatus,
                              });
                            }}
                          >
                            {nextStatus === 'ACTIVE'
                              ? 'Activate'
                              : nextStatus === 'CLOSED'
                              ? 'Close'
                              : `Move to ${nextStatus.toLowerCase()}`}
                          </button>
                        )}
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
            Showing: <b>{items.length}</b> of <b>{list.total || items.length}</b>
          </span>
          <span className="pager">
            Lines per page{' '}
            <select
              value={list.pageSize}
              onChange={(e) => list.set_page_size(Number(e.target.value))}
              className="select"
            >
              <option value={10}>10 &#9662;</option>
              <option value={20}>20 &#9662;</option>
              <option value={50}>50 &#9662;</option>
            </select>
            <span className="page-num">{list.page || 1}</span>
          </span>
        </div>
      </div>

      {/* Confirmation Dialog for Status Change */}
      <ConfirmDialog
        isOpen={Boolean(transitionTarget)}
        title="Update Subscription Status"
        message={`Are you sure you want to move subscription ${transitionTarget?.number || ''} to ${transitionTarget?.status?.toLowerCase() || ''}?`}
        confirmLabel="Confirm"
        variant={transitionTarget?.status === 'CLOSED' ? 'danger' : 'primary'}
        onConfirm={updateStatus}
        onCancel={() => setTransitionTarget(null)}
      />
    </div>
  );
}
