import { useState } from 'react';

import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { generateDueInvoices } from '../api';

export default function GenerateDueButton({ onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generateDueInvoices();
      const { created = 0, skipped = 0, errors = [] } = response ?? {};
      const errorSummary = errors.slice(0, 3).map((item) => item.message).filter(Boolean).join(' ');
      const message = `${created} invoice(s) generated, ${skipped} skipped.${errors.length ? ` ${errors.length} error(s): ${errorSummary}` : ''}`;
      toast({
        title: 'Generate Due Invoices',
        description: message,
        variant: errors.length ? 'warning' : created ? 'success' : 'info',
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
  );
}
