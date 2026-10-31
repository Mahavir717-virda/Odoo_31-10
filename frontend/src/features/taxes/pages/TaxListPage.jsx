import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import TaxFormModal from '../components/TaxFormModal';
import { getTaxes, createTax, updateTax, deleteTax } from '../api';

export default function TaxListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
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
  } = usePaginatedList(getTaxes);

  const handleOpenCreate = () => {
    setEditingTax(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setEditingTax(tax);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingTax) {
      await updateTax(editingTax.id, formData);
    } else {
      await createTax(formData);
    }
    load();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteTax(deleteTargetId);
      setDeleteTargetId(null);
      load();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tax Name',
      render: (row) => (
        <span className="font-semibold text-gray-900">{row.name}</span>
      ),
    },
    {
      key: 'rate_percent',
      label: 'Rate',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {Number(row.rate_percent).toFixed(2)}%
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
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteTargetId(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Taxes (Admin Only)"
        description="Configure tax rates applied to subscription lines and invoices."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Tax Rate
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search taxes by name..."
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No tax rates configured."
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

      <TaxFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        tax={editingTax}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Tax Rate"
        message="Are you sure you want to delete this tax rate? This action cannot be undone."
        confirmLabel="Delete Tax"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
