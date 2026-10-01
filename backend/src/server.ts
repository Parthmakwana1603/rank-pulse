import { createApp } from './app.js';
import { env } from './config/env.js';
import { jobs } from './services/jobs/job-runner.js';
import { logger } from './utils/logger.js';

const server = createApp().listen(env.PORT, () => {
  logger.info(`RankPulse API listening on http://localhost:${env.PORT}/api`, { env: env.NODE_ENV });
});

function shutdown(signal: string) {
  logger.info('Shutting down', { signal });
  server.close(() => {
    // Give running audits/reports a moment to finish writing their status.
    Promise.race([jobs.idle(), new Promise((r) => setTimeout(r, 10_000))]).finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
