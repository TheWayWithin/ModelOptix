/**
 * Sentry Server Configuration
 *
 * This file configures Sentry's SDK for the server (Node.js runtime).
 * It's automatically loaded by Next.js through @sentry/nextjs.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode - only in development
  debug: process.env.NODE_ENV === 'development',

  // Filter errors
  beforeSend(event) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DSN) {
      return null;
    }
    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    // Supabase rate limiting (handled gracefully in app)
    'Too many requests',
    // Expected auth errors
    'Invalid login credentials',
    'Email not confirmed',
    // User-cancelled actions
    'AbortError',
  ],
});
