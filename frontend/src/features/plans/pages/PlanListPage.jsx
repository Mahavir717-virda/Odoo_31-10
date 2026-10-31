import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import PlanActions from '../components/PlanActions';
import { getPlans, deletePlan } from '../api';

export default function PlanListPage() {
  const navigate = useNavigate();

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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription plan?')) {
      await deletePlan(id);
      load();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Plan Name',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'billing',
      label: 'Billing Cycle',
      render: (row) => (
        <span className="text-sm capitalize text-gray-700">
          Every {row.interval_count > 1 ? `${row.interval_count} ` : ''}{row.billing_interval}
          {row.interval_count > 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (row) => (
        <span className="font-medium text-gray-900">{formatMoney(row.price)}</span>
      ),
    },
    {
      key: 'trial',
      label: 'Trial Period',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.trial_days > 0 ? `${row.trial_days} days` : 'No trial'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <PlanActions
          plan={row}
          onEdit={(p) => navigate(`/plans/${p.id}`)}
          onDelete={handleDelete}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Configure recurring billing plans and intervals."
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
            placeholder="Search plans by name or code..."
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No subscription plans found."
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
    </div>
  );
}

