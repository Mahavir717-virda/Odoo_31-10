import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Table from '../../../components/ui/Table';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { deleteTemplate, fetchTemplates } from '../api';

export default function TemplateListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = String(user?.role).toUpperCase() === 'ADMIN';
  const [deleteTarget, setDeleteTarget] = useState(null);
  const loadTemplates = useCallback((params) => fetchTemplates(params), []);
  const list = usePaginatedList(loadTemplates);

  const removeTemplate = async () => {
    try {
      await deleteTemplate(deleteTarget.id);
      toast({ title: 'Deleted', description: 'Quotation template deleted.', variant: 'success' });
      setDeleteTarget(null);
      list.refresh();
    } catch (error) {
      toast({ title: 'Unable to delete template', description: error.message, variant: 'danger' });
    }
  };

  const columns = [
    { key: 'name', label: 'Template' },
    { key: 'plan_name', label: 'Plan' },
    { key: 'validity_days', label: 'Validity', format: (value) => `${value} days` },
    { key: 'payment_terms_days', label: 'Payment terms', format: (value) => `${value} days` },
    { key: 'is_active', label: 'Status', format: (value) => <Badge variant={value ? 'success' : 'default'}>{value ? 'Active' : 'Inactive'}</Badge> },
    { key: 'created_at', label: 'Created', format: (value) => formatDate(value) },
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); navigate(`/templates/${row.id}`); }}>Edit</Button>
          <Button size="sm" variant="danger" onClick={(event) => { event.stopPropagation(); setDeleteTarget(row); }}>Delete</Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation templates</h1>
          <p className="text-gray-600">Reusable subscription quotations and product lines.</p>
        </div>
        {isAdmin && <Button onClick={() => navigate('/templates/new')}>Create template</Button>}
      </div>
      {list.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{list.error.message}</p>}
      <SearchInput value={list.search} onChange={list.set_search} placeholder="Search templates..." className="sm:max-w-sm" />
      <Table
        columns={columns}
        data={list.data}
        loading={list.loading}
        emptyMessage="No quotation templates found."
        rowKey="id"
        onRowClick={(row) => navigate(`/templates/${row.id}`)}
      />
      <Pagination page={list.page} pageSize={list.page_size} total={list.total} onChange={list.set_page} onPageSizeChange={list.set_page_size} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onConfirm={removeTemplate}
        onCancel={() => setDeleteTarget(null)}
        title="Delete quotation template?"
        message={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
