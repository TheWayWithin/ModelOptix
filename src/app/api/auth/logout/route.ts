import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 *
 * Server-side logout handler that properly clears the session.
 * Client-side signOut() works, but this ensures cookies are cleared
 * on the server as well.
 *
 * @see architecture.md Section 3 - Authentication Flow
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
