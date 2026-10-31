import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { isMockEnabled } from '../../../api/mockHelper';
import { USER_ROLES } from '../../../utils/constants';
import AuthCard from '../components/AuthCard';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mockActive = isMockEnabled();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectAfterLogin = (user) => {
    const from = location.state?.from?.pathname;
    if (from && !from.startsWith('/login') && !from.startsWith('/forbidden')) {
      navigate(from, { replace: true });
    } else if (user?.role === USER_ROLES.customer) {
      navigate('/portal', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await login({ email, password });
      redirectAfterLogin(user);
    } catch (err) {
      setError(err?.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMockLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const { user } = await login({ email: `${role}@odoo.local`, password: 'Password123!', role });
      redirectAfterLogin(user);
    } catch (err) {
      setError(err?.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Sign in to your account"
      subtitle="Welcome back! Please enter your details."
      footer={
        <p className="text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign up
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
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />

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
          <div className="flex justify-end -mt-2 mb-4">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      {mockActive && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-center mb-3">
            Quick Mock Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickMockLogin(USER_ROLES.admin)}
              disabled={loading}
            >
              Admin
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickMockLogin(USER_ROLES.staff)}
              disabled={loading}
            >
              Staff
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickMockLogin(USER_ROLES.customer)}
              disabled={loading}
            >
              Customer
            </Button>
          </div>
        </div>
      )}
    </AuthCard>
  );
}

