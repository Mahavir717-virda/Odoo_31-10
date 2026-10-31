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

function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateValue(value) {
  return value ? String(value).slice(0, 10) : '';
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
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [usageLimit, setUsageLimit] = useState('');
  const [scope, setScope] = useState('SUBSCRIPTION');
  const [productIds, setProductIds] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
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
        setStartDate(dateValue(discount.start_date));
        setEndDate(dateValue(discount.end_date));
        setUsageLimit(discount.usage_limit == null ? '' : String(discount.usage_limit));
        setScope(discount.scope || 'SUBSCRIPTION');
        setProductIds((discount.product_ids || []).map(Number));
        setIsActive(Boolean(discount.is_active));
      }
    } catch (loadError) {
      setError(loadError?.message || 'Unable to load discount data.');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    load();
  }, [load]);

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = 'Discount name is required.';
    const numericValue = Number(value);
    if (!value || !Number.isFinite(numericValue) || numericValue <= 0) {
      nextErrors.value = 'Value must be greater than zero.';
    } else if (type === 'PERCENT' && numericValue > 100) {
      nextErrors.value = 'Percentage discounts cannot exceed 100%.';
    }
    if (!startDate) nextErrors.startDate = 'Start date is required.';
    if (!endDate) nextErrors.endDate = 'End date is required.';
    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate = 'End date must be on or after the start date.';
    }
    if (Number(minPurchase) < 0 || !Number.isFinite(Number(minPurchase))) {
      nextErrors.minPurchase = 'Minimum purchase must be zero or more.';
    }
    if (!Number.isInteger(Number(minQuantity)) || Number(minQuantity) < 0) {
      nextErrors.minQuantity = 'Minimum quantity must be a non-negative integer.';
    }
    if (usageLimit && (!Number.isInteger(Number(usageLimit)) || Number(usageLimit) < 1)) {
      nextErrors.usageLimit = 'Usage limit must be a positive whole number.';
    }
    if (scope === 'PRODUCTS' && productIds.length === 0) {
      nextErrors.productIds = 'Select at least one product for this discount.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      type,
      value: Number(value),
      min_purchase: Number(minPurchase),
      min_quantity: Number(minQuantity),
      start_date: startDate,
      end_date: endDate,
      usage_limit: usageLimit ? Number(usageLimit) : null,
      scope,
      is_active: isActive,
      product_ids: scope === 'PRODUCTS' ? productIds : [],
    };

    setSaving(true);
    try {
      if (isEditing) await updateDiscount(id, payload);
      else await createDiscount(payload);
      navigate('/discounts');
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save discount.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[300px] items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? (readOnly ? 'Discount Details' : 'Edit Discount') : 'Create New Discount'}
        breadcrumbs={[
          { label: 'Discounts', href: '/discounts' },
          { label: isEditing ? (readOnly ? 'Details' : 'Edit') : 'New' },
        ]}
      />

      <Card className="max-w-3xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={load}>Retry</Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="discount-name" label="Discount Name" value={name} onChange={(e) => setName(e.target.value)} error={Boolean(errors.name)} errorMessage={errors.name} required disabled={readOnly || saving} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select id="discount-type" label="Discount Type" value={type} onChange={(e) => setType(e.target.value)} options={[{ value: 'PERCENT', label: 'Percentage (%)' }, { value: 'FIXED', label: 'Fixed amount' }]} disabled={readOnly || saving} />
            <Input id="discount-value" label={type === 'PERCENT' ? 'Discount Percentage (%)' : 'Discount Amount'} type="number" min="0.01" max={type === 'PERCENT' ? '100' : undefined} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} error={Boolean(errors.value)} errorMessage={errors.value} required disabled={readOnly || saving} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="discount-start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={Boolean(errors.startDate)} errorMessage={errors.startDate} required disabled={readOnly || saving} />
            <Input id="discount-end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={Boolean(errors.endDate)} errorMessage={errors.endDate} required disabled={readOnly || saving} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="discount-min-purchase" label="Minimum Purchase" type="number" min="0" step="0.01" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} error={Boolean(errors.minPurchase)} errorMessage={errors.minPurchase} disabled={readOnly || saving} />
            <Input id="discount-min-quantity" label="Minimum Quantity" type="number" min="0" step="1" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} error={Boolean(errors.minQuantity)} errorMessage={errors.minQuantity} disabled={readOnly || saving} />
            <Input id="discount-usage-limit" label="Usage Limit (blank = unlimited)" type="number" min="1" step="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} error={Boolean(errors.usageLimit)} errorMessage={errors.usageLimit} disabled={readOnly || saving} />
          </div>

          <Select id="discount-scope" label="Applies To" value={scope} onChange={(e) => setScope(e.target.value)} options={[{ value: 'SUBSCRIPTION', label: 'Subscriptions' }, { value: 'PRODUCTS', label: 'Selected products' }]} disabled={readOnly || saving} />

          {scope === 'PRODUCTS' && (
            <fieldset disabled={readOnly || saving} className="rounded-lg border border-gray-200 p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">Eligible products</legend>
              {products.length === 0 ? (
                <p className="text-sm text-gray-500">No active products are available.</p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={productIds.includes(Number(product.id))}
                        onChange={(event) => {
                          const productId = Number(product.id);
                          setProductIds((current) => event.target.checked
                            ? [...current, productId]
                            : current.filter((selectedId) => selectedId !== productId));
                        }}
                      />
                      {product.name}
                    </label>
                  ))}
                </div>
              )}
              {errors.productIds && <p className="mt-2 text-sm text-red-600" role="alert">{errors.productIds}</p>}
            </fieldset>
          )}

          <Checkbox id="discount-active" label="Active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={readOnly || saving} />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
            <Link to="/discounts"><Button type="button" variant="outline">{readOnly ? 'Back' : 'Cancel'}</Button></Link>
            {!readOnly && <Button type="submit" variant="primary" loading={saving}>{isEditing ? 'Save Changes' : 'Create Discount'}</Button>}
          </div>
        </form>
      </Card>
    </div>
  );
}
