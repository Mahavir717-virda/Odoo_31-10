import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';

export default function OverdueTable({ data, loading, error }) {
  const navigate = useNavigate();
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error.message}</p>;
  return <Table
    columns={[
      { key: 'number', label: 'Invoice' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'due_date', label: 'Due', format: (value) => formatDate(value) },
      { key: 'balance', label: 'Balance', format: (value) => <span className="font-semibold text-red-600">{formatMoney(value)}</span> },
      { key: 'status', label: 'Status', format: () => <Badge variant="danger">Overdue</Badge> },
    ]}
    data={data ?? []}
    loading={loading}
    emptyMessage="No overdue invoices."
    rowKey="id"
    onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)}
  />;
}
