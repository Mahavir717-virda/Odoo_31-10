import { useCallback, useEffect, useRef, useState } from 'react';

import Card from '../../../../components/ui/Card';
import { formatMoney } from '../../../../utils/formatMoney';
import {
  fetchDashboardSummary,
  fetchOverdueInvoices,
  fetchRevenueTrend,
} from '../api';
import DashboardFilters from './components/DashboardFilters';
import OverdueTable from './components/OverdueTable';
import RevenueChart from './components/RevenueChart';
import SummaryCards from './components/SummaryCards';

export default function DashboardPage() {
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '' });

  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [revenueError, setRevenueError] = useState(null);
  const [overdue, setOverdue] = useState(null);
  const [overdueError, setOverdueError] = useState(null);

  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);

  const loadDashboard = useCallback(async () => {
    mountedRef.current = true;
    setLoading(true);

    await Promise.allSettled([
      fetchDashboardSummary(filters)
        .then((response) => {
          if (mountedRef.current) {
            setSummary(response.data);
            setSummaryError(null);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setSummary(null);
            setSummaryError(err instanceof Error ? err : new Error(String(err)));
          }
        }),
      fetchRevenueTrend(filters)
        .then((response) => {
          if (mountedRef.current) {
            setRevenue(response.data);
            setRevenueError(null);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setRevenue([]);
            setRevenueError(err instanceof Error ? err : new Error(String(err)));
          }
        }),
      fetchOverdueInvoices(filters)
        .then((response) => {
          if (mountedRef.current) {
            setOverdue(response.data);
            setOverdueError(null);
          }
        })
        .catch((err) => {
          if (mountedRef.current) {
            setOverdue([]);
            setOverdueError(err instanceof Error ? err : new Error(String(err)));
          }
        }),
    ]);

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
    return () => {
      mountedRef.current = false;
    };
  }, [loadDashboard]);

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
  };

  const totalOverdueAmount = (overdue || []).reduce((total, item) => total + Number(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Overview of active subscriptions, revenue, payments, and overdue invoices.
        </p>
      </div>

      <Card>
        <DashboardFilters filters={filters} onChange={handleFiltersChange} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <SummaryCards
                data={summary}
                loading={loading || summary === null && !summaryError}
                error={summaryError}
              />
            </div>
          </Card>
          <Card>
            <RevenueChart
              data={revenue}
              loading={loading || revenue === null && !revenueError}
              error={revenueError}
            />
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <div className="p-6 flex flex-col">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Overdue Invoices</h2>
              <p className="text-sm text-gray-500 mb-4">
                {overdue ? overdue.length : '--'} overdue invoices{' '}
                {totalOverdueAmount ? `• ${formatMoney(totalOverdueAmount)} outstanding` : ''}
              </p>
              <OverdueTable
                data={overdue}
                loading={loading || overdue === null && !overdueError}
                error={overdueError}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
