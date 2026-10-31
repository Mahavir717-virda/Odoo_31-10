import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { normalizeListResponse } from '../../../api/featureUtils';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatDate } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/formatMoney';
import { fetchInvoices, isOverdue } from '../api';
import GenerateDueButton from '../components/GenerateDueButton';

const STATUSES = ['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED'];

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [customersError, setCustomersError] = useState('');
  const [counts, setCounts] = useState(null);
  const [countsRefresh, setCountsRefresh] = useState(0);
  const loadList = useCallback((params) => fetchInvoices(params), []);
  const list = usePaginatedList(loadList);
  const { filters, set_filters: setListFilters } = list;

  const appliedQueryRef = useRef(false);
  useEffect(() => {
    if (appliedQueryRef.current) return;
    const queryFilters = Object.fromEntries(
      ['subscription_id', 'status', 'overdue', 'from', 'to']
        .filter((key) => searchParams.has(key))
        .map((key) => [key, searchParams.get(key)])
    );
    if (Object.keys(queryFilters).length) {
      appliedQueryRef.current = true;
      setListFilters({ ...filters, ...queryFilters });
    } else {
      appliedQueryRef.current = true;
    }
  }, [searchParams, filters, setListFilters]);

  useEffect(() => {
    let active = true;
    axiosClient.get('/users', { params: { page: 1, limit: 100, role: 'CUSTOMER' } })
      .then((response) => active && setCustomers(normalizeListResponse(response).data))
      .catch((error) => active && setCustomersError(error.message || 'Unable to load customer filters.'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      ...STATUSES.map((status) => fetchInvoices({ page: 1, limit: 1, status })),
      fetchInvoices({ page: 1, limit: 1, overdue: true }),
    ]).then((responses) => {
      if (active) setCounts([...responses.slice(0, -1).map((response) => response.total), responses.at(-1).total]);
    }).catch(() => active && setCounts(null));
    return () => { active = false; };
  }, [countsRefresh]);

  const refreshAfterGenerate = () => {
    list.refresh();
    setCountsRefresh((current) => current + 1);
  };

  const columns = [
    { key: 'number', label: 'Invoice' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'subscription_number', label: 'Subscription' },
    { key: 'invoice_date', label: 'Invoice date', format: (value) => formatDate(value) },
    { key: 'due_date', label: 'Due date', format: (value) => formatDate(value) },
    { key: 'total', label: 'Total', format: (value) => formatMoney(value) },
    { key: 'amount_paid', label: 'Paid', format: (value) => formatMoney(value) },
    { key: 'balance', label: 'Balance', format: (value, row) => <span className={isOverdue(row) ? 'font-semibold text-red-600' : ''}>{formatMoney(value)}</span> },
    { key: 'status', label: 'Status', format: (value, row) => <span className="flex items-center gap-2"><Badge variant={String(value).toUpperCase() === 'PAID' ? 'success' : String(value).toUpperCase() === 'CANCELLED' ? 'default' : 'info'}>{value}</Badge>{isOverdue(row) && <Badge variant="danger">Overdue</Badge>}</span> },
    { key: 'open', label: '', render: (invoice) => <button type="button" className="font-medium text-indigo-600 hover:underline" onClick={(event) => { event.stopPropagation(); navigate(`/invoices/${invoice.id}`); }}>View</button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Invoices</h1><p className="text-gray-600">Review invoices, balances, and payments.</p></div>
        <GenerateDueButton onSuccess={refreshAfterGenerate} />
      </div>
      {counts && <div className="flex flex-wrap gap-2">{['Draft', 'Confirmed', 'Paid', 'Overdue'].map((label, index) => <Badge key={label} variant={index === 3 && counts[index] ? 'danger' : 'default'}>{label}: {counts[index]}</Badge>)}</div>}
      {list.error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{list.error.message}</p>}
      {customersError && <p className="text-sm text-amber-800" role="status">{customersError}</p>}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <SearchInput value={list.search} onChange={list.set_search} placeholder="Search invoice or customer..." className="lg:col-span-2" />
        <Select id="invoice-status" label="Status" value={list.filters.status ?? ''} onChange={(event) => list.set_filters({ ...list.filters, status: event.target.value || undefined })} options={STATUSES.map((status) => ({ value: status, label: status }))} placeholder="All statuses" />
        <Select id="invoice-overdue" label="Overdue only" value={list.filters.overdue ? 'true' : ''} onChange={(event) => list.set_filters({ ...list.filters, overdue: event.target.value || undefined })} options={[{ value: 'true', label: 'Overdue' }]} placeholder="All invoices" />
        <Select id="invoice-customer" label="Customer" value={list.filters.customer_id ?? ''} onChange={(event) => list.set_filters({ ...list.filters, customer_id: event.target.value || undefined })} options={customers.map((customer) => ({ value: String(customer.id), label: customer.name }))} placeholder="All customers" />
        <Input id="invoice-from" label="From date" type="date" value={list.filters.from ?? ''} onChange={(event) => list.set_filters({ ...list.filters, from: event.target.value || undefined })} />
        <Input id="invoice-to" label="To date" type="date" value={list.filters.to ?? ''} onChange={(event) => list.set_filters({ ...list.filters, to: event.target.value || undefined })} />
      </div>
      <Table columns={columns} data={list.data} loading={list.loading} rowKey="id" emptyMessage="No invoices found." onRowClick={(invoice) => navigate(`/invoices/${invoice.id}`)} />
      <Pagination page={list.page} pageSize={list.page_size} total={list.total} onChange={list.set_page} onPageSizeChange={list.set_page_size} />
    </div>
  );
}
