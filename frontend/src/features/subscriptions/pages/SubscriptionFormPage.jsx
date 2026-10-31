import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { normalizeListResponse } from '../../../api/featureUtils';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Spinner from '../../../components/ui/Spinner';
import Textarea from '../../../components/ui/Textarea';
import { useToast } from '../../../components/ui/Toast';
import { getProducts } from '../../products/api';
import { getPlans } from '../../plans/api';
import { getTaxes } from '../../taxes/api';
import { fetchTemplates, getTemplate } from '../../quotation-templates/api';
import { createSubscription, createSubscriptionFromTemplate, getSubscription, updateSubscription, updateSubscriptionStatus } from '../api';

const asArray = (response, key) => {
  const body = response?.data ?? response;
  return Array.isArray(body) ? body : body?.[key] ?? [];
};

export default function SubscriptionFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({
    customer_id: '', plan_id: '', start_date: new Date().toISOString().slice(0, 10),
    expiry_date: '', payment_terms_days: 15, notes: '', lines: [],
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      axiosClient.get('/users', { params: { page: 1, limit: 100, role: 'CUSTOMER' } }),
      getPlans({ page: 1, limit: 100, status: 'ACTIVE' }),
      getProducts({ page: 1, limit: 100, is_active: true }),
      getTaxes({ page: 1, limit: 100, is_active: true }),
      fetchTemplates({ page: 1, limit: 100, is_active: true }),
      isEditing ? getSubscription(id) : Promise.resolve(null),
      templateId ? getTemplate(templateId) : Promise.resolve(null),
    ]).then(([customerResponse, planResponse, productResponse, taxResponse, templateResponse, subscription, selectedTemplate]) => {
      if (!active) return;
      setCustomers(normalizeListResponse(customerResponse).data);
      setPlans(asArray(planResponse, 'plans'));
      setProducts(asArray(productResponse, 'products'));
      setTaxes(asArray(taxResponse, 'taxes'));
      setTemplates(normalizeListResponse(templateResponse).data);
      if (subscription) {
        const status = String(subscription.status).toUpperCase();
        if (!['DRAFT', 'QUOTATION'].includes(status)) {
          setCanEdit(false);
          setError('Only draft and quotation subscriptions can be edited.');
        }
        setForm({
          customer_id: String(subscription.customer_id ?? ''),
          plan_id: String(subscription.plan_id ?? ''),
          start_date: String(subscription.start_date ?? '').slice(0, 10),
          expiry_date: subscription.expiry_date ? String(subscription.expiry_date).slice(0, 10) : '',
          payment_terms_days: subscription.payment_terms_days ?? 15,
          notes: subscription.notes ?? '',
          lines: (subscription.lines ?? []).map((line) => ({
            product_id: String(line.product_id),
            variant_id: line.variant_id ? String(line.variant_id) : '',
            quantity: line.quantity ?? 1,
            tax_id: line.tax_id ? String(line.tax_id) : '',
            description: line.description ?? '',
          })),
        });
      } else if (selectedTemplate) {
        const template = selectedTemplate;
        setForm((current) => ({
          ...current,
          plan_id: String(template.plan_id ?? ''),
          payment_terms_days: template.payment_terms_days ?? 15,
          lines: (template.lines ?? []).map((line) => ({
            product_id: String(line.product_id),
            variant_id: line.variant_id ? String(line.variant_id) : '',
            quantity: line.quantity ?? 1,
            tax_id: line.tax_id ? String(line.tax_id) : '',
          })),
        }));
      }
    }).catch((loadError) => {
      if (active) setError(loadError.message || 'Unable to load subscription form data.');
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id, isEditing, templateId]);

  const selectedPlan = plans.find((plan) => String(plan.id) === String(form.plan_id));
  const totalQuantity = form.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const totals = useMemo(() => form.lines.reduce((sum, line) => {
    const product = products.find((item) => String(item.id) === String(line.product_id));
    const variant = product?.variants?.find((item) => String(item.id) === String(line.variant_id));
    const tax = taxes.find((item) => String(item.id) === String(line.tax_id));
    const amount = (Number(product?.sales_price ?? 0) + Number(variant?.extra_price ?? 0)) * Number(line.quantity || 0);
    return sum + amount + amount * Number(tax?.rate_percent ?? 0) / 100;
  }, 0), [form.lines, products, taxes]);

  const updateLine = (index, key, value) => setForm((current) => ({
    ...current,
    lines: current.lines.map((line, lineIndex) => lineIndex === index
      ? { ...line, [key]: value, ...(key === 'product_id' ? { variant_id: '' } : {}) }
      : line),
  }));

  const save = async (event, makeQuotation = false) => {
    event.preventDefault();
    if (!form.customer_id || !form.plan_id || !form.start_date || form.lines.length === 0) {
      setError('Customer, plan, start date, and at least one product line are required.');
      return;
    }
    if (form.expiry_date && form.expiry_date < form.start_date) {
      setError('Expiry date cannot be earlier than the start date.');
      return;
    }
    if (selectedPlan && totalQuantity < Number(selectedPlan.min_quantity ?? 1)) {
      setError(`The selected plan requires a minimum quantity of ${selectedPlan.min_quantity}.`);
      return;
    }
    setSaving(true);
    setError('');
    const lines = form.lines.map((line) => ({
        product_id: Number(line.product_id),
        variant_id: line.variant_id ? Number(line.variant_id) : null,
        quantity: Number(line.quantity),
        tax_id: line.tax_id ? Number(line.tax_id) : null,
        description: line.description || null,
      }));
    const payload = isEditing
      ? {
          expiry_date: form.expiry_date || null,
          payment_terms_days: Number(form.payment_terms_days),
          notes: form.notes || null,
          lines,
        }
      : {
          customer_id: Number(form.customer_id),
          plan_id: Number(form.plan_id),
          start_date: form.start_date,
          expiry_date: form.expiry_date || null,
          payment_terms_days: Number(form.payment_terms_days),
          notes: form.notes || null,
          lines,
        };
    try {
      let saved;
      if (isEditing) {
        saved = await updateSubscription(id, payload);
      } else if (templateId) {
        saved = await createSubscriptionFromTemplate(templateId, {
          customer_id: Number(form.customer_id),
          start_date: form.start_date,
        });
        saved = await updateSubscription(saved.id, {
          expiry_date: form.expiry_date || null,
          payment_terms_days: Number(form.payment_terms_days),
          notes: form.notes || null,
          lines,
        });
      } else {
        saved = await createSubscription(payload);
      }
      if (makeQuotation && String(saved.status).toUpperCase() === 'DRAFT') {
        saved = await updateSubscriptionStatus(saved.id, 'QUOTATION');
      }
      toast({ title: isEditing ? 'Updated' : 'Created', description: 'Subscription saved successfully.', variant: 'success' });
      navigate(`/subscriptions/${saved.id}`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the subscription.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner /></div>;
  if (isEditing && !canEdit) {
    return <div className="space-y-4"><p className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-900" role="alert">{error}</p><Button variant="outline" onClick={() => navigate(`/subscriptions/${id}`)}>Return to subscription</Button></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link to="/subscriptions" className="text-sm text-indigo-600 hover:underline">Back to subscriptions</Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{isEditing ? 'Edit subscription' : templateId ? 'Create from template' : 'Create subscription'}</h1>
      </div>
      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      {selectedPlan && totalQuantity < Number(selectedPlan.min_quantity ?? 1) && <p className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This plan requires at least {selectedPlan.min_quantity} total line item units.</p>}
      <Card>
        <form onSubmit={(event) => save(event)} className="space-y-5">
          {!isEditing && (
            <Select id="source-template" label="Start from template (optional)" value={templateId ?? ''} onChange={(event) => navigate(event.target.value ? `/subscriptions/new?template=${event.target.value}` : '/subscriptions/new')} options={templates.map((template) => ({ value: String(template.id), label: template.name }))} placeholder="Blank subscription" />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="subscription-customer" label="Customer" value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })} options={customers.map((customer) => ({ value: String(customer.id), label: `${customer.name} (${customer.email})` }))} placeholder="Select customer" required disabled={isEditing} />
            <Select id="subscription-plan" label="Plan" value={form.plan_id} onChange={(event) => setForm({ ...form, plan_id: event.target.value })} options={plans.map((plan) => ({ value: String(plan.id), label: `${plan.name} (min. ${plan.min_quantity ?? 1})` }))} placeholder="Select plan" required disabled={isEditing || Boolean(templateId)} />
            <Input id="subscription-start" label="Start date" type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} required disabled={isEditing} />
            <Input id="subscription-expiry" label="Expiry date (optional)" type="date" min={form.start_date} value={form.expiry_date} onChange={(event) => setForm({ ...form, expiry_date: event.target.value })} />
            <Input id="subscription-terms" label="Payment terms (days)" type="number" min="0" value={form.payment_terms_days} onChange={(event) => setForm({ ...form, payment_terms_days: event.target.value })} />
            <Textarea id="subscription-notes" label="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={2} />
          </div>
          <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Product lines</h2><Button type="button" variant="outline" onClick={() => setForm({ ...form, lines: [...form.lines, { product_id: '', variant_id: '', quantity: 1, tax_id: '', description: '' }] })}>Add line</Button></div>
            {form.lines.map((line, index) => {
              const product = products.find((item) => String(item.id) === String(line.product_id));
              return (
                <div key={index} className="grid items-end gap-3 rounded border border-gray-200 p-3 sm:grid-cols-6">
                  <Select id={`sub-product-${index}`} label="Product" value={line.product_id} onChange={(event) => updateLine(index, 'product_id', event.target.value)} options={products.map((item) => ({ value: String(item.id), label: item.name }))} placeholder="Select product" required />
                  <Select id={`sub-variant-${index}`} label="Variant" value={line.variant_id} onChange={(event) => updateLine(index, 'variant_id', event.target.value)} options={(product?.variants ?? []).map((variant) => ({ value: String(variant.id), label: `${variant.attribute}: ${variant.value}` }))} placeholder="No variant" />
                  <Input id={`sub-quantity-${index}`} label="Quantity" type="number" min="1" step="1" value={line.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} required />
                  <Select id={`sub-tax-${index}`} label="Tax" value={line.tax_id} onChange={(event) => updateLine(index, 'tax_id', event.target.value)} options={taxes.map((tax) => ({ value: String(tax.id), label: `${tax.name} (${tax.rate_percent}%)` }))} placeholder="Product default" />
                  <Input id={`sub-description-${index}`} label="Description" value={line.description ?? ''} onChange={(event) => updateLine(index, 'description', event.target.value)} />
                  <Button type="button" variant="danger" onClick={() => setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) })}>Remove</Button>
                </div>
              );
            })}
            <p className="text-right font-semibold text-gray-800">Estimated total: {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(totals)}</p>
          </section>
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/subscriptions')}>Cancel</Button>
            <Button type="submit" disabled={saving} loading={saving}>{isEditing ? 'Save changes' : 'Save draft'}</Button>
            {!isEditing && <Button type="button" disabled={saving} onClick={(event) => save(event, true)}>Create quotation</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
