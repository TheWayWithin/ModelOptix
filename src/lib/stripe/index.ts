// Stripe exports for ModelOptix
//
// IMPORTANT: This file only exports client-safe items (types, config).
// For server-side Stripe operations, import from '@/lib/stripe/client' directly.
// This prevents the Stripe SDK from being bundled into client-side code.

// Client-safe exports (no Stripe SDK initialization)
export * from './types';
export * from './config';

// NOTE: Do NOT re-export from './client' here as it initializes the Stripe SDK
// with a server-side API key, which will fail on the client.
// Server-side code should import directly:
//   import { createCheckoutSession, ... } from '@/lib/stripe/client';
