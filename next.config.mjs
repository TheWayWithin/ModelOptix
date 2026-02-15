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
};

export default nextConfig;
