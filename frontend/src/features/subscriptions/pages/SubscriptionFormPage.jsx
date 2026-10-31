import { useEffect, useMemo, useRef, useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { useToast } from '../../../components/ui/Toast';
import useDebounce from '../../../hooks/useDebounce';
import { formatMoney } from '../../../utils/formatMoney';
import { getSubscriptionFromTemplate } from '../api';
import { CUSTOMERS, PLANS, VARIANTS, calculateSubscription } from '../mock';

const TAX_RATE = 0.18;

export default function SubscriptionFormPage({ initialTemplate, onCancel, onSuccess }) {
  const { toast } = useToast();

  const [customer_id, setCustomerId] = useState(initialTemplate?.customer_id ?? '');
  const [plan, setPlan] = useState(initialTemplate?.plan ?? 'starter');
  const [start_date, setStartDate] = useState(initialTemplate?.start_date ?? '');
  const [end_date, setEndDate] = useState(initialTemplate?.end_date ?? '');
  const [status, setStatus] = useState(initialTemplate?.status ?? 'draft');
  const [payment_status, setPaymentStatus] = useState(initialTemplate?.payment_status ?? 'unpaid');
  const [notes, setNotes] = useState(initialTemplate?.notes ?? '');
  const [lines, setLines] = useState(initialTemplate?.lines ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(Boolean(initialTemplate));
  const templateFetchedRef = useRef(false);

  const debouncedTaxRate = useDebounce(TAX_RATE, 300);

  const { subtotal, tax_total, total } = useMemo(() => {
    const calc = calculateSubscription(
      lines.map((line) => ({
        ...line,
        tax_rate: debouncedTaxRate,
      }))
    );
    return calc;
  }, [lines, debouncedTaxRate]);

  useEffect(() => {
    if (!initialTemplate || templateFetchedRef.current) {
      return;
    }
    templateFetchedRef.current = true;
    setTemplateLoading(true);
    getSubscriptionFromTemplate(initialTemplate.id)
      .then((response) => {
        const template = response.data;
        setCustomerId(template.customer_id);
        setPlan(template.plan);
        setNotes(template.notes ?? '');
        setLines(
          template.lines.map((line) => ({
            id: `line_${Date.now()}-${Math.random()}`,
            product: line.product,
            variant: line.variant,
            quantity: line.quantity,
            unit_price: line.unit_price,
            tax_rate: line.tax_rate,
          }))
        );
      })
      .catch((err) => {
        toast({ title: 'Error', description: err.message || 'Failed to load template.', variant: 'danger' });
      })
      .finally(() => setTemplateLoading(false));
  }, [initialTemplate, toast]);

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: `line_${Date.now()}`,
        product: '',
        variant: '',
        quantity: 1,
        unit_price: 0,
        tax_rate: TAX_RATE,
      },
    ]);
  };

  const handleRemoveLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index, field, value) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!customer_id || !start_date || !end_date) {
      toast({ title: 'Validation Error', description: 'Customer, start date, and end date are required.', variant: 'danger' });
      return;
    }
    if (lines.length === 0) {
      toast({ title: 'Validation Error', description: 'At least one product line is required.', variant: 'danger' });
      return;
    }
    setSubmitting(true);
    try {
      const newSubscription = {
        id: `sub_${Date.now()}`,
        customer_id,
        plan,
        status,
        start_date,
        end_date,
        next_billing_date: start_date,
        amount: total,
        payment_status,
        template_id: initialTemplate?.id ?? null,
        lines,
        subtotal,
        tax_total,
        total,
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
      };
      toast({ title: 'Created', description: 'Subscription created successfully.', variant: 'success' });
      if (onSuccess) {
        onSuccess(newSubscription);
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Failed to create subscription.', variant: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {initialTemplate ? 'Create from Template' : 'Create Subscription'}
        </h1>
        {templateLoading && <span className="text-sm text-gray-500 italic">Loading template...</span>}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="customer_id"
            label="Customer"
            value={customer_id}
            onChange={setCustomerId}
            required
            disabled={Boolean(initialTemplate)}
            options={CUSTOMERS.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            id="plan"
            label="Plan"
            value={plan}
            onChange={setPlan}
            required
            disabled={Boolean(initialTemplate)}
            options={PLANS.map((p) => ({ value: p.value, label: `${p.label} (${formatMoney(p.base_price)})` }))}
          />
          <Input
            id="start_date"
            label="Start Date"
            type="date"
            value={start_date}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
          <Input
            id="end_date"
            label="End Date"
            type="date"
            value={end_date}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
          <Select
            id="status"
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'quotation', label: 'Quotation' },
            ]}
          />
          <Select
            id="payment_status"
            label="Payment Status"
            value={payment_status}
            onChange={setPaymentStatus}
            options={[
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'paid', label: 'Paid' },
              { value: 'partial', label: 'Partial' },
            ]}
          />
        </div>

        <Textarea
          id="notes"
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
        />

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Product Lines</h3>
          {lines.map((line, index) => (
            <div key={line.id} className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-3 items-end">
              <Input
                id={`line_product_${index}`}
                label="Product"
                value={line.product}
                onChange={(event) => handleUpdateLine(index, 'product', event.target.value)}
                disabled={Boolean(initialTemplate)}
              />
              <Select
                id={`line_variant_${index}`}
                label="Variant"
                value={line.variant}
                onChange={(event) => handleUpdateLine(index, 'variant', event.target.value)}
                options={VARIANTS[plan]?.map((v) => ({ value: v.value, label: v.label })) ?? []}
                disabled={Boolean(initialTemplate)}
              />
              <Input
                id={`line_quantity_${index}`}
                label="Qty"
                type="number"
                min="1"
                value={String(line.quantity)}
                onChange={(event) => handleUpdateLine(index, 'quantity', Number(event.target.value))}
                disabled={Boolean(initialTemplate)}
              />
              <Input
                id={`line_price_${index}`}
                label="Unit Price"
                type="number"
                step="0.01"
                value={String(line.unit_price)}
                onChange={(event) => handleUpdateLine(index, 'unit_price', Number(event.target.value))}
                disabled={Boolean(initialTemplate)}
              />
              <Input
                id={`line_tax_${index}`}
                label="Tax %"
                type="number"
                step="0.01"
                value={String((line.tax_rate || 0) * 100)}
                onChange={(event) => handleUpdateLine(index, 'tax_rate', Number(event.target.value) / 100)}
                disabled={Boolean(initialTemplate)}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleRemoveLine(index)}
                className="h-10 px-3"
                disabled={Boolean(initialTemplate)}
              >
                Remove
              </Button>
            </div>
          ))}
          {!initialTemplate && (
            <Button type="button" variant="outline" onClick={handleAddLine}>
              Add Line
            </Button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{formatMoney(tax_total)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-gray-900">Total</span>
            <span className="text-indigo-600">{formatMoney(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
            loading={submitting}
          >
            {initialTemplate ? 'Create Subscription' : 'Save Subscription'}
          </Button>
        </div>
      </form>
    </div>
  );
}
