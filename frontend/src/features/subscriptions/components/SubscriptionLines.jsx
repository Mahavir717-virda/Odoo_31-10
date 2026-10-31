import { formatMoney } from '../../../utils/formatMoney';

export default function SubscriptionLines({ lines = [] }) {
  if (!lines || lines.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No line items.
      </div>
    );
  }

  return (
    <table className="w-full text-sm divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Variant</th>
          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Tax</th>
          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="bg-white">
            <td className="px-3 py-2 text-gray-900">{line.product}</td>
            <td className="px-3 py-2 text-gray-900">{line.variant}</td>
            <td className="px-3 py-2 text-gray-900">{line.quantity}</td>
            <td className="px-3 py-2 text-right text-gray-900">{formatMoney(line.unit_price || 0)}</td>
            <td className="px-3 py-2 text-right text-gray-900">{formatMoney(line.tax_amount || 0)}</td>
            <td className="px-3 py-2 text-right text-gray-900 font-medium">{formatMoney(line.total || 0)}</td>
          </tr>
        ))}
        <tr className="bg-gray-50">
          <td colSpan="5" className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
            Total
          </td>
          <td className="px-3 py-2 text-right text-sm font-semibold text-gray-900">
            {formatMoney(
              lines.reduce((sum, line) => sum + (line.total || 0), 0)
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
