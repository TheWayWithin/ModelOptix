/**
 * Supabase Client Re-exports
 *
 * Import from specific files for proper tree-shaking:
 * - Browser: import { createClient } from '@/lib/supabase/client'
 * - Server: import { createClient } from '@/lib/supabase/server'
 * - Service: import { createServiceClient } from '@/lib/supabase/service'
 * - Middleware: import { createClient } from '@/lib/supabase/middleware'
 *
 * This index file is for convenience imports only.
 */

// Browser client (for 'use client' components)
export { createClient as createBrowserClient, supabase } from './client';

// Server client (for Server Components, Actions, Route Handlers)
export { createClient as createServerClient } from './server';

// Service client (for background jobs - bypasses RLS)
export { createServiceClient } from './service';

// Middleware client (for middleware.ts only)
export { createClient as createMiddlewareClient } from './middleware';
