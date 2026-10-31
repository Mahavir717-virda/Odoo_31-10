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
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import VariantsTable from '../components/VariantsTable';
import VariantModal from '../components/VariantModal';
import { useAuth } from '../../../context/AuthContext';
import { extractValidationErrors } from '../../../api/errorHelper';
import { getProductById, createProduct, updateProduct } from '../api';
import { getTaxes } from '../../taxes/api';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { toast } = useToast();
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
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Unsaved changes warning on browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Load taxes for tax dropdown
  useEffect(() => {
    getTaxes({ page_size: 50 })
      .then((res) => {
        const list = res?.data || res || [];
        const options = [
          { value: '', label: 'No Tax / None' },
          ...list.map((t) => ({
            value: String(t.id),
            label: `${t.name} (${Number(t.rate_percent).toFixed(1)}%)`,
          })),
        ];
        setTaxOptions(options);
      })
      .catch(() => {});
  }, []);

  // Load product if editing
  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getProductById(id)
        .then((product) => {
          if (product) {
            setName(product.name || '');
            setType(product.type || 'SERVICE');
            setSalesPrice(product.sales_price !== undefined ? String(product.sales_price) : '');
            setCostPrice(product.cost_price !== undefined ? String(product.cost_price) : '0');
            setTaxId(product.tax_id ? String(product.tax_id) : '');
            setNotes(product.notes || '');
            setIsActive(product.is_active !== undefined ? Boolean(product.is_active) : true);
            setVariants(product.variants || []);
            setIsDirty(false);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

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

  const handleSaveVariant = (variantData) => {
    markDirty();
    if (editingVariantIndex >= 0) {
      const next = [...variants];
      next[editingVariantIndex] = { ...next[editingVariantIndex], ...variantData };
      setVariants(next);
    } else {
      setVariants([...variants, variantData]);
    }
  };

  const handleDeleteVariant = (index) => {
    markDirty();
    setVariants(variants.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Product name is required.';
    if (salesPrice === '' || Number.isNaN(Number(salesPrice)) || Number(salesPrice) < 0) {
      errs.sales_price = 'Sales price must be a valid non-negative number.';
    }
    if (costPrice !== '' && (Number.isNaN(Number(costPrice)) || Number(costPrice) < 0)) {
      errs.cost_price = 'Cost price must be a non-negative number.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      name: name.trim(),
      type,
      sales_price: Number(salesPrice),
      cost_price: Number(costPrice) || 0,
      tax_id: taxId ? Number(taxId) : null,
      notes: notes.trim(),
      is_active: isActive,
      variants,
    };

    try {
      if (isEditing) {
        await updateProduct(id, payload);
        toast({
          title: 'Product Updated',
          description: `${payload.name} has been updated.`,
          variant: 'success',
        });
      } else {
        await createProduct(payload);
        toast({
          title: 'Product Created',
          description: `${payload.name} added to the catalog.`,
          variant: 'success',
        });
      }
      setIsDirty(false);
      navigate('/products');
    } catch (err) {
      const { fieldErrors, generalMessage } = extractValidationErrors(err);
      setErrors({ ...fieldErrors, form: generalMessage });
      toast({
        title: 'Save Failed',
        description: generalMessage || 'Please review form errors.',
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      navigate('/products');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  const isReadOnly = !isAdmin;

  return (
    <div>
      <PageHeader
        title={
          isEditing
            ? isReadOnly
              ? `Product Details: ${name}`
              : `Edit Product: ${name}`
            : 'Create New Product'
        }
        description={
          isReadOnly
            ? 'Staff view of product configurations and variants.'
            : 'Configure product attributes, default tax category, pricing, and variants.'
        }
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: isEditing ? (isReadOnly ? 'Details' : 'Edit') : 'New' },
        ]}
      />

      {isDirty && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <span>You have unsaved changes in this product form.</span>
          <span className="font-semibold text-amber-900">Unsaved</span>
        </div>
      )}

      {errors.form && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {errors.form}
        </div>
      )}

      <Card className="max-w-4xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              General Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="product-name"
                  label="Product Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Enterprise Cloud ERP"
                  required
                  disabled={isReadOnly || saving}
                  error={Boolean(errors.name)}
                  errorMessage={errors.name}
                />
              </div>

              <div>
                <Select
                  id="product-type"
                  label="Product Type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    markDirty();
                  }}
                  disabled={isReadOnly || saving}
                  options={[
                    { value: 'SERVICE', label: 'Service' },
                    { value: 'GOODS', label: 'Goods / Physical' },
                    { value: 'ADDON', label: 'Add-on Module' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Pricing & Taxes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  id="sales-price"
                  label="Sales Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={salesPrice}
                  onChange={(e) => {
                    setSalesPrice(e.target.value);
                    markDirty();
                    if (errors.sales_price) setErrors((prev) => ({ ...prev, sales_price: null }));
                  }}
                  placeholder="0.00"
                  required
                  disabled={isReadOnly || saving}
                  error={Boolean(errors.sales_price)}
                  errorMessage={errors.sales_price}
                />
              </div>

              <div>
                <Input
                  id="cost-price"
                  label="Cost Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => {
                    setCostPrice(e.target.value);
                    markDirty();
                    if (errors.cost_price) setErrors((prev) => ({ ...prev, cost_price: null }));
                  }}
                  placeholder="0.00"
                  disabled={isReadOnly || saving}
                  error={Boolean(errors.cost_price)}
                  errorMessage={errors.cost_price}
                />
              </div>

              <div>
                <Select
                  id="tax-id"
                  label="Default Tax"
                  value={taxId}
                  onChange={(e) => {
                    setTaxId(e.target.value);
                    markDirty();
                  }}
                  options={taxOptions}
                  disabled={isReadOnly || saving}
                />
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Product Variants
                </h3>
                <p className="text-xs text-gray-400">
                  Define optional specifications, licenses, or hardware tiers with pricing adjustments.
                </p>
              </div>
              {!isReadOnly && (
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

            <div className="w-full overflow-x-auto">
              <VariantsTable
                variants={variants}
                basePrice={Number(salesPrice) || 0}
                onEdit={isReadOnly ? null : handleOpenEditVariant}
                onDelete={isReadOnly ? null : handleDeleteVariant}
              />
            </div>
          </div>

          {/* Description / Notes */}
          <div className="pt-4 border-t border-gray-100">
            <Textarea
              id="product-notes"
              label="Internal Notes / Description"
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markDirty();
              }}
              placeholder="Operational details, SLA notes, or customer-facing remarks..."
              disabled={isReadOnly || saving}
            />
          </div>

          {/* Active status */}
          <div className="pt-2">
            <Checkbox
              id="product-is-active"
              label="Product is active and eligible for new subscriptions"
              checked={isActive}
              onChange={(e) => {
                setIsActive(e.target.checked);
                markDirty();
              }}
              disabled={isReadOnly || saving}
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleCancelClick}
            >
              {isReadOnly ? 'Back to Products' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" variant="primary" loading={saving}>
                {isEditing ? 'Save Changes' : 'Create Product'}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <VariantModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        onSubmit={handleSaveVariant}
        variant={editingVariant}
      />

      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes that will be lost if you leave this page. Are you sure you want to discard them?"
        confirmLabel="Discard & Leave"
        confirmVariant="danger"
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsDirty(false);
          navigate('/products');
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </div>
  );
}
