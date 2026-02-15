/**
 * Sentry Client Configuration
 *
 * This file configures Sentry's SDK for the browser (client-side).
 * It's automatically loaded by Next.js through @sentry/nextjs.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NODE_ENV,

  // Performance monitoring - adjust sample rate in production
  // Set to 1.0 for development, 0.1-0.3 for production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay - captures user sessions for debugging
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Enable integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Debug mode - only in development
  debug: process.env.NODE_ENV === 'development',

  // Filter errors
  beforeSend(event) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    return event;
  },

  // Ignore certain errors that aren't actionable
  ignoreErrors: [
    // Browser extensions and plugins
    'Non-Error exception captured',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors
    'Network request failed',
    'Failed to fetch',
    'Load failed',
    // User-cancelled actions
    'AbortError',
  ],
});
