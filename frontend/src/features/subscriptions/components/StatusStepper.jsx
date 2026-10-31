import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { NEXT_STATUS_ACTION } from '../api';

const STATUS_ORDER = ['draft', 'quotation', 'confirmed', 'active', 'closed'];

const STATUS_VARIANTS = {
  draft: 'default',
  quotation: 'info',
  confirmed: 'default',
  active: 'success',
  closed: 'danger',
  paused: 'warning',
  expired: 'danger',
  cancelled: 'default',
};

export default function StatusStepper({ status, onStatusChange, className = '' }) {
  const nextAction = NEXT_STATUS_ACTION[status] ?? null;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm">
        {STATUS_ORDER.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[step] ?? 'default'}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </Badge>
            {index < STATUS_ORDER.length - 1 && (
              <span className="text-gray-400">→</span>
            )}
          </div>
        ))}
        {status === 'paused' && (
          <span className="ml-2 text-sm text-gray-600">(Paused)</span>
        )}
      </div>

      {nextAction && onStatusChange ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => onStatusChange(nextAction.to)}
          className="w-auto"
        >
          {nextAction.label}
        </Button>
      ) : (
        status === 'paused' ? (
          <span className="text-sm text-gray-500 italic">No status transition available while paused.</span>
        ) : (
          <span className="text-sm text-gray-500 italic">No further status transitions available.</span>
        )
      )}
    </div>
  );
}
