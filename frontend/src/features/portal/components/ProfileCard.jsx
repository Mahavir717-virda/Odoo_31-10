import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

export default function ProfileCard({ user: propUser = null, onEdit = null, className = '' }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  if (!user) {
    return null;
  }

  const role = user.role ? String(user.role).toUpperCase() : 'CUSTOMER';
  const initial = (user.name || user.email || 'C').charAt(0).toUpperCase();

  return (
    <Card className={`p-6 bg-white border border-gray-200 shadow-sm rounded-xl ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-md flex-shrink-0">
          {initial}
        </div>

        {/* User Info Details */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              {user.name || 'Valued Customer'}
            </h3>
            <div>
              <Badge
                variant={
                  role === 'ADMIN' ? 'danger' : role === 'STAFF' ? 'primary' : 'success'
                }
              >
                {role}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4 mt-3 text-sm text-gray-600">
            <div>
              <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">
                Email Address
              </span>
              <span className="font-medium text-gray-800 break-all">{user.email || '—'}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">
                Company
              </span>
              <span className="font-medium text-gray-800">{user.company || '—'}</span>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">
                Phone Number
              </span>
              <span className="font-medium text-gray-800">{user.phone || '—'}</span>
            </div>

            {user.address && (
              <div className="sm:col-span-2 md:col-span-3">
                <span className="text-xs font-medium text-gray-400 block uppercase tracking-wider">
                  Address
                </span>
                <span className="font-medium text-gray-800">{user.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Optional Action Button */}
        {onEdit && (
          <div className="flex-shrink-0 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
