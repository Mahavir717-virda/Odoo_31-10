import { useState } from 'react';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { getTaxes, createTax, updateTax, deleteTax } from '../api';

export default function TaxListPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [type, setType] = useState('percent');
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

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
    setName('');
    setRate('');
    setType('percent');
    setIsDefault(false);
    setStatus('active');
    setModalOpen(true);
  };

  const handleOpenEdit = (tax) => {
    setEditingTax(tax);
    setName(tax.name || '');
    setRate(tax.rate ?? '');
    setType(tax.type || 'percent');
    setIsDefault(Boolean(tax.is_default));
    setStatus(tax.status || 'active');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      rate: Number(rate) || 0,
      type,
      is_default: isDefault,
      status,
    };
    try {
      if (editingTax) {
        await updateTax(editingTax.id, payload);
      } else {
        await createTax(payload);
      }
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tax rule?')) {
      await deleteTax(id);
      load();
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Tax Name',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-gray-900">{row.name}</span>
          {row.is_default && <Badge variant="primary" size="sm">Default</Badge>}
        </div>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {row.rate}%
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Computation',
      render: (row) => (
        <span className="text-sm capitalize text-gray-600">{row.type}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status}
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
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Taxes"
        description="Configure tax rates applied to subscription lines and invoices."
        actions={
          <Button variant="primary" onClick={handleOpenCreate}>
            + Add Tax
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingTax ? 'Edit Tax' : 'Add Tax'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="tax-name"
            label="Tax Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard VAT 20%"
            required
          />

          <Input
            id="tax-rate"
            label="Rate (%)"
            type="number"
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="20"
            required
          />

          <Select
            id="tax-status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />

          <div className="pt-2">
            <Checkbox
              id="tax-default"
              label="Set as default tax for new items"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingTax ? 'Save Changes' : 'Create Tax'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

