import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for highlighting potential issues
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // TypeScript and ESLint checks during build
  typescript: {
    // Don't ignore build errors in production
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't ignore ESLint errors in production
    ignoreDuringBuilds: false,
  },

  // Enable instrumentation hook for cron job initialization
  // @see src/instrumentation.ts
  experimental: {
    instrumentationHook: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry (only if SENTRY_AUTH_TOKEN is available for source map upload)
// Set SENTRY_DSN in environment to enable error tracking
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  // Organization and project settings (set via env vars)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors (if using Vercel)
  automaticVercelMonitors: false,

  // Skip source map upload if auth token not available at build time
  // This allows builds to succeed without Sentry build secrets
  skipSentryWebpackPluginUpload: !process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryConfig);
