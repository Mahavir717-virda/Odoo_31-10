import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import StaffFormModal from '../components/StaffFormModal';
import { getStaffList, createStaff } from '../api';

export default function StaffListPage() {
  const [modalOpen, setModalOpen] = useState(false);

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
    load,
  } = usePaginatedList(getStaffList);

  const handleOpenCreate = () => {
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    await createStaff(formData);
    load();
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
      key: 'created_at',
      label: 'Joined',
      render: (row) => (
        <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff Directory (Admin Only)"
        description="View staff accounts and create new team members."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Staff Member
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{error.message}</span>
            <Button size="sm" variant="outline" onClick={load}>Retry</Button>
          </div>
        )}
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
      />
    </div>
  );
}
