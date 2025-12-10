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

module.exports = nextConfig;
