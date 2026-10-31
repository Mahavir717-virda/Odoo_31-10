import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import Button from '../components/ui/Button';

export default function NotFound() {
  const { user, isAuthenticated } = useAuth();
  const homePath = !isAuthenticated
    ? '/login'
    : user?.role === USER_ROLES.customer
    ? '/portal'
    : '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-800">Page Not Found</h2>
        <p className="mt-2 text-sm text-gray-600">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="mt-6 flex justify-center">
          <Link to={homePath}>
            <Button variant="primary">Back to Safety</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

