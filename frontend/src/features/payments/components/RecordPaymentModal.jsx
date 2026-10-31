import { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import { ToastProvider, useToast } from '../../../components/ui/Toast';
import { formatMoney } from '../../../utils/formatMoney';
import { recordPayment } from '../api';
import { getInvoiceBalance } from '../mock';

export default function RecordPaymentModal({ invoice, open, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) {
      setFormError(null);
      setAmount('');
      setNote('');
      return;
    }
    const balance = invoice ? getInvoiceBalance(invoice.id) : 0;
    setAmount(String(balance));
    setDate(new Date().toISOString().split('T')[0]);
  }, [open, invoice]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await recordPayment({
        invoice_id: invoice.id,
        amount,
        method,
        date,
        note,
      });
      toast({
        title: 'Payment Recorded',
        description: `Payment of ${formatMoney(amount)} recorded.`,
        variant: 'success',
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setFormError(err.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  const balance = invoice ? getInvoiceBalance(invoice.id) : 0;
  const amountNum = Number(amount);
  const isValid = amountNum > 0 && amountNum <= balance;

  return (
    <ToastProvider>
      <Modal
        open={open}
        onClose={onClose}
        title={`Record Payment - ${invoice.invoice_number}`}
        className="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-500 mb-2">
            Outstanding balance: {formatMoney(balance)}
          </div>
          <Input
            id="amount"
            label="Amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            error={Boolean(formError) && amountNum > balance}
            errorMessage={amountNum > balance ? 'Amount exceeds outstanding balance.' : undefined}
          />
          <Select
            id="method"
            label="Method"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
            options={[
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'credit_card', label: 'Credit Card' },
              { value: 'check', label: 'Check' },
              { value: 'cash', label: 'Cash' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Input
            id="date"
            label="Date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
          <Input
            id="note"
            label="Note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
          />
          {formError && (
            <p className="text-sm text-red-600" role="alert">{formError}</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValid} >
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </ToastProvider>
  );
}
