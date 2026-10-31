import Card from '../../../components/ui/Card';
import { formatMoney } from '../../../utils/formatMoney';
import Skeleton from './Skeleton';

const cards = [
  { key: 'active_subscriptions', label: 'Active subscriptions', format: (value) => Number(value ?? 0).toLocaleString() },
  { key: 'revenue_received', label: 'Revenue received', format: formatMoney },
  { key: 'outstanding', label: 'Outstanding', format: formatMoney },
  { key: 'overdue_amount', label: 'Overdue', format: formatMoney },
];

export default function SummaryCards({ data, loading, error }) {
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.key}><Skeleton height="12" width="40%" /><div className="mt-4"><Skeleton height="24" width="65%" /></div></Card>)}</div>;
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error.message}</p>;
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((item) => <Card key={item.key}><p className="text-sm font-medium text-gray-500">{item.label}</p><p className="mt-2 text-2xl font-bold text-gray-900">{item.format(data?.[item.key])}</p>{item.key === 'overdue_amount' && <p className="mt-1 text-xs text-gray-500">{data?.overdue_count ?? 0} overdue invoices</p>}</Card>)}</div>;
}
