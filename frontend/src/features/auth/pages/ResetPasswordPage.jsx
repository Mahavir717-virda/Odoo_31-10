import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isPasswordValid } from '../../../utils/passwordRules';
import AuthCard from '../components/AuthCard';
import PasswordChecklist from '../components/PasswordChecklist';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { extractValidationErrors } from '../../../api/errorHelper';
import { resetPassword } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!password) {
      errs.password = 'New password is required.';
    } else if (!isPasswordValid(password)) {
      errs.password = 'Password does not satisfy the security requirements.';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await resetPassword({ token, newPassword: password });
      toast({
        title: 'Password Updated',
        description: 'You can now sign in with your new credentials.',
        variant: 'success',
      });
      navigate('/login', { replace: true });
    } catch (err) {
      const { fieldErrors: serverErrors, generalMessage } = extractValidationErrors(err);
      setFieldErrors(serverErrors);
      setError(generalMessage || 'Failed to reset password.');
      toast({
        title: 'Reset Failed',
        description: generalMessage || 'Please verify the token and try again.',
        variant: 'danger',
      });
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
          label="Confirm new password"
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
          Reset Password
        </Button>
      </form>
    </AuthCard>
  );
}
