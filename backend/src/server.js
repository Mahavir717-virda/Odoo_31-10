const fs = require('fs');
const path = require('path');
const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

/**
 * Dynamically discover and start all background jobs in src/jobs/*.job.js
 */
const startJobs = () => {
  const jobsDir = path.join(__dirname, 'jobs');
  if (!fs.existsSync(jobsDir)) return;

  const files = fs.readdirSync(jobsDir);
  files.forEach((file) => {
    if (file.endsWith('.job.js')) {
      const jobPath = path.join(jobsDir, file);
      try {
        const job = require(jobPath);
        if (typeof job.start === 'function') {
          job.start();
          console.log(`[Jobs] Started background job: ${file}`);
        }
      } catch (err) {
        console.warn(`[Jobs] Could not start job ${file}: ${err.message}`);
      }
    }
  });
};

const startServer = async () => {
  try {
    // 1. Test database connection
    console.log('[Database] Connecting to PostgreSQL...');
    const result = await db.query('SELECT NOW() AS current_time');
    console.log(`[Database] Connected successfully. DB time: ${result.rows[0].current_time}`);

    // 2. Start background jobs
    startJobs();

    // 3. Listen for requests
    app.listen(env.PORT, () => {
      console.log(`[Server] Brightloop backend running on http://localhost:${env.PORT}`);
      console.log(`[Server] Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
