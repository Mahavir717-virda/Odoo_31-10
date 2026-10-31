import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isPasswordValid } from '../../../utils/passwordRules';
import AuthCard from '../components/AuthCard';
import PasswordChecklist from '../components/PasswordChecklist';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { extractValidationErrors } from '../../../api/errorHelper';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!email.includes('@')) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (!isPasswordValid(password)) {
      errs.password = 'Password does not satisfy the security requirements below.';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ name, email, company, phone, password });
      toast({
        title: 'Account Created',
        description: 'Welcome to the customer portal!',
        variant: 'success',
      });
      navigate('/portal', { replace: true });
    } catch (err) {
      const { fieldErrors: serverFieldErrors, generalMessage } = extractValidationErrors(err);
      setFieldErrors(serverFieldErrors);
      setFormError(generalMessage || 'Failed to create account.');
      toast({
        title: 'Registration Failed',
        description: generalMessage || 'Please review the form errors.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your customer account"
      subtitle="Start managing your subscriptions today."
      footer={
        <p className="text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      }
    >
      {formError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
          }}
          placeholder="e.g. Jane Doe"
          required
          disabled={loading}
          error={Boolean(fieldErrors.name)}
          errorMessage={fieldErrors.name}
        />

        <Input
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="jane@example.com"
          required
          disabled={loading}
          error={Boolean(fieldErrors.email)}
          errorMessage={fieldErrors.email}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="company"
            label="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
            disabled={loading}
          />

          <Input
            id="phone"
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555-0199"
            disabled={loading}
          />
        </div>

        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="••••••••"
            required
            disabled={loading}
            error={Boolean(fieldErrors.password)}
            errorMessage={fieldErrors.password}
          />
          <div className="mt-2">
            <PasswordChecklist password={password} />
          </div>
        </div>

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
          }}
          placeholder="••••••••"
          required
          disabled={loading}
          error={Boolean(fieldErrors.confirmPassword)}
          errorMessage={fieldErrors.confirmPassword}
        />

        <Button type="submit" variant="primary" loading={loading} className="w-full mt-4">
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}
