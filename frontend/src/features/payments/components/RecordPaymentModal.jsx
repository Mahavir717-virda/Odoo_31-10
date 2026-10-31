import { useEffect, useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import { useToast } from '../../../components/ui/Toast';
import { formatMoney } from '../../../utils/formatMoney';
import { recordPayment } from '../api';

const METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
];

export default function RecordPaymentModal({ invoice = null, open = false, onClose, onSuccess }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const balance = Number(invoice?.balance ?? Math.max(0, Number(invoice?.total ?? 0) - Number(invoice?.amount_paid ?? 0)));
  const numericAmount = Number(amount);

  useEffect(() => {
    if (!open) return;
    setError('');
    setAmount(String(balance));
    setMethod('BANK_TRANSFER');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setNote('');
  }, [open, invoice?.id, balance]);

  const submit = async (event) => {
    event.preventDefault();
    if (!invoice) {
      setError('Select an invoice before recording a payment.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > balance) {
      setError(`Enter an amount greater than zero and no more than ${formatMoney(balance)}.`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await recordPayment({
        invoice_id: Number(invoice.id),
        method,
        amount: numericAmount,
        payment_date: paymentDate,
        note: note.trim() || undefined,
      });
      toast({ title: 'Payment recorded', description: `Payment of ${formatMoney(numericAmount)} recorded.`, variant: 'success' });
      onSuccess?.();
    } catch (requestError) {
      setError(requestError.message || 'Unable to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={invoice ? `Record payment · ${invoice.number}` : 'Record payment'} className="max-w-lg">
      {!invoice ? (
        <p className="text-sm text-red-700" role="alert">Select a valid invoice before recording payment.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <dl className="grid grid-cols-3 gap-3 rounded bg-gray-50 p-3 text-sm">
            <div><dt className="text-gray-500">Invoice total</dt><dd className="font-medium">{formatMoney(invoice.total)}</dd></div>
            <div><dt className="text-gray-500">Already paid</dt><dd className="font-medium">{formatMoney(invoice.amount_paid)}</dd></div>
            <div><dt className="text-gray-500">Balance due</dt><dd className="font-medium">{formatMoney(balance)}</dd></div>
          </dl>
          <Input id="payment-amount" label="Amount" type="number" step="0.01" min="0.01" max={balance} value={amount} onChange={(event) => setAmount(event.target.value)} required />
          <Select id="payment-method" label="Method" value={method} onChange={(event) => setMethod(event.target.value)} options={METHODS} required />
          <Input id="payment-date" label="Payment date" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required />
          <Input id="payment-note" label="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || balance <= 0} loading={submitting}>Record payment</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
