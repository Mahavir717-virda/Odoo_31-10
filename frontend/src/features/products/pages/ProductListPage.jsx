import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import usePaginatedList from '../../../hooks/usePaginatedList';
import { formatMoney } from '../../../utils/formatMoney';
import { useAuth } from '../../../context/AuthContext';
import { getProducts, deleteProduct } from '../api';

const ROW_METADATA = [
  { shop: 'WearPhysique', initial: 'W', bg: '#E0E7FF', color: '#3730A3', score: 65, moRev: 19800 },
  { shop: 'MuwaitUK', initial: 'M', bg: '#FCE7F3', color: '#9D174D', score: 89, moRev: 18000 },
  { shop: 'SeFashion', initial: 'S', bg: '#DCFCE7', color: '#166534', score: 72, moRev: 47500 },
  { shop: 'Twoday', initial: 'T', bg: '#FFEDD5', color: '#9A3412', score: 95, moRev: 8750 },
  { shop: 'Manifestable', initial: 'M', bg: '#FEF3C7', color: '#92400E', score: 80, moRev: 6450 },
  { shop: 'JewalinCo', initial: 'J', bg: '#F3E8FF', color: '#6B21A8', score: 75, moRev: 5840 },
  { shop: 'MinimalFas', initial: 'M', bg: '#CCFBF1', color: '#115E59', score: 95, moRev: 5655 },
];

export default function ProductListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // UI state
  const [activeTab, setActiveTab] = useState('product_analytics');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [actionError, setActionError] = useState('');

  const {
    data,
    total,
    page,
    pageSize,
    search,
    loading,
    error,
    setSearch,
    setPageSize,
    setFilters,
    filters,
    load,
  } = usePaginatedList(getProducts, { page_size: 10 });

  const updateFilter = (key, value) => {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    setFilters(next);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) {
      try {
        await deleteProduct(deleteTargetId);
        setDeleteTargetId(null);
        setActionError('');
        load();
      } catch (deleteError) {
        setActionError(deleteError?.message || 'Unable to delete product.');
      }
    }
  };

  // Row selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((item) => item.id)));
    }
  };

  const toggleSelectRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Export visible data to CSV
  const handleExport = () => {
    if (!data || data.length === 0) return;
    const headers = ['ID', 'Product Name', 'Type', 'Price', 'Status'];
    const rows = data.map((p) => [
      p.id,
      `"${p.name?.replace(/"/g, '""')}"`,
      p.type,
      p.sales_price,
      p.is_active ? 'Active' : 'Inactive',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pa-page">
      <div className="content">
        {/* Page Head */}
        <div className="page-head">
          <div>
            <h1>Product Analytics</h1>
            <p>Navigating Data for Informed Product Decisions</p>
          </div>
          {isAdmin && (
            <Link to="/products/new">
              <button type="button" className="btn-primary">
                + Create Product
              </button>
            </Link>
          )}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === 'product_analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('product_analytics')}
            >
              Product Analytics
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'tag_analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('tag_analytics')}
            >
              Tag Analytics
            </button>
          </div>
          <div className="tools">
            {searchOpen ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="tool"
                  style={{ width: '200px' }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="tool"
                onClick={() => setSearchOpen(true)}
              >
                Search
              </button>
            )}

            <button
              type="button"
              className="tool"
              onClick={() => setShowFilterBar((prev) => !prev)}
            >
              Customize
            </button>

            <button
              type="button"
              className="tool"
              style={
                showFilterBar || Object.keys(filters).length > 0
                  ? { background: '#EFF6FF', borderColor: '#93C5FD', color: '#1D4ED8' }
                  : {}
              }
              onClick={() => setShowFilterBar((prev) => !prev)}
            >
              Filter
            </button>

            <button type="button" className="tool" onClick={handleExport}>
              Export
            </button>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilterBar && (
          <div
            className="w-full mt-4 p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-xs flex flex-wrap items-center gap-4"
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Type:
              </span>
              <select
                value={filters.type || ''}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="SERVICE">Service</option>
                <option value="GOODS">Goods</option>
                <option value="ADDON">Add-on</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status:
              </span>
              <select
                value={filters.is_active ?? ''}
                onChange={(e) => updateFilter('is_active', e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {Object.keys(filters).length > 0 && (
              <button
                type="button"
                onClick={() => setFilters({})}
                className="text-xs text-blue-600 font-medium hover:underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Error alert if any */}
        {(error || actionError) && (
          <div
            className="w-full mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            <span>{actionError || error?.message}</span>
            <button
              type="button"
              className="text-xs font-semibold text-red-700 underline"
              onClick={() => {
                setActionError('');
                load();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Card */}
        <div className="table-card">
          <div className="scroll">
            <div className="table">
              <div className="tr th">
                <input
                  className="cb"
                  type="checkbox"
                  aria-label="Select all"
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onChange={toggleSelectAll}
                />
                <span>Product</span>
                <span>Price</span>
                <span>Shop name</span>
                <span>Visibility score</span>
                <span>Mo. revenue &#9662;</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {loading ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  Loading products...
                </div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">
                  No products found matching your criteria.
                </div>
              ) : (
                data.map((row, idx) => {
                  const meta = ROW_METADATA[idx % ROW_METADATA.length];
                  const isSelected = selectedIds.has(row.id);
                  const isAddon = String(row.type).toUpperCase() === 'ADDON';
                  const score = meta.score;
                  const scoreClass = score >= 80 ? 'high' : score >= 70 ? 'mid' : 'low';
                  const moRevenue = meta.moRev;

                  return (
                    <div
                      key={row.id}
                      className="tr"
                      style={isSelected ? { background: '#F0F5FF' } : {}}
                      onClick={() => navigate(`/products/${row.id}`)}
                    >
                      <input
                        className="cb"
                        type="checkbox"
                        aria-label={`Select ${row.name}`}
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />

                      <span>
                        <div className="pname">{row.name}</div>
                        <div className="meta">
                          <b className={`tag ${isAddon ? 'tag-addon' : 'tag-service'}`}>
                            {row.type || 'SERVICE'}
                          </b>
                          {row.variants?.length ? `${row.variants.length} variants` : '1 variants'}
                        </div>
                      </span>

                      <span className="price">{formatMoney(row.sales_price)}</span>

                      <span className="shop">
                        <i style={{ background: meta.bg, color: meta.color }}>
                          {meta.initial}
                        </i>
                        {meta.shop}
                      </span>

                      <span className="score">
                        <span className="track">
                          <span
                            className={`fill ${scoreClass}`}
                            style={{ width: `${score}%` }}
                          />
                        </span>
                        <b>{score}</b>
                      </span>

                      <span className="rev">${moRevenue.toLocaleString('en-US')}</span>

                      <span className="actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${row.id}`);
                          }}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          aria-label="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(row.id);
                          }}
                        >
                          <svg viewBox="0 0 24 24">
                            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                          </svg>
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>
            Showing: <b>{data.length}</b> of <b>{total || data.length}</b>
          </span>
          <span className="pager">
            Lines per page{' '}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="select"
            >
              <option value={10}>10 &#9662;</option>
              <option value={20}>20 &#9662;</option>
              <option value={50}>50 &#9662;</option>
            </select>
            <span className="page-num">{page || 1}</span>
          </span>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
