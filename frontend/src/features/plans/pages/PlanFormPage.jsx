import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import { extractValidationErrors } from '../../../api/errorHelper';
import { getPlanById, createPlan, updatePlan } from '../api';

export default function PlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Warn on page leave if unsaved changes exist
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

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

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
            setIsDirty(false);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Plan name is required.';
    if (price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      errs.price = 'Price must be a valid non-negative number.';
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
        toast({
          title: 'Plan Updated',
          description: `Plan "${payload.name}" updated successfully.`,
          variant: 'success',
        });
      } else {
        await createPlan(payload);
        toast({
          title: 'Plan Created',
          description: `Plan "${payload.name}" created successfully.`,
          variant: 'success',
        });
      }
      setIsDirty(false);
      navigate('/plans');
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
      navigate('/plans');
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
        title={isEditing ? `Edit Plan: ${name}` : 'Create Subscription Plan'}
        description="Define recurring billing frequency, pricing tiers, validity dates, and lifecycle flags."
        breadcrumbs={[
          { label: 'Plans', href: '/plans' },
          { label: isEditing ? 'Edit' : 'New' },
        ]}
      />

      {isDirty && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <span>You have unsaved changes in this plan form.</span>
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
          {/* General Plan Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              General Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="plan-name"
                  label="Plan Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="e.g. Professional Annual"
                  required
                  error={Boolean(errors.name)}
                  errorMessage={errors.name}
                  disabled={saving}
                />
              </div>

              <div>
                <Select
                  id="plan-status"
                  label="Status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    markDirty();
                  }}
                  disabled={saving}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'PAUSED', label: 'Paused' },
                    { value: 'CLOSED', label: 'Closed' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Pricing & Term */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Pricing & Cadence
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Input
                  id="plan-price"
                  label="Price ($)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    markDirty();
                    if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                  }}
                  placeholder="99.00"
                  required
                  error={Boolean(errors.price)}
                  errorMessage={errors.price}
                  disabled={saving}
                />
              </div>

              <div>
                <Select
                  id="plan-billing-period"
                  label="Billing Cadence"
                  value={billingPeriod}
                  onChange={(e) => {
                    setBillingPeriod(e.target.value);
                    markDirty();
                  }}
                  disabled={saving}
                  options={[
                    { value: 'WEEKLY', label: 'Weekly' },
                    { value: 'MONTHLY', label: 'Monthly' },
                    { value: 'YEARLY', label: 'Yearly' },
                  ]}
                />
              </div>

              <div>
                <Input
                  id="plan-min-quantity"
                  label="Minimum Quantity"
                  type="number"
                  min="1"
                  value={minQuantity}
                  onChange={(e) => {
                    setMinQuantity(e.target.value);
                    markDirty();
                    if (errors.minQuantity) setErrors((prev) => ({ ...prev, minQuantity: null }));
                  }}
                  placeholder="1"
                  required
                  error={Boolean(errors.minQuantity)}
                  errorMessage={errors.minQuantity}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Validity Dates */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Validity Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  id="plan-start-date"
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    markDirty();
                    if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: null }));
                  }}
                  required
                  error={Boolean(errors.startDate)}
                  errorMessage={errors.startDate}
                  disabled={saving}
                />
              </div>

              <div>
                <Input
                  id="plan-end-date"
                  label="End Date (Optional)"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    markDirty();
                    if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                  }}
                  error={Boolean(errors.endDate)}
                  errorMessage={errors.endDate}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Lifecycle Capabilities */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
              Lifecycle Settings & Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <Checkbox
                id="plan-closable"
                label="Closable (Admins can permanently close this plan)"
                checked={closable}
                onChange={(e) => {
                  setClosable(e.target.checked);
                  markDirty();
                }}
                disabled={saving}
              />

              <Checkbox
                id="plan-pausable"
                label="Pausable (Plan can be temporarily paused and resumed)"
                checked={pausable}
                onChange={(e) => {
                  setPausable(e.target.checked);
                  markDirty();
                }}
                disabled={saving}
              />

              <Checkbox
                id="plan-renewable"
                label="Renewable (Subscriptions on this plan can renew)"
                checked={renewable}
                onChange={(e) => {
                  setRenewable(e.target.checked);
                  markDirty();
                }}
                disabled={saving}
              />

              <Checkbox
                id="plan-auto-close"
                label="Auto-Close (Automatically closes after end date passes)"
                checked={autoClose}
                onChange={(e) => {
                  setAutoClose(e.target.checked);
                  markDirty();
                }}
                disabled={saving}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {isEditing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={showDiscardDialog}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this plan. If you leave now, your changes will be discarded."
        confirmLabel="Discard & Leave"
        confirmVariant="danger"
        onConfirm={() => {
          setShowDiscardDialog(false);
          setIsDirty(false);
          navigate('/plans');
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </div>
  );
}
