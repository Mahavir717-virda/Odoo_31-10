import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import Textarea from '../../../components/ui/Textarea';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { getProducts } from '../../products/api';
import { getPlans } from '../../plans/api';
import { getTaxes } from '../../taxes/api';
import { createTemplate, getTemplate, updateTemplate } from '../api';

const recordsFrom = (response, key) => {
  const body = response?.data ?? response;
  return Array.isArray(body) ? body : body?.[key] ?? [];
};
export default function TemplateFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = Boolean(id);
  const readOnly = isEditing && String(user?.role).toUpperCase() !== 'ADMIN';
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [form, setForm] = useState({
    name: '', plan_id: '', validity_days: 30, payment_terms_days: 15, notes: '', is_active: true, lines: [],
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      getPlans({ page: 1, limit: 100 }),
      getProducts({ page: 1, limit: 100, is_active: true }),
      getTaxes({ page: 1, limit: 100, is_active: true }),
      isEditing ? getTemplate(id) : Promise.resolve(null),
    ]).then(([planResponse, productResponse, taxResponse, template]) => {
      if (!active) return;
      setPlans(recordsFrom(planResponse, 'plans'));
      setProducts(recordsFrom(productResponse, 'products'));
      setTaxes(recordsFrom(taxResponse, 'taxes'));
      if (template) {
        setForm({
          name: template.name ?? '',
          plan_id: String(template.plan_id ?? ''),
          validity_days: template.validity_days ?? 30,
          payment_terms_days: template.payment_terms_days ?? 15,
          notes: template.notes ?? '',
          is_active: template.is_active !== false,
          lines: (template.lines ?? []).map((line) => ({
            product_id: String(line.product_id),
            variant_id: line.variant_id ? String(line.variant_id) : '',
            quantity: line.quantity ?? 1,
            tax_id: line.tax_id ? String(line.tax_id) : '',
          })),
        });
      }
    }).catch((loadError) => {
      if (active) setError(loadError.message || 'Unable to load template data.');
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, isEditing]);

  const totals = useMemo(() => form.lines.reduce((sum, line) => {
    const product = products.find((item) => String(item.id) === String(line.product_id));
    const variant = product?.variants?.find((item) => String(item.id) === String(line.variant_id));
    const tax = taxes.find((item) => String(item.id) === String(line.tax_id));
    const unit = Number(product?.sales_price ?? 0) + Number(variant?.extra_price ?? 0);
    const beforeTax = unit * Number(line.quantity || 0);
    return sum + beforeTax + beforeTax * Number(tax?.rate_percent ?? 0) / 100;
  }, 0), [form.lines, products, taxes]);

  const updateLine = (index, key, value) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) => lineIndex === index
        ? { ...line, [key]: value, ...(key === 'product_id' ? { variant_id: '' } : {}) }
        : line),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.plan_id || !form.lines.length || form.lines.some((line) => !line.product_id || Number(line.quantity) < 1)) {
      setError('Enter a template name, plan, and at least one valid product line.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      plan_id: Number(form.plan_id),
      validity_days: Number(form.validity_days),
      payment_terms_days: Number(form.payment_terms_days),
      notes: form.notes || null,
      is_active: Boolean(form.is_active),
      lines: form.lines.map((line) => ({
        product_id: Number(line.product_id),
        variant_id: line.variant_id ? Number(line.variant_id) : null,
        quantity: Number(line.quantity),
        tax_id: line.tax_id ? Number(line.tax_id) : null,
      })),
    };
    try {
      if (isEditing) await updateTemplate(id, payload);
      else await createTemplate(payload);
      toast({ title: 'Saved', description: 'Quotation template saved successfully.', variant: 'success' });
      navigate('/templates');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/templates" className="text-sm text-indigo-600 hover:underline">Back to templates</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{isEditing ? 'Quotation template' : 'Create quotation template'}</h1>
      </div>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="template-name" label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required disabled={readOnly} />
            <Select id="template-plan" label="Plan" value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: event.target.value })} options={plans.map((plan) => ({ value: String(plan.id), label: plan.name }))} placeholder="Select plan" required disabled={readOnly} />
            <Input id="validity-days" label="Validity (days)" type="number" min="1" value={form.validity_days} onChange={(event) => setForm({ ...form, validity_days: event.target.value })} required disabled={readOnly} />
            <Input id="payment-terms" label="Payment terms (days)" type="number" min="0" value={form.payment_terms_days} onChange={(event) => setForm({ ...form, payment_terms_days: event.target.value })} required disabled={readOnly} />
          </div>
          <Textarea id="template-notes" label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} disabled={readOnly} />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} disabled={readOnly} />
            Active template
          </label>
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Line items</h2>{!readOnly && <Button type="button" variant="outline" onClick={() => setForm({ ...form, lines: [...form.lines, { product_id: '', variant_id: '', quantity: 1, tax_id: '' }] })}>Add line</Button>}</div>
            {form.lines.map((line, index) => {
              const product = products.find((item) => String(item.id) === String(line.product_id));
              return (
                <div key={index} className="grid items-end gap-3 rounded border border-gray-200 p-3 sm:grid-cols-5">
                  <Select id={`line-product-${index}`} label="Product" value={line.product_id} onChange={(event) => updateLine(index, 'product_id', event.target.value)} options={products.map((item) => ({ value: String(item.id), label: item.name }))} placeholder="Select product" required disabled={readOnly} />
                  <Select id={`line-variant-${index}`} label="Variant" value={line.variant_id} onChange={(event) => updateLine(index, 'variant_id', event.target.value)} options={(product?.variants ?? []).map((item) => ({ value: String(item.id), label: `${item.attribute}: ${item.value}` }))} placeholder="No variant" disabled={readOnly} />
                  <Input id={`line-quantity-${index}`} label="Quantity" type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} required disabled={readOnly} />
                  <Select id={`line-tax-${index}`} label="Tax" value={line.tax_id} onChange={(event) => updateLine(index, 'tax_id', event.target.value)} options={taxes.map((item) => ({ value: String(item.id), label: `${item.name} (${item.rate_percent}%)` }))} placeholder="No tax" disabled={readOnly} />
                  {!readOnly && <Button type="button" variant="danger" onClick={() => setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) })}>Remove</Button>}
                </div>
              );
            })}
            <p className="text-right text-sm font-semibold text-gray-800">Estimated total: {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(totals)}</p>
          </section>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/templates')}>Cancel</Button>
            {!readOnly && <Button type="submit" disabled={saving} loading={saving}>Save template</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
