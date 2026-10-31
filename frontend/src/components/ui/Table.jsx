import Spinner from './Spinner';

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  rowKey = 'id',
  className = '',
  onRowClick,
}) {
  if (loading) {
    return (
      <div className="w-full bg-white border border-[#E5E7EB] rounded-xl shadow-2xs flex min-h-[260px] items-center justify-center text-gray-500">
        <div className="flex items-center space-x-2.5">
          <Spinner />
          <span className="text-sm text-gray-500 font-medium">Loading data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-white border border-[#E5E7EB] rounded-xl shadow-2xs flex min-h-[220px] items-center justify-center text-gray-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`w-full bg-white border border-[#E5E7EB] rounded-xl shadow-2xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-[11px] lg:text-[12px] font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F3F5] bg-white">
            {data.map((row) => {
              const key = row[rowKey] ?? row.id ?? String(row[rowKey] ?? '');
              return (
                <tr
                  key={key}
                  className={`h-[68px] transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-[#F9FAFB]' : 'hover:bg-[#FBFBFB]'
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={`${column.key}-${key}`}
                      className="px-6 py-4 text-[14px] text-gray-800"
                    >
                      {column.render
                        ? column.render(row, row[column.key])
                        : column.format
                          ? column.format(row[column.key], row)
                          : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
