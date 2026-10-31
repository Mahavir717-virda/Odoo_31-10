import { formatMoney } from '../../../utils/formatMoney';

export default function SubscriptionLines({ lines = [] }) {
  if (!lines || lines.length === 0) {
    return (
      <div className="text-sm text-gray-400 text-center py-8 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
        No line items attached to this subscription.
      </div>
    );
  }

  const subtotal = lines.reduce((sum, line) => {
    const qty = Number(line.quantity || 1);
    const price = Number(line.unit_price || 0);
    const amount = Number(line.amount != null ? line.amount : (line.total != null ? line.total : qty * price));
    return sum + amount;
  }, 0);

  const totalTax = lines.reduce((sum, line) => {
    const qty = Number(line.quantity || 1);
    const price = Number(line.unit_price || 0);
    const lineAmount = Number(line.amount != null ? line.amount : (line.total != null ? line.total : qty * price));
    const taxRate = Number(line.tax_rate ?? line.tax_rate_percent ?? 0);
    const taxAmt = line.tax_amount != null ? Number(line.tax_amount) : (taxRate / 100) * lineAmount;
    return sum + taxAmt;
  }, 0);

  const grandTotal = subtotal + totalTax;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full text-left border-collapse min-w-[620px]">
        <thead>
          <tr className="bg-[#EEF2F8] border-b border-[#E2E8F0] text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            <th className="py-3 px-4">Product</th>
            <th className="py-3 px-4">Variant</th>
            <th className="py-3 px-4 text-center">Qty</th>
            <th className="py-3 px-4 text-right">Unit Price</th>
            <th className="py-3 px-4 text-right">Tax</th>
            <th className="py-3 px-4 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-[13px] text-gray-700 bg-white">
          {lines.map((line, idx) => {
            const qty = Number(line.quantity || 1);
            const price = Number(line.unit_price || 0);
            const lineAmount = Number(line.amount != null ? line.amount : (line.total != null ? line.total : qty * price));
            const taxRate = Number(line.tax_rate ?? line.tax_rate_percent ?? 0);
            const taxAmt = line.tax_amount != null ? Number(line.tax_amount) : (taxRate / 100) * lineAmount;
            const lineTotal = lineAmount + taxAmt;

            return (
              <tr key={line.id || idx} className="hover:bg-[#F6F9FF] transition">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-gray-900">
                    {line.product_name ?? line.description ?? line.product ?? 'Standard Item'}
                  </div>
                  {line.description && line.description !== line.product_name && (
                    <div className="text-[12px] text-gray-400 mt-0.5">{line.description}</div>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  {line.variant_label || line.variant ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#F1F5F9] text-gray-700 border border-[#E2E8F0]">
                      {line.variant_label || line.variant}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center font-semibold text-gray-800">
                  {qty}
                </td>
                <td className="py-3.5 px-4 text-right text-gray-700">
                  {formatMoney(price)}
                </td>
                <td className="py-3.5 px-4 text-right text-gray-500">
                  {taxRate > 0 ? `${taxRate}%` : '0%'}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                  {formatMoney(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0] text-[13px]">
          <tr>
            <td colSpan="5" className="py-2.5 px-4 text-right font-medium text-gray-500">
              Subtotal
            </td>
            <td className="py-2.5 px-4 text-right font-semibold text-gray-800">
              {formatMoney(subtotal)}
            </td>
          </tr>
          {totalTax > 0 && (
            <tr>
              <td colSpan="5" className="py-2 px-4 text-right font-medium text-gray-500">
                Estimated Tax
              </td>
              <td className="py-2 px-4 text-right font-semibold text-gray-800">
                {formatMoney(totalTax)}
              </td>
            </tr>
          )}
          <tr className="border-t border-[#E2E8F0]">
            <td colSpan="5" className="py-3 px-4 text-right font-bold text-gray-900 text-[14px]">
              Total Recurring Amount
            </td>
            <td className="py-3 px-4 text-right font-bold text-[#2563EB] text-[15px]">
              {formatMoney(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
