import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPlanById, createPlan, updatePlan } from '../api';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';

export default function PlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('YEARLY');
  const [minQuantity, setMinQuantity] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoClose, setAutoClose] = useState(false);
  const [closable, setClosable] = useState(true);
  const [pausable, setPausable] = useState(true);
  const [renewable, setRenewable] = useState(true);
  const [status, setStatus] = useState('ACTIVE');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');

  const loadPlan = useCallback(async () => {
    if (!isEditing) return;
    setLoading(true);
    setLoadError('');
    try {
      const plan = await getPlanById(id);
      if (!plan) {
        setLoadError('Plan not found.');
        return;
      }
      setName(plan.name || '');
      setPrice(plan.price !== undefined ? String(plan.price) : '');
      setBillingPeriod(plan.billing_period || 'YEARLY');
      setMinQuantity(plan.min_quantity !== undefined ? String(plan.min_quantity) : '1');
      setStartDate(plan.start_date ? plan.start_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setEndDate(plan.end_date ? plan.end_date.split('T')[0] : '');
      setAutoClose(Boolean(plan.auto_close));
      setClosable(plan.closable !== undefined ? Boolean(plan.closable) : true);
      setPausable(Boolean(plan.pausable));
      setRenewable(plan.renewable !== undefined ? Boolean(plan.renewable) : true);
      setStatus(plan.status || 'ACTIVE');
    } catch (err) {
      setLoadError(err?.message || 'Unable to load plan details.');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Plan name is required.';
    if (price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      errs.price = 'Price must be a non-negative number.';
    }
    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }
    if (endDate && startDate) {
      if (new Date(endDate) < new Date(startDate)) {
        errs.endDate = 'End date must be greater than or equal to start date.';
      }
    }
    const qty = Number(minQuantity);
    if (!minQuantity || Number.isNaN(qty) || qty < 1) {
      errs.minQuantity = 'Minimum quantity must be at least 1.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setFormError('');
    const payload = {
      name: name.trim(),
      price: Number(price),
      billing_period: billingPeriod,
      min_quantity: Number(minQuantity) || 1,
      start_date: startDate,
      end_date: endDate || null,
      auto_close: autoClose,
      closable,
      pausable,
      renewable,
      status,
    };

    try {
      if (isEditing) {
        await updatePlan(id, payload);
      } else {
        await createPlan(payload);
      }
      navigate('/plans');
    } catch (err) {
      setFormError(err?.message || 'Unable to save plan.');
    } finally {
      setSaving(false);
    }
  };

  const numPrice = Number(price) || 0;
  const cycleLabel =
    billingPeriod === 'YEARLY'
      ? '/year'
      : billingPeriod === 'MONTHLY'
      ? '/month'
      : billingPeriod === 'WEEKLY'
      ? '/week'
      : '/day';

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center p-12 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading plan details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/plans" className="hover:text-blue-600 transition">
          Plans
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {isEditing ? (name || 'Edit Plan') : 'New Plan'}
        </span>
      </div>

      {/* Page Head */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
          {isEditing ? `Edit Plan: ${name || 'Yearly Pro'}` : 'Create Subscription Plan'}
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Configure recurring billing intervals, prices, minimum order thresholds, and lifecycle flags.
        </p>
      </div>

      {/* Errors if any */}
      {(loadError || formError) && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
          {formError || loadError}
        </div>
      )}

      {/* 2-Column SaaS Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols): Main Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Configuration Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-5">
              <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                Plan Configuration
              </h2>

              <div>
                <label htmlFor="plan-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Yearly Pro"
                  required
                  disabled={saving}
                  className={`w-full h-11 px-3.5 bg-white border ${
                    errors.name ? 'border-red-400' : 'border-[#CBD5E1]'
                  } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                />
                {errors.name && <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plan-price" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Recurring Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                    }}
                    placeholder="999"
                    required
                    disabled={saving}
                    className={`w-full h-11 px-3.5 bg-white border ${
                      errors.price ? 'border-red-400' : 'border-[#CBD5E1]'
                    } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                  />
                  {errors.price && <p className="text-[12px] text-red-600 mt-1">{errors.price}</p>}
                </div>

                <div>
                  <label htmlFor="plan-period" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Billing Cycle
                  </label>
                  <select
                    id="plan-period"
                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value)}
                    disabled={saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  >
                    <option value="YEARLY">YEARLY (Annual invoice)</option>
                    <option value="MONTHLY">MONTHLY (Monthly invoice)</option>
                    <option value="WEEKLY">WEEKLY (Every 7 days)</option>
                    <option value="DAILY">DAILY (Every day)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plan-min-qty" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Minimum Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="plan-min-qty"
                    type="number"
                    min="1"
                    value={minQuantity}
                    onChange={(e) => {
                      setMinQuantity(e.target.value);
                      if (errors.minQuantity) setErrors((prev) => ({ ...prev, minQuantity: null }));
                    }}
                    placeholder="1"
                    required
                    disabled={saving}
                    className={`w-full h-11 px-3.5 bg-white border ${
                      errors.minQuantity ? 'border-red-400' : 'border-[#CBD5E1]'
                    } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                  />
                  {errors.minQuantity && <p className="text-[12px] text-red-600 mt-1">{errors.minQuantity}</p>}
                </div>

                <div>
                  <label htmlFor="plan-status" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Initial Status
                  </label>
                  <select
                    id="plan-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="plan-start-date" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Start Date (Available From) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="plan-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                    }}
                    required
                    disabled={saving}
                    className={`w-full h-11 px-3.5 bg-white border ${
                      errors.startDate ? 'border-red-400' : 'border-[#CBD5E1]'
                    } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                  />
                  {errors.startDate && <p className="text-[12px] text-red-600 mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <label htmlFor="plan-end-date" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    End Date (Available Until - Optional)
                  </label>
                  <input
                    id="plan-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                    }}
                    disabled={saving}
                    className={`w-full h-11 px-3.5 bg-white border ${
                      errors.endDate ? 'border-red-400' : 'border-[#CBD5E1]'
                    } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                  />
                  {errors.endDate && <p className="text-[12px] text-red-600 mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            {/* Plan Lifecycle Flags & Automation Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">Plan Lifecycle Flags & Permissions</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Control how this plan behaves during recurring runs, early closures, and auto-expiration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                    closable ? 'bg-blue-50/50 border-blue-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <input
                    id="plan-closable"
                    type="checkbox"
                    checked={closable}
                    onChange={(e) => setClosable(e.target.checked)}
                    disabled={saving}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="plan-closable" className="cursor-pointer">
                    <span className="block text-[13px] font-semibold text-gray-900">Closable</span>
                    <span className="block text-[11px] text-gray-500">Allows administrators to close the plan early</span>
                  </label>
                </div>

                <div
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                    pausable ? 'bg-blue-50/50 border-blue-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <input
                    id="plan-pausable"
                    type="checkbox"
                    checked={pausable}
                    onChange={(e) => setPausable(e.target.checked)}
                    disabled={saving}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="plan-pausable" className="cursor-pointer">
                    <span className="block text-[13px] font-semibold text-gray-900">Pausable</span>
                    <span className="block text-[11px] text-gray-500">Allows pausing recurring billing on this plan</span>
                  </label>
                </div>

                <div
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                    renewable ? 'bg-blue-50/50 border-blue-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <input
                    id="plan-renewable"
                    type="checkbox"
                    checked={renewable}
                    onChange={(e) => setRenewable(e.target.checked)}
                    disabled={saving}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="plan-renewable" className="cursor-pointer">
                    <span className="block text-[13px] font-semibold text-gray-900">Renewable</span>
                    <span className="block text-[11px] text-gray-500">Allows renewing the term once expired or closed</span>
                  </label>
                </div>

                <div
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition ${
                    autoClose ? 'bg-blue-50/50 border-blue-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <input
                    id="plan-autoclose"
                    type="checkbox"
                    checked={autoClose}
                    onChange={(e) => setAutoClose(e.target.checked)}
                    disabled={saving}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="plan-autoclose" className="cursor-pointer">
                    <span className="block text-[13px] font-semibold text-gray-900">Auto-Close</span>
                    <span className="block text-[11px] text-gray-500">Automatically close when end date arrives</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#EEF2F7]">
              <button
                type="button"
                onClick={() => navigate('/plans')}
                disabled={saving}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[14px] transition shadow-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>

          {/* Right Column (1 Col): Live Summary & Action Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Plan Preview Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Plan Preview</h3>
              <p className="text-[12px] text-gray-400 mb-4">Live recurring price & parameters</p>

              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Recurring Price
                </span>
                <div className="text-[28px] font-bold text-blue-900 mt-0.5 leading-tight">
                  {formatMoney(numPrice)}{' '}
                  <span className="text-[14px] font-normal text-blue-600">{cycleLabel}</span>
                </div>
                <span className="text-[12px] text-blue-600 mt-1 block">
                  {name || 'Untitled Plan'}
                </span>
              </div>

              <div className="space-y-3 text-[13px] border-b border-[#EEF2F7] pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Billing Cycle</span>
                  <span className="font-semibold text-gray-800">{billingPeriod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Minimum Order</span>
                  <span className="font-semibold text-gray-800">{minQuantity || 1} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available From</span>
                  <span className="font-semibold text-gray-800">{formatDate(startDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available Until</span>
                  <span className="font-semibold text-gray-800">
                    {endDate ? formatDate(endDate) : 'Open / Ongoing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto-Close</span>
                  <span className="font-semibold text-gray-800">{autoClose ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs mb-1">Lifecycle Flags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {closable && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-medium">
                        Closable
                      </span>
                    )}
                    {pausable && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium">
                        Pausable
                      </span>
                    )}
                    {renewable && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium">
                        Renewable
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                      status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : status === 'PAUSED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50 text-center"
                >
                  {saving ? 'Saving...' : 'Save Plan'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/plans')}
                  disabled={saving}
                  className="w-full py-2 px-4 rounded-xl border border-[#DCE3EE] text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition text-center"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Plan Best Practices Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">Plan Guidelines</h3>
              <ul className="space-y-2.5 text-[12px] text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Billing Frequency:</strong> Determines how often recurring invoices generate for subscribers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Permissions:</strong> Pausable and Closable flags dictate whether staff can pause or terminate subscriptions mid-term.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Minimum Order:</strong> Prevents subscriptions with fewer than the required number of units.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
