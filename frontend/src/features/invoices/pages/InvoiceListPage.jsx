import { useCallback, useState } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import SearchInput from '../../../components/ui/SearchInput';
import Table from '../../../components/ui/Table';
import Pagination from '../../../components/ui/Pagination';
import Badge from '../../../components/ui/Badge';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { formatDate } from '../../../utils/formatDate';
import { fetchInvoices, isOverdue } from '../api';
import { INVOICE_STATUSES, CUSTOMERS, SUBSCRIPTIONS } from '../mock';
import GenerateDueButton from '../components/GenerateDueButton';

const STATUS_VARIANTS = {
  draft: 'default',
  open: 'info',
  confirmed: 'default',
  unpaid: 'danger',
  paid: 'success',
  cancelled: 'default',
};

export default function InvoiceListPage() {
  const [generateResult, setGenerateResult] = useState(null);

  const fetchList = useCallback(async (params) => {
    const response = await fetchInvoices(params);
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

  const handleGenerateSuccess = () => {
    setGenerateResult(null);
    refresh();
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice No' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'subscription_name', label: 'Subscription' },
    { key: 'issue_date', label: 'Issue Date', format: (value) => formatDate(value) },
    { key: 'due_date', label: 'Due Date', format: (value) => formatDate(value) },
    { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
    { key: 'paid_amount', label: 'Paid', format: (value) => formatMoney(value) },
    { key: 'balance', label: 'Balance', format: (value, row) => {
      const overdue = isOverdue(row);
      return (
        <span className={`font-semibold ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
          {formatMoney(value)}
        </span>
      );
    }},
    { key: 'status', label: 'Status', format: (value) => (
      <Badge variant={STATUS_VARIANTS[value] ?? 'default'}>
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    )},
    {
      key: 'actions',
      label: 'Actions',
      format: () => (
        <Button type="button" variant="outline" size="sm" onClick={() => {}}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600">Manage invoices, payments, and billing.</p>
          </div>
          <div className="flex items-center gap-3">
            <GenerateDueButton onSuccess={handleGenerateSuccess} />
            <Button>Create Invoice</Button>
          </div>
        </div>

        {generateResult && (
          <div className="p-3 rounded border border-indigo-200 bg-indigo-50 text-indigo-800 text-sm">
            {generateResult.message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
            Error: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchInput
            value={search}
            onChange={set_search}
            placeholder="Search invoice, customer, subscription..."
            className="md:col-span-2 lg:col-span-2"
          />
          <Select
            label="Status"
            value={filters.status ?? ''}
            onChange={(event) =>
              set_filters({ ...filters, status: event.target.value || undefined })
            }
            placeholder="All statuses"
            options={INVOICE_STATUSES}
          />
          <Select
            label="Overdue"
            value={filters.overdue ?? ''}
            onChange={(event) => {
              const val = event.target.value;
              set_filters({ ...filters, overdue: val === '' ? undefined : val });
            }}
            placeholder="All"
            options={[
              { value: 'true', label: 'Overdue' },
              { value: 'false', label: 'Not Overdue' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Customer"
            value={filters.customer ?? ''}
            onChange={(event) =>
              set_filters({ ...filters, customer: event.target.value || undefined })
            }
            placeholder="All customers"
            options={CUSTOMERS.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            label="Subscription"
            value={filters.subscription ?? ''}
            onChange={(event) =>
              set_filters({ ...filters, subscription: event.target.value || undefined })
            }
            placeholder="All subscriptions"
            options={SUBSCRIPTIONS.map((s) => ({ value: s.id, label: `${s.customer_name} - ${s.plan}` }))}
          />
          <Input
            label="From Date"
            type="date"
            value={filters.from_date ?? ''}
            onChange={(event) =>
              set_filters({ ...filters, from_date: event.target.value || undefined })
            }
          />
          <Input
            label="To Date"
            type="date"
            value={filters.to_date ?? ''}
            onChange={(event) =>
              set_filters({ ...filters, to_date: event.target.value || undefined })
            }
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          rowKey="id"
          emptyMessage="No invoices found."
        />

        <Pagination
          page={page}
          pageSize={page_size}
          total={total}
          onChange={set_page}
          onPageSizeChange={set_page_size}
        />
      </div>
  );
}
