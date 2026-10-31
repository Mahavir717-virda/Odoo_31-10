import { useCallback, useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import SearchInput from '../../../components/ui/SearchInput';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { ToastProvider, useToast } from '../../../components/ui/Toast';
import { ConfirmProvider, useConfirm } from '../../../hooks/useConfirm';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api';

const PLAN_LABELS = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

export default function TemplateListPage() {
  const { toast } = useToast();
  const {
    open_confirm: openConfirm,
    close_confirm: closeConfirm,
    confirm,
  } = useConfirm();

  const [deleteId, setDeleteId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formTemplate, setFormTemplate] = useState(null);

  const fetchList = useCallback(async (params) => {
    const response = await fetchTemplates(params);
    return response;
  }, []);

  const {
    data,
    total,
    page,
    page_size,
    search,
    loading,
    error,
    set_page,
    set_page_size,
    set_search,
    refresh,
  } = usePaginatedList(fetchList, { page_size: 10 });

  const handleDelete = (id) => {
    setDeleteId(id);
    openConfirm({
      title: 'Delete template?',
      message: 'This action cannot be undone.',
      on_confirm: async () => {
        try {
          await deleteTemplate(id);
          toast({ title: 'Deleted', description: 'Template deleted successfully.', variant: 'success' });
          refresh();
        } catch (err) {
          toast({ title: 'Error', description: err.message || 'Failed to delete template.', variant: 'danger' });
        } finally {
          closeConfirm();
          setDeleteId(null);
        }
      },
      confirm_label: 'Delete',
      cancelLabel: 'Cancel',
    });
  };

  const handleCreate = () => {
    setFormMode('create');
    setFormTemplate(null);
    setOpenForm(true);
  };

  const handleEdit = (template) => {
    setFormMode('edit');
    setFormTemplate(template);
    setOpenForm(true);
  };

  const handleFormSave = async (payload) => {
    try {
      if (formMode === 'create') {
        await createTemplate(payload);
        toast({ title: 'Created', description: 'Template created successfully.', variant: 'success' });
      } else {
        await updateTemplate(formTemplate.id, payload);
        toast({ title: 'Updated', description: 'Template updated successfully.', variant: 'success' });
      }
      setOpenForm(false);
      refresh();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to save template.', variant: 'danger' });
    }
  };

  const columns = [
    { key: 'name', label: 'Template Name' },
    { key: 'plan', label: 'Plan', format: (value) => PLAN_LABELS[value] ?? value },
    { key: 'customer_name', label: 'Customer' },
    { key: 'validity_days', label: 'Validity (Days)' },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
    { key: 'created_at', label: 'Created', format: (value) => formatDate(value) },
    {
      key: 'actions',
      label: 'Actions',
      format: (_, row) => (
        <div className="flex gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Edit
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotation Templates</h1>
              <p className="text-gray-600">Manage reusable quotation templates.</p>
            </div>
            <Button onClick={handleCreate}>Create Template</Button>
          </div>

          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
              Error: {error.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput value={search} onChange={set_search} placeholder="Search templates..." className="sm:w-96" />
          </div>

          <Table
            columns={columns}
            data={data}
            loading={loading}
            rowKey="id"
            emptyMessage="No quotation templates found."
          />

          <Pagination
            page={page}
            pageSize={page_size}
            total={total}
            onChange={set_page}
            onPageSizeChange={set_page_size}
          />

          <Modal
            open={openForm}
            onClose={() => setOpenForm(false)}
            title={formMode === 'create' ? 'Create Template' : 'Edit Template'}
            className="max-w-2xl"
          >
            <TemplateForm
              onSave={handleFormSave}
              initial={formTemplate}
              mode={formMode}
              onClose={() => setOpenForm(false)}
            />
          </Modal>

          <ConfirmDialog
            open={deleteId !== null}
            onConfirm={confirm}
            onCancel={closeConfirm}
            title="Delete template?"
            message="This action cannot be undone."
          />
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}

function TemplateForm({ onSave, initial, mode, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [plan, setPlan] = useState(initial?.plan ?? 'starter');
  const [variant, setVariant] = useState(initial?.variant ?? 'basic');
  const [validity_days, setValidityDays] = useState(initial?.validity_days ?? 30);
  const [payment_terms, setPaymentTerms] = useState(initial?.payment_terms ?? 'Net 30');
  const [customer_id, setCustomerId] = useState(initial?.customer_id ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [lines, setLines] = useState(initial?.lines ?? []);
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        name,
        plan,
        variant,
        validity_days: Number(validity_days),
        payment_terms,
        customer_id,
        notes,
        lines,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addLine = () => {
    setLines([
      ...lines,
      { id: `line_${Date.now()}`, product: '', variant: '', quantity: 1, unit_price: 0, tax_rate: 0.18 },
    ]);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="template_name"
          label="Template Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Select
          id="template_plan"
          label="Plan"
          value={plan}
          onChange={setPlan}
          options={[
            { value: 'starter', label: 'Starter Plan' },
            { value: 'professional', label: 'Professional Plan' },
            { value: 'enterprise', label: 'Enterprise Plan' },
          ]}
        />
        <Select
          id="template_variant"
          label="Variant"
          value={variant}
          onChange={setVariant}
          options={[
            { value: 'basic', label: 'Basic' },
            { value: 'standard', label: 'Standard' },
            { value: 'premium', label: 'Premium' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />
        <Input
          id="validity_days"
          label="Validity (Days)"
          type="number"
          value={String(validity_days)}
          onChange={(event) => setValidityDays(event.target.value)}
        />
        <Select
          id="payment_terms"
          label="Payment Terms"
          value={payment_terms}
          onChange={setPaymentTerms}
          options={[
            { value: 'Net 30', label: 'Net 30' },
            { value: 'Net 15', label: 'Net 15' },
            { value: 'Due on receipt', label: 'Due on receipt' },
          ]}
        />
        <Select
          id="customer_id"
          label="Customer"
          value={customer_id}
          onChange={setCustomerId}
          options={[
            { value: 'cust_1', label: 'Acme Corp' },
            { value: 'cust_2', label: 'Globex Corporation' },
            { value: 'cust_3', label: 'Stark Industries' },
          ]}
        />
      </div>

      <Textarea
        id="template_notes"
        label="Notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
      />

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Product Lines</h3>
        {lines.map((line, index) => (
          <div key={line.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 items-end">
            <Input
              id={`line_product_${index}`}
              label="Product"
              value={line.product}
              onChange={(event) => updateLine(index, 'product', event.target.value)}
            />
            <Input
              id={`line_variant_${index}`}
              label="Variant"
              value={line.variant}
              onChange={(event) => updateLine(index, 'variant', event.target.value)}
            />
            <Input
              id={`line_quantity_${index}`}
              label="Qty"
              type="number"
              value={String(line.quantity)}
              onChange={(event) => updateLine(index, 'quantity', Number(event.target.value))}
            />
            <Input
              id={`line_price_${index}`}
              label="Unit Price"
              type="number"
              value={String(line.unit_price)}
              onChange={(event) => updateLine(index, 'unit_price', Number(event.target.value))}
            />
            <Input
              id={`line_tax_${index}`}
              label="Tax %"
              type="number"
              value={String((line.tax_rate || 0) * 100)}
              onChange={(event) => updateLine(index, 'tax_rate', Number(event.target.value) / 100)}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeLine(index)}
              className="h-10 px-3"
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addLine}>
          Add Line
        </Button>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={submitting} loading={submitting}>
          {mode === 'create' ? 'Create Template' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
