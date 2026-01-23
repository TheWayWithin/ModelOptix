/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry's SDK for Edge Runtime (middleware, edge functions).
 * It's automatically loaded by Next.js through @sentry/nextjs.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance monitoring (keep lower for edge due to cold starts)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

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
});
