import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

function isoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function presetDates(preset) {
  const end = new Date();
  const start = new Date(end);
  if (preset === 'month') start.setDate(1);
  else if (preset === 'quarter') start.setMonth(start.getMonth() - 3);
  else if (preset === 'year') start.setMonth(0, 1);
  else start.setDate(start.getDate() - 29);
  return { start_date: isoDate(start), end_date: isoDate(end) };
}

export default function DashboardFilters({ filters, onChange }) {
  const preset = filters.preset ?? 'month';
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Select
        id="dashboard-period"
        label="Date range"
        value={preset}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value === 'custom' ? { ...filters, preset: value } : { ...presetDates(value), preset: value });
        }}
        options={[
          { value: '30days', label: 'Last 30 days' },
          { value: 'month', label: 'This month' },
          { value: 'quarter', label: 'Last 3 months' },
          { value: 'year', label: 'This year' },
          { value: 'custom', label: 'Custom range' },
        ]}
      />
      {preset === 'custom' && <>
        <Input id="dashboard-start-date" label="From" type="date" value={filters.start_date ?? ''} onChange={(event) => onChange({ ...filters, start_date: event.target.value })} />
        <Input id="dashboard-end-date" label="To" type="date" value={filters.end_date ?? ''} onChange={(event) => onChange({ ...filters, end_date: event.target.value })} />
      </>}
    </div>
  );
}
