import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import Spinner from '../components/ui/Spinner';

export default function RoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === USER_ROLES.customer) {
    return <Navigate to="/portal" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

