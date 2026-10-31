import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import PaymentHistory from '../../payments/components/PaymentHistory';
import RecordPaymentModal from '../../payments/components/RecordPaymentModal';
import { getInvoice, isOverdue } from '../api';
import InvoiceActions from '../components/InvoiceActions';
import InvoiceTotals from '../components/InvoiceTotals';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentRefresh, setPaymentRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setInvoice(await getInvoice(id)); }
    catch (loadError) { setError(loadError.message || 'Unable to load invoice.'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePrint = () => window.print();

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Spinner /></div>;
  if (error) return <div className="space-y-4"><p className="rounded border border-red-200 bg-red-50 p-3 text-red-800" role="alert">{error}</p><Button variant="outline" onClick={load}>Retry</Button></div>;
  if (!invoice) return <EmptyState title="Invoice not found" description="This invoice may have been removed or is unavailable to your account." />;

  const status = String(invoice.status ?? '').toUpperCase();
  const overdue = isOverdue(invoice);
  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Link to="/invoices" className="text-sm text-indigo-600 hover:underline print:hidden">Back to invoices</Link><h1 className="mt-2 text-2xl font-bold text-gray-900">Invoice {invoice.number}</h1><p className="text-gray-600">{invoice.customer_name} · Subscription {invoice.subscription_number}</p></div>
        <div className="flex flex-wrap items-center gap-2 print:hidden"><Badge variant={status === 'PAID' ? 'success' : status === 'CANCELLED' ? 'default' : 'info'}>{status}</Badge>{overdue && <Badge variant="danger">Overdue</Badge>}<Button variant="outline" onClick={handlePrint}>Print</Button></div>
      </div>
      <Card>
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Customer</dt><dd className="mt-1 font-medium text-gray-900">{invoice.customer_name}</dd><dd className="text-sm text-gray-500">{invoice.customer_email}</dd><dd className="text-sm text-gray-500">{invoice.customer_company}</dd><dd className="text-sm text-gray-500">{invoice.customer_phone}</dd><dd className="text-sm text-gray-500">{invoice.customer_address}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Subscription</dt><dd className="mt-1 text-gray-900">{invoice.subscription_number}</dd></div>
          <div><dt className="text-xs font-semibold uppercase text-gray-500">Dates</dt><dd className="mt-1 text-gray-900">Invoice: {formatDate(invoice.invoice_date)}</dd><dd className="text-gray-900">Due: {formatDate(invoice.due_date)}</dd><dd className="text-sm text-gray-500">{invoice.period_start && invoice.period_end ? `Period ${formatDate(invoice.period_start)} – ${formatDate(invoice.period_end)}` : ''}</dd></div>
        </dl>
      </Card>
      <Card><h2 className="mb-4 font-semibold text-gray-900">Invoice lines</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-gray-500"><th className="px-3 py-2">Description</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit price</th><th className="px-3 py-2">Tax</th><th className="px-3 py-2 text-right">Amount</th></tr></thead><tbody>{(invoice.lines ?? []).map((line) => <tr key={line.id} className="border-b"><td className="px-3 py-3">{line.description || line.product_name}</td><td className="px-3 py-3">{line.quantity}</td><td className="px-3 py-3">{formatMoney(line.unit_price)}</td><td className="px-3 py-3">{line.tax_rate}% ({formatMoney(line.tax_amount)})</td><td className="px-3 py-3 text-right font-medium">{formatMoney(Number(line.amount) + Number(line.tax_amount))}</td></tr>)}</tbody></table></div></Card>
      {invoice.discounts?.length > 0 && <Card><h2 className="mb-3 font-semibold text-gray-900">Discounts</h2><ul className="space-y-2">{invoice.discounts.map((discount) => <li key={discount.id} className="flex justify-between text-sm"><span>{discount.discount_name}</span><span>-{formatMoney(discount.amount)}</span></li>)}</ul></Card>}
      <Card><h2 className="mb-4 font-semibold text-gray-900">Totals</h2><InvoiceTotals invoice={invoice} /></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="print:hidden"><h2 className="mb-4 font-semibold text-gray-900">Available actions</h2><InvoiceActions invoice={invoice} onSuccess={(action) => action === 'record_payment' ? setPaymentOpen(true) : load()} /></Card>
        <Card><h2 className="mb-4 font-semibold text-gray-900">Payment history</h2><PaymentHistory key={`${invoice.id}-${paymentRefresh}`} invoiceId={invoice.id} /></Card>
      </div>
      <RecordPaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} invoice={invoice} onSuccess={async () => { setPaymentOpen(false); setPaymentRefresh((current) => current + 1); await load(); }} />
      <Button className="print:hidden" variant="outline" onClick={() => navigate('/invoices')}>Return to invoices</Button>
    </div>
  );
}
