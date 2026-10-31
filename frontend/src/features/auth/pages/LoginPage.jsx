import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isMockEnabled } from '../../../api/mockHelper';
import AuthCard from '../components/AuthCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { extractValidationErrors } from '../../../api/errorHelper';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const mockActive = isMockEnabled();

  const [email, setEmail] = useState('admin@brightloop.test');
  const [password, setPassword] = useState('Admin@1234');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const redirectAfterLogin = (user) => {
    const from = location.state?.from?.pathname;
    const userRole = String(user?.role || '').toUpperCase();
    toast({
      title: 'Welcome back!',
      description: `Signed in as ${user?.name || user?.email || 'User'}.`,
      variant: 'success',
    });

    if (from && !from.startsWith('/login') && !from.startsWith('/forbidden')) {
      navigate(from, { replace: true });
    } else if (userRole === 'CUSTOMER') {
      navigate('/portal', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!email.includes('@')) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
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
      const { user } = await login({ email, password });
      redirectAfterLogin(user);
    } catch (err) {
      const { fieldErrors: serverFieldErrors, generalMessage } = extractValidationErrors(err);
      setFieldErrors(serverFieldErrors);
      setFormError(generalMessage || 'Failed to sign in. Please verify your credentials.');
      toast({
        title: 'Sign In Failed',
        description: generalMessage || 'Invalid email or password.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMockLogin = async (mockEmail, mockPassword, role) => {
    setEmail(mockEmail);
    setPassword(mockPassword);
    setFormError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const { user } = await login({ email: mockEmail, password: mockPassword, role });
      redirectAfterLogin(user);
    } catch (err) {
      const { generalMessage } = extractValidationErrors(err);
      setFormError(generalMessage || 'Quick login failed.');
      toast({
        title: 'Quick Login Failed',
        description: generalMessage,
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Brightloop Subscription Management System"
      footer={
        <p className="text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign up
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
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="user@brightloop.test"
          required
          disabled={loading}
          error={Boolean(fieldErrors.email)}
          errorMessage={fieldErrors.email}
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
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
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
          Sign In
        </Button>
      </form>

      {/* Mock Quick Sign-in Section */}
      {mockActive && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
            Quick Sign-In (Mock Development)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickMockLogin('admin@brightloop.test', 'Admin@1234', 'admin')}
              className="text-xs text-red-700 border-red-200 hover:bg-red-50"
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickMockLogin('staff@brightloop.test', 'Staff@1234', 'staff')}
              className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
            >
              Staff
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleQuickMockLogin('customer1@acme.test', 'Cust@1234', 'customer')}
              className="text-xs text-green-700 border-green-200 hover:bg-green-50"
            >
              Customer
            </Button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
