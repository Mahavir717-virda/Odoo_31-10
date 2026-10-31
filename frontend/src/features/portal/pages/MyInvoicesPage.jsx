import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Spinner from '../../../components/ui/Spinner';
import Table from '../../../components/ui/Table';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchMyInvoices } from '../api';
import { CURRENT_CUSTOMER } from '../mock';
import ProfileCard from '../components/ProfileCard';

const STATUS_VARIANTS = {
  draft: 'default',
  open: 'info',
  paid: 'success',
  unpaid: 'danger',
  cancelled: 'default',
};

const handlePrintInvoice = (invoice) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }
  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; }
          h2 { margin: 0 0 8px; font-size: 24px; }
          .meta { margin-bottom: 24px; font-size: 14px; color: #555; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background: #f3f4f6; font-weight: 600; font-size: 13px; text-transform: uppercase; }
          .amount { font-weight: 700; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h2>Invoice ${invoice.invoice_number}</h2>
        <div class="meta">
          <div><strong>Customer:</strong> ${CURRENT_CUSTOMER.name}</div>
          <div><strong>Subscription:</strong> ${invoice.subscription_id}</div>
          <div><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</div>
          <div><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</div>
          <div><strong>Status:</strong> ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</div>
        </div>
        <table>
          <thead>
            <tr><th>Description</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr><td>Subscription billing - ${invoice.subscription_id}</td><td class="amount">${formatMoney(invoice.amount)}</td></tr>
          </tbody>
        </table>
        <p class="mt-6" style="font-size:12px;color:#666;">This is a computer-generated invoice and does not require a signature.</p>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

const COLUMNS = [
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'status', label: 'Status', format: (value) => (
    <Badge variant={STATUS_VARIANTS[value] ?? 'default'}>
      {value.charAt(0).toUpperCase() + value.slice(1)}
    </Badge>
  )},
  { key: 'issue_date', label: 'Issue Date', format: (value) => formatDate(value) },
  { key: 'due_date', label: 'Due Date', format: (value) => formatDate(value) },
  { key: 'amount', label: 'Amount', format: (value) => formatMoney(value) },
  {
    key: 'actions',
    label: 'Actions',
    format: (_, row) => (
      <div className="flex gap-2">
        <a
          href={`/portal/invoices/${row.id}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          View
        </a>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handlePrintInvoice(row)}
        >
          Print
        </Button>
      </div>
    ),
  },
];

export default function MyInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  const loadInvoices = useCallback(async () => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMyInvoices();
      if (mountedRef.current) {
        setInvoices(response.data || []);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setInvoices([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadInvoices();
    return () => {
      mountedRef.current = false;
    };
  }, [loadInvoices]);

  const handlePrintAll = () => {
    window.print();
  };

  const totalAmount = invoices.reduce((total, invoice) => total + Number(invoice.amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
          <p className="text-gray-600">Your billing invoices. Read-only.</p>
        </div>
        <div className="flex min-h-[400px] items-center justify-center text-gray-500">
          <Spinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
        </div>
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Invoices</h1>
          <p className="text-gray-600">Your billing invoices. Read-only.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePrintAll}>
            Print All
          </Button>
        </div>
      </div>

      <ProfileCard user={CURRENT_CUSTOMER} />

      {error && (
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
          {error.message}
        </div>
      )}

      <div className="mb-4 text-right text-sm text-gray-500">
        Total: {formatMoney(totalAmount)}
      </div>

      <Table
        columns={COLUMNS}
        data={invoices}
        loading={loading}
        emptyMessage="No invoices found."
        rowKey="id"
      />
    </div>
  );
}
