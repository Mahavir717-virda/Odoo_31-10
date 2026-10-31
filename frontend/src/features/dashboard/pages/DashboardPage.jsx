import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Table from '../../../components/ui/Table';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchDashboardActivity, fetchDashboardSummary, fetchOverdueInvoices, fetchRevenueTrend } from '../api';
import DashboardFilters from '../components/DashboardFilters';
import OverdueTable from '../components/OverdueTable';
import RevenueChart from '../components/RevenueChart';
import SummaryCards from '../components/SummaryCards';

function initialRange() {
  const now = new Date();
  return { preset: 'month', start_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end_date: now.toISOString().slice(0, 10) };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialRange);
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const requestFilters = { start_date: filters.start_date || undefined, end_date: filters.end_date || undefined };
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
    setErrors({
      ...(results[0].status === 'rejected' ? { summary: results[0].reason } : {}),
      ...(results[1].status === 'rejected' ? { revenue: results[1].reason } : {}),
      ...(results[2].status === 'rejected' ? { overdue: results[2].reason } : {}),
      ...(results[3].status === 'rejected' ? { activity: results[3].reason } : {}),
    });
    setLoading(false);
  }, [filters.start_date, filters.end_date]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-600">Subscriptions, received revenue, balances, and overdue invoices.</p></div>
      <Card><DashboardFilters filters={filters} onChange={setFilters} /></Card>
      <SummaryCards data={summary} loading={loading} error={errors.summary} />
      <RevenueChart data={revenue} loading={loading} error={errors.revenue} />
      <section className="space-y-4">
        <div><h2 className="text-lg font-semibold text-gray-900">Recent business activity</h2><p className="text-sm text-gray-500">Latest subscriptions and invoices from your account.</p></div>
        {errors.activity && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{errors.activity.message || 'Unable to load recent activity.'}</p>}
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold text-gray-900">Recent subscriptions</h3><Button size="sm" variant="outline" onClick={() => navigate('/subscriptions')}>View all</Button></div>
            <Table
              columns={[
                { key: 'number', label: 'Subscription' },
                { key: 'customer_name', label: 'Customer' },
                { key: 'status', label: 'Status', format: (value) => <Badge variant={String(value).toUpperCase() === 'ACTIVE' ? 'success' : 'info'}>{String(value ?? '').replaceAll('_', ' ')}</Badge> },
                { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
              ]}
              data={activity?.subscriptions ?? []}
              loading={loading}
              rowKey="id"
              emptyMessage="No subscriptions found."
              onRowClick={(subscription) => navigate(`/subscriptions/${subscription.id}`)}
            />
          </Card>
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-semibold text-gray-900">Recent invoices</h3><Button size="sm" variant="outline" onClick={() => navigate('/invoices')}>View all</Button></div>
            <Table
              columns={[
                { key: 'number', label: 'Invoice' },
                { key: 'customer_name', label: 'Customer' },
                { key: 'due_date', label: 'Due date', format: (value) => formatDate(value) },
                { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
                { key: 'status', label: 'Status', format: (value) => <Badge variant={String(value).toUpperCase() === 'PAID' ? 'success' : 'info'}>{String(value ?? '').replaceAll('_', ' ')}</Badge> },
              ]}
              data={activity?.invoices ?? []}
              loading={loading}
              rowKey="id"
              emptyMessage="No invoices found."
              onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
            />
          </Card>
        </div>
      </section>
      <Card>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="text-base font-semibold text-gray-900">Overdue invoices</h2><p className="text-sm text-gray-500">{summary?.overdue_count ?? overdue.length} invoices · {summary ? 'balance amounts appear above' : 'summary unavailable'}</p></div>
          <Button size="sm" variant="outline" onClick={() => navigate('/invoices?overdue=true')}>View all overdue invoices</Button>
        </div>
        <OverdueTable data={overdue} loading={loading} error={errors.overdue} />
      </Card>
    </div>
  );
}
