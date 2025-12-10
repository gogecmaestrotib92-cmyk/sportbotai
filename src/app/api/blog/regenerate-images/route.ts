// API route to regenerate images for existing blog posts
// This fixes posts that have expired Replicate URLs

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { generateFeaturedImage, getPlaceholderImage } from '@/lib/blog/image-generator';

export const maxDuration = 300; // 5 minutes for multiple image generations

export async function POST(request: NextRequest) {
  try {
    // Check for admin auth (simple secret key for now)
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET || 'sportbot-admin-2024';
    
    if (authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get posts with Replicate URLs (these expire), placeholders, or missing images
    const postsWithExpiredImages = await prisma.blogPost.findMany({
      where: {
        OR: [
          { featuredImage: { contains: 'replicate.delivery' } },
          { featuredImage: { contains: 'placehold.co' } },
          { featuredImage: null },
          { featuredImage: '' },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        focusKeyword: true,
        featuredImage: true,
      },
    });

    console.log(`[Image Regen] Found ${postsWithExpiredImages.length} posts with expired/missing images`);

    const results: { slug: string; success: boolean; newImage?: string; error?: string }[] = [];

    for (const post of postsWithExpiredImages) {
      try {
        console.log(`[Image Regen] Processing: ${post.slug}`);
        
        const imageResult = await generateFeaturedImage(
          post.title,
          post.focusKeyword || post.slug,
          post.category || 'Educational Guides'
        );

        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            featuredImage: imageResult.url,
            imageAlt: imageResult.alt,
          },
        });

        results.push({
          slug: post.slug,
          success: true,
          newImage: imageResult.url,
        });

        // Small delay between generations
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Image Regen] Failed for ${post.slug}:`, error);
        
        // Use placeholder as fallback
        const placeholder = getPlaceholderImage(post.focusKeyword || post.title);
        await prisma.blogPost.update({
          where: { id: post.id },
          data: { featuredImage: placeholder },
        });

        results.push({
          slug: post.slug,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          newImage: placeholder,
        });
      }
    }

    // Revalidate the blog pages to clear cache
    revalidatePath('/blog');
    results.forEach(r => {
      revalidatePath(`/blog/${r.slug}`);
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      cacheCleared: true,
    });

  } catch (error) {
    console.error('[Image Regen] Error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate images' },
      { status: 500 }
    );
  }
}
