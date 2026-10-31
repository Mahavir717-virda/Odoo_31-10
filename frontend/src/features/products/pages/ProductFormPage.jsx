import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import VariantModal from '../components/VariantModal';
import { useAuth } from '../../../context/AuthContext';
import { formatMoney } from '../../../utils/formatMoney';
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
        { value: '', label: 'No tax' },
        ...list.map((t) => ({
          value: String(t.id),
          label: `${t.name} (${Number(t.rate_percent).toFixed(1)}%)`,
        })),
      ];
      setTaxOptions(options);
      setTaxLoadError('');
    } catch (err) {
      setTaxLoadError(err?.message || 'Unable to load tax rates.');
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
    } catch (err) {
      setLoadError(err?.message || 'Unable to load product details.');
    } finally {
      setLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadTaxes();
  }, [loadTaxes]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (!isAdmin && !isEditing) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center max-w-lg mx-auto mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-sm text-gray-600 mb-6">
          Staff accounts have read-only access to products. Only Admins can create new catalog items.
        </p>
        <Link to="/products">
          <button type="button" className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-sm transition">
            Return to Products
          </button>
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
    if (!isAdmin) return;
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
    } catch (err) {
      setFormError(err?.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  // Pricing calculations for summary card
  const sPrice = Number(salesPrice) || 0;
  const cPrice = Number(costPrice) || 0;
  const margin = sPrice - cPrice;
  const marginPercent = sPrice > 0 ? ((margin / sPrice) * 100).toFixed(1) : '0.0';
  const highestFinalPrice = variants.reduce(
    (max, v) => Math.max(max, sPrice + (Number(v.extra_price) || 0)),
    sPrice
  );
  const selectedTax = taxOptions.find((t) => t.value === String(taxId));
  const selectedTaxLabel = selectedTax ? selectedTax.label : 'No tax';

  if (loading) {
    return (
      <div className="min-h-[360px] flex items-center justify-center p-12 text-gray-500 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading product details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans pb-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-2">
        <Link to="/products" className="hover:text-blue-600 transition">
          Products
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">
          {isEditing ? (name || 'Edit Product') : 'New Product'}
        </span>
      </div>

      {/* Page Head */}
      <div className="mb-6">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
          {isEditing ? `Edit Product: ${name || `#${id}`}` : 'Create Product'}
        </h1>
        <p className="text-[14px] text-gray-500 mt-1">
          Define product details, category type, base pricing, default tax, and variant add-ons.
        </p>
      </div>

      {/* Errors if any */}
      {(loadError || taxLoadError || formError) && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800" role="alert">
          {formError || loadError || taxLoadError}
        </div>
      )}

      {/* 2-Column SaaS Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols): Main Form Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-5">
              <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                Product Details
              </h2>

              <div>
                <label htmlFor="product-form-name" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="product-form-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Analytics Pack"
                  disabled={!isAdmin || saving}
                  required
                  className={`w-full h-11 px-3.5 bg-white border ${
                    errors.name ? 'border-red-400' : 'border-[#CBD5E1]'
                  } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                />
                {errors.name && <p className="text-[12px] text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-form-type" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Product Type
                  </label>
                  <select
                    id="product-form-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={!isAdmin || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  >
                    <option value="SERVICE">SERVICE (Recurring / Consulting)</option>
                    <option value="GOODS">GOODS (Physical / Hardware)</option>
                    <option value="ADDON">ADDON (Feature Plugin)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="product-form-tax" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Default Tax
                  </label>
                  <select
                    id="product-form-tax"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    disabled={!isAdmin || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  >
                    {taxOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-form-sales-price" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Sales Price ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="product-form-sales-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salesPrice}
                    onChange={(e) => {
                      setSalesPrice(e.target.value);
                      if (errors.salesPrice) setErrors((prev) => ({ ...prev, salesPrice: null }));
                    }}
                    placeholder="1800"
                    disabled={!isAdmin || saving}
                    required
                    className={`w-full h-11 px-3.5 bg-white border ${
                      errors.salesPrice ? 'border-red-400' : 'border-[#CBD5E1]'
                    } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition`}
                  />
                  {errors.salesPrice && <p className="text-[12px] text-red-600 mt-1">{errors.salesPrice}</p>}
                </div>

                <div>
                  <label htmlFor="product-form-cost-price" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                    Cost Price ($)
                  </label>
                  <input
                    id="product-form-cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="300"
                    disabled={!isAdmin || saving}
                    className="w-full h-11 px-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="pt-1 flex items-center gap-3">
                <input
                  id="product-form-is-active"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!isAdmin || saving}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="product-form-is-active" className="cursor-pointer select-none">
                  <span className="block text-[13px] font-semibold text-gray-900">Active</span>
                  <span className="block text-[11px] text-gray-500">Product is available for subscription orders and quotation templates</span>
                </label>
              </div>
            </div>

            {/* Internal Notes & Description Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
              <h2 className="text-[15px] font-bold text-gray-900 border-b border-[#EEF2F7] pb-3">
                Internal Notes & Description
              </h2>
              <div>
                <label htmlFor="product-form-notes" className="block text-[13px] font-semibold text-gray-700 mb-1.5">
                  Technical Specs or Delivery Terms
                </label>
                <textarea
                  id="product-form-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Technical specs, service level agreements, or delivery requirements..."
                  disabled={!isAdmin || saving}
                  className="w-full p-3.5 bg-white border border-[#CBD5E1] rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Variants & Computed Pricing Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEF2F7] pb-3">
                <div>
                  <h2 className="text-[15px] font-bold text-gray-900">Variants & Computed Pricing</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    Variants modify the base sales price. Final price = Base ({formatMoney(sPrice)}) + Surcharge.
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenAddVariant}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl transition shadow-sm"
                  >
                    + Add Variant
                  </button>
                )}
              </div>

              {variants.length === 0 ? (
                <div className="text-center py-10 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl text-gray-400 text-sm">
                  No variants configured. Click &quot;+ Add Variant&quot; to configure options like Edition, Capacity, or Brand.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                        <th className="py-2.5 px-4">Attribute</th>
                        <th className="py-2.5 px-4">Option Value</th>
                        <th className="py-2.5 px-4">Extra Price</th>
                        <th className="py-2.5 px-4">Final Price</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700 bg-white">
                      {variants.map((v, idx) => {
                        const extra = Number(v.extra_price) || 0;
                        const final = sPrice + extra;

                        return (
                          <tr key={v.id || idx} className="hover:bg-[#F6F9FF] transition">
                            <td className="py-3 px-4 font-semibold text-gray-900">{v.attribute_name}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {v.value}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-emerald-600 font-medium">+{formatMoney(extra)}</td>
                            <td className="py-3 px-4 font-bold text-blue-600">{formatMoney(final)}</td>
                            <td className="py-3 px-4 text-right">
                              {isAdmin && (
                                <div className="inline-flex items-center gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditVariant(v, idx)}
                                    className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 border border-[#CBD5E1] rounded-lg transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveVariant(idx)}
                                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#EEF2F7]">
              <button
                type="button"
                onClick={() => navigate('/products')}
                disabled={saving}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-[#DCE3EE] text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[14px] transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              )}
            </div>
          </div>

          {/* Right Column (1 Col): Live Pricing Summary & Action Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Live Pricing Summary Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-1">Pricing Summary</h3>
              <p className="text-[12px] text-gray-400 mb-4">Live margin & catalog breakdown</p>

              <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Base Sales Price
                </span>
                <div className="text-[28px] font-bold text-blue-900 mt-0.5 leading-tight">
                  {formatMoney(sPrice)}
                </div>
                <div className="flex items-center justify-between text-[12px] text-blue-700 mt-1 pt-1 border-t border-blue-200">
                  <span>Gross Margin:</span>
                  <span className="font-bold">{formatMoney(margin)} ({marginPercent}%)</span>
                </div>
              </div>

              <div className="space-y-3 text-[13px] border-b border-[#EEF2F7] pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Product Type</span>
                  <span className="font-semibold text-gray-800">{type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost Price</span>
                  <span className="font-semibold text-gray-800">{formatMoney(cPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Default Tax</span>
                  <span className="font-semibold text-gray-800">{selectedTaxLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Variants</span>
                  <span className="font-semibold text-gray-800">{variants.length} configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Highest Final Price</span>
                  <span className="font-bold text-blue-600">{formatMoney(highestFinalPrice)}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500">Status</span>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {isAdmin && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-[13px] transition shadow-sm disabled:opacity-50 text-center"
                  >
                    {saving ? 'Saving...' : 'Save Product'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  disabled={saving}
                  className="w-full py-2 px-4 rounded-xl border border-[#DCE3EE] text-gray-600 hover:bg-gray-50 font-semibold text-[13px] transition text-center"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Catalog Guidelines Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
              <h3 className="text-[14px] font-bold text-gray-900 mb-2">Catalog Guidelines</h3>
              <ul className="space-y-2.5 text-[12px] text-gray-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Service vs Goods:</strong> Services are billed recurringly or delivered as consulting hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Variant Add-ons:</strong> Add options (Brand, Memory, Edition) with positive surcharges added to base price.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Taxes:</strong> Configured default tax rate applies automatically in quotation and invoice generators.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>

      {/* Variant Modal */}
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
