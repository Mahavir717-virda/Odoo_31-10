export function formatDate(date, options = {}) {
  if (!date) {
    return '-';
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(parsed);
}

export function formatDateTime(date) {
  return formatDate(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
