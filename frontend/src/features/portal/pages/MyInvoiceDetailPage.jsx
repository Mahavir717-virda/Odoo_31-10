import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { getMyInvoice } from '../api';
import ProfileCard from '../components/ProfileCard';

export default function MyInvoiceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setInvoice(await getMyInvoice(id)); }
    catch (loadError) { setError(loadError.message || 'Unable to load this invoice.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner /></div>;
  if (error) return <div className="space-y-4"><p className="rounded border border-red-200 bg-red-50 p-3 text-red-800" role="alert">{error}</p><Button variant="outline" onClick={load}>Retry</Button></div>;
  if (!invoice) return <p className="text-gray-600">Invoice not found.</p>;

  const balance = Number(invoice.balance ?? Number(invoice.total) - Number(invoice.amount_paid));
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div><Link to="/portal/invoices" className="text-sm text-indigo-600 hover:underline">Back to invoices</Link><h1 className="mt-2 text-2xl font-bold text-gray-900">Invoice {invoice.number}</h1></div>
        <Button variant="outline" onClick={() => window.print()}>Print invoice</Button>
      </div>
      <ProfileCard user={user} />
      <div className={`rounded-lg p-5 ${balance <= 0 ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}><p className="text-sm font-semibold">{balance <= 0 ? 'Paid' : 'Balance due'}</p><p className="mt-1 text-2xl font-bold">{formatMoney(balance <= 0 ? invoice.total : balance)}</p><p className="mt-1 text-sm">Total: {formatMoney(invoice.total)} · Paid: {formatMoney(invoice.amount_paid)}</p></div>
      <Card><div className="flex items-start justify-between"><div><h2 className="font-semibold text-gray-900">Invoice {invoice.number}</h2><p className="text-sm text-gray-600">Subscription {invoice.subscription_number}</p></div><Badge variant={String(invoice.status).toUpperCase() === 'PAID' ? 'success' : 'info'}>{invoice.status}</Badge></div><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-gray-500">Invoice date</dt><dd>{formatDate(invoice.invoice_date)}</dd></div><div><dt className="text-sm text-gray-500">Due date</dt><dd>{formatDate(invoice.due_date)}</dd></div><div><dt className="text-sm text-gray-500">Customer</dt><dd>{invoice.customer_name || user?.name}</dd></div><div><dt className="text-sm text-gray-500">Email</dt><dd>{invoice.customer_email || user?.email}</dd></div></dl></Card>
      <Card><h2 className="mb-4 font-semibold text-gray-900">Invoice lines</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-gray-500"><th className="px-3 py-2">Description</th><th className="px-3 py-2">Quantity</th><th className="px-3 py-2">Unit price</th><th className="px-3 py-2">Tax</th><th className="px-3 py-2 text-right">Amount</th></tr></thead><tbody>{(invoice.lines ?? []).map((line) => <tr key={line.id} className="border-b"><td className="px-3 py-3">{line.description || line.product_name}</td><td className="px-3 py-3">{line.quantity}</td><td className="px-3 py-3">{formatMoney(line.unit_price)}</td><td className="px-3 py-3">{line.tax_rate}% ({formatMoney(line.tax_amount)})</td><td className="px-3 py-3 text-right">{formatMoney(Number(line.amount) + Number(line.tax_amount))}</td></tr>)}</tbody></table></div></Card>
      {invoice.discounts?.length > 0 && <Card><h2 className="mb-3 font-semibold text-gray-900">Discounts</h2>{invoice.discounts.map((discount) => <div key={discount.id} className="flex justify-between text-sm"><span>{discount.discount_name}</span><span>-{formatMoney(discount.amount)}</span></div>)}</Card>}
      <Card><h2 className="mb-3 font-semibold text-gray-900">Totals</h2><dl className="ml-auto max-w-sm space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(invoice.subtotal)}</dd></div><div className="flex justify-between"><dt>Discounts</dt><dd>-{formatMoney(invoice.discount_total)}</dd></div><div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(invoice.tax_total)}</dd></div><div className="flex justify-between border-t pt-2 font-semibold"><dt>Total</dt><dd>{formatMoney(invoice.total)}</dd></div><div className="flex justify-between"><dt>Paid</dt><dd>{formatMoney(invoice.amount_paid)}</dd></div><div className="flex justify-between font-semibold"><dt>Balance due</dt><dd>{formatMoney(balance)}</dd></div></dl></Card>
      <p className="text-sm text-gray-500">This invoice is read-only. Contact support if you need assistance.</p>
    </div>
  );
}
