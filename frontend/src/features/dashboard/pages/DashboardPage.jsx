import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { fetchDashboardSummary, fetchOverdueInvoices, fetchRevenueTrend } from '../api';
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
    ]);
    setSummary(results[0].status === 'fulfilled' ? results[0].value : null);
    setRevenue(results[1].status === 'fulfilled' ? results[1].value : []);
    setOverdue(results[2].status === 'fulfilled' ? results[2].value : []);
    setErrors({
      ...(results[0].status === 'rejected' ? { summary: results[0].reason } : {}),
      ...(results[1].status === 'rejected' ? { revenue: results[1].reason } : {}),
      ...(results[2].status === 'rejected' ? { overdue: results[2].reason } : {}),
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
