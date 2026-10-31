import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Checkbox from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

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
    if (!email.trim() || !email.includes('@')) {
      errs.email = 'A valid email address is required.';
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
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={staff ? 'Edit Staff Member' : 'Add New Staff Member'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="staff-modal-name"
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
          }}
          placeholder="e.g. David Kim"
          error={Boolean(errors.name)}
          errorMessage={errors.name}
          required
        />

        <Input
          id="staff-modal-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="david.kim@brightloop.test"
          error={Boolean(errors.email)}
          errorMessage={errors.email}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            id="staff-modal-role"
            label="Role Permission"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'STAFF', label: 'Staff (Standard Ops)' },
              { value: 'ADMIN', label: 'Admin (Full Access)' },
            ]}
          />

          <Input
            id="staff-modal-phone"
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1-555-0150"
          />
        </div>

        <Input
          id="staff-modal-company"
          label="Department / Unit"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Brightloop Operations"
        />

        <div className="pt-1">
          <Checkbox
            id="staff-modal-is-active"
            label="Active account (can log into the system)"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {staff ? 'Save Changes' : 'Add Staff Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

