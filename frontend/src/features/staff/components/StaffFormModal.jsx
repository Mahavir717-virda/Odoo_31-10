import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';
import { extractValidationErrors } from '../../../api/errorHelper';

export default function StaffFormModal({ open, onClose, onSubmit, staff = null }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setEmail(staff.email || '');
      setRole(staff.role ? String(staff.role).toUpperCase() : 'STAFF');
      setPhone(staff.phone || '');
      setCompany(staff.company || '');
      setIsActive(staff.is_active !== undefined ? Boolean(staff.is_active) : true);
    } else {
      setName('');
      setEmail('');
      setRole('STAFF');
      setPhone('');
      setCompany('Brightloop Operations');
      setIsActive(true);
    }
    setErrors({});
  }, [staff, open]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Full name is required.';
    }
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!email.includes('@')) {
      errs.email = 'Please enter a valid email address.';
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
        email: email.trim(),
        role,
        phone: phone.trim(),
        company: company.trim(),
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
      title={staff ? 'Edit Staff Member' : 'Add Staff Member'}
    >
      {errors.form && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="staff-name"
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          placeholder="e.g. John Smith"
          required
          disabled={submitting}
          error={Boolean(errors.name)}
          errorMessage={errors.name}
        />

        <Input
          id="staff-email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="john.smith@brightloop.test"
          required
          disabled={submitting || Boolean(staff)}
          error={Boolean(errors.email)}
          errorMessage={errors.email}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="staff-role"
            label="System Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'STAFF', label: 'Staff Member (Operator)' },
              { value: 'ADMIN', label: 'Administrator (Full Access)' },
            ]}
            disabled={submitting}
          />

          <Input
            id="staff-phone"
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-0155"
            disabled={submitting}
          />
        </div>

        <Input
          id="staff-company"
          label="Department / Unit"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Customer Success, Operations, etc."
          disabled={submitting}
        />

        <div className="pt-2">
          <Checkbox
            id="staff-is-active"
            label="Account Active (User can authenticate and perform tasks)"
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
            {staff ? 'Save Changes' : 'Create Staff'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
