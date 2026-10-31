export default function Pagination({
  page = 1,
  pageSize = 10,
  total = 0,
  onChange,
  onPageSizeChange,
  className = '',
}) {
  const pageCount = Math.ceil(total / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, pageCount));
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const goToPage = (nextPage) => {
    const target = Math.max(1, Math.min(nextPage, pageCount));
    if (target !== currentPage && onChange) {
      onChange(target);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-sm-row sm:items-center sm:justify-between gap-4 ${className}`}>
      <div className="text-sm text-gray-600">
        {total === 0 ? (
          'No items'
        ) : (
          <>
            Showing <span className="font-medium">{start}</span> to <span className="font-medium">{end}</span> of <span className="font-medium">{total}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage === 1 || !onChange}
          onClick={() => goToPage(currentPage - 1)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{pageCount}</span>
        </span>
        <button
          type="button"
          disabled={currentPage >= pageCount || !onChange}
          onClick={() => goToPage(currentPage + 1)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
        >
          Next
        </button>

        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
