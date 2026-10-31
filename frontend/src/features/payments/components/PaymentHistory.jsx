import Table from '../../../components/ui/Table';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchInvoicePayments } from '../api';
import { useEffect, useState } from 'react';

const METHOD_VARIANTS = {
  BANK_TRANSFER: 'info',
  CARD: 'success',
  CHEQUE: 'default',
  CASH: 'warning',
  UPI: 'info',
  ONLINE: 'success',
};

export default function PaymentHistory({ invoiceId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchInvoicePayments(invoiceId)
      .then((payments) => active && setData(Array.isArray(payments) ? payments : []))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
        Error: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No payments" description="No payment records for this invoice." />;
  }

  return (
    <Table
      columns={[
        { key: 'payment_date', label: 'Date', format: (value) => formatDate(value) },
        { key: 'method', label: 'Method', format: (value) => (
          <Badge variant={METHOD_VARIANTS[value] ?? 'default'}>
            {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
          </Badge>
        )},
        { key: 'amount', label: 'Amount', format: (value) => formatMoney(value) },
        { key: 'note', label: 'Note' },
      ]}
      data={data}
      loading={false}
      rowKey="id"
      emptyMessage="No payments recorded."
    />
  );
}
