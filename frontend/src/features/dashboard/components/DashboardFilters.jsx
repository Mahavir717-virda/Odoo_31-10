import { useCallback } from 'react';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

export default function DashboardFilters({ filters, onChange }) {
  const { start_date = '', end_date = '', status = '' } = filters;

  const handleChange = useCallback(
    (key, value) => {
      onChange({ ...filters, [key]: value || undefined });
    },
    [filters, onChange]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Input
        id="dashboard-start-date"
        label="From Date"
        type="date"
        value={start_date}
        onChange={(event) => handleChange('start_date', event.target.value)}
        placeholder="Start date"
      />
      <Input
        id="dashboard-end-date"
        label="To Date"
        type="date"
        value={end_date}
        onChange={(event) => handleChange('end_date', event.target.value)}
        placeholder="End date"
      />
      <Select
        id="dashboard-status"
        label="Status"
        value={status}
        onChange={(event) => handleChange('status', event.target.value)}
        placeholder="All statuses"
        options={[
          { value: '', label: 'All Statuses' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'paid', label: 'Paid' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'partial', label: 'Partial' },
        ]}
      />
    </div>
  );
}
