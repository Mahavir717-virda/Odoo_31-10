import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import StaffFormModal from '../components/StaffFormModal';
import { getStaffList, createStaff, updateStaff, deleteStaff } from '../api';

export default function StaffListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
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
  } = usePaginatedList(getStaffList);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingStaff) {
      await updateStaff(editingStaff.id, formData);
    } else {
      await createStaff(formData);
    }
    load();
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      await deleteStaff(deleteTargetId);
      setDeleteTargetId(null);
      load();
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
        title="Staff Directory (Admin Only)"
        description="Manage internal team accounts and role-based permissions."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Staff Member
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search staff by name or email..."
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No staff members found."
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

      <StaffFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        staff={editingStaff}
      />

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? They will lose access immediately."
        confirmLabel="Remove Staff"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
