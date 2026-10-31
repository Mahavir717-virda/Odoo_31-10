import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
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
import UsageProgress from '../components/UsageProgress';
import { getDiscounts, deleteDiscount } from '../api';

export default function DiscountListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [selectedScope, setSelectedScope] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  const {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    setPage,
    setSearch: setPaginatedSearch,
    setFilters: setPaginatedFilters,
    load,
  } = usePaginatedList(getDiscounts);

  const updateFilter = (key, value) => {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    setFilters(next);
    setPaginatedFilters(next);
  };

  const handleScopeChange = (e) => {
    const val = e.target.value;
    setSelectedScope(val);
    updateFilter('scope', val || undefined);
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    updateFilter('state', val || undefined);
  };

  const handleDeleteClick = (e, row) => {
    e.stopPropagation();
    setDeleteTarget(row);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDiscount(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const renderStatusBadges = (row) => {
    const today = new Date().toISOString().slice(0, 10);
    const isExpired = Boolean(row.end_date && row.end_date < today);
    const isExhausted = Boolean(
      row.usage_limit !== null &&
      row.usage_limit !== undefined &&
      row.usage_limit > 0 &&
      (row.used_count || 0) >= row.usage_limit
    );

    const badges = [];

    if (!row.is_active) {
      badges.push(
        <Badge key="inactive" variant="default">
          Inactive
        </Badge>
      );
    }

    if (isExpired) {
      badges.push(
        <Badge key="expired" variant="danger">
          Expired
        </Badge>
      );
    }

    if (isExhausted) {
      badges.push(
        <Badge key="exhausted" variant="danger">
          Exhausted
        </Badge>
      );
    }

    if (row.is_active && !isExpired && !isExhausted) {
      badges.push(
        <Badge key="active" variant="success">
          Active
        </Badge>
      );
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const columns = [
    {
      key: 'name',
      label: 'Discount & Scope',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {row.name}
          </span>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant={row.scope === 'PRODUCTS' ? 'info' : 'default'} className="text-[10px]">
              {row.scope === 'PRODUCTS' ? 'Products Only' : 'Subscription'}
            </Badge>
            {row.scope === 'PRODUCTS' && row.product_ids?.length > 0 && (
              <span className="text-[11px] text-gray-500">
                ({row.product_ids.length} item{row.product_ids.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'benefit',
      label: 'Benefit',
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 text-sm">
            {row.type === 'PERCENT' ? `${row.value}% OFF` : `${formatMoney(row.value)} OFF`}
          </span>
          <div className="text-xs text-gray-500">
            {row.type === 'PERCENT' ? 'Percentage' : 'Fixed Amount'}
          </div>
        </div>
      ),
    },
    {
      key: 'limits',
      label: 'Requirements',
      render: (row) => {
        const hasMinPurchase = row.min_purchase && Number(row.min_purchase) > 0;
        const hasMinQty = row.min_quantity && Number(row.min_quantity) > 0;

        if (!hasMinPurchase && !hasMinQty) {
          return <span className="text-gray-400 text-xs">None</span>;
        }

        return (
          <div className="text-xs space-y-0.5">
            {hasMinPurchase && (
              <div className="text-gray-700">
                Min: <span className="font-medium">{formatMoney(row.min_purchase)}</span>
              </div>
            )}
            {hasMinQty && (
              <div className="text-gray-500">
                Min Qty: <span className="font-medium text-gray-700">{row.min_quantity}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'validity',
      label: 'Valid dates',
      render: (row) => (
        <div className="text-xs text-gray-600">
          <div>From: <span className="text-gray-800 font-medium">{formatDate(row.start_date)}</span></div>
          <div>To: <span className="text-gray-800 font-medium">{formatDate(row.end_date)}</span></div>
        </div>
      ),
    },
    {
      key: 'redemptions',
      label: 'Usage Progress',
      render: (row) => (
        <UsageProgress used={row.used_count} limit={row.usage_limit} />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => renderStatusBadges(row),
    },
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/discounts/${row.id}`)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(e) => handleDeleteClick(e, row)}>Delete</Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Discounts & Coupons"
        description="Configure promotional campaigns, percentage and fixed discounts, and usage limits."
        actions={
          <Link to="/discounts/new">
            <Button variant="primary">+ Create Discount</Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        {(error || actionError) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{actionError || error?.message}</span>
            <Button size="sm" variant="outline" onClick={() => { setActionError(''); load(); }}>Retry</Button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-end">
          <div>
            <span className="block text-xs font-medium text-gray-700 mb-1">Search</span>
            <SearchInput
              value={search}
              onChange={(val) => { setSearch(val); setPaginatedSearch(val); }}
              placeholder="Search discounts by name or code..."
            />
          </div>

          <div>
            <Select
              id="filter-scope"
              label="Scope"
              value={selectedScope}
              onChange={handleScopeChange}
              options={[
                { value: '', label: 'All Scopes' },
                { value: 'SUBSCRIPTION', label: 'Subscription Only' },
                { value: 'PRODUCTS', label: 'Products Only' },
              ]}
              className="!mb-0"
            />
          </div>

          <div>
            <Select
              id="filter-state"
              label="Status / State"
              value={selectedState}
              onChange={handleStateChange}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'exhausted', label: 'Exhausted' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              className="!mb-0"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No discounts found matching your criteria."
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
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Customers will no longer be able to apply this discount.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}