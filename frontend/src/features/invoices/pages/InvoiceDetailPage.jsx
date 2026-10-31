import { useEffect, useState } from 'react';

import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Spinner from '../../../components/ui/Spinner';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { getInvoice, isOverdue } from '../api';
import InvoiceTotals from '../components/InvoiceTotals';
import InvoiceActions from '../components/InvoiceActions';
import PaymentHistory from '../../payments/components/PaymentHistory';
import RecordPaymentModal from '../../payments/components/RecordPaymentModal';

const STATUS_VARIANTS = {
  draft: 'default',
  open: 'info',
  confirmed: 'default',
  unpaid: 'danger',
  paid: 'success',
  cancelled: 'default',
};

export default function InvoiceDetailPage({ invoiceId }) {
  const id = invoiceId || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPayment, setOpenPayment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getInvoice(id)
      .then((response) => setInvoice(response.data))
      .catch((err) => setError(err.message || 'Failed to load invoice.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-gray-500">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center text-red-600">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!invoice) {
    return <EmptyState title="Invoice not found" description="The invoice you requested does not exist." />;
  }

  const overdue = isOverdue(invoice);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_number}</h1>
          <p className="text-gray-600">
            {invoice.customer_name} • {invoice.subscription_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={STATUS_VARIANTS[invoice.status] ?? 'default'}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
          {overdue && (
            <Badge variant="danger">Overdue</Badge>
          )}
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer</h3>
            <p className="text-gray-900">{invoice.customer_name}</p>
            <p className="text-sm text-gray-500 mt-1">{invoice.customer_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Subscription</h3>
            <p className="text-gray-900">{invoice.subscription_name}</p>
            <p className="text-sm text-gray-500 mt-1">{invoice.subscription_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Dates</h3>
            <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
            <p className="text-sm text-gray-500 mt-1">Issue date</p>
            <p className="text-gray-900">{formatDate(invoice.due_date)}</p>
            <p className="text-sm text-gray-500 mt-1">Due date</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Totals</h3>
        <InvoiceTotals invoice={invoice} />
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Line Items</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">Qty</th>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">Discount</th>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">Tax</th>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoice.lines.map((line) => (
                <tr key={line.id} className="text-gray-900">
                  <td className="px-4 py-3 border-b border-gray-200">{line.description}</td>
                  <td className="px-4 py-3 border-b border-gray-200">{line.quantity}</td>
                  <td className="px-4 py-3 border-b border-gray-200">{formatMoney(line.unit_price)}</td>
                  <td className="px-4 py-3 border-b border-gray-200">{line.discount_percent}%</td>
                  <td className="px-4 py-3 border-b border-gray-200">{formatMoney(line.tax_amount)}</td>
                  <td className="px-4 py-3 border-b border-gray-200 font-semibold">{formatMoney(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Actions</h3>
          <InvoiceActions invoice={invoice} onSuccess={(action) => {
            if (action === 'record_payment') {
              setOpenPayment(true);
            } else {
              setInvoice(null);
              setLoading(true);
              getInvoice(id)
                .then((response) => setInvoice(response.data))
                .catch((err) => setError(err.message || 'Failed to refresh.'))
                .finally(() => setLoading(false));
            }
          }} />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Payment History</h3>
          <PaymentHistory invoiceId={invoice.id} />
        </Card>
      </div>

      <RecordPaymentModal
        open={openPayment}
        onClose={() => setOpenPayment(false)}
        invoice={invoice}
        onSuccess={() => {
            setOpenPayment(false);
            setInvoice(null);
            setLoading(true);
            getInvoice(id)
            .then((response) => setInvoice(response.data))
            .catch((err) => setError(err.message || 'Failed to refresh.'))
            .finally(() => setLoading(false));
        }}
      />
    </div>
  );
}
