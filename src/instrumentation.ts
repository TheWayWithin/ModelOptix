/**
 * Next.js Instrumentation
 *
 * This file is automatically loaded by Next.js on server startup.
 * It initializes cron jobs for background tasks.
 *
 * Required: `experimental.instrumentationHook: true` in next.config.mjs
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * @see architecture.md Section 8 - Background Jobs
 */

export async function register() {
  // Only run cron jobs in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Skip cron initialization during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log(
        '[Instrumentation] Skipping cron initialization during build'
      );
      return;
    }

    // Skip cron in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(
        '[Instrumentation] Skipping cron initialization in test environment'
      );
      return;
    }

    try {
      // Dynamic imports to avoid loading at build time
      const cron = await import('node-cron');
      const {
        runJobWithLock,
        reaper,
        cleanupExpiredSessions,
        cleanupGuestSanityChecks,
        syncModelCatalog,
        syncPricing,
        syncBenchmarks,
        generateOpportunities,
        sendTrialReminders,
      } = await import('@/lib/jobs');

      console.log('[Instrumentation] Initializing cron jobs...');

      // Cleanup expired sessions - Daily at 1:00 AM UTC
      cron.schedule('0 1 * * *', async () => {
        console.log('[Cron] Running cleanup-expired-sessions');
        await runJobWithLock('cleanup-expired-sessions', cleanupExpiredSessions);
      });

      // Cleanup guest sanity checks - Daily at 6:00 AM UTC
      cron.schedule('0 6 * * *', async () => {
        console.log('[Cron] Running cleanup-guest-sanity-checks');
        await runJobWithLock(
          'cleanup-guest-sanity-checks',
          cleanupGuestSanityChecks
        );
      });

      // Reaper - Every 5 minutes (no locking needed, safe to run concurrently)
      cron.schedule('*/5 * * * *', async () => {
        console.log('[Cron] Running reaper');
        await reaper();
      });

      // Model Catalog Sync - Daily at 2:00 AM UTC
      cron.schedule('0 2 * * *', async () => {
        console.log('[Cron] Running sync-model-catalog');
        await runJobWithLock('sync-model-catalog', async () => {
          const result = await syncModelCatalog();
          return {
            itemsProcessed:
              result.stats.modelsUpdated + result.stats.modelsCreated,
          };
        });
      });

      // Pricing Sync - Daily at 3:00 AM UTC
      cron.schedule('0 3 * * *', async () => {
        console.log('[Cron] Running sync-pricing');
        await runJobWithLock('sync-pricing', async () => {
          const result = await syncPricing();
          return {
            itemsProcessed: result.stats.pricingUpdated,
          };
        });
      });

      // Benchmark Sync - Weekly on Sunday at 4:00 AM UTC
      cron.schedule('0 4 * * 0', async () => {
        console.log('[Cron] Running sync-benchmarks');
        await runJobWithLock('sync-benchmarks', async () => {
          const result = await syncBenchmarks();
          return {
            itemsProcessed: result.stats.benchmarksUpdated,
          };
        });
      });

      // Opportunity Generation - Daily at 5:00 AM UTC
      // Runs after model/pricing sync to use fresh data
      cron.schedule('0 5 * * *', async () => {
        console.log('[Cron] Running generate-opportunities');
        await runJobWithLock('generate-opportunities', generateOpportunities);
      });

      // Trial Reminders - Daily at 9:00 AM UTC
      // Sends email reminders to users with trials ending soon
      cron.schedule('0 9 * * *', async () => {
        console.log('[Cron] Running trial-reminders');
        await runJobWithLock('trial-reminders', async () => {
          const result = await sendTrialReminders();
          return { itemsProcessed: result.remindersSent };
        });
      });

      console.log('[Instrumentation] Cron jobs initialized:');
      console.log('  - cleanup-expired-sessions: 0 1 * * * (daily 1am UTC)');
      console.log(
        '  - cleanup-guest-sanity-checks: 0 6 * * * (daily 6am UTC)'
      );
      console.log('  - reaper: */5 * * * * (every 5 minutes)');
      console.log('  - sync-model-catalog: 0 2 * * * (daily 2am UTC)');
      console.log('  - sync-pricing: 0 3 * * * (daily 3am UTC)');
      console.log('  - sync-benchmarks: 0 4 * * 0 (weekly Sunday 4am UTC)');
      console.log('  - generate-opportunities: 0 5 * * * (daily 5am UTC)');
      console.log('  - trial-reminders: 0 9 * * * (daily 9am UTC)');
    } catch (error) {
      console.error('[Instrumentation] Failed to initialize cron jobs:', error);
      // Don't throw - allow server to start even if cron setup fails
    }
  }
}
