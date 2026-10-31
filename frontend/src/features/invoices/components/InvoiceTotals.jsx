import { formatMoney } from '../../../utils/formatMoney';

export default function InvoiceTotals({ invoice }) {
  if (!invoice) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 rounded border bg-gray-50">
        <p className="text-xs text-gray-500 uppercase">Subtotal</p>
        <p className="text-lg font-semibold">{formatMoney(invoice.subtotal)}</p>
      </div>
      <div className="p-4 rounded border bg-gray-50">
        <p className="text-xs text-gray-500 uppercase">Tax</p>
        <p className="text-lg font-semibold">{formatMoney(invoice.tax_total)}</p>
      </div>
      <div className="p-4 rounded border bg-gray-50">
        <p className="text-xs text-gray-500 uppercase">Discount</p>
        <p className="text-lg font-semibold">-{formatMoney(invoice.discount_total)}</p>
      </div>
      <div className="p-4 rounded border bg-gray-50">
        <p className="text-xs text-gray-500 uppercase">Total</p>
        <p className="text-lg font-semibold">{formatMoney(invoice.total)}</p>
      </div>
      <div className="p-4 rounded border bg-gray-50">
        <p className="text-xs text-gray-500 uppercase">Paid</p>
        <p className="text-lg font-semibold">{formatMoney(invoice.paid_amount)}</p>
      </div>
      <div className="col-span-1 md:col-span-3 p-4 rounded border bg-indigo-50">
        <p className="text-xs text-indigo-600 uppercase">Balance</p>
        <p className="text-lg font-semibold text-indigo-800">{formatMoney(invoice.balance)}</p>
      </div>
    </div>
  );
}
