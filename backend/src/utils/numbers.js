const db = require('../config/db');

/**
 * Generates the next subscription number, e.g. SUB-0001
 * Uses sequence subscription_number_seq
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<string>}
 */
const nextSubscriptionNumber = async (client = null) => {
  const res = await db.query(
    "SELECT 'SUB-' || lpad(nextval('subscription_number_seq')::text, 4, '0') AS num",
    [],
    client
  );
  return res.rows[0].num;
};

/**
 * Generates the next invoice number, e.g. INV-0001
 * Uses sequence invoice_number_seq
 * @param {import('pg').PoolClient} [client]
 * @returns {Promise<string>}
 */
const nextInvoiceNumber = async (client = null) => {
  const res = await db.query(
    "SELECT 'INV-' || lpad(nextval('invoice_number_seq')::text, 4, '0') AS num",
    [],
    client
  );
  return res.rows[0].num;
};

module.exports = {
  nextSubscriptionNumber,
  nextInvoiceNumber,
};

