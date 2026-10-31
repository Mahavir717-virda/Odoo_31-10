import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isMockEnabled } from '../api/mockHelper';
import { USER_ROLES } from '../utils/constants';
import Button from '../components/ui/Button';

export default function Forbidden() {
  const { user, switchMockRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mockActive = isMockEnabled();

  const userRole = String(user?.role || '').toLowerCase();
  const homePath = userRole === USER_ROLES.customer ? '/portal' : '/dashboard';
  const attemptedFrom = location.state?.from?.pathname || location.state?.attemptedPath;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4 shadow-xs">
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
        <h2 className="mt-2 text-xl font-semibold text-gray-800">Access Restricted</h2>
        <p className="mt-2 text-sm text-gray-600 max-w-sm mx-auto">
          You do not have administrative authorization to access this feature with your current role{' '}
          <span className="font-semibold text-gray-900 uppercase">
            ({user?.role || 'Guest'})
          </span>
          .
        </p>

        {attemptedFrom && (
          <p className="mt-2 text-xs text-gray-400 font-mono">
            Attempted resource: {attemptedFrom}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
          <Link to={homePath}>
            <Button variant="primary">Return to Home</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Sign In As Different User</Button>
          </Link>
        </div>

        {mockActive && (
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm max-w-sm mx-auto text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Mock Role Quick Switch
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-medium px-1.5 py-0.5 rounded">
                Dev Mode
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Switch role instantly to test role-gated pages:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => switchMockRole('admin')}>
                Admin
              </Button>
              <Button size="sm" variant="outline" onClick={() => switchMockRole('staff')}>
                Staff
              </Button>
              <Button size="sm" variant="outline" onClick={() => switchMockRole('customer')}>
                Customer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
