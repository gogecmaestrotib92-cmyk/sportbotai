const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Omogućava striktni React mode za bolje debagovanje
  reactStrictMode: true,

  // Ignore ESLint warnings during build (still runs, just doesn't fail)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Enable gzip compression
  compress: true,

  // Optimize for modern browsers only and CSS
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    optimizeCss: true, // Inline critical CSS for faster FCP/LCP
  },

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
      {
        protocol: 'https',
        hostname: 'www.upwork.com',
      },
      // API-Sports CDN for team/league logos
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-1.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-2.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-3.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-4.api-sports.io',
      },
      // ESPN CDN for NBA/NFL/NHL logos
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
      },
    ],
  },

  // Custom headers for AI/LLM discoverability
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  // Redirect non-www to www (critical for SEO - consolidates ranking signals)
  async redirects() {
    return [
      // Non-www to www redirect
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'sportbotai.com',
          },
        ],
        destination: 'https://www.sportbotai.com/:path*',
        permanent: true, // 308 redirect - tells Google this is permanent
      },
    ];
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
// Cache bust: 1767386978
