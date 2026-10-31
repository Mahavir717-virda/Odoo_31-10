import { formatMoney } from '../../../utils/formatMoney';
import Button from '../../../components/ui/Button';

export default function VariantsTable({
  basePrice = 0,
  variants = [],
  onEdit = null,
  onRemove = null,
  readOnly = false,
}) {
  const numericBasePrice = Number(basePrice) || 0;

  if (!variants || variants.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
        <p className="text-sm font-medium text-gray-600">No product variants configured.</p>
        <p className="text-xs text-gray-400 mt-1">
          Variants inherit the base sales price plus an optional extra surcharge.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 border-b">Attribute</th>
            <th className="px-4 py-3 border-b">Value / Option</th>
            <th className="px-4 py-3 border-b">Extra Price</th>
            <th className="px-4 py-3 border-b font-bold text-indigo-700">Computed Final Price</th>
            {!readOnly && (onEdit || onRemove) && (
              <th className="px-4 py-3 border-b text-right">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {variants.map((v, index) => {
            const extra = Number(v.extra_price) || 0;
            const finalPrice = numericBasePrice + extra;

            return (
              <tr key={v.id || index} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{v.attribute}</td>
                <td className="px-4 py-3 text-gray-700">{v.value}</td>
                <td className="px-4 py-3 text-gray-600">
                  {extra >= 0 ? `+${formatMoney(extra)}` : `-${formatMoney(Math.abs(extra))}`}
                </td>
                <td className="px-4 py-3 font-bold text-indigo-600">
                  {formatMoney(finalPrice)}
                </td>
                {!readOnly && (onEdit || onRemove) && (
                  <td className="px-4 py-3 text-right space-x-2">
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(v, index)}
                        type="button"
                      >
                        Edit
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onRemove(index)}
                        type="button"
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
