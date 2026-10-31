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
import { formatDate } from '../../../utils/formatDate';
import StaffFormModal from '../components/StaffFormModal';
import { getStaffList, createStaff, updateStaff, deleteStaff } from '../api';

export default function StaffListPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
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
  } = usePaginatedList(getStaffList);

  // Sync debounced search to paginated query
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, formData);
        toast({
          title: 'Staff Updated',
          description: `Account for ${formData.name} was successfully updated.`,
          variant: 'success',
        });
      } else {
        await createStaff(formData);
        toast({
          title: 'Staff Created',
          description: `New staff account for ${formData.name} was created.`,
          variant: 'success',
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save staff member.',
        variant: 'danger',
      });
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteStaff(deleteTargetId);
      toast({
        title: 'Staff Removed',
        description: 'Staff member account has been revoked.',
        variant: 'success',
      });
      setDeleteTargetId(null);
      load();
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Failed to remove staff member.',
        variant: 'danger',
      });
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Staff Member',
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => {
        const isAdmin = String(row.role).toUpperCase() === 'ADMIN';
        return (
          <Badge variant={isAdmin ? 'danger' : 'primary'}>
            {String(row.role).toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'company',
      label: 'Department / Phone',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-700">{row.company || 'Operations'}</div>
          {row.phone && <div className="text-xs text-gray-400">{row.phone}</div>}
        </div>
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
      key: 'created_at',
      label: 'Joined',
      render: (row) => (
        <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>
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
        title="Staff Directory"
        description="Manage internal team accounts, permissions, and roles (Admin access only)."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Staff Member
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
            <span>{error.message || 'Failed to load staff list.'}</span>
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
            placeholder="Search staff by name or email..."
          />
        </div>

        {/* Horizontally scrollable responsive table */}
        <div className="w-full overflow-x-auto">
          <Table
            columns={columns}
            data={data}
            loading={loading}
            emptyMessage={
              <div className="py-8 text-center">
                <p className="text-gray-500 font-medium">No staff members found.</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria or add a new team member.</p>
                <Button size="sm" variant="outline" onClick={handleOpenCreate} className="mt-3">
                  + Add Staff
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

      <StaffFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        staff={editingStaff}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? They will lose access to the portal immediately."
        confirmLabel={deleting ? 'Removing...' : 'Remove Staff'}
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
