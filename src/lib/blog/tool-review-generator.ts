/**
 * Tool Review Generator
 * 
 * Generates blog posts for sports betting tools in the "Tools You Should Know" section.
 * Integrates with existing blog infrastructure - same images, formatting, and publishing.
 */

import { prisma } from '@/lib/prisma';
import { 
  extractWebsiteContent, 
  findContactEmail,
  scrapeSportsBettingTools,
  isBlockedDomain,
} from '@/lib/backlink-scout';
import { captureScreenshotWithFallback } from './screenshot-generator';
import { generateToolReviewContent } from './content-generator';
import { sendToolReviewOutreach } from '@/lib/email';

export interface ToolReviewResult {
  success: boolean;
  toolName: string;
  slug?: string;
  error?: string;
}

/**
 * Generate and publish tool reviews as blog posts
 * @param count Number of reviews to generate (default 1)
 * @returns Array of results
 */
export async function generateToolReviewPosts(count: number = 1): Promise<ToolReviewResult[]> {
  const results: ToolReviewResult[] = [];
  
  // ONLY review tools from sportsbettingtools.io
  // Skip big brands that won't link back
  const bigBrands = [
    'draftkings', 'fanduel', 'betmgm', 'caesars', 'bet365', 
    'pointsbet', 'barstool', 'espnbet', 'fanatics', 'betrivers',
    'hard rock', 'bovada', 'betfair', 'william hill'
  ];
  
  const toolsNeedingReviews = await prisma.toolReview.findMany({
    where: {
      contentWords: { gt: 100 }, // Has extracted content
      blogPostId: null, // No blog post created yet
      // ONLY from sportsbettingtools.io - our single source
      sourceUrl: { contains: 'sportsbettingtools' },
      // ONLY tools with contact emails - so we can send outreach
      contactEmail: { not: null },
      // Exclude big brands - they won't link back
      NOT: {
        OR: bigBrands.map(brand => ({
          toolName: { contains: brand, mode: 'insensitive' as const }
        }))
      }
    },
    orderBy: [
      // Newest first (more likely to engage)
      { createdAt: 'desc' },
    ],
    take: count,
  });
  
  console.log(`[ToolReview] Found ${toolsNeedingReviews.length} tools from sportsbettingtools.io needing reviews`);
  
  for (const tool of toolsNeedingReviews) {
    try {
      console.log(`[ToolReview] Generating review for: ${tool.toolName}`);
      
      // Generate the review content using same approach as regular blogs
      const review = await generateToolReviewContent(
        tool.toolName,
        tool.toolUrl,
        tool.toolDescription || '',
        tool.contentExtracted || ''
      );
      
      // Capture screenshot of tool's homepage for featured image
      let featuredImage = '/sports/football.jpg';
      try {
        console.log(`[ToolReview] Capturing screenshot of ${tool.toolUrl}...`);
        console.log(`[ToolReview] SCREENSHOTONE_API_KEY configured: ${!!process.env.SCREENSHOTONE_API_KEY}`);
        
        featuredImage = await captureScreenshotWithFallback(
          tool.toolUrl,
          tool.toolName,
          '/sports/football.jpg'
        );
        if (featuredImage.includes('blob.vercel-storage.com')) {
          console.log(`[ToolReview] ✅ Screenshot captured: ${featuredImage.substring(0, 80)}...`);
        } else {
          console.log(`[ToolReview] ⚠️ Using fallback image - featuredImage is: ${featuredImage}`);
        }
      } catch (imgErr) {
        console.error(`[ToolReview] ❌ Screenshot error for ${tool.toolName}:`, imgErr);
      }
      
      // Check if slug exists
      const existing = await prisma.blogPost.findUnique({ where: { slug: review.slug } });
      if (existing) {
        console.log(`[ToolReview] Slug ${review.slug} already exists, linking...`);
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: { blogPostId: existing.id, blogSlug: review.slug },
        });
        results.push({ success: true, toolName: tool.toolName, slug: review.slug });
        continue;
      }
      
      // Create blog post (PUBLISHED) - using all fields from content generator
      const blogPost = await prisma.blogPost.create({
        data: {
          title: review.title,
          slug: review.slug,
          excerpt: review.excerpt,
          content: review.content,
          category: 'Tools & Resources',
          tags: review.tags,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          postType: 'GENERAL',
          metaTitle: review.metaTitle,
          metaDescription: review.metaDescription,
          featuredImage,
        },
      });
      
      // Link tool review to blog post
      await prisma.toolReview.update({
        where: { id: tool.id },
        data: {
          blogPostId: blogPost.id,
          blogSlug: review.slug,
          reviewTitle: review.title,
          reviewContent: review.content,
          reviewGeneratedAt: new Date(),
          reviewStatus: 'PUBLISHED',
        },
      });
      
      console.log(`[ToolReview] ✅ Published: /blog/${review.slug}`);
      
      // Send outreach email if contact email exists
      if (tool.contactEmail) {
        const reviewUrl = `https://www.sportbotai.com/blog/${review.slug}`;
        const emailSent = await sendToolReviewOutreach(tool.contactEmail, tool.toolName, reviewUrl);
        console.log(`[ToolReview] 📧 Outreach email ${emailSent ? 'sent' : 'failed'} to ${tool.contactEmail}`);
      }
      
      results.push({ success: true, toolName: tool.toolName, slug: review.slug });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[ToolReview] ❌ Failed for ${tool.toolName}:`, errorMsg);
      results.push({ success: false, toolName: tool.toolName, error: errorMsg });
    }
  }
  
  return results;
}

/**
 * Get count of tools ready for review generation (ONLY with contact emails)
 */
export async function getToolsReadyForReview(): Promise<number> {
  return prisma.toolReview.count({
    where: {
      contentWords: { gt: 100 },
      blogPostId: null,
      sourceUrl: { contains: 'sportsbettingtools' },
      contactEmail: { not: null }, // Only count tools we can email
    },
  });
}

/**
 * Discover new tools from sportsbettingtools.io and process them
 * Full pipeline: scrape → save → extract content → find email
 * 
 * @param maxNew Maximum new tools to process per run
 * @returns Discovery results
 */
export async function discoverAndProcessNewTools(maxNew: number = 5): Promise<{ discovered: number; new: number }> {
  const result = { discovered: 0, new: 0 };
  
  try {
    console.log('[ToolDiscovery] Starting scrape from sportsbettingtools.io...');
    
    // 1. Scrape sportsbettingtools.io
    const scrapedTools = await scrapeSportsBettingTools();
    result.discovered = scrapedTools.length;
    
    if (scrapedTools.length === 0) {
      console.log('[ToolDiscovery] No tools found, Puppeteer may not be available');
      return result;
    }
    
    console.log(`[ToolDiscovery] Scraped ${scrapedTools.length} tools`);
    
    // 2. Filter blocked domains and dedupe
    const validTools = scrapedTools.filter(t => !isBlockedDomain(t.url));
    
    // 3. Check which are new (not in DB)
    const existingUrls = await prisma.toolReview.findMany({
      where: {
        toolUrl: { in: validTools.map(t => t.url) },
      },
      select: { toolUrl: true },
    });
    
    const existingSet = new Set(existingUrls.map(e => e.toolUrl));
    const newTools = validTools.filter(t => !existingSet.has(t.url));
    
    console.log(`[ToolDiscovery] ${newTools.length} new tools to process`);
    
    // 4. Process up to maxNew tools
    const toProcess = newTools.slice(0, maxNew);
    
    for (const tool of toProcess) {
      try {
        console.log(`[ToolDiscovery] Processing: ${tool.name}`);
        
        // Extract content from website
        const { content, wordCount } = await extractWebsiteContent(tool.url);
        console.log(`[ToolDiscovery] Extracted ${wordCount} words`);
        
        // Find contact email
        const { email, source: emailSource } = await findContactEmail(tool.url);
        console.log(`[ToolDiscovery] Email: ${email || 'not found'} (${emailSource})`);
        
        // Save to database
        await prisma.toolReview.create({
          data: {
            toolName: tool.name,
            toolUrl: tool.url,
            toolDescription: tool.description,
            sourceUrl: tool.sourceUrl || 'https://sportsbettingtools.io',
            scrapedFrom: 'sportsbettingtools',
            contentExtracted: content,
            contentWords: wordCount,
            contactEmail: email,
            emailSource: emailSource,
            reviewStatus: 'PENDING',
            outreachStatus: 'NOT_SENT',
          },
        });
        
        result.new++;
        console.log(`[ToolDiscovery] ✅ Saved: ${tool.name}`);
        
        // Small delay between processing
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (toolError) {
        console.error(`[ToolDiscovery] Failed to process ${tool.name}:`, toolError);
      }
    }
    
    console.log(`[ToolDiscovery] Complete: ${result.new} new tools added`);
    
  } catch (error) {
    console.error('[ToolDiscovery] Error:', error);
  }
  
  return result;
}