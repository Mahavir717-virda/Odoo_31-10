import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { useAuth } from '../../../context/AuthContext';
import { getProducts, deleteProduct } from '../api';

export default function ProductListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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
  } = usePaginatedList(getProducts);

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteProduct(deleteTargetId);
      setDeleteTargetId(null);
      load();
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
            {isAdmin ? 'Edit' : 'View Details'}
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
            ? 'Manage all products, services, add-ons, pricing, and variants.'
            : 'Catalog overview for staff members. Editing and deletion are restricted to Admins.'
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search products by name or type..."
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No products found in the catalog."
          onRowClick={(row) => navigate(`/products/${row.id}`)}
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
        open={Boolean(deleteTargetId)}
        title="Delete Product"
        message="Are you sure you want to remove this product and all its variants from the catalog?"
        confirmLabel="Delete Product"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
