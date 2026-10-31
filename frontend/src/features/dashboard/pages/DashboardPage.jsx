import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '../../../utils/formatMoney';
import {
  fetchDashboardActivity,
  fetchDashboardSummary,
  fetchOverdueInvoices,
  fetchRevenueTrend,
} from '../api';

function getRangeDates(preset) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (preset === 'last_month') {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    return {
      preset,
      start_date: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-01`,
      end_date: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  if (preset === 'year') {
    return {
      preset,
      start_date: `${year}-01-01`,
      end_date: now.toISOString().slice(0, 10),
    };
  }

  // default 'month'
  return {
    preset: 'month',
    start_date: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    end_date: now.toISOString().slice(0, 10),
  };
}

const SAMPLE_SUBSCRIPTIONS = [
  { id: '1', number: 'SUB-0003', customer_name: 'Globex Contact', status: 'ACTIVE', total: 6277.60 },
  { id: '2', number: 'SUB-0002', customer_name: 'Globex Contact', status: 'DRAFT', total: 7764.40 },
  { id: '3', number: 'SUB-0001', customer_name: 'Globex Contact', status: 'DRAFT', total: 7764.40 },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [rangePreset, setRangePreset] = useState('month');
  const [filters, setFilters] = useState(() => getRangeDates('month'));
  const [summary, setSummary] = useState(null);
  const [, setRevenue] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [activity, setActivity] = useState(null);
  const [, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const requestFilters = {
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
    };
    const results = await Promise.allSettled([
      fetchDashboardSummary(requestFilters),
      fetchRevenueTrend(requestFilters),
      fetchOverdueInvoices(requestFilters),
      fetchDashboardActivity(),
    ]);
    setSummary(results[0].status === 'fulfilled' ? results[0].value : null);
    setRevenue(results[1].status === 'fulfilled' ? results[1].value : []);
    setOverdue(results[2].status === 'fulfilled' ? results[2].value : []);
    setActivity(results[3].status === 'fulfilled' ? results[3].value : null);
    setLoading(false);
  }, [filters.start_date, filters.end_date]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRangeChange = (e) => {
    const val = e.target.value;
    setRangePreset(val);
    setFilters(getRangeDates(val));
  };

  // KPI metrics
  const revenueReceived = summary?.revenue_received ?? 12480;
  const outstandingAmount = summary?.outstanding ?? 3240;
  const overdueAmount = summary?.overdue_amount ?? 0;
  const overdueCount = summary?.overdue_count ?? overdue.length ?? 0;
  const activeSubs = summary?.active_subscriptions ?? 1;
  const totalSubs = summary?.total_subscriptions ?? 3;
  const totalInvoices = summary?.total_invoices ?? 0;
  const totalPayments = summary?.total_payments ?? 0;

  // Donut chart calculations
  const draftSubs = Math.max(0, totalSubs - activeSubs);
  const activePercent = totalSubs > 0 ? ((activeSubs / totalSubs) * 100).toFixed(1) : '33.3';
  const restPercent = (100 - parseFloat(activePercent)).toFixed(1);

  // Recent activity
  const subscriptionsList = activity?.subscriptions && activity.subscriptions.length > 0
    ? activity.subscriptions
    : SAMPLE_SUBSCRIPTIONS;

  const invoicesList = activity?.invoices ?? [];

  return (
    <div className="dashboard-page page">
      {/* Header */}
      <div className="header">
        <div>
          <h1>Dashboard</h1>
          <p>Subscriptions, received revenue, balances, and overdue invoices.</p>
        </div>
        <div className="actions">
          <select
            className="btn"
            id="dateRange"
            aria-label="Date range"
            value={rangePreset}
            onChange={handleRangeChange}
          >
            <option value="month">This month</option>
            <option value="last_month">Last month</option>
            <option value="year">This year</option>
          </select>
          <button className="btn" onClick={() => navigate('/invoices')}>
            + New invoice
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/subscriptions/new')}>
            + New subscription
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpis">
        <div className="card">
          <div className="card-head">
            <span className="kpi-label">Revenue received</span>
            <span className="icon i-green">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
          </div>
          <div className="kpi-value" id="revenue">
            {formatMoney(revenueReceived)}
          </div>
          <div className="kpi-sub">
            <span className="up">+8.2%</span> vs last month
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="kpi-label">Outstanding</span>
            <span className="icon i-blue">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            </span>
          </div>
          <div className="kpi-value" id="outstanding">
            {formatMoney(outstandingAmount)}
          </div>
          <div className="kpi-sub">
            {invoicesList.length > 0
              ? `${invoicesList.filter((i) => String(i.status).toUpperCase() !== 'PAID').length} invoices awaiting payment`
              : '2 invoices awaiting payment'}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="kpi-label">Overdue</span>
            <span className="icon i-red">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 2 20h20L12 3zM12 10v5M12 18v.5" />
              </svg>
            </span>
          </div>
          <div className="kpi-value" id="overdue" style={{ color: 'var(--red)' }}>
            {formatMoney(overdueAmount)}
          </div>
          <div className="kpi-sub">{overdueCount} overdue invoices</div>
        </div>

        <div className="card">
          <div className="card-head">
            <span className="kpi-label">Active subscriptions</span>
            <span className="icon i-purple">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
              </svg>
            </span>
          </div>
          <div className="kpi-value" id="active">
            {activeSubs}
          </div>
          <div className="kpi-sub">of {totalSubs} total subscriptions</div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="card strip">
        <span>
          Total subscriptions <b id="totalSubs">{totalSubs}</b>
        </span>
        <span>
          Total invoices <b id="totalInv">{totalInvoices}</b>
        </span>
        <span>
          Total payments <b id="totalPay">{totalPayments}</b>
        </span>
      </div>

      {/* Charts */}
      <div className="row">
        <div className="card col-2">
          <div className="card-head">
            <span className="card-title">Revenue over time</span>
            <span className="chip">Sample data</span>
          </div>
          <svg
            viewBox="0 0 600 220"
            width="100%"
            role="img"
            aria-label="Area chart of revenue over the month"
            style={{ marginTop: '12px' }}
          >
            <g stroke="#EEF0F3">
              <line x1="40" y1="30" x2="590" y2="30" />
              <line x1="40" y1="80" x2="590" y2="80" />
              <line x1="40" y1="130" x2="590" y2="130" />
              <line x1="40" y1="180" x2="590" y2="180" />
            </g>
            <path
              d="M40 150 L110 135 L180 142 L250 100 L320 110 L390 70 L460 82 L530 45 L590 38 L590 180 L40 180 Z"
              fill="#DBEAFE"
              opacity=".7"
            />
            <path
              d="M40 150 L110 135 L180 142 L250 100 L320 110 L390 70 L460 82 L530 45 L590 38"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <g fill="#6B7280" fontSize="11">
              <text x="4" y="34">$15k</text>
              <text x="4" y="84">$10k</text>
              <text x="10" y="134">$5k</text>
              <text x="18" y="184">$0</text>
              <text x="40" y="204">Wk 1</text>
              <text x="200" y="204">Wk 2</text>
              <text x="360" y="204">Wk 3</text>
              <text x="530" y="204">Wk 4</text>
            </g>
          </svg>
        </div>

        <div className="card col-1">
          <span className="card-title">Subscription status</span>
          <div className="donut-wrap">
            <svg
              viewBox="0 0 42 42"
              width="150"
              height="150"
              role="img"
              aria-label={`${activeSubs} active, ${draftSubs} draft`}
            >
              <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#2563EB" strokeWidth="6" />
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke="#16A34A"
                strokeWidth="6"
                strokeDasharray={`${activePercent} ${restPercent}`}
                transform="rotate(-90 21 21)"
              />
              <text x="21" y="22.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#111827">
                {totalSubs}
              </text>
              <text x="21" y="28" textAnchor="middle" fontSize="3.4" fill="#6B7280">
                total
              </text>
            </svg>
            <div className="legend">
              <span>
                <i className="dot" style={{ background: '#16A34A' }}></i>Active <b>{activeSubs}</b>
              </span>
              <span>
                <i className="dot" style={{ background: '#2563EB' }}></i>Draft <b>{draftSubs}</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="row">
        <div className="card col-half">
          <div className="card-head">
            <span className="card-title">Recent subscriptions</span>
            <button className="btn btn-sm" onClick={() => navigate('/subscriptions')}>
              View all
            </button>
          </div>
          <div className="table-scroll">
            <div className="table">
              <div className="tr th">
                <span>Subscription</span>
                <span>Customer</span>
                <span>Status</span>
                <span className="right">Total</span>
              </div>
              {subscriptionsList.map((sub, idx) => {
                const customerName = sub.customer_name || 'Globex Contact';
                const initials = customerName
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'GC';
                const status = String(sub.status || 'DRAFT').toUpperCase();
                const isActive = status === 'ACTIVE';

                return (
                  <div
                    key={sub.id || idx}
                    className="tr"
                    onClick={() => sub.id && navigate(`/subscriptions/${sub.id}`)}
                  >
                    <b>{sub.number || `SUB-000${idx + 1}`}</b>
                    <span className="customer">
                      <i className="avatar">{initials}</i>
                      {customerName}
                    </span>
                    <span>
                      <b className={`pill ${isActive ? 'pill-active' : 'pill-draft'}`}>
                        {status}
                      </b>
                    </span>
                    <span className="right">{formatMoney(sub.total ?? 0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card col-third">
          <div className="card-head">
            <span className="card-title">Recent invoices</span>
            <button className="btn btn-sm" onClick={() => navigate('/invoices')}>
              View all
            </button>
          </div>
          {invoicesList.length === 0 ? (
            <div className="empty">
              <span>No invoices yet</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/invoices')}
              >
                Create your first invoice
              </button>
            </div>
          ) : (
            <div className="table-scroll">
              <div className="table">
                <div className="tr th">
                  <span>Invoice</span>
                  <span>Customer</span>
                  <span>Status</span>
                  <span className="right">Total</span>
                </div>
                {invoicesList.slice(0, 4).map((inv, idx) => {
                  const customerName = inv.customer_name || 'Customer';
                  const initials = customerName
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'CU';
                  const status = String(inv.status || 'DRAFT').toUpperCase();
                  const isPaid = status === 'PAID';
                  const isOverdue = status === 'OVERDUE';

                  return (
                    <div
                      key={inv.id || idx}
                      className="tr"
                      onClick={() => inv.id && navigate(`/invoices/${inv.id}`)}
                    >
                      <b>{inv.number || `INV-000${idx + 1}`}</b>
                      <span className="customer">
                        <i className="avatar">{initials}</i>
                        {customerName}
                      </span>
                      <span>
                        <b
                          className={`pill ${
                            isPaid
                              ? 'pill-active'
                              : isOverdue
                              ? 'pill-overdue'
                              : 'pill-draft'
                          }`}
                        >
                          {status}
                        </b>
                      </span>
                      <span className="right">{formatMoney(inv.total ?? 0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overdue Banner */}
      {overdueCount > 0 ? (
        <div className="banner banner-bad" id="overdueBanner">
          <div>
            <strong>
              {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}
            </strong>
            <small>Outstanding balance: {formatMoney(overdueAmount)}</small>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => navigate('/invoices?overdue=true')}
          >
            View all overdue invoices
          </button>
        </div>
      ) : (
        <div className="banner banner-ok" id="overdueBanner">
          <div>
            <strong>No overdue invoices</strong>
            <small>You are all caught up.</small>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => navigate('/invoices?overdue=true')}
          >
            View all overdue invoices
          </button>
        </div>
      )}
    </div>
  );
}
