const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Omogućava striktni React mode za bolje debagovanje
  reactStrictMode: true,
  
  // Configure external image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'sjufcjskyrftmlfu.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  
  // Organization and project in Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Routes to ignore for performance monitoring
  widenClientFileUpload: true,
  
  // Hides source maps from generated client bundles
  hideSourceMaps: true,
  
  // Disables logger for cleaner output
  disableLogger: true,
};

// Wrap config with Sentry (only if DSN is configured)
module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
