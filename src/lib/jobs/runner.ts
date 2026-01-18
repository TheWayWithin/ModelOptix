/**
 * Job Runner with Distributed Locking
 *
 * Implements job locking via PostgreSQL unique partial index to prevent
 * concurrent execution across multiple server instances.
 *
 * Pattern:
 * 1. Try to INSERT a 'running' job record
 * 2. Unique partial index on (job_name) WHERE status = 'running' ensures only one can succeed
 * 3. Winner runs the job with heartbeat updates
 * 4. On completion, updates status to 'completed' or 'failed'
 *
 * @see architecture.md Section 8 - Job Safety
 */

import { createServiceClient } from '@/lib/supabase/service';

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

export interface JobResult {
  success: boolean;
  itemsProcessed?: number;
  error?: string;
  skipped?: boolean; // True if another instance holds the lock
}

/**
 * Run a job with distributed locking.
 *
 * @param jobName - Unique identifier for the job
 * @param fn - The job function to execute
 * @returns JobResult indicating success, failure, or skip (lock held by another instance)
 */
export async function runJobWithLock(
  jobName: string,
  fn: () => Promise<{ itemsProcessed?: number } | void>
): Promise<JobResult> {
  const supabase = createServiceClient();
  let jobRunId: string | null = null;
  let heartbeatInterval: NodeJS.Timeout | null = null;

  try {
    // Step 1: Try to acquire lock by inserting a 'running' job record
    // The unique partial index will reject if another 'running' record exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertData, error: insertError } = await (supabase as any)
      .from('job_runs')
      .insert({
        job_name: jobName,
        status: 'running',
        heartbeat_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    // Check for unique constraint violation (lock already held)
    if (insertError) {
      // PostgreSQL error code 23505 = unique_violation
      if (insertError.code === '23505') {
        console.log(`[Job:${jobName}] Lock held by another instance, skipping`);
        return { success: true, skipped: true };
      }
      // Other database errors
      console.error(`[Job:${jobName}] Failed to acquire lock:`, insertError);
      return { success: false, error: insertError.message };
    }

    jobRunId = insertData.id;
    console.log(
      `[Job:${jobName}] Lock acquired, starting execution (run_id: ${jobRunId})`
    );

    // Step 2: Start heartbeat to signal we're still alive
    heartbeatInterval = setInterval(async () => {
      if (jobRunId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: heartbeatError } = await (supabase as any)
          .from('job_runs')
          .update({ heartbeat_at: new Date().toISOString() })
          .eq('id', jobRunId);

        if (heartbeatError) {
          console.warn(
            `[Job:${jobName}] Heartbeat update failed:`,
            heartbeatError
          );
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Step 3: Execute the job
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;

    // Step 4: Mark as completed
    const itemsProcessed = result?.itemsProcessed ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: completeError } = await (supabase as any)
      .from('job_runs')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
        items_processed: itemsProcessed,
      })
      .eq('id', jobRunId!);

    if (completeError) {
      console.error(
        `[Job:${jobName}] Failed to mark as completed:`,
        completeError
      );
    }

    console.log(
      `[Job:${jobName}] Completed successfully in ${duration}ms, processed ${itemsProcessed} items`
    );

    return { success: true, itemsProcessed };
  } catch (error) {
    // Step 4b: Mark as failed on error
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`[Job:${jobName}] Execution failed:`, errorMessage);

    if (jobRunId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: failError } = await (supabase as any)
        .from('job_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error: errorMessage.substring(0, 1000), // Truncate long errors
        })
        .eq('id', jobRunId);

      if (failError) {
        console.error(`[Job:${jobName}] Failed to mark as failed:`, failError);
      }
    }

    return { success: false, error: errorMessage };
  } finally {
    // Always clean up heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  }
}
