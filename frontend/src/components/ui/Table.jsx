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
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto border border-gray-200 rounded-md ${className}`}>
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row) => {
            const key = row[rowKey] ?? row.id ?? String(row[rowKey] ?? '');
            return (
              <tr
                key={key}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td
                    key={`${column.key}-${key}`}
                    className="px-4 py-3 border-b border-gray-200 text-gray-900"
                  >
                    {column.format ? column.format(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
