import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import useDebounce from '../../../hooks/useDebounce';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import UsageProgress from '../components/UsageProgress';
import { getDiscounts, deleteDiscount } from '../api';

export default function DiscountListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedScope, setSelectedScope] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    set_filters: setFilters,
    load,
  } = usePaginatedList(getDiscounts);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleScopeChange = (e) => {
    const val = e.target.value;
    setSelectedScope(val);
    setFilters({
      scope: val || undefined,
      state: selectedState || undefined,
    });
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    setFilters({
      scope: selectedScope || undefined,
      state: val || undefined,
    });
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
      toast({
        title: 'Discount Deleted',
        description: `Coupon "${deleteTarget.name}" has been deleted.`,
        variant: 'success',
      });
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete discount.',
        variant: 'danger',
      });
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
      label: 'Validity',
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
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/discounts/${row.id}`)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => handleDeleteClick(e, row)}>
            Delete
          </Button>
        </div>
      ),
    },
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

      {/* Error state banner with retry */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm flex items-center justify-between text-red-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error.message || 'Failed to load discounts.'}</span>
          </div>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-end">
          <div>
            <span className="block text-xs font-medium text-gray-700 mb-1">Search</span>
            <SearchInput
              value={searchInput}
              onChange={(val) => setSearchInput(val)}
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

        {/* Horizontally scrollable table */}
        <div className="w-full overflow-x-auto">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage={
              <div className="py-8 text-center">
                <p className="text-gray-500 font-medium">No discounts found matching your criteria.</p>
                <p className="text-xs text-gray-400 mt-1">Create a promotional campaign or adjust search filters.</p>
                <Link to="/discounts/new">
                  <Button size="sm" variant="outline" className="mt-3">
                    + Create Discount
                  </Button>
                </Link>
              </div>
            }
            onRowClick={(row) => navigate(`/discounts/${row.id}`)}
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

      {/* Delete Confirmation Modal */}
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
