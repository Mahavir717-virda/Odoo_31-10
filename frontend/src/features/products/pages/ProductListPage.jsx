import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import useDebounce from '../../../hooks/useDebounce';
import { formatMoney } from '../../../utils/formatMoney';
import { useAuth } from '../../../context/AuthContext';
import { getProducts, deleteProduct } from '../api';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [deleteTargetId, setDeleteTargetId] = useState(null);
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
    load,
  } = usePaginatedList(getProducts);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTargetId);
      toast({
        title: 'Product Deleted',
        description: 'Product and variants removed successfully.',
        variant: 'success',
      });
      setDeleteTargetId(null);
      load();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete product.',
        variant: 'danger',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case 'SERVICE':
        return 'primary';
      case 'GOODS':
        return 'success';
      case 'ADDON':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product Name',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">
            {row.variants?.length > 0
              ? `${row.variants.length} variant${row.variants.length > 1 ? 's' : ''}`
              : 'No variants'}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={getTypeVariant(row.type)} size="sm">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'sales_price',
      label: 'Sales Price',
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {formatMoney(row.sales_price)}
        </span>
      ),
    },
    {
      key: 'cost_price',
      label: 'Cost Price',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatMoney(row.cost_price)}
        </span>
      ),
    },
    {
      key: 'tax_name',
      label: 'Default Tax',
      render: (row) => (
        <span className="text-xs text-gray-600">
          {row.tax_name || (row.tax_id ? `Tax #${row.tax_id}` : 'None')}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/products/${row.id}`)}
          >
            {isAdmin ? 'Edit' : 'View'}
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleteTargetId(row.id)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Products & Catalog (Admin)' : 'Products & Catalog (Staff Read-Only)'}
        description={
          isAdmin
            ? 'Manage all subscription-eligible products, add-ons, pricing, and variants.'
            : 'Catalog overview for staff members. Creating and deleting are restricted to Admins.'
        }
        actions={
          isAdmin ? (
            <Link to="/products/new">
              <Button variant="primary">+ Create Product</Button>
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
              Staff Read-Only
            </span>
          )
        }
      />

      {/* Error state banner with retry */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm flex items-center justify-between text-red-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error.message || 'Failed to load products list.'}</span>
          </div>
          <Button size="sm" variant="outline" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={searchInput}
            onChange={(val) => setSearchInput(val)}
            placeholder="Search products by name or type..."
          />
        </div>

        {/* Horizontally scrollable table */}
        <div className="w-full overflow-x-auto">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage={
              <div className="py-8 text-center">
                <p className="text-gray-500 font-medium">No products found in the catalog.</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or create a new product.</p>
                {isAdmin && (
                  <Link to="/products/new">
                    <Button size="sm" variant="outline" className="mt-3">
                      + Create Product
                    </Button>
                  </Link>
                )}
              </div>
            }
            onRowClick={(row) => navigate(`/products/${row.id}`)}
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

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Product"
        message="Are you sure you want to remove this product and all its variants from the catalog?"
        confirmLabel={deleting ? 'Deleting...' : 'Delete Product'}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
