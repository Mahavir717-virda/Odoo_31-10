import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { extractValidationErrors } from '../../../api/errorHelper';
import { forgotPassword } from '../api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { toast } = useToast();

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!email.includes('@')) {
      errs.email = 'Please enter a valid email address.';
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
      await forgotPassword(email.trim());
      setSuccess(true);
      toast({
        title: 'Instructions Sent',
        description: 'Password reset link has been dispatched to your email.',
        variant: 'success',
      });
    } catch (err) {
      const { fieldErrors: serverErrors, generalMessage } = extractValidationErrors(err);
      setFieldErrors(serverErrors);
      setError(generalMessage || 'Failed to request password reset link.');
      toast({
        title: 'Request Failed',
        description: generalMessage || 'Please verify your email address.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="No worries, we'll send you reset instructions."
      footer={
        <Link to="/login" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
          ← Back to sign in
        </Link>
      }
    >
      {success ? (
        <div className="text-center py-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
          <p className="mt-1 text-sm text-gray-600">
            We have sent password reset instructions to <span className="font-medium text-gray-900">{email}</span>.
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
            }}
            placeholder="user@example.com"
            required
            disabled={loading}
            error={Boolean(fieldErrors.email)}
            errorMessage={fieldErrors.email}
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
