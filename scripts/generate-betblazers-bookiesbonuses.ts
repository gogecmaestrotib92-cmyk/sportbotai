/**
 * Generate reviews for BetBlazers and BookiesBonuses, then send outreach
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

// 2 tools to process
const TOOLS = [
  {
    name: 'BetBlazers',
    url: 'https://betblazers.com/',
    email: 'info@betblazers.com',
    description: 'BetBlazers is a sports betting community platform offering expert betting picks, comprehensive guides for beginners, and state-by-state legal sports betting information for US bettors. Features include bankroll management tips, odds comparison, and detailed tutorials on moneylines, parlays, and point spreads.'
  },
  {
    name: 'Bookies Bonuses',
    url: 'https://bookiesbonuses.com/',
    email: 'info@bookiesbonuses.com',
    description: 'Bookies Bonuses is a UK-focused betting comparison site that lists 210+ UK betting sites with their welcome offers and ongoing promotions. Since 2009, they help punters find the best bookmakers, compare sign-up bonuses, track daily price boosts, and navigate betting site sister networks. Features include expert reviews, betting guides, and responsible gambling resources.'
  }
];

async function extractContentFromUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return '';
    
    const html = await response.text();
    
    // Extract text content
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
    
    return textContent;
  } catch {
    return '';
  }
}

async function processOneTool(tool: typeof TOOLS[0]): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Processing: ${tool.name}`);
  console.log('='.repeat(60));
  console.log(`   URL: ${tool.url}`);
  console.log(`   Email: ${tool.email}`);
  
  // Extract content from their site
  console.log(`   Extracting content from ${tool.url}...`);
  const content = await extractContentFromUrl(tool.url);
  console.log(`   Extracted ${content.length} chars`);
  
  // Generate review content
  console.log(`   Generating review content (this takes 1-2 min)...`);
  const review = await generateToolReviewContent(
    tool.name,
    tool.url,
    tool.description,
    content
  );
  
  console.log(`   ✅ Generated: "${review.title}"`);
  
  // Capture screenshot
  console.log(`   Capturing screenshot...`);
  let featuredImage = '/sports/football.jpg';
  try {
    featuredImage = await captureScreenshotWithFallback(
      tool.url,
      tool.name,
      '/sports/football.jpg'
    );
    if (featuredImage.includes('blob.vercel-storage.com')) {
      console.log(`   ✅ Screenshot captured`);
    } else {
      console.log(`   ⚠️ Using fallback image`);
    }
  } catch (err) {
    console.log(`   ⚠️ Screenshot failed, using fallback`);
  }
  
  // Ensure slug has tools/ prefix
  const slug = review.slug.startsWith('tools/') ? review.slug : `tools/${review.slug}`;
  
  // Check if slug exists
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  
  if (existing) {
    console.log(`   ⚠️ Blog post already exists: ${slug}`);
    console.log(`   📧 Sending outreach anyway...`);
    
    const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
    const sent = await sendToolReviewOutreach(tool.email, tool.name, reviewUrl);
    console.log(`   ${sent ? '✅' : '❌'} Outreach ${sent ? 'sent' : 'failed'}!`);
    
    return sent;
  }
  
  // Create blog post
  console.log(`   Creating blog post...`);
  const blogPost = await prisma.blogPost.create({
    data: {
      title: review.title,
      slug: slug,
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
  
  console.log(`   ✅ Blog post created: /blog/${slug}`);
  
  // Create ToolReview entry for tracking
  await prisma.toolReview.create({
    data: {
      toolName: tool.name,
      toolUrl: tool.url,
      toolDescription: tool.description,
      contactEmail: tool.email,
      sourceUrl: 'manual-outreach',
      scrapedFrom: 'manual',
      blogPostId: blogPost.id,
      blogSlug: slug,
      reviewTitle: review.title,
      reviewContent: review.content,
      reviewGeneratedAt: new Date(),
      reviewStatus: 'PUBLISHED',
      outreachStatus: 'NOT_SENT',
    }
  });
  
  // Send outreach email
  console.log(`   📧 Sending outreach email to ${tool.email}...`);
  const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
  const sent = await sendToolReviewOutreach(tool.email, tool.name, reviewUrl);
  
  if (sent) {
    await prisma.toolReview.updateMany({
      where: { toolUrl: tool.url },
      data: { outreachStatus: 'SENT', outreachSentAt: new Date() }
    });
    console.log(`   ✅ Outreach email sent!`);
  } else {
    console.log(`   ❌ Outreach email failed`);
  }
  
  return true;
}

async function main() {
  console.log('🚀 Generating 2 tool reviews: BetBlazers & Bookies Bonuses');
  console.log('This will take 3-5 minutes...\n');
  
  let success = 0;
  
  for (const tool of TOOLS) {
    try {
      const ok = await processOneTool(tool);
      if (ok) success++;
    } catch (err) {
      console.error(`❌ Error processing ${tool.name}:`, err);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Done! ${success}/${TOOLS.length} tools processed`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
}

main().catch(console.error);
