import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../../components/ui/Toast';
import { useAuth } from '../../../context/AuthContext';
import { getProducts } from '../../products/api';
import { getPlans } from '../../plans/api';
import { getTaxes } from '../../taxes/api';
import { createTemplate, getTemplate, updateTemplate } from '../api';
import { formatMoney } from '../../../utils/formatMoney';

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
    name: '',
    plan_id: '',
    validity_days: 30,
    payment_terms_days: 15,
    notes: '',
    is_active: true,
    lines: [],
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      getPlans({ page: 1, limit: 100 }),
      getProducts({ page: 1, limit: 100, is_active: true }),
      getTaxes({ page: 1, limit: 100, is_active: true }),
      isEditing ? getTemplate(id) : Promise.resolve(null),
    ])
      .then(([planResponse, productResponse, taxResponse, template]) => {
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
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Unable to load template data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, isEditing]);

  const selectedPlan = plans.find((p) => String(p.id) === String(form.plan_id));

  const totals = useMemo(
    () =>
      form.lines.reduce((sum, line) => {
        const product = products.find((item) => String(item.id) === String(line.product_id));
        const variant = product?.variants?.find((item) => String(item.id) === String(line.variant_id));
        const tax = taxes.find((item) => String(item.id) === String(line.tax_id));
        const unit = Number(product?.sales_price ?? 0) + Number(variant?.extra_price ?? 0);
        const beforeTax = unit * Number(line.quantity || 0);
        return sum + beforeTax + (beforeTax * Number(tax?.rate_percent ?? 0)) / 100;
      }, 0),
    [form.lines, products, taxes]
  );

  const updateLine = (index, key, value) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index
          ? { ...line, [key]: value, ...(key === 'product_id' ? { variant_id: '' } : {}) }
          : line
      ),
    }));
  };

  const addLine = () => {
    setForm((current) => ({
      ...current,
      lines: [
        ...current.lines,
        {
          product_id: products[0] ? String(products[0].id) : '',
          variant_id: '',
          quantity: 1,
          tax_id: '',
        },
      ],
    }));
  };

  const removeLine = (index) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !form.plan_id ||
      !form.lines.length ||
      form.lines.some((line) => !line.product_id || Number(line.quantity) < 1)
    ) {
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

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center p-12 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading template details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/templates" className="hover:text-blue-600 transition">
          Templates
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {isEditing ? (form.name || 'Edit Template') : 'New Template'}
        </span>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
          {isEditing ? `Edit Template: ${form.name || 'Quotation'}` : 'Create Quotation Template'}
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Configure preset quotation defaults, validity terms, and standard product bundles.
        </p>
      </div>

      {/* Errors */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
          {error}
        </div>
      )}

      {/* 2-Column SaaS Grid */}
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols): Main Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Information Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-5">
              <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                Template Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="template-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="template-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Starter SaaS Bundle"
                    required
                    disabled={readOnly || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="template-plan" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Default Recurring Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="template-plan"
                    value={form.plan_id}
                    onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                    required
                    disabled={readOnly || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  >
                    <option value="">Select plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="validity-days" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Quotation Validity (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="validity-days"
                    type="number"
                    min="1"
                    value={form.validity_days}
                    onChange={(e) => setForm({ ...form, validity_days: e.target.value })}
                    required
                    disabled={readOnly || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="payment-terms" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Payment Terms (Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="payment-terms"
                    type="number"
                    min="0"
                    value={form.payment_terms_days}
                    onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })}
                    required
                    disabled={readOnly || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="template-notes" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Default Terms & Notes
                </label>
                <textarea
                  id="template-notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Contractual defaults or notes for this quotation..."
                  disabled={readOnly || saving}
                  className="w-full p-3 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    disabled={readOnly || saving}
                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-[13px] text-gray-700">
                    Active template (available when creating new subscriptions)
                  </span>
                </label>
              </div>
            </div>

            {/* Product Lines Section Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">Preset Product Lines</h2>
                  <span className="text-[12px] text-gray-500">{form.lines.length} {form.lines.length === 1 ? 'item' : 'items'} configured</span>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={addLine}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition shadow-sm"
                  >
                    + Add Line
                  </button>
                )}
              </div>

              {form.lines.length === 0 ? (
                <div className="text-center py-10 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl text-gray-400 text-sm">
                  No product lines added yet. Click &quot;+ Add Line&quot; to configure default products.
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
                        <div className="sm:col-span-5">
                          <label htmlFor={`tmpl-prod-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <select
                            id={`tmpl-prod-${index}`}
                            value={line.product_id}
                            onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                            required
                            disabled={readOnly || saving}
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
                          <label htmlFor={`tmpl-var-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Variant
                          </label>
                          <select
                            id={`tmpl-var-${index}`}
                            value={line.variant_id}
                            onChange={(e) => updateLine(index, 'variant_id', e.target.value)}
                            disabled={readOnly || saving}
                            className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                          >
                            <option value="">No variant</option>
                            {(product?.variants ?? []).map((v) => (
                              <option key={v.id} value={String(v.id)}>
                                {v.attribute}: {v.value}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor={`tmpl-qty-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                            Qty <span className="text-red-500">*</span>
                          </label>
                          <input
                            id={`tmpl-qty-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                            required
                            disabled={readOnly || saving}
                            className="w-full h-10 px-3 bg-white border border-[#CBD5E1] rounded-lg text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <label htmlFor={`tmpl-tax-${index}`} className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Tax
                            </label>
                            <select
                              id={`tmpl-tax-${index}`}
                              value={line.tax_id}
                              onChange={(e) => updateLine(index, 'tax_id', e.target.value)}
                              disabled={readOnly || saving}
                              className="w-full h-10 px-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[12px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                            >
                              <option value="">No tax</option>
                              {taxes.map((t) => (
                                <option key={t.id} value={String(t.id)}>
                                  {t.name} ({t.rate_percent}%)
                                </option>
                              ))}
                            </select>
                          </div>
                          {!readOnly && (
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
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[13px]">
                    <span className="text-gray-500 font-medium">Estimated Bundle Total (tax included):</span>
                    <span className="text-[17px] font-bold text-gray-900">
                      {formatMoney(totals)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#EEF2F7]">
              <Link
                to="/templates"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
              {!readOnly && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[14px] transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : isEditing ? 'Save Template' : 'Create Template'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Live Summary & Action Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Template Summary Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Template Overview</h3>
              <p className="text-[12px] text-gray-400 mb-4">Preset quotation defaults</p>

              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Estimated Bundle Value
                </span>
                <div className="text-[28px] font-bold text-blue-900 mt-0.5 leading-tight">
                  {formatMoney(totals)}
                </div>
                <span className="text-[12px] text-blue-600 mt-1 block">
                  {selectedPlan ? selectedPlan.name : 'No default plan'}
                </span>
              </div>

              <div className="space-y-3 text-[13px] border-b border-[#EEF2F7] pb-4 mb-4">
                <div>
                  <span className="text-gray-400 text-xs block">Template Name</span>
                  <span className="font-semibold text-gray-900">
                    {form.name || 'Untitled Template'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                    form.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {form.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Product Lines</span>
                  <span className="font-semibold text-gray-800">{form.lines.length} configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quotation Validity</span>
                  <span className="font-semibold text-gray-800">{form.validity_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Terms</span>
                  <span className="font-semibold text-gray-800">{form.payment_terms_days} days</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {!readOnly && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50 text-center"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Save Template' : 'Create Template'}
                  </button>
                )}
                <Link
                  to="/templates"
                  className="block w-full py-2 px-4 rounded-xl border border-[#DCE3EE] text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>

            {/* Template Guidelines Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">How Templates Work</h3>
              <ul className="space-y-2.5 text-[12px] text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>1-Click Presets:</strong> Quickly create subscriptions pre-populated with standard products, discounts, and terms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Validity:</strong> Sets the expiration window on quotes sent to prospective customers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Customizable:</strong> Sales agents can still adjust lines and quantities after creating from template.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
