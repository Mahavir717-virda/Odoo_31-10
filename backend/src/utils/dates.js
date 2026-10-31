/**
 * Date calculation and formatting helpers
 */

/**
 * Adds days to a date string (YYYY-MM-DD) or Date object, returning 'YYYY-MM-DD'
 * @param {string|Date} date
 * @param {number} days
 * @returns {string}
 */
const addDays = (date, days) => {
  const str = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + Number(days)));
  return dt.toISOString().split('T')[0];
};

/**
 * Adds a billing period (DAILY, WEEKLY, MONTHLY, YEARLY) to a date string (YYYY-MM-DD)
 * @param {string|Date} date
 * @param {'DAILY'|'WEEKLY'|'MONTHLY'|'YEARLY'} period
 * @returns {string}
 */
const addPeriod = (date, period) => {
  const str = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  const [y, m, d] = str.split('-').map(Number);

  switch (period) {
    case 'DAILY':
      return addDays(str, 1);
    case 'WEEKLY':
      return addDays(str, 7);
    case 'MONTHLY': {
      const targetMonth = m; // 1-indexed target month
      const targetYear = y + Math.floor(targetMonth / 12);
      const normalizedMonth = targetMonth % 12; // 0-indexed month
      const daysInTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
      const targetDay = Math.min(d, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, normalizedMonth, targetDay)).toISOString().split('T')[0];
    }
    case 'YEARLY': {
      const targetYear = y + 1;
      const daysInTargetMonth = new Date(Date.UTC(targetYear, m, 0)).getUTCDate();
      const targetDay = Math.min(d, daysInTargetMonth);
      return new Date(Date.UTC(targetYear, m - 1, targetDay)).toISOString().split('T')[0];
    }
    default:
      throw new Error(`Unsupported billing period: ${period}`);
  }
};

/**
 * Returns today's date formatted as 'YYYY-MM-DD'
 * @returns {string}
 */
const todayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Formats a Date or date string to 'YYYY-MM-DD'
 * @param {string|Date} date
 * @returns {string|null}
 */
const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

module.exports = {
  addDays,
  addPeriod,
  todayDate,
  formatDate,
};
