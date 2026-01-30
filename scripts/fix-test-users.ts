import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env vars'); process.exit(1); }

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function fix() {
  console.log('=== Fixing E2E Test Users ===\n');

  // Delete and recreate both users to ensure clean state
  const { data } = await sb.auth.admin.listUsers();
  const testUsers = (data?.users || []).filter(u => u.email?.includes('e2e-'));

  for (const user of testUsers) {
    console.log(`Deleting ${user.email} (${user.id})...`);
    await sb.auth.admin.deleteUser(user.id);
  }

  // Also delete their profiles if any
  for (const user of testUsers) {
    await sb.from('user_profiles').delete().eq('id', user.id);
  }

  console.log('');

  // Recreate test user with password (no special chars to avoid shell/encoding issues)
  console.log('Creating e2e-test@modeloptix.com...');
  const { data: testUser, error: testErr } = await sb.auth.admin.createUser({
    email: 'e2e-test@modeloptix.com',
    password: 'TestPass123Secure',
    email_confirm: true,
    user_metadata: { display_name: 'E2E Test User' },
  });
  if (testErr) {
    console.error('  FAILED:', testErr.message);
  } else {
    console.log('  Created:', testUser.user.id);
    // Wait for auth trigger to create profile
    await new Promise(r => setTimeout(r, 2000));
    // Verify profile exists
    const { data: profile } = await sb.from('user_profiles').select('id, is_admin').eq('id', testUser.user.id).single();
    console.log('  Profile:', profile ? 'exists' : 'MISSING');
  }

  // Recreate admin user with password (no special chars to avoid shell/encoding issues)
  console.log('\nCreating e2e-admin@modeloptix.com...');
  const { data: adminUser, error: adminErr } = await sb.auth.admin.createUser({
    email: 'e2e-admin@modeloptix.com',
    password: 'AdminPass123Secure',
    email_confirm: true,
    user_metadata: { display_name: 'E2E Admin', is_admin: true },
  });
  if (adminErr) {
    console.error('  FAILED:', adminErr.message);
  } else {
    console.log('  Created:', adminUser.user.id);
    await new Promise(r => setTimeout(r, 2000));
    // Set admin flag
    const { error: profileErr } = await sb.from('user_profiles').update({ is_admin: true }).eq('id', adminUser.user.id);
    console.log('  Admin flag:', profileErr ? `FAILED: ${profileErr.message}` : 'set');
    // Verify
    const { data: profile } = await sb.from('user_profiles').select('id, is_admin').eq('id', adminUser.user.id).single();
    console.log('  Profile:', profile ? `exists (is_admin: ${profile.is_admin})` : 'MISSING');
  }

  // Test sign-in with anon key to match browser behavior
  console.log('\n=== Testing Sign-In (anon key) ===');
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    console.log('No NEXT_PUBLIC_SUPABASE_ANON_KEY, skipping anon test');
    return;
  }

  const anonClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: testSignIn } = await anonClient.auth.signInWithPassword({
    email: 'e2e-test@modeloptix.com',
    password: 'TestPass123Secure',
  });
  console.log('Test user sign-in:', testSignIn ? `FAILED: ${testSignIn.message}` : 'SUCCESS');

  const { error: adminSignIn } = await anonClient.auth.signInWithPassword({
    email: 'e2e-admin@modeloptix.com',
    password: 'AdminPass123Secure',
  });
  console.log('Admin sign-in:', adminSignIn ? `FAILED: ${adminSignIn.message}` : 'SUCCESS');
}

fix();
