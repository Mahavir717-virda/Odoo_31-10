import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import VariantsTable from '../components/VariantsTable';
import { getProductById, createProduct, updateProduct } from '../api';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Hosting');
  const [status, setStatus] = useState('active');
  const [variants, setVariants] = useState([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getProductById(id)
        .then((product) => {
          if (product) {
            setName(product.name || '');
            setSku(product.sku || '');
            setPrice(product.price || '');
            setCategory(product.category || 'Hosting');
            setStatus(product.status || 'active');
            setVariants(product.variants || []);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleAddVariant = (e) => {
    e.preventDefault();
    if (!newVariantName) return;
    setVariants((prev) => [
      ...prev,
      { id: Date.now(), name: newVariantName, price: Number(newVariantPrice) || Number(price) || 0 },
    ]);
    setNewVariantName('');
    setNewVariantPrice('');
  };

  const handleRemoveVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      sku,
      price: Number(price) || 0,
      category,
      status,
      variants,
    };
    try {
      if (isEditing) {
        await updateProduct(id, payload);
      } else {
        await createProduct(payload);
      }
      navigate('/products');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Product' : 'Create New Product'}
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: isEditing ? 'Edit' : 'New' },
        ]}
      />

      <Card className="max-w-3xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="product-name"
            label="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dedicated Server Hosting"
            required
            disabled={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="product-sku"
              label="SKU / Identifier"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. PROD-100"
              required
              disabled={loading}
            />

            <Input
              id="product-price"
              label="Base Price ($)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="29.99"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="product-category"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'Hosting', label: 'Hosting' },
                { value: 'Security', label: 'Security' },
                { value: 'Support', label: 'Support Services' },
                { value: 'Hardware', label: 'Hardware' },
              ]}
              disabled={loading}
            />

            <Select
              id="product-status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              disabled={loading}
            />
          </div>

          {/* Variants Section */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Product Variants</h3>
            <VariantsTable variants={variants} onRemove={handleRemoveVariant} />

            <div className="mt-3 flex flex-col sm:flex-row gap-2 items-end">
              <div className="flex-1">
                <Input
                  id="variant-name"
                  label="Variant Name"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  placeholder="e.g. 16GB RAM Add-on"
                  className="mb-0"
                />
              </div>
              <div className="w-32">
                <Input
                  id="variant-price"
                  label="Price ($)"
                  type="number"
                  step="0.01"
                  value={newVariantPrice}
                  onChange={(e) => setNewVariantPrice(e.target.value)}
                  placeholder="10.00"
                  className="mb-0"
                />
              </div>
              <Button type="button" variant="outline" onClick={handleAddVariant}>
                Add Variant
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Link to="/products">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={saving}>
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

