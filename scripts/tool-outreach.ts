/**
 * PREMIUM TOOL OUTREACH SCRIPT
 * ============================
 * 
 * Standard process for tool reviews and backlink outreach:
 * 1. Generate high-quality review content
 * 2. Capture screenshot
 * 3. Publish to blog with proper slug (kebab-case!)
 * 4. Send premium outreach email
 * 5. Track in database
 * 
 * Usage:
 *   npx tsx scripts/tool-outreach.ts
 * 
 * Then edit the TOOLS array below with your targets.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

// ============================================
// TOOLS TO PROCESS - EDIT THIS ARRAY
// ============================================
const TOOLS: ToolConfig[] = [
  {
    name: 'TopBetPredict',
    url: 'https://topbetpredict.com/',
    email: 'topbetpredict.com@gmail.com',
    description: 'TopBetPredict is a comprehensive football predictions and stats platform offering daily match predictions, H2H statistics, match facts, and live scores across 30+ countries and 50+ leagues worldwide. Key features include: (1) Daily predictions with 1x2, double chance, and combo bets for every match, (2) H2H Stats section showing head-to-head records with detailed match statistics like goals, shots on goal, offsides, corners, and clean sheets, (3) Match Facts page highlighting team streaks (BTTS, over/under, winning/undefeated), (4) LiveScore integration, (5) Coverage of major leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1) plus lower divisions and emerging leagues. The site also provides betting guides and educational resources covering topics from beginner betting terminology to advanced strategies. Built on WordPress with the Football Leagues by AnWP Pro plugin.',
  },
];

interface ToolConfig {
  name: string;
  url: string;
  email: string;
  description: string;
}

// ============================================
// SLUG GENERATOR - PROPER KEBAB-CASE
// ============================================
function generateSlug(toolName: string): string {
  return toolName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
    + '-review';
}

// ============================================
// EXTRACT CONTENT FROM URL
// ============================================
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

// ============================================
// PROCESS SINGLE TOOL
// ============================================
async function processOneTool(tool: ToolConfig): Promise<boolean> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📝 Processing: ${tool.name}`);
  console.log('═'.repeat(60));
  console.log(`   URL: ${tool.url}`);
  console.log(`   Email: ${tool.email}`);
  
  // Generate proper slug FIRST
  const baseSlug = generateSlug(tool.name);
  const slug = `tools/${baseSlug}`;
  console.log(`   Slug: ${slug}`);
  
  // Check if already exists
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    console.log(`   ⚠️  Already exists! Sending outreach only...`);
    
    const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
    const sent = await sendToolReviewOutreach(tool.email, tool.name, reviewUrl);
    console.log(`   ${sent ? '✅' : '❌'} Outreach ${sent ? 'sent' : 'failed'}`);
    return sent;
  }
  
  // Extract content from their site
  console.log(`   Extracting content...`);
  const content = await extractContentFromUrl(tool.url);
  console.log(`   Extracted ${content.length} chars`);
  
  // Generate review content
  console.log(`   Generating review (1-2 min)...`);
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
    console.log(`   ✅ Screenshot: ${featuredImage.includes('blob') ? 'uploaded' : 'fallback'}`);
  } catch {
    console.log(`   ⚠️  Using fallback image`);
  }
  
  // Create blog post with OUR slug (not the generated one which might be wrong)
  console.log(`   Creating blog post...`);
  const blogPost = await prisma.blogPost.create({
    data: {
      title: review.title,
      slug: slug, // Use OUR properly generated slug!
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
  console.log(`   ✅ Published: /blog/${slug}`);
  
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
  const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
  console.log(`   📧 Sending to ${tool.email}...`);
  console.log(`   📎 Link: ${reviewUrl}`);
  
  const sent = await sendToolReviewOutreach(tool.email, tool.name, reviewUrl);
  
  if (sent) {
    await prisma.toolReview.updateMany({
      where: { toolUrl: tool.url },
      data: { outreachStatus: 'SENT', outreachSentAt: new Date() }
    });
    console.log(`   ✅ Email sent!`);
  } else {
    console.log(`   ❌ Email failed`);
  }
  
  return true;
}

// ============================================
// MAIN
// ============================================
async function main() {
  if (TOOLS.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  TOOL OUTREACH SCRIPT                                       ║
╠════════════════════════════════════════════════════════════╣
║                                                              ║
║  No tools configured. Edit the TOOLS array in this file:    ║
║                                                              ║
║  const TOOLS = [                                             ║
║    {                                                         ║
║      name: 'Tool Name',                                      ║
║      url: 'https://example.com',                             ║
║      email: 'contact@example.com',                           ║
║      description: 'What the tool does...'                    ║
║    },                                                        ║
║  ];                                                          ║
║                                                              ║
╚════════════════════════════════════════════════════════════╝
`);
    return;
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║  TOOL OUTREACH - ${TOOLS.length} tool(s) to process                        ║
╚════════════════════════════════════════════════════════════╝
`);

  let success = 0;
  
  for (const tool of TOOLS) {
    try {
      const ok = await processOneTool(tool);
      if (ok) success++;
    } catch (err) {
      console.error(`   ❌ Error: ${err}`);
    }
  }
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  DONE: ${success}/${TOOLS.length} tools processed                              ║
╚════════════════════════════════════════════════════════════╝
`);

  await prisma.$disconnect();
}

main().catch(console.error);
