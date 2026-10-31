import { useState } from 'react';

import Button from '../../../components/ui/Button';
import { ToastProvider, useToast } from '../../../components/ui/Toast';
import { generateDueInvoices } from '../api';

export default function GenerateDueButton({ onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generateDueInvoices();
      const { created, message } = response;
      toast({
        title: 'Generate Due Invoices',
        description: message,
        variant: created.length ? 'success' : 'info',
      });
      onSuccess?.();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to generate due invoices.',
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToastProvider>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        loading={loading}
        onClick={handleGenerate}
      >
        Generate Due Invoices
      </Button>
    </ToastProvider>
  );
}
