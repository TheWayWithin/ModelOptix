/**
 * Cleanup E2E Test Data
 *
 * Removes test data created during E2E runs to prevent staging pollution.
 * Only deletes data owned by e2e-* test users. Does NOT delete the test
 * users themselves (they are reused across test runs).
 *
 * Cascade deletes handle child records:
 *   products → functions, use_cases → opportunities, sanity_checks
 *
 * Usage: npx tsx scripts/e2e/cleanup-test-data.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USER_EMAILS = [
  'e2e-test@modeloptix.com',
  'e2e-admin@modeloptix.com',
  'e2e-free@modeloptix.com',
];

async function main() {
  console.log('=== Cleaning Up E2E Test Data ===');
  console.log(`Target: ${supabaseUrl}\n`);

  // Get test user IDs
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const testUserIds = allUsers?.users
    ?.filter((u) => u.email && TEST_USER_EMAILS.includes(u.email))
    .map((u) => u.id) ?? [];

  if (testUserIds.length === 0) {
    console.log('No test users found. Nothing to clean up.');
    return;
  }

  console.log(`Found ${testUserIds.length} test users: ${testUserIds.join(', ')}\n`);

  // Delete sanity checks owned by test users
  const { data: deletedChecks, error: checksError } = await supabase
    .from('sanity_checks')
    .delete()
    .in('user_id', testUserIds)
    .select('id');

  if (checksError) {
    console.log(`  Warning: sanity_checks cleanup error: ${checksError.message}`);
  } else {
    console.log(`  Deleted ${deletedChecks?.length ?? 0} sanity checks`);
  }

  // Delete alerts owned by test users
  const { data: deletedAlerts, error: alertsError } = await supabase
    .from('alerts')
    .delete()
    .in('user_id', testUserIds)
    .select('id');

  if (alertsError) {
    console.log(`  Warning: alerts cleanup error: ${alertsError.message}`);
  } else {
    console.log(`  Deleted ${deletedAlerts?.length ?? 0} alerts`);
  }

  // Delete products (cascades to functions, use_cases, opportunities)
  const { data: deletedProducts, error: productsError } = await supabase
    .from('products')
    .delete()
    .in('user_id', testUserIds)
    .select('id');

  if (productsError) {
    console.log(`  Warning: products cleanup error: ${productsError.message}`);
  } else {
    console.log(`  Deleted ${deletedProducts?.length ?? 0} products (cascades to functions, use_cases, opportunities)`);
  }

  // Delete notification preferences
  const { data: deletedPrefs, error: prefsError } = await supabase
    .from('notification_preferences')
    .delete()
    .in('user_id', testUserIds)
    .select('id');

  if (prefsError) {
    console.log(`  Warning: notification_preferences cleanup error: ${prefsError.message}`);
  } else {
    console.log(`  Deleted ${deletedPrefs?.length ?? 0} notification preferences`);
  }

  console.log('\n=== Cleanup Complete ===');
  console.log('Note: Test user accounts were preserved for reuse.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
