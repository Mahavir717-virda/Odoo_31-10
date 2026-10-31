export default function UsageProgress({
  used = 0,
  limit = null,
  className = '',
}) {
  const numericUsed = Number(used) || 0;
  const isUnlimited = limit === null || limit === undefined || limit === '' || Number(limit) <= 0;

  if (isUnlimited) {
    return (
      <div className={`w-full max-w-xs ${className}`}>
        <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
          <span className="font-medium text-gray-800">{numericUsed} redeemed</span>
          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            ∞ Unlimited
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className="h-1.5 rounded-full bg-emerald-500 w-full opacity-60" />
        </div>
      </div>
    );
  }

  const numericLimit = Number(limit);
  const percent = Math.min(100, Math.round((numericUsed / numericLimit) * 100));
  const isExhausted = numericUsed >= numericLimit;

  let barColor = 'bg-indigo-600';
  let textColor = 'text-gray-600';

  if (isExhausted) {
    barColor = 'bg-red-600';
    textColor = 'text-red-700 font-semibold';
  } else if (percent >= 80) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-700 font-medium';
  }

  return (
    <div className={`w-full max-w-xs ${className}`}>
      <div className={`flex justify-between items-center text-xs mb-1 ${textColor}`}>
        <span>{numericUsed} / {numericLimit} used</span>
        <span>
          {isExhausted ? (
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
              Limit Reached
            </span>
          ) : (
            `${percent}%`
          )}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
