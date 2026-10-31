import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/layout/PageHeader';
import Table from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import SearchInput from '../../../components/ui/SearchInput';
import Pagination from '../../../components/ui/Pagination';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import UsageProgress from '../components/UsageProgress';
import { getDiscounts, deleteDiscount } from '../api';

export default function DiscountListPage() {
  const navigate = useNavigate();

  const {
    data,
    total,
    page,
    pageSize,
    search,
    loading,
    setPage,
    setSearch,
    load,
  } = usePaginatedList(getDiscounts);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this discount coupon?')) {
      await deleteDiscount(id);
      load();
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Discount Code',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            {row.code}
          </span>
          <div className="text-xs text-gray-500 mt-1">{row.name}</div>
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Benefit',
      render: (row) => (
        <span className="font-semibold text-gray-900">
          {row.discount_type === 'percentage' ? `${row.value}% OFF` : `${formatMoney(row.value)} OFF`}
        </span>
      ),
    },
    {
      key: 'usage',
      label: 'Redemptions',
      render: (row) => (
        <UsageProgress current={row.current_uses} max={row.max_uses} />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/discounts/${row.id}`)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={(e) => handleDelete(e, row.id)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Discounts & Coupons"
        description="Create promotional codes and discount rules."
        actions={
          <Link to="/discounts/new">
            <Button variant="primary">+ Create Discount</Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="max-w-md mb-4">
          <SearchInput
            value={search}
            onChange={(val) => setSearch(val)}
            placeholder="Search discounts by code or title..."
          />
        </div>

        <Table
          columns={columns}
          data={data}
          loading={loading}
          emptyMessage="No discounts found."
          onRowClick={(row) => navigate(`/discounts/${row.id}`)}
        />

        <div className="mt-4 pt-3 border-t border-gray-100">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </div>
  );
}

