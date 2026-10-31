import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { normalizeListResponse } from '../../../api/featureUtils';
import { useToast } from '../../../components/ui/Toast';
import { getProducts } from '../../products/api';
import { getPlans } from '../../plans/api';
import { getTaxes } from '../../taxes/api';
import { fetchTemplates, getTemplate } from '../../quotation-templates/api';
import { createSubscription, createSubscriptionFromTemplate, getSubscription, updateSubscription, updateSubscriptionStatus } from '../api';
import { formatMoney } from '../../../utils/formatMoney';

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
    customer_id: '',
    plan_id: '',
    start_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
    payment_terms_days: 15,
    notes: '',
    lines: [],
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
    ])
      .then(([customerResponse, planResponse, productResponse, taxResponse, templateResponse, subscription, selectedTemplate]) => {
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
              description: line.description ?? '',
            })),
          }));
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load subscription form data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, isEditing, templateId]);

  const selectedPlan = plans.find((plan) => String(plan.id) === String(form.plan_id));
  const selectedCustomer = customers.find((c) => String(c.id) === String(form.customer_id));
  const totalQuantity = form.lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const totals = useMemo(
    () =>
      form.lines.reduce((sum, line) => {
        const product = products.find((item) => String(item.id) === String(line.product_id));
        const variant = product?.variants?.find((item) => String(item.id) === String(line.variant_id));
        const tax = taxes.find((item) => String(item.id) === String(line.tax_id));
        const amount = (Number(product?.sales_price ?? 0) + Number(variant?.extra_price ?? 0)) * Number(line.quantity || 0);
        return sum + amount + (amount * Number(tax?.rate_percent ?? 0)) / 100;
      }, 0),
    [form.lines, products, taxes]
  );

  const updateLine = (index, key, value) =>
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, [key]: value, ...(key === 'product_id' ? { variant_id: '' } : {}) }
          : line
      ),
    }));

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lines: [
        ...current.lines,
        { product_id: products[0] ? String(products[0].id) : '', variant_id: '', quantity: 1, tax_id: '', description: '' },
      ],
    }));
  };

  const removeLine = (index) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const save = async (event, makeQuotation = false) => {
    if (event) event.preventDefault();
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
      toast({
        title: isEditing ? 'Updated' : 'Created',
        description: 'Subscription saved successfully.',
        variant: 'success',
      });
      navigate(`/subscriptions/${saved.id}`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the subscription.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center p-12 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading subscription configuration...</span>
        </div>
      </div>
    );
  }

  if (isEditing && !canEdit) {
    return (
      <div className="w-full font-sans pb-12 max-w-4xl mx-auto">
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900 mb-4" role="alert">
          {error}
        </div>
        <button
          onClick={() => navigate(`/subscriptions/${id}`)}
          className="px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50"
        >
          Return to Subscription
        </button>
      </div>
    );
  }

  return (
    <div className="w-full font-sans pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/subscriptions" className="hover:text-blue-600 transition">
          Subscriptions
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {isEditing ? 'Edit Subscription' : 'New Subscription'}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
          {isEditing ? 'Edit Subscription' : 'Create Subscription'}
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Configure customer details, recurring plan, product line items, and invoice payment terms.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 mb-6" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={(e) => save(e, false)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols): Main Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Optional Template Selector */}
            {!isEditing && !templateId && templates.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7">
                <label htmlFor="subscription-template" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Load Preset from Quotation Template (Optional)
                </label>
                <select
                  id="subscription-template"
                  onChange={(e) => {
                    const tmpl = templates.find((t) => String(t.id) === e.target.value);
                    if (tmpl) {
                      setForm((current) => ({
                        ...current,
                        plan_id: String(tmpl.plan_id ?? ''),
                        payment_terms_days: tmpl.payment_terms_days ?? 15,
                        lines: (tmpl.lines ?? []).map((line) => ({
                          product_id: String(line.product_id),
                          variant_id: line.variant_id ? String(line.variant_id) : '',
                          quantity: line.quantity ?? 1,
                          tax_id: line.tax_id ? String(line.tax_id) : '',
                          description: line.description ?? '',
                        })),
                      }));
                    }
                  }}
                  className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                >
                  <option value="">Blank Subscription</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={String(tmpl.id)}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* General Configuration Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-5">
              <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                Subscription Configuration
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="subscription-customer" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subscription-customer"
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    required
                    disabled={isEditing}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition disabled:bg-gray-100"
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subscription-plan" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Recurring Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subscription-plan"
                    value={form.plan_id}
                    onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                    required
                    disabled={isEditing || Boolean(templateId)}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition disabled:bg-gray-100"
                  >
                    <option value="">Select plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} (Min. {p.min_quantity ?? 1} units) - {formatMoney(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="subscription-start" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subscription-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                    disabled={isEditing}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="subscription-expiry" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Expiry Date (Optional)
                  </label>
                  <input
                    id="subscription-expiry"
                    type="date"
                    min={form.start_date}
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="subscription-terms" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Payment Terms (Days)
                  </label>
                  <input
                    id="subscription-terms"
                    type="number"
                    min="0"
                    value={form.payment_terms_days}
                    onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subscription-notes" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Internal Notes & Terms
                </label>
                <textarea
                  id="subscription-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Special notes or contractual terms..."
                  className="w-full p-3 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Product Lines Section Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">Product Lines</h2>
                  <span className="text-[12px] text-gray-500">
                    {form.lines.length} {form.lines.length === 1 ? 'item' : 'items'} configured • Total quantity: {totalQuantity}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition shadow-sm"
                >
                  + Add Line
                </button>
              </div>

              {form.lines.length === 0 ? (
                <div className="text-center py-10 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl text-gray-400 text-sm">
                  No product lines added yet. Click &quot;+ Add Line&quot; to configure products.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.lines.map((line, index) => {
                    const product = products.find((item) => String(item.id) === String(line.product_id));
                    return (
                      <div
                        key={index}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                      >
                        <div className="sm:col-span-4">
                          <label htmlFor={`sub-prod-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <select
                            id={`sub-prod-${index}`}
                            value={line.product_id}
                            onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                            required
                            className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.name} ({formatMoney(p.sales_price)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor={`sub-var-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Variant
                          </label>
                          <select
                            id={`sub-var-${index}`}
                            value={line.variant_id}
                            onChange={(e) => updateLine(index, 'variant_id', e.target.value)}
                            className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                          >
                            <option value="">No variant</option>
                            {(product?.variants ?? []).map((v) => (
                              <option key={v.id} value={String(v.id)}>
                                {v.attribute}: {v.value} (+{formatMoney(v.extra_price || 0)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor={`sub-qty-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Qty <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`sub-qty-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                            required
                            className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor={`sub-tax-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Tax
                          </label>
                          <select
                            id={`sub-tax-${index}`}
                            value={line.tax_id}
                            onChange={(e) => updateLine(index, 'tax_id', e.target.value)}
                            className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                          >
                            <option value="">Default Tax</option>
                            {taxes.map((t) => (
                              <option key={t.id} value={String(t.id)}>
                                {t.name} ({t.rate_percent}%)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeLine(index)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove line"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[13px]">
                    <span className="text-gray-500 font-medium">Estimated Total (tax included):</span>
                    <span className="text-[17px] font-bold text-gray-900">
                      {formatMoney(totals)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions for Mobile / Accessibility */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-[#EEF2F7]">
              <button
                type="button"
                onClick={() => navigate('/subscriptions')}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              {!isEditing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => save(e, true)}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[14px] transition disabled:opacity-50"
                >
                  Create Quotation
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[14px] transition shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Draft'}
              </button>
            </div>
          </div>

          {/* Right Column (1 Col): Live Summary & Action Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Summary Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Subscription Summary</h3>
              <p className="text-[12px] text-gray-400 mb-4">Live calculation & contract overview</p>

              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Estimated Recurring Total
                </span>
                <div className="text-[28px] font-bold text-blue-900 mt-0.5 leading-tight">
                  {formatMoney(totals)}
                </div>
                <span className="text-[12px] text-blue-600 mt-1 block">
                  {selectedPlan ? `${selectedPlan.name} • ${formatMoney(selectedPlan.price)}` : 'Select a recurring plan'}
                </span>
              </div>

              <div className="space-y-3 text-[13px] border-b border-[#EEF2F7] pb-4 mb-4">
                <div>
                  <span className="text-gray-400 text-xs block">Customer</span>
                  <span className="font-semibold text-gray-900">
                    {selectedCustomer ? selectedCustomer.name : 'None selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Configured Items</span>
                  <span className="font-semibold text-gray-800">{form.lines.length} lines ({totalQuantity} units)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Terms</span>
                  <span className="font-semibold text-gray-800">{form.payment_terms_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Start Date</span>
                  <span className="font-semibold text-gray-800">{form.start_date || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date</span>
                  <span className="font-semibold text-gray-800">{form.expiry_date || 'No Expiry (Ongoing)'}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50 text-center"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Draft'}
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => save(e, true)}
                    className="w-full py-2 px-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold text-[13px] transition disabled:opacity-50 text-center"
                  >
                    Create Quotation →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/subscriptions')}
                  className="w-full py-2 px-4 rounded-xl border border-[#DCE3EE] text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition text-center"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Workflow Guidance Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">Workflow Notes</h3>
              <ul className="space-y-2.5 text-[12px] text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Draft:</strong> Stored internally for revisions without sending an official quote.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Quotation:</strong> Locks line items for customer review and approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Line Totals:</strong> Computed automatically with line item quantity, variant uplift, and tax percentages.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
