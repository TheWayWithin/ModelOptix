import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Auth callback route for OAuth providers and email confirmation.
 *
 * This handles the redirect after a user authenticates with OAuth
 * or confirms their email address.
 *
 * @see architecture.md Section 3 - Authentication Flow
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth - redirect to intended destination
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error - redirect to error page
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
