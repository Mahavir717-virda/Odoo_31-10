import Button from '../../../components/ui/Button';

export default function PlanActions({ onEdit, onDelete, plan }) {
  return (
    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
      <Button size="sm" variant="ghost" onClick={() => onEdit(plan)}>
        Edit
      </Button>
      <Button size="sm" variant="danger" onClick={() => onDelete(plan.id)}>
        Delete
      </Button>
    </div>
  );
}

