import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Skeleton from './Skeleton';
import { formatMoney } from '../../../utils/formatMoney';

export default function RevenueChart({ data, loading, error }) {
  if (loading) {
    return (
      <Card padded={false}>
        <div className="p-8 flex flex-col items-center justify-center min-h-[260px] space-y-2">
          <Skeleton height="10" width="30%" />
          <Skeleton height="8" width="60%" />
          <Skeleton height="8" width="45%" />
          <Skeleton height="8" width="30%" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
          Error loading revenue trend: {error.message}
        </div>
      </Card>
    );
  }

  const points = data && data.length ? data : [];
  if (points.length === 0) {
    return (
      <Card>
        <EmptyState title="No revenue data" description="No revenue records found for the selected period." />
      </Card>
    );
  }

  const width = 640;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const revenues = points.map((point) => point.revenue);
  const minRevenue = Math.min(...revenues);
  const maxRevenue = Math.max(...revenues);
  const revenueRange = maxRevenue - minRevenue || 1;

  const x = (index) => padding.left + (index / (points.length - 1 || 1)) * plotWidth;
  const y = (value) =>
    padding.top + plotHeight - ((value - minRevenue) / revenueRange) * plotHeight;

  const line = points
    .map((point, index) => `${x(index)},${y(point.revenue)}`)
    .join(' ');

  const areaLine = points
    .map((point, index) => `${x(index)},${y(point.revenue)}`)
    .concat([`${x(points.length - 1)},${height - padding.bottom}`, `${padding.left},${height - padding.bottom}`])
    .join(' ');

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend (12 Months)</h3>
        <div className="w-full" style={{ minHeight: height }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue trend chart">
            <defs>
              <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={areaLine}
              fill="url(#revenueGradient)"
              fillOpacity={0.6}
            />
            <polyline
              points={line}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={x(index)}
                cy={y(point.revenue)}
                r={3.5}
                fill="#4f46e5"
              />
            ))}
            {/* X axis labels */}
            {points.map((point, index) => (
              <text
                key={index}
                x={x(index)}
                y={height - padding.bottom + 17}
                fontSize="11"
                fill="#6b7280"
                textAnchor="middle"
              >
                {point.month}
              </text>
            ))}
            {/* Y axis labels */}
            {[
              minRevenue,
              Number(((minRevenue + maxRevenue) / 2).toFixed(0)),
              maxRevenue,
            ].map((value, index) => (
              <text
                key={index}
                x={padding.left - 8}
                y={index === 0 ? height - padding.bottom : index === 2 ? padding.top - 6 : y(value)}
                fontSize="11"
                fill="#6b7280"
                textAnchor={index === 0 || index === 2 ? 'end' : 'start'}
                dy={index === 1 ? '0.33em' : undefined}
              >
                {formatMoney(value)}
              </text>
            ))}
          </svg>
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          {points.map((point) => (
            <div key={point.month} className="flex flex-col items-center">
              <span className="text-gray-500">{point.month}</span>
              <span className="font-medium text-gray-900">{formatMoney(point.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
