import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Spinner from '../../../components/ui/Spinner';
import Table from '../../../components/ui/Table';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchMyInvoices } from '../api';
import ProfileCard from '../components/ProfileCard';

const STATUS_COLORS = { PAID: 'success', DRAFT: 'default', CONFIRMED: 'info', CANCELLED: 'default' };

export default function MyInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setInvoices(await fetchMyInvoices()); }
    catch (loadError) { setError(loadError.message || 'Unable to load invoices.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'number', label: 'Invoice' },
    { key: 'status', label: 'Status', format: (value) => <Badge variant={STATUS_COLORS[String(value).toUpperCase()] ?? 'default'}>{value}</Badge> },
    { key: 'invoice_date', label: 'Invoice date', format: (value) => formatDate(value) },
    { key: 'due_date', label: 'Due date', format: (value) => formatDate(value) },
    { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
    { key: 'balance', label: 'Balance due', format: (value) => formatMoney(value) },
    { key: 'view', label: '', render: (invoice) => <Link className="font-medium text-indigo-600 hover:underline" to={`/portal/invoices/${invoice.id}`} onClick={(event) => event.stopPropagation()}>View details</Link> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">My invoices</h1><p className="text-gray-600">Your customer-specific invoice history.</p></div><Button variant="outline" onClick={() => window.print()} className="print:hidden">Print</Button></div>
      <ProfileCard user={user} />
      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}<button type="button" className="ml-3 underline" onClick={load}>Retry</button></div>}
      {loading ? <div className="flex min-h-64 items-center justify-center"><Spinner /></div> : <Table columns={columns} data={invoices} loading={false} rowKey="id" emptyMessage="No invoices found." />}
    </div>
  );
}
