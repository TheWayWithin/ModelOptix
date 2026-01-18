/**
 * Job Reaper
 *
 * Marks stale 'running' jobs as 'failed' if they haven't sent a heartbeat
 * in the last 5 minutes. This handles cases where a job instance crashed
 * without properly releasing its lock.
 *
 * This job does NOT use locking itself - it's safe to run concurrently
 * since it only marks jobs with stale heartbeats as failed.
 *
 * Schedule: Every 5 minutes (cron: 0/5 * * * *)
 *
 * @see architecture.md Section 8 - Job Safety
 */

import { createServiceClient } from '@/lib/supabase/service';

const STALE_THRESHOLD_MINUTES = 5;

export interface ReaperResult {
  itemsProcessed: number;
  reapedJobs: string[];
}

/**
 * Find and mark stale jobs as failed.
 *
 * @returns Result with count and names of reaped jobs
 */
export async function reaper(): Promise<ReaperResult> {
  const supabase = createServiceClient();

  // Calculate the threshold timestamp (5 minutes ago)
  const thresholdTime = new Date(
    Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000
  ).toISOString();

  console.log(
    `[Reaper] Checking for jobs with heartbeat older than ${thresholdTime}`
  );

  // Find stale running jobs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staleJobs, error: selectError } = await (supabase as any)
    .from('job_runs')
    .select('id, job_name, heartbeat_at, started_at')
    .eq('status', 'running')
    .lt('heartbeat_at', thresholdTime);

  if (selectError) {
    console.error('[Reaper] Failed to query stale jobs:', selectError);
    throw selectError;
  }

  if (!staleJobs || staleJobs.length === 0) {
    console.log('[Reaper] No stale jobs found');
    return { itemsProcessed: 0, reapedJobs: [] };
  }

  console.log(`[Reaper] Found ${staleJobs.length} stale job(s) to reap`);

  const reapedJobs: string[] = [];

  // Mark each stale job as failed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const job of staleJobs as any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('job_runs')
      .update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error: `Reaped: No heartbeat for ${STALE_THRESHOLD_MINUTES}+ minutes (last heartbeat: ${job.heartbeat_at})`,
      })
      .eq('id', job.id)
      .eq('status', 'running'); // Only update if still running (optimistic locking)

    if (updateError) {
      console.error(
        `[Reaper] Failed to reap job ${job.job_name}:`,
        updateError
      );
    } else {
      console.log(
        `[Reaper] Reaped stale job: ${job.job_name} (started: ${job.started_at}, last heartbeat: ${job.heartbeat_at})`
      );
      reapedJobs.push(job.job_name);
    }
  }

  console.log(`[Reaper] Completed, reaped ${reapedJobs.length} job(s)`);

  return {
    itemsProcessed: reapedJobs.length,
    reapedJobs,
  };
}
