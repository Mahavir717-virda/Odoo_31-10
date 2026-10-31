import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { useAuth } from '../../../context/AuthContext';
import UsageProgress from '../components/UsageProgress';
import { getDiscounts, deleteDiscount } from '../api';

export default function DiscountListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');

  const {
    data,
    total,
    page,
    pageSize,
    search,
    loading,
    error,
    setPage,
    setSearch,
    setFilters,
    filters,
    load,
  } = usePaginatedList(getDiscounts);

  const updateFilter = (key, value) => {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    setFilters(next);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteDiscount(deleteTarget.id);
        setDeleteTarget(null);
        setActionError('');
        load();
      } catch (deleteError) {
        setActionError(deleteError?.message || 'Unable to delete discount.');
      }
    }
  };

  const getStatus = (discount) => {
    if (!discount.is_active) return 'disabled';
    const endDate = String(discount.end_date ?? '').slice(0, 10);
    if (endDate && Number.isFinite(Date.parse(endDate)) && new Date(`${endDate}T00:00:00`) < new Date(new Date().toDateString())) return 'expired';
    if (discount.usage_limit && discount.used_count >= discount.usage_limit) return 'exhausted';
    return 'active';
  };

  const columns = [
    {
      key: 'name',
      label: 'Discount',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900">{row.name}</span>
          <div className="text-xs text-gray-500">{row.scope}</div>
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Benefit',
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {String(row.type).toUpperCase() === 'PERCENT' ? `${row.value}% OFF` : `${formatMoney(row.value)} OFF`}
        </span>
      ),
    },
    {
      key: 'usage',
      label: 'Redemptions',
      render: (row) => (
        <UsageProgress current={row.used_count} max={row.usage_limit} />
      ),
    },
    {
      key: 'dates',
      label: 'Valid dates',
      render: (row) => (
        <span className="text-xs text-gray-600">{formatDate(row.start_date)} – {formatDate(row.end_date)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const status = getStatus(row);
        return <Badge variant={status === 'active' ? 'success' : status === 'expired' ? 'warning' : 'default'}>{status}</Badge>;
      },
    },
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/discounts/${row.id}`)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}>Delete</Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Discounts & Coupons"
        description="Create promotional rules and review their usage."
        actions={isAdmin ? (
          <Link to="/discounts/new">
            <Button variant="primary">+ Create Discount</Button>
          </Link>
        ) : null}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        {(error || actionError) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{actionError || error?.message}</span>
            <Button size="sm" variant="outline" onClick={() => { setActionError(''); load(); }}>Retry</Button>
          </div>
        )}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search discounts by name..."
          />
          <Select
            value={filters.state || ''}
            onChange={(event) => updateFilter('state', event.target.value)}
            aria-label="Filter discounts by status"
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'expired', label: 'Expired' },
              { value: 'exhausted', label: 'Exhausted' },
            ]}
          />
          <Select
            value={filters.scope || ''}
            onChange={(event) => updateFilter('scope', event.target.value)}
            aria-label="Filter discounts by scope"
            options={[
              { value: '', label: 'All scopes' },
              { value: 'PRODUCTS', label: 'Products' },
              { value: 'SUBSCRIPTION', label: 'Subscriptions' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No discounts found."
          onRowClick={(row) => navigate(`/discounts/${row.id}`)}
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
        open={Boolean(deleteTarget)}
        title="Delete Discount"
        message={`Delete discount "${deleteTarget?.name}"?`}
        confirmLabel="Delete Discount"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
