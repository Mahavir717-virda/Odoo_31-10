import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchPayments } from '../api';
import { fetchInvoices } from '../../invoices/api';
import RecordPaymentModal from '../components/RecordPaymentModal';

const METHODS = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];

export default function PaymentListPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [invoicePickerOpen, setInvoicePickerOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [availableInvoices, setAvailableInvoices] = useState([]);
  const [invoiceLoadError, setInvoiceLoadError] = useState('');
  const loadList = useCallback((params) => fetchPayments(params), []);
  const list = usePaginatedList(loadList);
  const visibleTotal = useMemo(() => list.data.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0), [list.data]);

  const loadInvoicesForPayment = async () => {
    try {
      const response = await fetchInvoices({ page: 1, limit: 100, status: 'CONFIRMED' });
      setAvailableInvoices(response.data.filter((item) => Number(item.balance) > 0));
      setInvoiceLoadError('');
      setInvoicePickerOpen(true);
    } catch (error) {
      setInvoiceLoadError(error.message || 'Unable to load invoices.');
    }
  };

  const columns = [
    { key: 'payment_date', label: 'Date', format: (value) => formatDate(value) },
    { key: 'invoice_number', label: 'Invoice', render: (payment) => <Link className="font-medium text-indigo-600 hover:underline" to={`/invoices/${payment.invoice_id}`} onClick={(event) => event.stopPropagation()}>{payment.invoice_number ?? `Invoice ${payment.invoice_id}`}</Link> },
    { key: 'customer_name', label: 'Customer' },
    { key: 'method', label: 'Method', format: (value) => <Badge variant="info">{String(value).replaceAll('_', ' ')}</Badge> },
    { key: 'amount', label: 'Amount', format: (value) => formatMoney(value) },
    { key: 'note', label: 'Note', format: (value) => value || '—' },
  ];

  const refreshAfterPayment = () => {
    setModalOpen(false);
    setInvoice(null);
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Payments</h1><p className="text-gray-600">View recorded invoice payments.</p></div>
        <Button onClick={loadInvoicesForPayment}>Record payment</Button>
      </div>
      {invoiceLoadError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{invoiceLoadError}</p>}
      {list.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{list.error.message}</p>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <SearchInput value={list.search} onChange={list.set_search} placeholder="Search invoice or customer..." className="lg:col-span-2" />
        <Select id="payment-method-filter" label="Method" value={list.filters.method ?? ''} onChange={(event) => list.set_filters({ ...list.filters, method: event.target.value || undefined })} options={METHODS.map((method) => ({ value: method, label: method.replaceAll('_', ' ') }))} placeholder="All methods" />
        <Input id="payment-from" label="From date" type="date" value={list.filters.from ?? ''} onChange={(event) => list.set_filters({ ...list.filters, from: event.target.value || undefined })} />
        <Input id="payment-to" label="To date" type="date" value={list.filters.to ?? ''} onChange={(event) => list.set_filters({ ...list.filters, to: event.target.value || undefined })} />
      </div>
      <div className="text-right text-sm font-medium text-gray-700">Visible payments total: {formatMoney(visibleTotal)}</div>
      <Table columns={columns} data={list.data} loading={list.loading} rowKey="id" emptyMessage="No payments found." onRowClick={(payment) => navigate(`/invoices/${payment.invoice_id}`)} />
      <Pagination page={list.page} pageSize={list.page_size} total={list.total} onChange={list.set_page} onPageSizeChange={list.set_page_size} />
      <Modal open={invoicePickerOpen} onClose={() => { setInvoicePickerOpen(false); setInvoice(null); }} title="Choose an invoice" className="max-w-xl">
            <Select id="payment-invoice" label="Confirmed invoice" value={invoice ? String(invoice.id) : ''} onChange={(event) => setInvoice(availableInvoices.find((item) => String(item.id) === event.target.value) ?? null)} options={availableInvoices.map((item) => ({ value: String(item.id), label: `${item.number} · ${item.customer_name} · ${formatMoney(item.balance)} due` }))} placeholder="Select invoice" />
            {availableInvoices.length === 0 && <p className="mb-3 text-sm text-gray-500">There are no confirmed invoices with an outstanding balance.</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setInvoicePickerOpen(false); setInvoice(null); }}>Cancel</Button>
              <Button disabled={!invoice} onClick={() => { setInvoicePickerOpen(false); setModalOpen(true); }}>Continue</Button>
            </div>
      </Modal>
      <RecordPaymentModal invoice={invoice} open={modalOpen} onClose={() => { setModalOpen(false); setInvoice(null); }} onSuccess={refreshAfterPayment} />
    </div>
  );
}
