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
  const d = new Date(date);
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split('T')[0];
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
  todayDate,
  formatDate,
};

