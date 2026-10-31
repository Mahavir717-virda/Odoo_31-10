import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { isPasswordValid } from '../../../utils/passwordRules';

export default function StaffFormModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setCompany('');
    setErrors({});
    setFormError('');
  }, [open]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'A valid email address is required.';
    }
    if (!isPasswordValid(password)) errs.password = 'Password must be at least 9 characters and include an uppercase letter, lowercase letter, and special character.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        company: company.trim(),
      });
      onClose();
    } catch (error) {
      setFormError(error?.message || 'Unable to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Staff Member"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{formError}</p>}
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

        <Input
          id="staff-modal-password"
          label="Temporary Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(errors.password)}
          errorMessage={errors.password}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Add Staff Member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
