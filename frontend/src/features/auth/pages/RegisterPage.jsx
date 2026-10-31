import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isPasswordValid } from '../../../utils/passwordRules';
import AuthCard from '../components/AuthCard';
import PasswordChecklist from '../components/PasswordChecklist';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid(password)) {
      setError('Password does not satisfy the security requirements.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, company, phone, password });
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to create account.');
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
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          required
        />

        <Input
          id="email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@company.com"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="company"
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
          />
          <Input
            id="phone"
            label="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1-555-0100"
          />
        </div>

        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {password && <PasswordChecklist password={password} />}
        </div>

        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}
