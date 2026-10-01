import { errorFields, logger } from '../../utils/logger.js';

/**
 * In-process job queue for long-running work (site audits, report files). Jobs record their own
 * status in the database (pending → running → completed/failed), so a separate worker process
 * (e.g. a queue like BullMQ) can replace this class later without changing the API.
 *
 * Limitation: jobs live in memory. If the server restarts mid-job, the job's row stays
 * "running"; services treat such rows as failed once they are older than their time limit.
 */
export class JobRunner {
  private queue: { label: string; run: () => Promise<void> }[] = [];
  private active = 0;
  private idleWaiters: (() => void)[] = [];

  constructor(private readonly concurrency: number) {}

  enqueue(label: string, run: () => Promise<void>) {
    this.queue.push({ label, run });
    this.next();
  }

  /** Resolves when no job is queued or running (used by tests and graceful shutdown). */
  idle(): Promise<void> {
    if (this.active === 0 && this.queue.length === 0) return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  private next() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift()!;
      this.active++;
      job
        .run()
        .catch((err) => logger.error('Job crashed', { job: job.label, ...errorFields(err) }))
        .finally(() => {
          this.active--;
          this.next();
          if (this.active === 0 && this.queue.length === 0) {
            for (const resolve of this.idleWaiters.splice(0)) resolve();
          }
        });
    }
  }
}

export const jobs = new JobRunner(2);
