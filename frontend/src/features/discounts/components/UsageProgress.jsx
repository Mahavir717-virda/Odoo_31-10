export default function UsageProgress({ current = 0, max = 0 }) {
  if (!max || max <= 0) {
    return <span className="text-xs text-gray-500">{current} / Unlimited</span>;
  }

  const percent = Math.min(100, Math.round((current / max) * 100));

  let barColor = 'bg-indigo-600';
  if (percent >= 100) {
    barColor = 'bg-red-500';
  } else if (percent >= 80) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{current} used</span>
        <span>{max} limit ({percent}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

