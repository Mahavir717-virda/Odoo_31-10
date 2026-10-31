import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isPasswordValid } from '../../../utils/passwordRules';
import AuthCard from '../components/AuthCard';
import PasswordChecklist from '../components/PasswordChecklist';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { resetPassword } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid(password)) {
      setError('Password does not satisfy security requirements');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Set new password"
      subtitle="Your new password must be different from previous passwords."
      footer={
        <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
          ← Back to sign in
        </Link>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            id="password"
            label="New password"
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
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Reset Password
        </Button>
      </form>
    </AuthCard>
  );
}
