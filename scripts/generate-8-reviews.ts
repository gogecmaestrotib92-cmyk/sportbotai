/**
 * Generate reviews for 8 curated tools and send outreach
 * 
 * Tools selected from the manually curated list with verified emails
 */

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

// 8 best tools from the curated list (good emails, active sites)
const TOOLS_TO_PROCESS = [
  'Tipstrr',
  'ProTipster', 
  'BetMines',
  'Vitibet',
  'BeSoccer',
  'EaglePredict',
  'CornerProBet',
  'DataBet.ai',
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
    
    // Extract text content (simple extraction)
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

async function processOneTool(toolName: string): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Processing: ${toolName}`);
  console.log('='.repeat(60));
  
  // Get tool from database
  const tool = await prisma.toolReview.findFirst({
    where: { toolName }
  });
  
  if (!tool) {
    console.log(`❌ Tool not found in database: ${toolName}`);
    return false;
  }
  
  if (!tool.contactEmail) {
    console.log(`❌ No email for: ${toolName}`);
    return false;
  }
  
  // Skip bad emails
  if (tool.contactEmail.includes('sentry') || 
      tool.contactEmail.includes('johnappleseed') ||
      tool.contactEmail.includes('wixpress')) {
    console.log(`❌ Bad email, skipping: ${tool.contactEmail}`);
    return false;
  }
  
  console.log(`   URL: ${tool.toolUrl}`);
  console.log(`   Email: ${tool.contactEmail}`);
  
  // Check if already has blog post
  if (tool.blogPostId) {
    console.log(`⚠️  Already has blog post, skipping review generation`);
    
    // But maybe we need to send outreach?
    if (tool.outreachStatus !== 'SENT') {
      const reviewUrl = `https://www.sportbotai.com/blog/${tool.blogSlug}`;
      console.log(`📧 Sending outreach...`);
      const sent = await sendToolReviewOutreach(tool.contactEmail, tool.toolName, reviewUrl);
      if (sent) {
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: { outreachStatus: 'SENT', outreachSentAt: new Date() }
        });
        console.log(`✅ Outreach sent!`);
      }
    }
    return true;
  }
  
  // Extract content from their site
  console.log(`   Extracting content from ${tool.toolUrl}...`);
  let content = tool.contentExtracted || '';
  if (!content || content.length < 100) {
    content = await extractContentFromUrl(tool.toolUrl);
  }
  
  // Generate review content
  console.log(`   Generating review content...`);
  const review = await generateToolReviewContent(
    tool.toolName,
    tool.toolUrl,
    tool.toolDescription || `${tool.toolName} is a sports betting tool.`,
    content
  );
  
  console.log(`   ✅ Generated: "${review.title}"`);
  
  // Capture screenshot
  console.log(`   Capturing screenshot...`);
  let featuredImage = '/sports/football.jpg';
  try {
    featuredImage = await captureScreenshotWithFallback(
      tool.toolUrl,
      tool.toolName,
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
  
  // Check if slug exists
  const slug = `tools/${review.slug.replace('tools/', '')}`;
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  
  if (existing) {
    console.log(`   ⚠️ Slug already exists, linking to existing post`);
    await prisma.toolReview.update({
      where: { id: tool.id },
      data: { 
        blogPostId: existing.id, 
        blogSlug: slug,
        reviewStatus: 'PUBLISHED'
      }
    });
  } else {
    // Create blog post
    console.log(`   Creating blog post...`);
    const blogPost = await prisma.blogPost.create({
      data: {
        title: review.title,
        slug,
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
    
    // Link to tool review
    await prisma.toolReview.update({
      where: { id: tool.id },
      data: {
        blogPostId: blogPost.id,
        blogSlug: slug,
        reviewTitle: review.title,
        reviewContent: review.content,
        reviewGeneratedAt: new Date(),
        reviewStatus: 'PUBLISHED',
      },
    });
    
    console.log(`   ✅ Published: /blog/${slug}`);
  }
  
  // Send outreach email
  const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
  console.log(`   📧 Sending outreach to ${tool.contactEmail}...`);
  
  const emailSent = await sendToolReviewOutreach(tool.contactEmail, tool.toolName, reviewUrl);
  
  if (emailSent) {
    await prisma.toolReview.update({
      where: { id: tool.id },
      data: {
        outreachStatus: 'SENT',
        outreachSentAt: new Date(),
      },
    });
    console.log(`   ✅ Outreach email sent!`);
  } else {
    console.log(`   ❌ Failed to send email`);
  }
  
  return true;
}

async function main() {
  console.log('🚀 Generating reviews for 8 curated tools...\n');
  console.log('Tools to process:', TOOLS_TO_PROCESS.join(', '));
  
  let success = 0;
  let failed = 0;
  
  for (const toolName of TOOLS_TO_PROCESS) {
    try {
      const result = await processOneTool(toolName);
      if (result) success++;
      else failed++;
    } catch (error) {
      console.error(`❌ Error processing ${toolName}:`, error);
      failed++;
    }
    
    // Small delay between tools
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
