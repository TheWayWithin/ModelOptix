/**
 * Opportunity Generation Cron Job
 *
 * Runs daily at 5am UTC to scan all use cases and create/update opportunities.
 * Uses job locking to prevent concurrent execution.
 *
 * Schedule: 0 5 * * * (5am UTC daily)
 *
 * @see architecture.md Section 8 - Background Jobs
 */

import {
  generateAllOpportunities,
  type GenerateOpportunitiesResult,
} from '@/lib/recommendations/opportunity-generator';

/**
 * Generate opportunities for all active use cases.
 *
 * @returns Result with items processed count for job runner
 */
export async function generateOpportunities(): Promise<{
  itemsProcessed: number;
}> {
  console.log('[generate-opportunities] Starting job');
  const startTime = Date.now();

  try {
    const result: GenerateOpportunitiesResult = await generateAllOpportunities();

    const duration = Date.now() - startTime;
    console.log(
      `[generate-opportunities] Complete in ${duration}ms: ` +
        `${result.processed} use cases, ${result.opportunitiesCreated} opportunities`
    );

    if (result.errors.length > 0) {
      console.error(
        `[generate-opportunities] ${result.errors.length} errors:`
      );
      for (const error of result.errors.slice(0, 5)) {
        console.error(`  - ${error}`);
      }
      if (result.errors.length > 5) {
        console.error(`  ... and ${result.errors.length - 5} more`);
      }
    }

    return { itemsProcessed: result.opportunitiesCreated };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(
      `[generate-opportunities] Fatal error after ${duration}ms:`,
      err instanceof Error ? err.message : err
    );
    throw err;
  }
}

export type { GenerateOpportunitiesResult };
