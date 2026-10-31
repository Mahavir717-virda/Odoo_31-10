import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import VariantsTable from '../components/VariantsTable';
import VariantModal from '../components/VariantModal';
import { useAuth } from '../../../context/AuthContext';
import { getProductById, createProduct, updateProduct } from '../api';
import { getTaxes } from '../../taxes/api';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isEditing = Boolean(id && id !== 'new');

  const [name, setName] = useState('');
  const [type, setType] = useState('SERVICE');
  const [salesPrice, setSalesPrice] = useState('');
  const [costPrice, setCostPrice] = useState('0');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState([]);

  const [taxOptions, setTaxOptions] = useState([]);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState(-1);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');
  const [taxLoadError, setTaxLoadError] = useState('');
  const [formError, setFormError] = useState('');

  const loadTaxes = useCallback(async () => {
    try {
      const response = await getTaxes({ page: 1, limit: 50 });
        const list = Array.isArray(response?.data) ? response.data : [];
        const options = [
          { value: '', label: 'No Tax / None' },
          ...list.map((t) => ({
            value: String(t.id),
            label: `${t.name} (${Number(t.rate_percent).toFixed(1)}%)`,
          })),
        ];
      setTaxOptions(options);
      setTaxLoadError('');
    } catch (error) {
      setTaxLoadError(error?.message || 'Unable to load tax rates.');
    }
  }, []);

  const loadProduct = useCallback(async () => {
    if (!isEditing) return;
    setLoading(true);
    setLoadError('');
    try {
      const product = await getProductById(id);
      if (product) {
        setName(product.name || '');
        setType(product.type || 'SERVICE');
        setSalesPrice(product.sales_price !== undefined ? String(product.sales_price) : '');
        setCostPrice(product.cost_price !== undefined ? String(product.cost_price) : '0');
        setTaxId(product.tax_id ? String(product.tax_id) : '');
        setNotes(product.notes || '');
        setIsActive(product.is_active !== undefined ? Boolean(product.is_active) : true);
        setVariants(product.variants || []);
      }
    } catch (error) {
      setLoadError(error?.message || 'Unable to load product details.');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => { loadTaxes(); }, [loadTaxes]);
  useEffect(() => { loadProduct(); }, [loadProduct]);

  // Read-only block if non-admin tries to create new product
  if (!isAdmin && !isEditing) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center max-w-lg mx-auto mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-600 mb-6">
          Staff accounts have read-only access to products. Only Admins can create new catalog items.
        </p>
        <Link to="/products">
          <Button variant="primary">Return to Products</Button>
        </Link>
      </div>
    );
  }

  const handleOpenAddVariant = () => {
    setEditingVariant(null);
    setEditingVariantIndex(-1);
    setVariantModalOpen(true);
  };

  const handleOpenEditVariant = (variant, index) => {
    setEditingVariant(variant);
    setEditingVariantIndex(index);
    setVariantModalOpen(true);
  };

  const handleSaveVariant = (savedVariant) => {
    if (editingVariantIndex >= 0) {
      setVariants((prev) => {
        const next = [...prev];
        next[editingVariantIndex] = savedVariant;
        return next;
      });
    } else {
      setVariants((prev) => [...prev, savedVariant]);
    }
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Product name is required.';
    if (salesPrice === '' || Number.isNaN(Number(salesPrice)) || Number(salesPrice) < 0) {
      errs.salesPrice = 'Sales price must be a non-negative number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return; // Prevent non-admin submission
    if (!validate()) return;

    setSaving(true);
    setFormError('');
    const payload = {
      name: name.trim(),
      type,
      sales_price: Number(salesPrice),
      cost_price: Number(costPrice) || 0,
      tax_id: taxId ? Number(taxId) : null,
      notes,
      is_active: isActive,
      variants,
    };

    try {
      if (isEditing) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/products');
    } catch (error) {
      setFormError(error?.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={
          !isAdmin
            ? 'Product Details (Staff Read-Only)'
            : isEditing
            ? `Edit Product: ${name || `#${id}`}`
            : 'Create New Product'
        }
        description={
          !isAdmin
            ? 'Staff members can view product specifications and variant pricing.'
            : 'Define product details, category type, base pricing, default tax, and variant add-ons.'
        }
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: isEditing ? (name || 'Edit') : 'New' },
        ]}
      />

      <Card className="max-w-4xl bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
        {(loadError || taxLoadError) && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
            <span>{loadError || taxLoadError}</span>
            <Button size="sm" variant="outline" onClick={() => { loadTaxes(); loadProduct(); }}>Retry</Button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{formError}</p>}
          <Input
            id="product-form-name"
            label="Product Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            }}
            placeholder="e.g. CRM Enterprise Suite"
            error={Boolean(errors.name)}
            errorMessage={errors.name}
            disabled={!isAdmin || saving}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              id="product-form-type"
              label="Product Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: 'SERVICE', label: 'SERVICE (Recurring / Consulting)' },
                { value: 'GOODS', label: 'GOODS (Physical / Hardware)' },
                { value: 'ADDON', label: 'ADDON (Feature Plugin)' },
              ]}
              disabled={!isAdmin || saving}
            />

            <Input
              id="product-form-sales-price"
              label="Sales Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={salesPrice}
              onChange={(e) => {
                setSalesPrice(e.target.value);
                if (errors.salesPrice) setErrors((prev) => ({ ...prev, salesPrice: null }));
              }}
              placeholder="2500.00"
              error={Boolean(errors.salesPrice)}
              errorMessage={errors.salesPrice}
              disabled={!isAdmin || saving}
              required
            />

            <Input
              id="product-form-cost-price"
              label="Cost Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="500.00"
              disabled={!isAdmin || saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="product-form-tax"
              label="Default Tax"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              options={taxOptions}
              disabled={!isAdmin || saving}
            />

            <div className="flex items-center pt-6">
              <Checkbox
                id="product-form-is-active"
                label="Product is active and available in subscription orders"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={!isAdmin || saving}
              />
            </div>
          </div>

          <Textarea
            id="product-form-notes"
            label="Internal Notes & Description"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Technical specs, service level agreements, or delivery requirements..."
            rows={3}
            disabled={!isAdmin || saving}
          />

          {/* Variants Management Section */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Product Variants & Computed Pricing
                </h3>
                <p className="text-xs text-gray-500">
                  Variants modify the base sales price. Final price = Base ({salesPrice ? `$${Number(salesPrice).toFixed(2)}` : '$0.00'}) + Surcharge.
                </p>
              </div>
              {isAdmin && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddVariant}
                  disabled={saving}
                >
                  + Add Variant
                </Button>
              )}
            </div>

            <VariantsTable
              basePrice={salesPrice}
              variants={variants}
              onEdit={handleOpenEditVariant}
              onRemove={handleRemoveVariant}
              readOnly={!isAdmin}
            />
          </div>

          {/* Actions Bar */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Link to="/products">
              <Button variant="outline" disabled={saving}>
                {isAdmin ? 'Cancel' : 'Back to Products'}
              </Button>
            </Link>
            {isAdmin && (
              <Button type="submit" variant="primary" loading={saving}>
                {isEditing ? 'Save Product' : 'Create Product'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      {isAdmin && (
        <VariantModal
          open={variantModalOpen}
          onClose={() => setVariantModalOpen(false)}
          onSave={handleSaveVariant}
          variant={editingVariant}
          baseSalesPrice={salesPrice}
        />
      )}
    </div>
  );
}