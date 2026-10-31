import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { USER_ROLES } from '../../../utils/constants';

export default function StaffFormModal({ open, onClose, onSubmit, staff = null }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(USER_ROLES.staff);
  const [status, setStatus] = useState('active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setEmail(staff.email || '');
      setRole(staff.role || USER_ROLES.staff);
      setStatus(staff.status || 'active');
    } else {
      setName('');
      setEmail('');
      setRole(USER_ROLES.staff);
      setStatus('active');
    }
  }, [staff, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ name, email, role, status });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={staff ? 'Edit Staff Member' : 'Invite Staff Member'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="staff-name"
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          required
        />
        <Input
          id="staff-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@company.com"
          required
        />
        <Select
          id="staff-role"
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[
            { value: USER_ROLES.staff, label: 'Staff' },
            { value: USER_ROLES.admin, label: 'Admin' },
          ]}
        />
        <Select
          id="staff-status"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {staff ? 'Save Changes' : 'Invite Staff'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

