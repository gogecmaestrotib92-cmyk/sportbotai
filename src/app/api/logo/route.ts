/**
 * Logo Proxy API
 * 
 * Proxies external team logo images with proper caching and optimization.
 * - Caches for 30 days (immutable logos rarely change)
 * - Converts to WebP for 25-35% smaller file sizes
 * - Resizes to requested dimensions (saves bandwidth)
 * - Reduces payload by serving through CDN
 * - Avoids CORS issues
 * 
 * Usage: /api/logo?url=https://a.espncdn.com/...&size=100
 */

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

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

// In-memory cache for processed images (edge runtime compatible)
const imageCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour in-memory cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const logoUrl = searchParams.get('url');
  const size = Math.min(parseInt(searchParams.get('size') || '100', 10), 200); // Max 200px
  const format = searchParams.get('format') || 'webp'; // Default to WebP

  if (!logoUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Check Accept header for WebP support
  const acceptHeader = request.headers.get('accept') || '';
  const supportsWebP = acceptHeader.includes('image/webp');
  const outputFormat = supportsWebP && format !== 'png' ? 'webp' : 'png';

  try {
    const url = new URL(logoUrl);
    
    // Security: only allow whitelisted domains
    if (!ALLOWED_DOMAINS.some(domain => url.hostname.includes(domain))) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // Create cache key
    const cacheKey = `${logoUrl}-${size}-${outputFormat}`;
    
    // Check in-memory cache
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new NextResponse(new Uint8Array(cached.buffer), {
        headers: {
          'Content-Type': outputFormat === 'webp' ? 'image/webp' : 'image/png',
          'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable', // 30 days
          'CDN-Cache-Control': 'public, max-age=2592000, immutable',
          'Vercel-CDN-Cache-Control': 'public, max-age=2592000, immutable',
          'X-Cache': 'HIT',
        },
      });
    }

    // Fetch the original image
    const response = await fetch(logoUrl, {
      headers: {
        'User-Agent': 'SportBot-AI/1.0',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch logo', { status: response.status });
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Process image with Sharp: resize and convert to WebP
    let processedImage: Buffer;
    try {
      const sharpInstance = sharp(imageBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
        });
      
      if (outputFormat === 'webp') {
        processedImage = await sharpInstance
          .webp({ quality: 75, effort: 6 })
          .toBuffer();
      } else {
        processedImage = await sharpInstance
          .png({ compressionLevel: 9 })
          .toBuffer();
      }
    } catch {
      // If Sharp fails, return original image
      processedImage = imageBuffer;
    }

    // Store in cache
    imageCache.set(cacheKey, { buffer: processedImage, timestamp: Date.now() });
    
    // Limit cache size (remove oldest entries if > 500)
    if (imageCache.size > 500) {
      const oldestKey = imageCache.keys().next().value;
      if (oldestKey) imageCache.delete(oldestKey);
    }

    // Return with long cache lifetime (30 days)
    return new NextResponse(new Uint8Array(processedImage), {
      headers: {
        'Content-Type': outputFormat === 'webp' ? 'image/webp' : 'image/png',
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable', // 30 days
        'CDN-Cache-Control': 'public, max-age=2592000, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=2592000, immutable',
        'X-Original-Size': imageBuffer.length.toString(),
        'X-Optimized-Size': processedImage.length.toString(),
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.error('Logo proxy error:', error);
    return new NextResponse('Failed to proxy logo', { status: 500 });
  }
}
