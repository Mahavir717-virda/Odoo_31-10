const cron = require('node-cron');
const { generateDue } = require('../modules/invoices/invoices.service');

/**
 * Executes generateDue manually and returns the result
 */
const run = async () => {
  console.log('[Billing Job] Running generateDue manually...');
  try {
    const result = await generateDue();
    console.log('[Billing Job] Finished:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('[Billing Job] Error running generateDue:', err);
    throw err;
  }
};

/**
 * Starts the daily billing cron job at 01:00
 */
const start = () => {
  // '0 1 * * *' schedules daily at 01:00
  cron.schedule('0 1 * * *', async () => {
    console.log('[Billing Job] Starting scheduled generateDue at 01:00...');
    try {
      const result = await generateDue();
      console.log('[Billing Job] Scheduled run completed successfully:', JSON.stringify(result));
    } catch (err) {
      console.error('[Billing Job] Scheduled run encountered an error:', err);
    }
  });

  console.log('[Billing Job] Scheduled billing job (daily at 01:00)');
};

module.exports = {
  start,
  run,
};

