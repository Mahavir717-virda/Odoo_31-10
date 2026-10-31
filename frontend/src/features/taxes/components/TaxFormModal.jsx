import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import { extractValidationErrors } from '../../../api/errorHelper';

export default function TaxFormModal({ open, onClose, onSubmit, tax = null }) {
  const [name, setName] = useState('');
  const [ratePercent, setRatePercent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tax) {
      setName(tax.name || '');
      setRatePercent(tax.rate_percent !== undefined ? String(tax.rate_percent) : '');
      setIsActive(tax.is_active !== undefined ? Boolean(tax.is_active) : true);
    } else {
      setName('');
      setRatePercent('');
      setIsActive(true);
    }
    setErrors({});
  }, [tax, open]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Tax name is required.';
    }
    const rate = Number(ratePercent);
    if (ratePercent === '' || Number.isNaN(rate)) {
      errs.rate_percent = 'Valid tax rate is required.';
    } else if (rate < 0 || rate > 100) {
      errs.rate_percent = 'Tax rate must be between 0% and 100%.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        rate_percent: Number(ratePercent),
        is_active: isActive,
      });
    } catch (err) {
      const { fieldErrors, generalMessage } = extractValidationErrors(err);
      setErrors({ ...fieldErrors, form: generalMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tax ? 'Edit Tax Rate' : 'Add New Tax Rate'}
    >
      {errors.form && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="tax-name"
          label="Tax Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          placeholder="e.g. GST 18%"
          error={Boolean(errors.name)}
          errorMessage={errors.name}
          required
          disabled={submitting}
        />

        <Input
          id="tax-rate-percent"
          label="Rate (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={ratePercent}
          onChange={(e) => {
            setRatePercent(e.target.value);
            if (errors.rate_percent) setErrors((prev) => ({ ...prev, rate_percent: null }));
          }}
          placeholder="18.00"
          error={Boolean(errors.rate_percent)}
          errorMessage={errors.rate_percent}
          required
          disabled={submitting}
        />

        <div className="pt-2">
          <Checkbox
            id="tax-is-active"
            label="Tax is active and available for product assignments"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={submitting}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {tax ? 'Save Changes' : 'Create Tax Rate'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
