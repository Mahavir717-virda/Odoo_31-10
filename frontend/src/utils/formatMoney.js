export function formatMoney(amount, currency = 'USD') {
  const value = Number(amount);
  if (Number.isNaN(value)) {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function parseMoney(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const number = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isNaN(number) ? 0 : number;
}
