import { useState } from 'react';

import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { useToast } from '../../../components/ui/Toast';
import {
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
  getInvoiceActions,
} from '../api';

const ACTION_LABELS = {
  confirm: 'Confirm',
  cancel: 'Cancel',
  send: 'Send',
  record_payment: 'Record Payment',
};

const ACTION_VARIANTS = {
  confirm: 'primary',
  cancel: 'danger',
  send: 'outline',
  record_payment: 'secondary',
};

export default function InvoiceActions({ invoice, onSuccess }) {
  const { toast } = useToast();
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const actions = getInvoiceActions(invoice.status, invoice.balance, invoice.amount_paid);

  const handleAction = async (action) => {
    if (pendingAction) return;
    setPendingAction(action);

    try {
      if (action === 'confirm') {
        await confirmInvoice(invoice.id);
      } else if (action === 'cancel') {
        await cancelInvoice(invoice.id);
      } else if (action === 'send') {
        await sendInvoice(invoice.id);
      }
      toast({
        title: 'Done',
        description: `Invoice ${ACTION_LABELS[action].toLowerCase()} successfully.`,
        variant: 'success',
      });
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Action failed.',
        variant: 'danger',
      });
    } finally {
      setPendingAction(null);
    }
  };

  const handleCancel = () => {
    setConfirmTarget('cancel');
  };

  const handleConfirmCancel = async () => {
    if (pendingAction) return;
    setPendingAction('cancel');
    try {
      await cancelInvoice(invoice.id);
      toast({ title: 'Cancelled', description: 'Invoice cancelled.', variant: 'success' });
      onSuccess?.();
    } catch (err) {
      toast({ title: 'Error', description: err.message || 'Cancel failed.', variant: 'danger' });
    } finally {
      setConfirmTarget(null);
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {actions.map((action) => {
          if (action === 'record_payment') {
            return (
              <Button
                key={action}
                variant={ACTION_VARIANTS[action]}
                size="sm"
                disabled={pendingAction}
                onClick={() => onSuccess?.('record_payment', invoice)}
              >
                {ACTION_LABELS[action]}
              </Button>
            );
          }
          if (action === 'cancel') {
            return (
              <Button
                key={action}
                variant={ACTION_VARIANTS[action]}
                size="sm"
                disabled={pendingAction}
                onClick={handleCancel}
              >
                {ACTION_LABELS[action]}
              </Button>
            );
          }
          return (
            <Button
              key={action}
              variant={ACTION_VARIANTS[action]}
              size="sm"
              disabled={pendingAction}
              loading={pendingAction === action}
              onClick={() => handleAction(action)}
            >
              {ACTION_LABELS[action]}
            </Button>
          );
        })}
      </div>

      {confirmTarget === 'cancel' && (
        <ConfirmDialog
          open
          onConfirm={handleConfirmCancel}
          onCancel={() => setConfirmTarget(null)}
          title="Cancel Invoice"
          message={`Are you sure you want to cancel invoice ${invoice.number}?`}
          confirmLabel="Yes, Cancel"
          cancelLabel="No"
          confirmVariant="danger"
        />
      )}
    </>
  );
}
