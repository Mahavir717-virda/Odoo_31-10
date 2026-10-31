import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import { getDiscountById, createDiscount, updateDiscount, getDiscountProducts } from '../api';
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
      const [availableProducts, discount] = await Promise.all([
        getDiscountProducts(),
        isEditing ? getDiscountById(id) : Promise.resolve(null),
      ]);
      setProducts(availableProducts);
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

  // Load available products for PRODUCTS scope
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProducts({ page_size: 100 })
      .then((res) => {
        if (!mounted) return;
        const list = res?.data || (Array.isArray(res) ? res : []);
        setProducts(list);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? `Edit Discount: ${name}` : 'Create New Discount'}
        description="Set up discount amounts, duration, eligibility rules, and redemption limits."
        breadcrumbs={[
          { label: 'Discounts', href: '/discounts' },
          { label: isEditing ? (readOnly ? 'Details' : 'Edit') : 'New' },
        ]}
      />

      <Card className="max-w-4xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {errors.form && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Details Section */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              General Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="discount-name"
                  label="Discount / Coupon Code"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.toUpperCase());
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. WELCOME20, ENTERPRISE500"
                  required
                  error={Boolean(errors.name)}
                  errorMessage={errors.name}
                  disabled={loading || saving}
                />
              </div>

              <div>
                <Select
                  id="discount-type"
                  label="Discount Type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                  }}
                  options={[
                    { value: 'PERCENT', label: 'Percentage (%)' },
                    { value: 'FIXED', label: 'Fixed Amount ($)' },
                  ]}
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div>
                <Input
                  id="discount-value"
                  label={type === 'PERCENT' ? 'Percentage (Max 100%)' : 'Amount ($)'}
                  type="number"
                  step="0.01"
                  min="0"
                  max={type === 'PERCENT' ? '100' : undefined}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                  }}
                  placeholder={type === 'PERCENT' ? '20' : '50.00'}
                  required
                  error={Boolean(errors.value)}
                  errorMessage={errors.value}
                  disabled={loading || saving}
                />
              </div>

              <div>
                <Input
                  id="discount-min-purchase"
                  label="Minimum Purchase ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={minPurchase}
                  onChange={(e) => {
                    setMinPurchase(e.target.value);
                    if (errors.minPurchase) setErrors((prev) => ({ ...prev, minPurchase: null }));
                  }}
                  placeholder="0.00"
                  error={Boolean(errors.minPurchase)}
                  errorMessage={errors.minPurchase}
                  disabled={loading || saving}
                />
              </div>

              <div>
                <Input
                  id="discount-min-quantity"
                  label="Minimum Quantity"
                  type="number"
                  step="1"
                  min="0"
                  value={minQuantity}
                  onChange={(e) => {
                    setMinQuantity(e.target.value);
                    if (errors.minQuantity) setErrors((prev) => ({ ...prev, minQuantity: null }));
                  }}
                  placeholder="0"
                  error={Boolean(errors.minQuantity)}
                  errorMessage={errors.minQuantity}
                  disabled={loading || saving}
                />
              </div>
            </div>
          </div>

          {/* Validity & Usage Limits Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Validity & Usage Limits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  id="discount-start-date"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate || errors.endDate) {
                      setErrors((prev) => ({ ...prev, startDate: null, endDate: null }));
                    }
                  }}
                  required
                  error={Boolean(errors.startDate)}
                  errorMessage={errors.startDate}
                  disabled={loading || saving}
                />
              </div>

              <div>
                <Input
                  id="discount-end-date"
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                  }}
                  required
                  error={Boolean(errors.endDate)}
                  errorMessage={errors.endDate}
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-800">Redemption Limit</span>
                <Checkbox
                  id="unlimited-usage-checkbox"
                  label="Unlimited Redemptions"
                  checked={isUnlimited}
                  onChange={(e) => {
                    setIsUnlimited(e.target.checked);
                    if (errors.usageLimit) setErrors((prev) => ({ ...prev, usageLimit: null }));
                  }}
                  className="!mb-0"
                  disabled={loading || saving}
                />
              </div>

              {!isUnlimited && (
                <div className="max-w-xs mt-2">
                  <Input
                    id="discount-usage-limit"
                    label="Maximum Redemptions"
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
                    error={Boolean(errors.usageLimit)}
                    errorMessage={errors.usageLimit}
                    disabled={loading || saving}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Scope & Product Multi-Select Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Scope & Applicability
            </h3>
            <div className="max-w-xs mb-4">
              <Select
                id="discount-scope"
                label="Applicable Scope"
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value);
                  if (errors.productIds) setErrors((prev) => ({ ...prev, productIds: null }));
                }}
                options={[
                  { value: 'SUBSCRIPTION', label: 'Subscription Plan Level' },
                  { value: 'PRODUCTS', label: 'Products Only (Specific Products)' },
                ]}
                disabled={loading || saving}
              />
            </div>

            {scope === 'PRODUCTS' && (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-sm font-medium text-gray-800">
                    Select Eligible Products <span className="text-red-500">*</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {productIds.length} of {products.length} selected
                  </span>
                </div>

                {errors.productIds && (
                  <p className="text-xs text-red-600 mb-3" role="alert">
                    {errors.productIds}
                  </p>
                )}

                {products.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3">No products available to select.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 bg-white rounded border border-gray-200">
                    {products.map((p) => {
                      const isSelected = productIds.includes(Number(p.id));
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-medium'
                              : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <input
                            id={`product-select-${p.id}`}
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProductId(p.id)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            disabled={loading || saving}
                          />
                          <label htmlFor={`product-select-${p.id}`} className="flex-1 min-w-0 cursor-pointer">
                            <span className="truncate block font-medium">{p.name}</span>
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
          <div className="pt-4 border-t border-gray-100">
            <Checkbox
              id="discount-is-active"
              label="Active (Discount is available for customers to use during its validity period)"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={loading || saving}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Link to="/discounts">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={saving}>
              {isEditing ? 'Save Changes' : 'Create Discount'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}