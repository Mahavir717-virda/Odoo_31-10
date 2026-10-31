const { Pool, types } = require('pg');
const env = require('./env');

// Type parsers
// 1700 is NUMERIC - parse as float
types.setTypeParser(1700, parseFloat);
// 1082 is DATE - keep as 'YYYY-MM-DD' strings (no timezone shifts)
types.setTypeParser(1082, (v) => v);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute query using pool or client
 * @param {string} text
 * @param {Array} [params]
 * @param {import('pg').PoolClient} [client]
 */
const query = (text, params, client) => {
  if (client && typeof client.query === 'function') {
    return client.query(text, params);
  }
  return pool.query(text, params);
};

/**
 * Get dedicated client from pool
 */
const getClient = () => {
  return pool.connect();
};

/**
 * Execute callback within a transaction (BEGIN/COMMIT/ROLLBACK)
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
};

