/**
 * Server-side Supabase client
 *
 * Use this in Server Components, Server Actions, and Route Handlers
 *
 * @example
 * // In a Server Component or Route Handler
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function GET() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('table').select()
 *   // ...
 * }
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Re-export service client for convenience
 *
 * For background jobs, import directly from '@/lib/supabase/service'
 * For route handlers that need RLS bypass, you can use this re-export
 */
export { createServiceClient } from './service';
