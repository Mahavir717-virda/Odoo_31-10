import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMockEnabled } from '../api/mockHelper';
import { USER_ROLES } from '../utils/constants';
import Button from '../components/ui/Button';

export default function Forbidden() {
  const { user, switchMockRole } = useAuth();
  const mockActive = isMockEnabled();

  const homePath = user?.role === USER_ROLES.customer ? '/portal' : '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2m12 0H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">403</h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-800">Access Denied</h2>
        <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
          You do not have sufficient permissions to view this resource with your current role{' '}
          <span className="font-semibold text-gray-800">({user?.role || 'Guest'})</span>.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link to={homePath}>
            <Button variant="primary">Return to Home</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Sign In As Different User</Button>
          </Link>
        </div>

        {mockActive && (
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm max-w-sm mx-auto">
            <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
              Mock Role Quick Switch
            </p>
            <div className="flex justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => switchMockRole(USER_ROLES.admin)}>
                Admin
              </Button>
              <Button size="sm" variant="outline" onClick={() => switchMockRole(USER_ROLES.staff)}>
                Staff
              </Button>
              <Button size="sm" variant="outline" onClick={() => switchMockRole(USER_ROLES.customer)}>
                Customer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

