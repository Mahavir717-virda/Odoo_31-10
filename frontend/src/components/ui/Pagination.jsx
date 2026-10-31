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
  const count = Math.min(pageSize, total);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5 px-1 text-[13px] text-gray-500 ${className}`}>
      {/* Left count indicator matching screenshot */}
      <div>
        Showing: <strong className="font-semibold text-gray-900">{total === 0 ? 0 : (pageSize >= total ? total : count)}</strong> of{' '}
        <strong className="font-semibold text-gray-900">{total}</strong>
      </div>

      {/* Right controls matching screenshot */}
      <div className="flex items-center space-x-3 self-end sm:self-auto">
        {onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-[13px] text-gray-500">Lines per page</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="appearance-none bg-white border border-[#E5E7EB] rounded-lg px-3 py-1 pr-7 text-[13px] font-medium text-gray-800 focus:outline-none cursor-pointer"
              >
                {[7, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size === 7 ? '7/12' : size}
                  </option>
                ))}
              </select>
              <svg className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-1">
          {pageCount > 1 && (
            <button
              type="button"
              disabled={currentPage <= 1 || !onChange}
              onClick={() => onChange && onChange(currentPage - 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:pointer-events-none rounded transition"
              aria-label="Previous Page"
            >
              ‹
            </button>
          )}

          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center text-xs rounded-md bg-[#2563EB] text-white font-bold shadow-2xs"
          >
            {currentPage}
          </button>

          {pageCount > 1 && (
            <button
              type="button"
              disabled={currentPage >= pageCount || !onChange}
              onClick={() => onChange && onChange(currentPage + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:pointer-events-none rounded transition"
              aria-label="Next Page"
            >
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
