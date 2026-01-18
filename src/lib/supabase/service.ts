/**
 * Supabase Service Client (Admin/Service Role)
 *
 * Use this for background jobs and operations that bypass RLS.
 * This client does NOT depend on cookies/request context, making it
 * suitable for cron jobs and instrumentation.
 *
 * WARNING: Never expose this client to the browser!
 * The service role key has full database access.
 *
 * @example
 * // In a background job
 * import { createServiceClient } from '@/lib/supabase/service'
 *
 * export async function myJob() {
 *   const supabase = createServiceClient()
 *   const { data } = await supabase.from('job_runs').select()
 *   // ...
 * }
 */
import { createClient } from '@supabase/supabase-js';

let serviceClient: ReturnType<typeof createClient> | null = null;

/**
 * Get or create a singleton Supabase service client.
 *
 * Uses the service role key which bypasses Row Level Security.
 * This is necessary for background jobs that operate outside of
 * a user request context.
 *
 * @returns Supabase client with service role access
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not configured
 */
export function createServiceClient() {
  if (serviceClient) {
    return serviceClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
        'This is required for background jobs that bypass RLS.'
    );
  }

  serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}
