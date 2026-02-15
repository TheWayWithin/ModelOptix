import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env vars'); process.exit(1); }

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function check() {
  // List test users
  const { data } = await sb.auth.admin.listUsers();
  const testUsers = (data?.users || []).filter(u => u.email?.includes('e2e-'));
  console.log('Test users found:', testUsers.length);
  for (const u of testUsers) {
    console.log(`  ${u.email} | confirmed: ${u.email_confirmed_at ? 'yes' : 'no'} | id: ${u.id}`);
  }

  // Try signing in as test user
  const { data: _signIn, error: signInErr } = await sb.auth.signInWithPassword({
    email: 'e2e-test@modeloptix.com',
    password: 'TestPass123!',
  });
  console.log('\nSign-in (test user):', signInErr ? `FAILED: ${signInErr.message}` : 'SUCCESS');

  // Try signing in as admin
  const { data: _adminSignIn, error: adminErr } = await sb.auth.signInWithPassword({
    email: 'e2e-admin@modeloptix.com',
    password: 'AdminPass123!',
  });
  console.log('Sign-in (admin):', adminErr ? `FAILED: ${adminErr.message}` : 'SUCCESS');

  // Check profiles exist
  const ids = testUsers.map(u => u.id);
  if (ids.length > 0) {
    const { data: profiles, error: profErr } = await sb.from('user_profiles').select('id, is_admin, subscription_tier').in('id', ids);
    console.log('\nProfiles:', JSON.stringify(profiles, null, 2));
    if (profErr) console.log('Profile error:', profErr.message);
  }
}

check();
