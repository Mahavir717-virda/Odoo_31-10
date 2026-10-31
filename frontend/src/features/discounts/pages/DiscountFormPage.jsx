import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getDiscountById, createDiscount, updateDiscount } from '../api';

export default function DiscountFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [status, setStatus] = useState('active');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getDiscountById(id)
        .then((discount) => {
          if (discount) {
            setName(discount.name || '');
            setCode(discount.code || '');
            setDiscountType(discount.discount_type || 'percentage');
            setValue(discount.value || '');
            setMaxUses(discount.max_uses || '');
            setValidUntil(discount.valid_until || '');
            setStatus(discount.status || 'active');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      code,
      discount_type: discountType,
      value: Number(value) || 0,
      max_uses: Number(maxUses) || 0,
      valid_until: validUntil || null,
      status,
    };
    try {
      if (isEditing) {
        await updateDiscount(id, payload);
      } else {
        await createDiscount(payload);
      }
      navigate('/discounts');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Discount' : 'Create New Discount'}
        breadcrumbs={[
          { label: 'Discounts', href: '/discounts' },
          { label: isEditing ? 'Edit' : 'New' },
        ]}
      />

      <Card className="max-w-3xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="discount-name"
            label="Promotion / Campaign Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Promo 2026"
            required
            disabled={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="discount-code"
              label="Coupon Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER20"
              required
              disabled={loading}
            />

            <Select
              id="discount-type"
              label="Discount Type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed Amount ($)' },
              ]}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="discount-value"
              label={discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount ($)'}
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === 'percentage' ? '20' : '50.00'}
              required
              disabled={loading}
            />

            <Input
              id="discount-max-uses"
              label="Max Usage Limit (0 for unlimited)"
              type="number"
              min="0"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="100"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="discount-valid-until"
              label="Expiration Date"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              disabled={loading}
            />

            <Select
              id="discount-status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'expired', label: 'Expired' },
                { value: 'disabled', label: 'Disabled' },
              ]}
              disabled={loading}
            />
          </div>

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

