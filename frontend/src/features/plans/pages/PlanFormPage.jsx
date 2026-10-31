import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { getPlanById, createPlan, updatePlan } from '../api';

export default function PlanFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [billingInterval, setBillingInterval] = useState('month');
  const [intervalCount, setIntervalCount] = useState(1);
  const [price, setPrice] = useState('');
  const [trialDays, setTrialDays] = useState(0);
  const [status, setStatus] = useState('active');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      getPlanById(id)
        .then((plan) => {
          if (plan) {
            setName(plan.name || '');
            setCode(plan.code || '');
            setBillingInterval(plan.billing_interval || 'month');
            setIntervalCount(plan.interval_count || 1);
            setPrice(plan.price || '');
            setTrialDays(plan.trial_days || 0);
            setStatus(plan.status || 'active');
            setDescription(plan.description || '');
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
      billing_interval: billingInterval,
      interval_count: Number(intervalCount) || 1,
      price: Number(price) || 0,
      trial_days: Number(trialDays) || 0,
      status,
      description,
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

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Plan' : 'Create New Plan'}
        breadcrumbs={[
          { label: 'Plans', href: '/plans' },
          { label: isEditing ? 'Edit' : 'New' },
        ]}
      />

      <Card className="max-w-3xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="plan-name"
            label="Plan Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Growth Pro"
            required
            disabled={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="plan-code"
              label="Plan Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PLAN-GROWTH"
              required
              disabled={loading}
            />

            <Input
              id="plan-price"
              label="Recurring Price ($)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="49.00"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="plan-interval"
              label="Billing Interval"
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value)}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' },
              ]}
              disabled={loading}
            />

            <Input
              id="plan-interval-count"
              label="Interval Frequency"
              type="number"
              min="1"
              value={intervalCount}
              onChange={(e) => setIntervalCount(e.target.value)}
              placeholder="1"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="plan-trial"
              label="Trial Days"
              type="number"
              min="0"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              placeholder="0"
              disabled={loading}
            />

            <Select
              id="plan-status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'archived', label: 'Archived' },
              ]}
              disabled={loading}
            />
          </div>

          <Textarea
            id="plan-description"
            label="Plan Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about what is included in this plan..."
            rows={3}
            disabled={loading}
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <Link to="/plans">
              <Button variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" loading={saving}>
              {isEditing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

