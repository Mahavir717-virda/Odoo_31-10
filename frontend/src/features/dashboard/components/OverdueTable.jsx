import Table from '../../../../components/ui/Table';
import { formatMoney } from '../../../../utils/formatMoney';
import { formatDate } from '../../../../utils/formatDate';

const COLUMNS = [
  { key: 'customer_name', label: 'Customer' },
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'due_date', label: 'Due Date', format: (value) => formatDate(value) },
  { key: 'amount', label: 'Amount', format: (value) => formatMoney(value) },
  { key: 'days_overdue', label: 'Days Overdue' },
];

export default function OverdueTable({ data, loading, error }) {
  if (error) {
    return (
      <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
        Error loading overdue invoices: {error.message}
      </div>
    );
  }

  return (
    <Table
      columns={COLUMNS}
      data={data}
      loading={loading}
      emptyMessage="No overdue invoices."
      rowKey="id"
    />
  );
}
