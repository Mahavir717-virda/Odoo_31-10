import { useCallback, useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import SearchInput from '../../../components/ui/SearchInput';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import { ToastProvider, useToast } from '../../../components/ui/Toast';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchPayments } from '../api';
import RecordPaymentModal from '../components/RecordPaymentModal';
import { INVOICES } from '../mock';

const METHOD_VARIANTS = {
  bank_transfer: 'info',
  credit_card: 'success',
  check: 'default',
  cash: 'warning',
  other: 'default',
};

export default function PaymentListPage() {
  const { toast } = useToast();
  const [openRecord, setOpenRecord] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchList = useCallback(async (params) => {
    const response = await fetchPayments(params);
    return response;
  }, []);

  const {
    data,
    total,
    page,
    page_size,
    search,
    filters,
    loading,
    error,
    set_page,
    set_page_size,
    set_search,
    set_filters,
    refresh,
  } = usePaginatedList(fetchList, { page_size: 10 });

  const handleRecordSuccess = () => {
    setOpenRecord(false);
    setSelectedInvoice(null);
    refresh();
    toast({ title: 'Recorded', description: 'Payment recorded successfully.', variant: 'success' });
  };

  const columns = [
    { key: 'date', label: 'Date', format: (value) => formatDate(value) },
    { key: 'invoice_id', label: 'Invoice', format: (value) => {
      const invoice = INVOICES.find((inv) => inv.id === value);
      return invoice ? invoice.invoice_number : value;
    }},
    { key: 'customer_name', label: 'Customer', format: (value, row) => {
      const invoice = INVOICES.find((inv) => inv.id === row.invoice_id);
      return invoice ? invoice.customer_name : '-';
    }},
    { key: 'method', label: 'Method', format: (value) => (
      <Badge variant={METHOD_VARIANTS[value] ?? 'default'}>
        {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
      </Badge>
    )},
    { key: 'amount', label: 'Amount', format: (value) => formatMoney(value) },
    { key: 'note', label: 'Note' },
  ];

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">View and record payments against invoices.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedInvoice ? selectedInvoice.id : ''}
              onChange={(event) => {
                const id = event.target.value || undefined;
                setSelectedInvoice(id ? INVOICES.find((inv) => inv.id === id) : null);
              }}
              placeholder="Select invoice"
              options={INVOICES.map((inv) => ({ value: inv.id, label: `${inv.invoice_number} - ${inv.customer_name}` }))}
            />
            <Button onClick={() => setOpenRecord(true)} disabled={!selectedInvoice}>
              Record Payment
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
            Error: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchInput
            value={search}
            onChange={set_search}
            placeholder="Search payments..."
          />
          <Input label="Invoice ID" value={filters.invoice_id ?? ''} onChange={(event) =>
            set_filters({ ...filters, invoice_id: event.target.value || undefined })
          } />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          rowKey="id"
          emptyMessage="No payments found."
        />

        <Pagination
          page={page}
          pageSize={page_size}
          total={total}
          onChange={set_page}
          onPageSizeChange={set_page_size}
        />

        <RecordPaymentModal
          invoice={selectedInvoice}
          open={openRecord}
          onClose={() => setOpenRecord(false)}
          onSuccess={handleRecordSuccess}
        />
      </div>
    </ToastProvider>
  );
}
