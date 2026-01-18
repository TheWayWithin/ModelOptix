/**
 * Cleanup Guest Sanity Checks Job
 *
 * Removes sanity check records from guest users (those without a user_id)
 * that are older than 7 days. This prevents unbounded growth of anonymous
 * usage data in the database.
 *
 * Schedule: Daily at 6:00 AM UTC (0 6 * * *)
 *
 * @see architecture.md Section 8 - Background Jobs
 */

import { createServiceClient } from '@/lib/supabase/service';

const RETENTION_DAYS = 7;

export interface CleanupGuestSanityChecksResult {
  itemsProcessed: number;
  deletedCount: number;
}

/**
 * Delete guest sanity check records older than 7 days.
 *
 * Guest sanity checks are identified by having a NULL user_id.
 *
 * @returns Result with count of deleted records
 */
export async function cleanupGuestSanityChecks(): Promise<CleanupGuestSanityChecksResult> {
  const supabase = createServiceClient();

  // Calculate cutoff date (7 days ago)
  const cutoffDate = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  console.log(
    `[CleanupGuestSanityChecks] Deleting guest sanity checks older than ${cutoffDate}`
  );

  // Delete guest sanity checks older than 7 days
  // Guest checks have NULL user_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error, count } = await (supabase as any)
    .from('sanity_checks')
    .delete()
    .is('user_id', null) // Guest users have no user_id
    .lt('created_at', cutoffDate)
    .select('id');

  if (error) {
    console.error(
      '[CleanupGuestSanityChecks] Failed to delete records:',
      error
    );
    throw error;
  }

  const deletedCount = count ?? data?.length ?? 0;

  console.log(
    `[CleanupGuestSanityChecks] Deleted ${deletedCount} guest sanity check(s)`
  );

  return {
    itemsProcessed: deletedCount,
    deletedCount,
  };
}
