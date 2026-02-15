/**
 * Create Test Users for E2E Testing
 *
 * Creates two test accounts on the target Supabase instance:
 * 1. A regular test user (for onboarding/import tests)
 * 2. An admin test user (for admin sync tests)
 *
 * Usage: pnpm tsx scripts/create-test-users.ts
 *
 * Environment Requirements:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USER_EMAIL = 'e2e-test@modeloptix.com';
const TEST_USER_PASSWORD = 'TestPass123Secure';
const TEST_ADMIN_EMAIL = 'e2e-admin@modeloptix.com';
const TEST_ADMIN_PASSWORD = 'AdminPass123Secure';

async function createOrGetUser(email: string, password: string, isAdmin: boolean) {
  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  if (existing) {
    console.log(`  User ${email} already exists (${existing.id})`);

    // Update password to ensure it matches
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
    });
    if (updateError) {
      console.log(`  Warning: Could not update password: ${updateError.message}`);
    } else {
      console.log(`  Password updated for ${email}`);
    }

    // Ensure admin flag is set correctly
    if (isAdmin) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ is_admin: true })
        .eq('id', existing.id);

      if (profileError) {
        console.log(`  Warning: Could not set admin flag: ${profileError.message}`);
      } else {
        console.log(`  Admin flag set for ${email}`);
      }
    }

    return existing.id;
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: isAdmin ? 'E2E Admin' : 'E2E Test User',
      is_admin: isAdmin,
    },
  });

  if (error) {
    console.error(`  Failed to create ${email}: ${error.message}`);
    return null;
  }

  console.log(`  Created ${email} (${data.user.id})`);

  // Set admin flag if needed
  if (isAdmin && data.user) {
    // Wait a moment for the auth trigger to create the profile
    await new Promise((r) => setTimeout(r, 1000));

    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('id', data.user.id);

    if (profileError) {
      console.log(`  Warning: Could not set admin flag: ${profileError.message}`);
    } else {
      console.log(`  Admin flag set for ${email}`);
    }
  }

  return data.user.id;
}

async function main() {
  console.log('=== Creating E2E Test Users ===');
  console.log(`Target: ${supabaseUrl}\n`);

  console.log('1. Creating test user...');
  await createOrGetUser(TEST_USER_EMAIL, TEST_USER_PASSWORD, false);

  console.log('\n2. Creating admin user...');
  await createOrGetUser(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, true);

  console.log('\n=== Done ===\n');
  console.log('Add these to your environment (or .env.test):');
  console.log(`  TEST_USER_EMAIL=${TEST_USER_EMAIL}`);
  console.log(`  TEST_USER_PASSWORD=${TEST_USER_PASSWORD}`);
  console.log(`  TEST_ADMIN_EMAIL=${TEST_ADMIN_EMAIL}`);
  console.log(`  TEST_ADMIN_PASSWORD=${TEST_ADMIN_PASSWORD}`);
  console.log(`  TEST_OPENROUTER_KEY=<your OpenRouter API key>`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
