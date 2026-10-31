/**
 * Status Flow state machine for Subscriptions
 * DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED
 */

const STATUS_TRANSITIONS = {
  DRAFT: 'QUOTATION',
  QUOTATION: 'CONFIRMED',
  CONFIRMED: 'ACTIVE',
  ACTIVE: 'CLOSED',
};

/**
 * Checks if a status transition from -> to is allowed
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
const canTransition = (from, to) => {
  return STATUS_TRANSITIONS[from] === to;
};

module.exports = {
  STATUS_TRANSITIONS,
  canTransition,
};

