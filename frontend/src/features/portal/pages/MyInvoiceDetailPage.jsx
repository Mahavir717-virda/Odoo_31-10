import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Spinner from '../../../components/ui/Spinner';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchMyInvoices } from '../api';
import { CURRENT_CUSTOMER } from '../mock';

export default function MyInvoiceDetailPage() {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);

  const invoiceId = window.location.pathname.split('/').pop();

  const loadInvoice = useCallback(async () => {
    mountedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchMyInvoices();
      const found = (response.data || []).find((item) => item.id === invoiceId);
      if (mountedRef.current) {
        setInvoice(found || null);
        if (!found) {
          setError(new Error('Invoice not found.'));
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [invoiceId]);

  useEffect(() => {
    loadInvoice();
    return () => {
      mountedRef.current = false;
    };
  }, [loadInvoice]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-gray-500">
        <Spinner />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice</h1>
        </div>
        {error && (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
            {error.message}
          </div>
        )}
        {!error && (
          <div className="border rounded-lg p-12 text-center">
            <h3 className="text-sm font-semibold text-gray-900">Invoice not found.</h3>
          </div>
        )}
        <div className="mt-6">
          <Button type="button" variant="outline" asChild>
            <a href="/portal/invoices">Back to Invoices</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
          <p className="text-gray-600">
            Subscription {invoice.subscription_id} • {CURRENT_CUSTOMER.name}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/portal/invoices"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Back to Invoices
          </a>
          <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
            Print
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Invoice #</dt>
                <dd className="font-medium text-gray-900">{invoice.invoice_number}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Subscription</dt>
                <dd className="font-medium text-gray-900">{invoice.subscription_id}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Customer</dt>
                <dd className="font-medium text-gray-900">{CURRENT_CUSTOMER.name}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Issue Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Due Date</dt>
                <dd className="font-medium text-gray-900">{formatDate(invoice.due_date)}</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-gray-500">Status</dt>
                <dd className={`font-medium text-gray-900 capitalize`}>{invoice.status}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Amount</h3>
            <p className="text-3xl font-bold text-gray-900">{formatMoney(invoice.amount)}</p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-md">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 border-b border-gray-200 text-gray-900">
                  Subscription billing - {invoice.subscription_id}
                </td>
                <td className="px-4 py-4 border-b border-gray-200 text-right font-medium text-gray-900">
                  {formatMoney(invoice.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-sm text-gray-500">
        Invoices are read-only. Contact support to request changes.
      </div>
    </div>
  );
}
