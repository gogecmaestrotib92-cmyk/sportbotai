/**
 * Logo Proxy API
 * 
 * Proxies external team logo images with proper caching.
 * - Caches for 7 days (immutable logos rarely change)
 * - Uses ESPN's combiner service to resize images (saves bandwidth)
 * - Reduces payload by serving through CDN
 * - Avoids CORS issues
 * 
 * Usage: /api/logo?url=https://a.espncdn.com/...&size=100
 */

import { NextRequest, NextResponse } from 'next/server';

// Allow these domains for logos
const ALLOWED_DOMAINS = [
  'a.espncdn.com',
  'media.api-sports.io',
  'media-cdn.cortextech.io',
  'media-cdn.incrowdsports.com',
  'upload.wikimedia.org',
  'crests.football-data.org',
  'flagcdn.com',
  'assets.laliga.com',
  'resources.premierleague.com',
];

/**
 * Transform ESPN URLs to use their combiner service for resizing
 * ESPN combiner: https://a.espncdn.com/combiner/i?img=/i/teamlogos/nfl/500/nyj.png&w=100&h=100
 */
function getOptimizedUrl(originalUrl: string, size: number): string {
  const url = new URL(originalUrl);
  
  // For ESPN images, use their combiner service for resizing
  if (url.hostname === 'a.espncdn.com' && originalUrl.includes('/i/teamlogos/')) {
    // Extract the path after the domain
    const imagePath = url.pathname;
    return `https://a.espncdn.com/combiner/i?img=${imagePath}&w=${size}&h=${size}&scale=crop&transparent=true`;
  }
  
  // For other sources, return as-is (we can't resize them server-side without Sharp)
  return originalUrl;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const logoUrl = searchParams.get('url');
  const size = parseInt(searchParams.get('size') || '100', 10); // Default to 100px

  if (!logoUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const url = new URL(logoUrl);
    
    // Security: only allow whitelisted domains
    if (!ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain))) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Get optimized URL (resized for ESPN)
    const optimizedUrl = getOptimizedUrl(logoUrl, Math.min(size, 200));

    // Fetch the image
    const response = await fetch(optimizedUrl, {
      headers: {
        'User-Agent': 'SportBot-AI/1.0',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch logo', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return with long cache lifetime (7 days)
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, immutable',
        'CDN-Cache-Control': 'public, max-age=604800, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch (error) {
    console.error('Logo proxy error:', error);
    return new NextResponse('Failed to proxy logo', { status: 500 });
  }
}
