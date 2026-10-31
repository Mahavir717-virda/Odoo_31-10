const cron = require('node-cron');
const db = require('../config/db');

/**
 * Executes plan auto-close query:
 * Closes active/paused plans that have auto_close enabled and end_date < CURRENT_DATE.
 * Logs how many plans were closed.
 */
const run = async () => {
  console.log('[PlanAutoClose Job] Running plan auto-close job...');
  try {
    const result = await db.query(
      `UPDATE plans
       SET status = 'CLOSED', updated_at = NOW()
       WHERE auto_close = TRUE
         AND end_date < CURRENT_DATE
         AND status <> 'CLOSED'
       RETURNING id`
    );

    const closedCount = result.rowCount || result.rows.length;
    console.log(`[PlanAutoClose Job] Closed ${closedCount} expired plan(s).`);
    return { closedCount, closedIds: result.rows.map((r) => r.id) };
  } catch (err) {
    console.error('[PlanAutoClose Job] Error auto-closing plans:', err);
    throw err;
  }
};

/**
 * Starts the daily plan auto-close cron job at 00:30,
 * and also runs once at server startup.
 */
const start = () => {
  // Run once immediately on startup asynchronously
  run().catch((err) => {
    console.error('[PlanAutoClose Job] Startup run failed:', err);
  });

  // Schedule daily at 00:30
  cron.schedule('30 0 * * *', async () => {
    console.log('[PlanAutoClose Job] Starting scheduled plan auto-close at 00:30...');
    try {
      await run();
    } catch (err) {
      console.error('[PlanAutoClose Job] Scheduled run encountered an error:', err);
    }
  });

  console.log('[PlanAutoClose Job] Scheduled plan auto-close job (daily at 00:30)');
};

module.exports = {
  start,
  run,
};

