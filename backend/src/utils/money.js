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

/**
 * Computes totals for invoice lines and applied discounts
 * @param {Array<{ amount: number, tax_amount: number, product_id?: number }>} lines
 * @param {Array<{ id: number, type: string, value: number, scope: string, product_ids?: number[] }>} applicableDiscounts
 * @returns {{ subtotal: number, discount_total: number, tax_total: number, total: number, appliedDiscounts: Array<{ discount_id: number, amount: number }> }}
 */
const computeInvoiceTotals = (lines = [], applicableDiscounts = []) => {
  let subtotal = 0;
  let tax_total = 0;

  for (const line of lines) {
    subtotal += Number(line.amount || 0);
    tax_total += Number(line.tax_amount || 0);
  }

  subtotal = round2(subtotal);
  tax_total = round2(tax_total);

  let discount_total = 0;
  const appliedDiscounts = [];

  for (const discount of applicableDiscounts) {
    let eligibleBase = 0;
    if (discount.scope === 'SUBSCRIPTION') {
      eligibleBase = subtotal;
    } else if (discount.scope === 'PRODUCTS') {
      const prodSet = new Set((discount.product_ids || []).map(Number));
      const matchLines = lines.filter((l) => prodSet.has(Number(l.product_id)));
      eligibleBase = matchLines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    }

    let discAmount = 0;
    if (discount.type === 'PERCENT') {
      discAmount = round2((eligibleBase * Number(discount.value)) / 100);
    } else if (discount.type === 'FIXED') {
      discAmount = round2(Math.min(Number(discount.value), eligibleBase));
    }

    if (discAmount > 0) {
      discount_total += discAmount;
      appliedDiscounts.push({
        discount_id: discount.id,
        amount: discAmount,
      });
    }
  }

  discount_total = round2(discount_total);
  const total = round2(Math.max(0, subtotal - discount_total + tax_total));

  return {
    subtotal,
    discount_total,
    tax_total,
    total,
    appliedDiscounts,
  };
};

module.exports = {
  round2,
  computeLineAmount,
  computeTaxAmount,
  computeTotals,
  computeInvoiceTotals,
};
