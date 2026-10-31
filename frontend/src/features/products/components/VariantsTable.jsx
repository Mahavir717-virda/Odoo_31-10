import { formatMoney } from '../../../utils/formatMoney';
import Button from '../../../components/ui/Button';

export default function VariantsTable({ variants = [], onRemove = null }) {
  if (!variants || variants.length === 0) {
    return (
      <div className="p-4 text-center border border-dashed border-gray-300 rounded-lg text-sm text-gray-500">
        No variants defined for this product.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
          <tr>
            <th className="px-4 py-2 border-b">Variant Name</th>
            <th className="px-4 py-2 border-b">Price</th>
            {onRemove && <th className="px-4 py-2 border-b text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {variants.map((v, i) => (
            <tr key={v.id || i}>
              <td className="px-4 py-2 text-gray-900 font-medium">{v.name}</td>
              <td className="px-4 py-2 text-gray-700">{formatMoney(v.price)}</td>
              {onRemove && (
                <td className="px-4 py-2 text-right">
                  <Button size="sm" variant="danger" onClick={() => onRemove(i)}>
                    Remove
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

