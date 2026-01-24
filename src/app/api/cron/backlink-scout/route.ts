/**
 * Backlink Scout Cron Job
 * 
 * Runs daily to discover new sports betting/analytics tools,
 * extract content, find contact emails, and queue for review.
 * 
 * Schedule: Daily at 8 AM UTC
 * Manual trigger: GET /api/cron/backlink-scout?secret=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  runBacklinkScout,
  extractWebsiteContent,
  findContactEmail,
  generateToolReview,
} from '@/lib/backlink-scout';
import { captureScreenshotWithFallback } from '@/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '@/lib/email';

export const maxDuration = 300; // 5 minute timeout

const CRON_SECRET = process.env.CRON_SECRET;

// ============================================
// MAIN CRON HANDLER
// ============================================

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}` || secretParam === CRON_SECRET;
  
  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Optional parameters
  const dryRun = url.searchParams.get('dry') === 'true';
  const action = url.searchParams.get('action') || 'discover'; // discover, generate, outreach
  
  console.log(`[BacklinkScout] Cron triggered - action: ${action}, dryRun: ${dryRun}`);
  
  const stats = {
    action,
    dryRun,
    discovered: 0,
    new: 0,
    reviewsGenerated: 0,
    emailsQueued: 0,
    errors: [] as string[],
  };
  
  try {
    switch (action) {
      // ========================================
      // ACTION: DISCOVER
      // Find new tools from directories
      // ========================================
      case 'discover': {
        const result = await runBacklinkScout({
          sources: ['producthunt', 'alternativeto'],
          searchTerms: ['sports betting', 'betting analytics', 'odds comparison'],
          maxNew: 5,
          dryRun,
        });
        
        stats.discovered = result.discovered;
        stats.new = result.new;
        stats.errors = result.errors;
        break;
      }
      
      // ========================================
      // ACTION: GENERATE
      // Generate reviews for pending tools
      // ========================================
      case 'generate': {
        const pendingReviews = await prisma.toolReview.findMany({
          where: {
            reviewStatus: 'PENDING',
            contentWords: { gt: 100 }, // Must have extracted content
          },
          take: 3, // Process 3 at a time
        });
        
        console.log(`[BacklinkScout] Found ${pendingReviews.length} pending reviews`);
        
        for (const tool of pendingReviews) {
          try {
            if (dryRun) {
              console.log(`[BacklinkScout] DRY RUN - Would generate review for ${tool.toolName}`);
              stats.reviewsGenerated++;
              continue;
            }
            
            // Update status to generating
            await prisma.toolReview.update({
              where: { id: tool.id },
              data: { reviewStatus: 'GENERATING' },
            });
            
            // Generate the review
            const review = await generateToolReview(
              tool.toolName,
              tool.toolUrl,
              tool.toolDescription || '',
              tool.contentExtracted || ''
            );
            
            // Capture screenshot of tool's homepage for featured image
            let featuredImage = '/sports/football.jpg'; // fallback
            try {
              featuredImage = await captureScreenshotWithFallback(
                tool.toolUrl,
                tool.toolName,
                '/sports/football.jpg'
              );
              console.log(`[BacklinkScout] Screenshot captured: ${featuredImage}`);
            } catch (imgErr) {
              console.log(`[BacklinkScout] Screenshot failed, using fallback: ${imgErr}`);
            }
            
            // Create blog post
            const blogPost = await prisma.blogPost.create({
              data: {
                title: review.title,
                slug: `tools/${review.slug}`,
                excerpt: `A review of ${tool.toolName} - a sports betting/analytics tool.`,
                content: review.content,
                category: 'Tools & Resources',
                tags: ['tool-review', 'sports-betting', 'analytics'],
                status: 'DRAFT', // Start as draft for review
                postType: 'GENERAL',
                metaTitle: review.title,
                metaDescription: `Our review of ${tool.toolName}. See what it offers, key features, pros and cons.`,
                featuredImage,
              },
            });
            
            // Update tool review with blog post link
            // Note: blogSlug should be just the slug, WITHOUT 'tools/' prefix
            // because the URL is constructed as /tools/{blogSlug}
            await prisma.toolReview.update({
              where: { id: tool.id },
              data: {
                reviewStatus: 'GENERATED',
                blogPostId: blogPost.id,
                blogSlug: review.slug, // Use review.slug directly, NOT blogPost.slug which has 'tools/' prefix
                reviewTitle: review.title,
                reviewContent: review.content,
                reviewGeneratedAt: new Date(),
              },
            });
            
            stats.reviewsGenerated++;
            console.log(`[BacklinkScout] Generated review: ${tool.toolName} -> ${blogPost.slug}`);
            
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            stats.errors.push(`Generate ${tool.toolName}: ${errorMsg}`);
            
            await prisma.toolReview.update({
              where: { id: tool.id },
              data: { reviewStatus: 'FAILED' },
            });
          }
        }
        break;
      }
      
      // ========================================
      // ACTION: OUTREACH
      // Send emails to tools with generated/published reviews
      // ========================================
      case 'outreach': {
        const readyForOutreach = await prisma.toolReview.findMany({
          where: {
            reviewStatus: { in: ['GENERATED', 'PUBLISHED'] },
            outreachStatus: 'NOT_SENT',
            contactEmail: { not: null },
            blogSlug: { not: null }, // Must have a blog post created
          },
          take: 5,
        });
        
        console.log(`[BacklinkScout] Found ${readyForOutreach.length} ready for outreach`);
        
        for (const tool of readyForOutreach) {
          try {
            if (dryRun) {
              console.log(`[BacklinkScout] DRY RUN - Would email ${tool.contactEmail}`);
              stats.emailsQueued++;
              continue;
            }
            
            // Build the review URL from blogSlug
            const reviewUrl = `https://www.sportbotai.com/${tool.blogSlug}`;
            
            // Send the outreach email
            const emailSent = await sendToolReviewOutreach(
              tool.contactEmail!,
              tool.toolName,
              reviewUrl
            );
            
            if (emailSent) {
              await prisma.toolReview.update({
                where: { id: tool.id },
                data: {
                  outreachStatus: 'SENT',
                  outreachSentAt: new Date(),
                },
              });
              stats.emailsQueued++;
              console.log(`[BacklinkScout] ✅ Sent outreach: ${tool.toolName} -> ${tool.contactEmail}`);
            } else {
              console.log(`[BacklinkScout] ⚠️ Failed to send email to ${tool.contactEmail}`);
              stats.errors.push(`Email failed for ${tool.toolName}`);
            }
            
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            stats.errors.push(`Outreach ${tool.toolName}: ${errorMsg}`);
          }
        }
        break;
      }
      
      // ========================================
      // ACTION: STATS
      // Get current backlink scout statistics
      // ========================================
      case 'stats': {
        const statusCounts = await prisma.toolReview.groupBy({
          by: ['reviewStatus'],
          _count: true,
        });
        
        const outreachCounts = await prisma.toolReview.groupBy({
          by: ['outreachStatus'],
          _count: true,
        });
        
        const backlinkCounts = await prisma.toolReview.groupBy({
          by: ['backlinkStatus'],
          _count: true,
        });
        
        return NextResponse.json({
          success: true,
          stats: {
            reviewStatus: Object.fromEntries(statusCounts.map(c => [c.reviewStatus, c._count])),
            outreachStatus: Object.fromEntries(outreachCounts.map(c => [c.outreachStatus, c._count])),
            backlinkStatus: Object.fromEntries(backlinkCounts.map(c => [c.backlinkStatus, c._count])),
          },
          timestamp: new Date().toISOString(),
        });
      }
      
      default:
        return NextResponse.json({
          error: 'Unknown action. Use: discover, generate, outreach, stats',
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[BacklinkScout] Cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats,
    }, { status: 500 });
  }
}
