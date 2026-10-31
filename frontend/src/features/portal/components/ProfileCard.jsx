import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

export default function ProfileCard({ user: propUser = null, onEdit = null }) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  if (!user) {
    return null;
  }

  return (
    <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        {/* User Details */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
            {user.role && (
              <div>
                <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'staff' ? 'primary' : 'success'}>
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
          {user.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
          {user.company && (
            <p className="text-xs font-medium text-gray-600 mt-1">
              Company: <span className="text-gray-800">{user.company}</span>
            </p>
          )}
        </div>

        {/* Action */}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit Profile
          </Button>
        )}
      </div>
    </Card>
  );
}
