export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  expired: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
  partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  refunded: 'bg-purple-100 text-purple-800 border-purple-200',
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function getStatusColor(status) {
  return STATUS_COLORS[status] ?? STATUS_COLORS.default;
}
