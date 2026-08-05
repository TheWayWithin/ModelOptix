/**
 * Setup E2E Test Users in Staging Supabase
 *
 * Creates 3 test users for E2E testing. Idempotent - safe to re-run.
 *
 * Users:
 * 1. Regular user  - e2e-test@modeloptix.com  (free tier)
 * 2. Admin user    - e2e-admin@modeloptix.com (solo tier, is_admin=true)
 * 3. Free user     - e2e-free@modeloptix.com  (free tier, for tier limit tests)
 *
 * The auth trigger (003_auth_trigger.sql) auto-creates user_profiles on signup.
 *
 * Usage: npx tsx scripts/e2e/setup-test-users.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local for Supabase credentials
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

interface TestUser {
  email: string;
  password: string;
  displayName: string;
  isAdmin: boolean;
  subscriptionTier: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'e2e-test@modeloptix.com',
    password: 'TestPass123!',
    displayName: 'E2E Test User',
    isAdmin: false,
    subscriptionTier: 'free',
  },
  {
    email: 'e2e-admin@modeloptix.com',
    password: 'AdminPass123!',
    displayName: 'E2E Admin User',
    isAdmin: true,
    subscriptionTier: 'solo',
  },
  {
    email: 'e2e-free@modeloptix.com',
    password: 'TestPass123!',
    displayName: 'E2E Free User',
    isAdmin: false,
    subscriptionTier: 'free',
  },
];

async function createOrUpdateUser(user: TestUser): Promise<string | null> {
  const { email, password, displayName, isAdmin, subscriptionTier } = user;

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
      console.log(`  Password updated`);
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        is_admin: isAdmin,
        subscription_tier: subscriptionTier,
        display_name: displayName,
      })
      .eq('id', existing.id);

    if (profileError) {
      console.log(`  Warning: Could not update profile: ${profileError.message}`);
    } else {
      console.log(`  Profile updated (admin=${isAdmin}, tier=${subscriptionTier})`);
    }

    return existing.id;
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      is_admin: isAdmin,
    },
  });

  if (error) {
    console.error(`  Failed to create ${email}: ${error.message}`);
    return null;
  }

  console.log(`  Created ${email} (${data.user.id})`);

  // Wait for auth trigger to create user_profiles
  await new Promise((r) => setTimeout(r, 2000));

  // Update profile with correct tier and admin flag
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      is_admin: isAdmin,
      subscription_tier: subscriptionTier,
      display_name: displayName,
    })
    .eq('id', data.user.id);

  if (profileError) {
    console.log(`  Warning: Could not update profile: ${profileError.message}`);
  } else {
    console.log(`  Profile set (admin=${isAdmin}, tier=${subscriptionTier})`);
  }

  return data.user.id;
}

async function main() {
  console.log('=== Setting Up E2E Test Users ===');
  console.log(`Target: ${supabaseUrl}\n`);

  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i];
    console.log(`${i + 1}. ${user.displayName} (${user.email}):`);
    await createOrUpdateUser(user);
    console.log();
  }

  console.log('=== Setup Complete ===\n');
  console.log('Test credentials for .env.test:');
  console.log('  TEST_USER_EMAIL=e2e-test@modeloptix.com');
  console.log('  TEST_USER_PASSWORD=TestPass123!');
  console.log('  TEST_ADMIN_EMAIL=e2e-admin@modeloptix.com');
  console.log('  TEST_ADMIN_PASSWORD=AdminPass123!');
  console.log('  TEST_FREE_USER_EMAIL=e2e-free@modeloptix.com');
  console.log('  TEST_FREE_USER_PASSWORD=TestPass123!');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
