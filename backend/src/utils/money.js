/**
 * Money utility functions for precise 2-decimal financial calculations
 */

/**
 * Rounds a number to 2 decimal places
 * @param {number|string} val
 * @returns {number}
 */
const round2 = (val) => {
  const num = Number(val) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Computes line total amount: quantity * unit_price rounded to 2 decimal places
 * @param {number} quantity
 * @param {number} unitPrice
 * @returns {number}
 */
const computeLineAmount = (quantity, unitPrice) => {
  return round2((Number(quantity) || 0) * (Number(unitPrice) || 0));
};

/**
 * Computes line tax amount: (lineAmount * taxRate) / 100 rounded to 2 decimal places
 * @param {number} lineAmount
 * @param {number} taxRate
 * @returns {number}
 */
const computeTaxAmount = (lineAmount, taxRate) => {
  return round2(((Number(lineAmount) || 0) * (Number(taxRate) || 0)) / 100);
};

/**
 * Computes totals for an array of lines { amount, tax_amount }
 * @param {Array<{ amount: number, tax_amount: number }>} lines
 * @returns {{ subtotal: number, tax_total: number, total: number }}
 */
const computeTotals = (lines = []) => {
  let subtotal = 0;
  let taxTotal = 0;

  for (const line of lines) {
    subtotal += Number(line.amount) || 0;
    taxTotal += Number(line.tax_amount) || 0;
  }

  subtotal = round2(subtotal);
  taxTotal = round2(taxTotal);
  const total = round2(subtotal + taxTotal);

  return {
    subtotal,
    tax_total: taxTotal,
    total,
  };
};

module.exports = {
  round2,
  computeLineAmount,
  computeTaxAmount,
  computeTotals,
};

