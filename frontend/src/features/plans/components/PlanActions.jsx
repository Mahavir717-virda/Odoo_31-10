import Button from '../../../components/ui/Button';

export default function PlanActions({
  plan,
  onEdit,
  onClosePlan,
  onTogglePause,
  onRenew,
  onDelete,
}) {
  const isClosed = plan.status === 'CLOSED';
  const isActive = plan.status === 'ACTIVE';

  return (
    <div
      className="flex items-center flex-wrap gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Edit */}
      <Button size="sm" variant="ghost" onClick={() => onEdit(plan)}>
        Edit
      </Button>

      {/* Pausable Action */}
      {plan.pausable && isActive && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onTogglePause(plan)}
          title="Pause recurring billing"
        >
          Pause
        </Button>
      )}

      {/* Closable Action */}
      {plan.closable && !isClosed && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onClosePlan(plan)}
          className="text-amber-700 border-amber-300 hover:bg-amber-50"
          title="Close plan early"
        >
          Close
        </Button>
      )}

      {/* Renewable Action */}
      {plan.renewable && !isActive && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRenew(plan)}
          className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
          title="Renew plan term"
        >
          Renew
        </Button>
      )}

      {/* Delete */}
      <Button
        size="sm"
        variant="danger"
        onClick={() => onDelete(plan.id)}
      >
        Delete
      </Button>
    </div>
  );
}
