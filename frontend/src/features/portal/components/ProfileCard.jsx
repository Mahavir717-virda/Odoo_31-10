export default function ProfileCard({ user }) {
  const initials = (user?.name || '')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-lg">
          {initials || '?'}
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{user?.name || 'Customer'}</h2>
          <p className="text-sm text-gray-500">{user?.email || '-'}</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold text-gray-500 uppercase">Member Since</dt>
          <dd className="text-gray-900">{user?.member_since || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-gray-500 uppercase">Plan</dt>
          <dd className="text-gray-900">{user?.plan || '-'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-gray-500 uppercase">Customer ID</dt>
          <dd className="text-gray-900 truncate">{user?.id || '-'}</dd>
        </div>
      </dl>
    </div>
  );
}
