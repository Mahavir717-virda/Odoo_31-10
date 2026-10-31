import { useState, useEffect } from 'react';
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
import TaxFormModal from '../components/TaxFormModal';
import { getTaxes, createTax, updateTax, deleteTax } from '../api';

export default function TaxListPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
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
  } = usePaginatedList(getTaxes);

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

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
        toast({
          title: 'Tax Updated',
          description: `Tax rate "${formData.name}" updated successfully.`,
          variant: 'success',
        });
      } else {
        await createTax(formData);
        toast({
          title: 'Tax Created',
          description: `Tax rate "${formData.name}" added successfully.`,
          variant: 'success',
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save tax rate.',
        variant: 'danger',
      });
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteTax(deleteTargetId);
      toast({
        title: 'Tax Deleted',
        description: 'Tax rate has been removed.',
        variant: 'success',
      });
      setDeleteTargetId(null);
      load();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to delete tax rate.',
        variant: 'danger',
      });
    } finally {
      setDeleting(false);
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
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
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
        title="Tax Rates (Admin Only)"
        description="Configure standardized sales taxes, GST/VAT percentage tiers, and invoice defaults."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Tax Rate
          </Button>
        }
      />

      {/* Error state banner with retry */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm flex items-center justify-between text-red-800">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error.message || 'Failed to load tax rates.'}</span>
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
            placeholder="Search taxes by title or rate..."
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
                <p className="text-gray-500 font-medium">No tax rates defined yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add sales tax, VAT, or GST rates to attach to products.</p>
                <Button size="sm" variant="outline" onClick={handleOpenCreate} className="mt-3">
                  + Add Tax Rate
                </Button>
              </div>
            }
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

      <TaxFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        tax={editingTax}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Tax Rate"
        message="Are you sure you want to delete this tax rate? Existing invoices using it will retain past totals, but new products will not be able to select it."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Tax'}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
