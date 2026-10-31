import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import { getPlanById, createPlan, updatePlan } from '../api';

export default function PlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('MONTHLY');
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

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getPlanById(id)
        .then((plan) => {
          if (plan) {
            setName(plan.name || '');
            setPrice(plan.price !== undefined ? String(plan.price) : '');
            setBillingPeriod(plan.billing_period || 'MONTHLY');
            setMinQuantity(plan.min_quantity !== undefined ? String(plan.min_quantity) : '1');
            setStartDate(
              plan.start_date ? plan.start_date.split('T')[0] : new Date().toISOString().split('T')[0]
            );
            setEndDate(plan.end_date ? plan.end_date.split('T')[0] : '');
            setAutoClose(Boolean(plan.auto_close));
            setClosable(plan.closable !== undefined ? Boolean(plan.closable) : true);
            setPausable(Boolean(plan.pausable));
            setRenewable(plan.renewable !== undefined ? Boolean(plan.renewable) : true);
            setStatus(plan.status || 'ACTIVE');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Plan name is required.';
    if (price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      errs.price = 'Price must be a non-negative number.';
    }
    if (!startDate) {
      errs.startDate = 'Start date is required.';
    }
    // Date validation: CHECK (end_date IS NULL OR end_date >= start_date)
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
        title={isEditing ? `Edit Plan: ${name || `#${id}`}` : 'Create New Subscription Plan'}
        description="Configure subscription intervals, prices, minimum orders, and lifecycle flags."
        breadcrumbs={[
          { label: 'Plans', href: '/plans' },
          { label: isEditing ? (name || 'Edit') : 'New' },
        ]}
      />

      <Card className="max-w-3xl bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="plan-form-name"
            label="Plan Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
            }}
            placeholder="e.g. Monthly Standard"
            error={Boolean(errors.name)}
            errorMessage={errors.name}
            required
            disabled={saving}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="plan-form-price"
              label="Recurring Price ($)"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
              }}
              placeholder="999.00"
              error={Boolean(errors.price)}
              errorMessage={errors.price}
              required
              disabled={saving}
            />

            <Select
              id="plan-form-billing-period"
              label="Billing Cycle"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              options={[
                { value: 'DAILY', label: 'DAILY (Every day)' },
                { value: 'WEEKLY', label: 'WEEKLY (Every 7 days)' },
                { value: 'MONTHLY', label: 'MONTHLY (Monthly invoice)' },
                { value: 'YEARLY', label: 'YEARLY (Annual invoice)' },
              ]}
              disabled={saving}
            />

            <Input
              id="plan-form-min-quantity"
              label="Minimum Quantity"
              type="number"
              min="1"
              value={minQuantity}
              onChange={(e) => {
                setMinQuantity(e.target.value);
                if (errors.minQuantity) setErrors((prev) => ({ ...prev, minQuantity: null }));
              }}
              placeholder="1"
              error={Boolean(errors.minQuantity)}
              errorMessage={errors.minQuantity}
              required
              disabled={saving}
            />
          </div>

          {/* Date Validation Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="plan-form-start-date"
              label="Start Date (Available From)"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
              }}
              error={Boolean(errors.startDate)}
              errorMessage={errors.startDate}
              required
              disabled={saving}
            />

            <Input
              id="plan-form-end-date"
              label="End Date (Available Until - Optional)"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
              }}
              error={Boolean(errors.endDate)}
              errorMessage={errors.endDate}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="plan-form-status"
              label="Initial Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'PAUSED', label: 'PAUSED' },
                { value: 'CLOSED', label: 'CLOSED' },
              ]}
              disabled={saving}
            />

            <div className="pt-6">
              <Checkbox
                id="plan-form-auto-close"
                label="Auto-Close: automatically close when end_date arrives"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Lifecycle Flags Section */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Plan Lifecycle Flags & Permissions
            </h4>
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <Checkbox
                id="plan-flag-closable"
                label="Closable: Allows administrators to close the plan early"
                checked={closable}
                onChange={(e) => setClosable(e.target.checked)}
                disabled={saving}
              />
              <Checkbox
                id="plan-flag-pausable"
                label="Pausable: Allows administrators to temporarily pause recurring billing on this plan"
                checked={pausable}
                onChange={(e) => setPausable(e.target.checked)}
                disabled={saving}
              />
              <Checkbox
                id="plan-flag-renewable"
                label="Renewable: Allows renewing the term once expired or closed"
                checked={renewable}
                onChange={(e) => setRenewable(e.target.checked)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Link to="/plans">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={saving}>
              {isEditing ? 'Save Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
