import Card from '../../../components/ui/Card';
import Skeleton from './Skeleton';
import { formatMoney } from '../../../utils/formatMoney';

const CARDS = [
  { key: 'active_subscriptions', label: 'Active Subscriptions', format: (value) => value ?? '-', type: 'number' },
  { key: 'total_revenue', label: 'Total Revenue', format: formatMoney, type: 'money' },
  { key: 'total_payments', label: 'Total Payments', format: formatMoney, type: 'money' },
  { key: 'overdue_invoices', label: 'Overdue Invoices', format: (value) => value ?? '-', type: 'number' },
];

export default function SummaryCards({ data, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} padded={false}>
            <div className="p-6 space-y-4">
              <Skeleton height="14" width="40%" className="mb-2" />
              <Skeleton height="10" width="20%" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
        Error loading summary: {error.message}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => (
        <Card key={card.key}>
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {card.format(data?.[card.key])}
          </p>
        </Card>
      ))}
    </div>
  );
}
