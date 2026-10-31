import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getDiscountById, createDiscount, updateDiscount } from '../api';
import { getProducts } from '../../products/api';
import { formatMoney } from '../../../utils/formatMoney';

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultEndDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function DiscountFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditing = Boolean(id && id !== 'new');
  const readOnly = isEditing && !isAdmin;

  const [name, setName] = useState('');
  const [type, setType] = useState('PERCENT');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('0');
  const [minQuantity, setMinQuantity] = useState('0');
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [usageLimit, setUsageLimit] = useState('');
  const [scope, setScope] = useState('SUBSCRIPTION');
  const [productIds, setProductIds] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setErrors({});
    try {
      const [availableProductsRes, discount] = await Promise.all([
        getProducts({ page_size: 100 }),
        isEditing ? getDiscountById(id) : Promise.resolve(null),
      ]);
      const productList = availableProductsRes?.data || (Array.isArray(availableProductsRes) ? availableProductsRes : []);
      setProducts(productList);

      if (discount) {
        setName(discount.name || '');
        setType(discount.type || 'PERCENT');
        setValue(String(discount.value ?? ''));
        setMinPurchase(String(discount.min_purchase ?? 0));
        setMinQuantity(String(discount.min_quantity ?? 0));
        setStartDate(String(discount.start_date ?? getTodayStr()).slice(0, 10));
        setEndDate(String(discount.end_date ?? getDefaultEndDate()).slice(0, 10));
        const unlimited = discount.usage_limit === null || discount.usage_limit === undefined || discount.usage_limit === '';
        setIsUnlimited(unlimited);
        setUsageLimit(unlimited ? '' : String(discount.usage_limit));
        setScope(discount.scope === 'PRODUCTS' ? 'PRODUCTS' : 'SUBSCRIPTION');
        setProductIds(Array.isArray(discount.product_ids) ? discount.product_ids.map(Number) : []);
        setIsActive(Boolean(discount.is_active));
      }
    } catch (loadError) {
      setErrors({ form: loadError?.message || 'Unable to load discount data.' });
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleProductId = (productId) => {
    setProductIds((prev) => {
      const numId = Number(productId);
      if (prev.includes(numId)) {
        return prev.filter((p) => p !== numId);
      }
      return [...prev, numId];
    });
    if (errors.productIds) {
      setErrors((prev) => ({ ...prev, productIds: null }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Discount name / code is required.';
    const numericValue = Number(value);
    if (!value || !Number.isFinite(numericValue) || numericValue <= 0) {
      nextErrors.value = 'Discount value must be greater than 0.';
    } else if (type === 'PERCENT' && numericValue > 100) {
      nextErrors.value = 'Percentage discount cannot exceed 100%.';
    }
    if (!startDate) nextErrors.startDate = 'Start date is required.';
    if (!endDate) nextErrors.endDate = 'End date is required.';
    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate = 'End date must be greater than or equal to start date.';
    }
    if (Number(minPurchase) < 0 || !Number.isFinite(Number(minPurchase))) {
      nextErrors.minPurchase = 'Minimum purchase amount cannot be negative.';
    }
    if (!Number.isInteger(Number(minQuantity)) || Number(minQuantity) < 0) {
      nextErrors.minQuantity = 'Minimum quantity cannot be negative.';
    }
    if (!isUnlimited) {
      const numLimit = parseInt(usageLimit, 10);
      if (!usageLimit || isNaN(numLimit) || numLimit <= 0) {
        nextErrors.usageLimit = 'Usage limit must be a positive number greater than 0.';
      }
    }
    if (scope === 'PRODUCTS' && (!productIds || productIds.length === 0)) {
      nextErrors.productIds = 'Please select at least one product when scope is set to Products Only.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;

    const payload = {
      name: name.trim().toUpperCase(),
      type,
      value: Number(value),
      min_purchase: Math.max(0, Number(minPurchase) || 0),
      min_quantity: Math.max(0, parseInt(minQuantity, 10) || 0),
      start_date: startDate,
      end_date: endDate,
      usage_limit: isUnlimited ? null : parseInt(usageLimit, 10),
      scope,
      product_ids: scope === 'PRODUCTS' ? productIds : [],
      is_active: isActive,
    };

    setSaving(true);
    try {
      if (isEditing) await updateDiscount(id, payload);
      else await createDiscount(payload);
      navigate('/discounts');
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        form: err.response?.data?.message || err.message || 'Failed to save discount.',
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center p-12 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading discount details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/discounts" className="hover:text-blue-600 transition">
          Discounts
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {isEditing ? (name || 'Edit Discount') : 'New Discount'}
        </span>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
          {isEditing ? `Edit Discount: ${name || 'Discount'}` : 'Create New Discount'}
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Configure discount coupons, percentages, redemption limits, and product eligibility.
        </p>
      </div>

      {/* Errors if any */}
      {errors.form && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
          {errors.form}
        </div>
      )}

      {/* 2-Column SaaS Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols): Main Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-6">
              {/* General Information */}
              <div className="space-y-4">
                <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                  General Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="discount-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Discount / Coupon Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="discount-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value.toUpperCase());
                        if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. SUMMER25, ENTERPRISE50"
                      required
                      disabled={loading || saving || readOnly}
                      className={`w-full h-11 px-3.5 bg-white border ${
                        errors.name ? 'border-red-400' : 'border-[#CBD5E1]'
                      } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition uppercase font-mono`}
                    />
                    {errors.name && <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="discount-type" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Discount Type
                    </label>
                    <select
                      id="discount-type"
                      value={type}
                      onChange={(e) => {
                        setType(e.target.value);
                        if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                      }}
                      disabled={loading || saving || readOnly}
                      className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount ($)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="discount-value" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      {type === 'PERCENT' ? 'Percentage (Max 100%)' : 'Fixed Discount ($)'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="discount-value"
                      type="number"
                      step={type === 'PERCENT' ? '1' : '0.01'}
                      min="0.01"
                      max={type === 'PERCENT' ? '100' : undefined}
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                      }}
                      placeholder={type === 'PERCENT' ? '20' : '50.00'}
                      required
                      disabled={loading || saving || readOnly}
                      className={`w-full h-11 px-3.5 bg-white border ${
                        errors.value ? 'border-red-400' : 'border-[#CBD5E1]'
                      } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                    />
                    {errors.value && <p className="text-[12px] text-red-600 mt-1">{errors.value}</p>}
                  </div>

                  <div>
                    <label htmlFor="discount-min-purchase" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Minimum Purchase ($)
                    </label>
                    <input
                      id="discount-min-purchase"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minPurchase}
                      onChange={(e) => {
                        setMinPurchase(e.target.value);
                        if (errors.minPurchase) setErrors((prev) => ({ ...prev, minPurchase: null }));
                      }}
                      placeholder="0.00"
                      disabled={loading || saving || readOnly}
                      className={`w-full h-11 px-3.5 bg-white border ${
                        errors.minPurchase ? 'border-red-400' : 'border-[#CBD5E1]'
                      } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                    />
                    {errors.minPurchase && <p className="text-[12px] text-red-600 mt-1">{errors.minPurchase}</p>}
                  </div>

                  <div>
                    <label htmlFor="discount-min-qty" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Minimum Quantity
                    </label>
                    <input
                      id="discount-min-qty"
                      type="number"
                      min="0"
                      step="1"
                      value={minQuantity}
                      onChange={(e) => {
                        setMinQuantity(e.target.value);
                        if (errors.minQuantity) setErrors((prev) => ({ ...prev, minQuantity: null }));
                      }}
                      placeholder="0"
                      disabled={loading || saving || readOnly}
                      className={`w-full h-11 px-3.5 bg-white border ${
                        errors.minQuantity ? 'border-red-400' : 'border-[#CBD5E1]'
                      } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                    />
                    {errors.minQuantity && <p className="text-[12px] text-red-600 mt-1">{errors.minQuantity}</p>}
                  </div>
                </div>
              </div>

              {/* Validity Dates */}
              <div className="space-y-4 pt-2">
                <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                  Validity Dates
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="discount-start-date" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      Start Date (Available From) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="discount-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                      }}
                      required
                      disabled={loading || saving || readOnly}
                      className={`w-full h-11 px-3.5 bg-white border ${
                        errors.startDate ? 'border-red-400' : 'border-[#CBD5E1]'
                      } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                    />
                    {errors.startDate && <p className="text-[12px] text-red-600 mt-1">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label htmlFor="discount-end-date" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                      End Date (Available Until) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="discount-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                      }}
                      required
                      disabled={loading || saving || readOnly}
                      className={`w-full h-11 px-3.5 bg-white border ${
                        errors.endDate ? 'border-red-400' : 'border-[#CBD5E1]'
                      } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                    />
                    {errors.endDate && <p className="text-[12px] text-red-600 mt-1">{errors.endDate}</p>}
                  </div>
                </div>
              </div>

              {/* Redemption Limits */}
              <div className="space-y-4 pt-2">
                <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                  Redemption & Limits
                </h2>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isUnlimited}
                      onChange={(e) => {
                        setIsUnlimited(e.target.checked);
                        if (errors.usageLimit) setErrors((prev) => ({ ...prev, usageLimit: null }));
                      }}
                      disabled={loading || saving || readOnly}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-[13px] font-medium text-gray-800">
                      Unlimited Redemptions (No ceiling on total customer uses)
                    </span>
                  </label>

                  {!isUnlimited && (
                    <div className="max-w-xs pt-1">
                      <label htmlFor="discount-usage-limit" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                        Maximum Allowed Redemptions <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="discount-usage-limit"
                        type="number"
                        min="1"
                        step="1"
                        value={usageLimit}
                        onChange={(e) => {
                          setUsageLimit(e.target.value);
                          if (errors.usageLimit) setErrors((prev) => ({ ...prev, usageLimit: null }));
                        }}
                        placeholder="e.g. 100"
                        required
                        disabled={loading || saving || readOnly}
                        className={`w-full h-11 px-3.5 bg-white border ${
                          errors.usageLimit ? 'border-red-400' : 'border-[#CBD5E1]'
                        } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                      />
                      {errors.usageLimit && <p className="text-[12px] text-red-600 mt-1">{errors.usageLimit}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Scope & Applicability */}
              <div className="space-y-4 pt-2">
                <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                  Scope & Applicability
                </h2>
                <div className="max-w-xs">
                  <label htmlFor="discount-scope" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Applicable Level
                  </label>
                  <select
                    id="discount-scope"
                    value={scope}
                    onChange={(e) => {
                      setScope(e.target.value);
                      if (errors.productIds) setErrors((prev) => ({ ...prev, productIds: null }));
                    }}
                    disabled={loading || saving || readOnly}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  >
                    <option value="SUBSCRIPTION">Subscription Plan Level</option>
                    <option value="PRODUCTS">Specific Products Only</option>
                  </select>
                </div>

                {scope === 'PRODUCTS' && (
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-gray-800">
                        Select Eligible Products <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[12px] text-gray-500">
                        {productIds.length} of {products.length} selected
                      </span>
                    </div>

                    {errors.productIds && <p className="text-[12px] text-red-600">{errors.productIds}</p>}

                    {products.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-2">No products available to select.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-white rounded-xl border border-[#CBD5E1]">
                        {products.map((p) => {
                          const isSelected = productIds.includes(Number(p.id));
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/60 text-blue-900 font-medium'
                                  : 'border-[#E2E8F0] hover:bg-gray-50 text-gray-700'
                              }`}
                              onClick={() => toggleProductId(p.id)}
                            >
                              <input
                                id={`disc-prod-${p.id}`}
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductId(p.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                disabled={loading || saving || readOnly}
                              />
                              <label htmlFor={`disc-prod-${p.id}`} className="flex-1 min-w-0 cursor-pointer">
                                <span className="truncate block font-semibold text-gray-900">{p.name}</span>
                                <span className="text-[11px] text-gray-500">
                                  {p.type} • {formatMoney(p.sales_price || 0)}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Active Status Checkbox */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id="discount-is-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading || saving || readOnly}
                    className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-[13px] text-gray-700">
                    Active: discount code is valid and available for redemption
                  </span>
                </label>
              </div>

              {/* Bottom Actions for Mobile */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#EEF2F7]">
                <Link
                  to="/discounts"
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
                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Discount'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1 Col): Live Coupon Preview & Action Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Coupon Preview Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Coupon Preview</h3>
              <p className="text-[12px] text-gray-400 mb-4">Live customer-facing badge</p>

              {/* Coupon Ticket Visual */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] relative overflow-hidden mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-white/80 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {scope === 'SUBSCRIPTION' ? 'Subscription Coupon' : 'Product Coupon'}
                  </span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="font-mono text-[22px] font-extrabold text-blue-950 tracking-wider mb-1">
                  {name || 'COUPON_CODE'}
                </div>

                <div className="text-[26px] font-extrabold text-[#2563EB] mb-2 leading-tight">
                  {type === 'PERCENT' ? `${value || '0'}% OFF` : `${formatMoney(Number(value) || 0)} OFF`}
                </div>

                <div className="text-[11px] text-blue-900/80 space-y-0.5 border-t border-blue-200/60 pt-2">
                  <div>Min purchase: {minPurchase > 0 ? formatMoney(minPurchase) : 'None'}</div>
                  <div>Valid: {startDate} – {endDate}</div>
                  <div>Limit: {isUnlimited ? 'Unlimited Uses' : `${usageLimit || '—'} Redemptions`}</div>
                </div>
              </div>

              {/* Quick Summary Metrics */}
              <div className="space-y-2.5 text-[13px] border-b border-[#EEF2F7] pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount Type</span>
                  <span className="font-semibold text-gray-800">
                    {type === 'PERCENT' ? 'Percentage' : 'Fixed Reduction'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Scope Level</span>
                  <span className="font-semibold text-gray-800">
                    {scope === 'SUBSCRIPTION' ? 'All Plans' : `${productIds.length} Products`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Redemption Ceiling</span>
                  <span className="font-semibold text-gray-800">
                    {isUnlimited ? 'Unlimited' : `${usageLimit || '0'} max`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {!readOnly && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50 text-center"
                  >
                    {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Discount'}
                  </button>
                )}
                <Link
                  to="/discounts"
                  className="block w-full py-2 px-4 rounded-xl border border-[#DCE3EE] text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </div>

            {/* Discount Strategy Tips Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">Discount Tips</h3>
              <ul className="space-y-2 text-[12px] text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Coupon Codes:</strong> Automatically capitalized and formatted for customer redemption.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Subscription Scope:</strong> Applies across entire recurring subscription totals.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Limits:</strong> Protect your revenue by adding a maximum redemption ceiling.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
