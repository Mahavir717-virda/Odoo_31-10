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
import TaxFormModal from '../components/TaxFormModal';
import { getTaxes, createTax, updateTax, deleteTax } from '../api';

export default function TaxListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
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
    try {
      if (editingTax) {
        await updateTax(editingTax.id, formData);
      } else {
        await createTax(formData);
      }
      setActionError('');
      load();
    } catch (saveError) {
      setActionError(saveError?.message || 'Unable to save tax rate.');
      throw saveError;
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteTax(deleteTargetId);
        setDeleteTargetId(null);
        setActionError('');
        load();
      } catch (deleteError) {
        setActionError(deleteError?.message || 'Unable to delete tax rate.');
      }
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
        {(error || actionError) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{actionError || error?.message}</span>
            <Button size="sm" variant="outline" onClick={() => { setActionError(''); load(); }}>Retry</Button>
          </div>
        )}
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search taxes by name..."
          />
          <Select
            value={filters.is_active ?? ''}
            onChange={(event) => setFilters(event.target.value ? { is_active: event.target.value } : {})}
            aria-label="Filter taxes by status"
            options={[
              { value: '', label: 'All statuses' },
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
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
