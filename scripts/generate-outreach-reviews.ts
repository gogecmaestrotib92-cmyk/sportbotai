/**
 * Generate reviews for manually specified tools with outreach
 * 
 * Usage: npx tsx scripts/generate-outreach-reviews.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();

// Tools to process with manually found emails
interface ToolToProcess {
  toolName: string;
  toolUrl: string;
  contactEmail: string | null;
  description: string;
}

const TOOLS_TO_PROCESS: ToolToProcess[] = [
  {
    toolName: 'StatSalt',
    toolUrl: 'https://statsalt.com/',
    contactEmail: null, // No direct email, contact form only
    description: 'StatSalt is a premium sports handicapping platform offering data-backed picks and predictions from expert handicappers. The site features a transparent leaderboard system tracking handicapper performance across NFL, NBA, NHL, MLB, and college sports. Users can purchase individual picks or subscribe to expert packages with guaranteed options.',
  },
  {
    toolName: 'PickDawgz',
    toolUrl: 'https://pickdawgz.com/',
    contactEmail: 'help@pickdawgz.com',
    description: 'PickDawgz is a sports betting picks platform with a massive social following (260K YouTube subscribers, 480K TikTok followers). They offer free daily picks, premium handicapper packages, parlays, and betting tools. The platform covers NFL, NBA, NHL, MLB, college sports, and more with detailed predictions and analysis.',
  },
  {
    toolName: 'Scores and Stats',
    toolUrl: 'https://www.scoresandstats.com/',
    contactEmail: 'sales@scoresandstats.com',
    description: 'Scores and Stats (SAS) is a comprehensive sports betting platform providing expert handicapper picks, live scores, odds comparison, and in-depth betting guides. They feature a network of verified handicappers with transparent performance tracking, covering NBA, NFL, NHL, MLB, NCAAF, NCAAB, soccer, tennis, and more.',
  },
  {
    toolName: 'XCLSV Media',
    toolUrl: 'https://xclsvmedia.com/',
    contactEmail: 'zaire@xclsvmedia.com',
    description: 'XCLSV Media is an iGaming affiliate agency specializing in sports betting marketing and partnerships. They connect brands with sportsbooks, provide digital marketing services tailored for iGaming, and offer sports betting content including best bets and predictions. Based in New York, they serve as a marketing ally for businesses in the sports betting industry.',
  },
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

async function processOneTool(tool: ToolToProcess): Promise<{ success: boolean; slug?: string }> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Processing: ${tool.toolName}`);
  console.log('='.repeat(60));
  console.log(`   URL: ${tool.toolUrl}`);
  console.log(`   Email: ${tool.contactEmail || 'N/A (no direct email)'}`);
  
  // Generate slug
  const slugBase = tool.toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const slug = `tools/${slugBase}-review`;
  
  // Check if already exists
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    console.log(`⚠️  Blog post already exists: /blog/${slug}`);
    
    // Send outreach if email available and not sent
    if (tool.contactEmail) {
      const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
      console.log(`📧 Sending outreach to ${tool.contactEmail}...`);
      const sent = await sendToolReviewOutreach(tool.contactEmail, tool.toolName, reviewUrl);
      if (sent) {
        console.log(`✅ Outreach sent!`);
      } else {
        console.log(`❌ Failed to send outreach`);
      }
    }
    return { success: true, slug };
  }
  
  // Extract content from site
  console.log(`   Extracting content from ${tool.toolUrl}...`);
  const content = await extractContentFromUrl(tool.toolUrl);
  console.log(`   ✅ Extracted ${content.length} chars`);
  
  // Generate review content
  console.log(`   Generating review content...`);
  const review = await generateToolReviewContent(
    tool.toolName,
    tool.toolUrl,
    tool.description,
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
  console.log(`   ✅ Published: /blog/${slug}`);
  
  // Also create ToolReview record
  await prisma.toolReview.upsert({
    where: {
      toolUrl: tool.toolUrl,
    },
    create: {
      toolName: tool.toolName,
      toolUrl: tool.toolUrl,
      toolDescription: tool.description,
      contactEmail: tool.contactEmail,
      sourceUrl: 'manual',
      scrapedFrom: 'MANUAL_OUTREACH',
      contentExtracted: content,
      contentWords: content.split(/\s+/).length,
      blogPostId: blogPost.id,
      blogSlug: slug,
      reviewTitle: review.title,
      reviewContent: review.content,
      reviewGeneratedAt: new Date(),
      reviewStatus: 'PUBLISHED',
    },
    update: {
      blogPostId: blogPost.id,
      blogSlug: slug,
      reviewTitle: review.title,
      reviewContent: review.content,
      reviewGeneratedAt: new Date(),
      reviewStatus: 'PUBLISHED',
    },
  });
  
  // Send outreach email if contact email available
  if (tool.contactEmail) {
    const reviewUrl = `https://www.sportbotai.com/blog/${slug}`;
    console.log(`   📧 Sending outreach to ${tool.contactEmail}...`);
    
    const emailSent = await sendToolReviewOutreach(tool.contactEmail, tool.toolName, reviewUrl);
    
    if (emailSent) {
      await prisma.toolReview.update({
        where: { toolUrl: tool.toolUrl },
        data: {
          outreachStatus: 'SENT',
          outreachSentAt: new Date(),
        },
      });
      console.log(`   ✅ Outreach email sent!`);
    } else {
      console.log(`   ❌ Failed to send email`);
    }
  } else {
    console.log(`   ⚠️ No email available, skipping outreach`);
  }
  
  return { success: true, slug };
}

async function main() {
  console.log('🚀 Generating reviews for curated tools with outreach...\n');
  console.log('Tools to process:');
  TOOLS_TO_PROCESS.forEach(t => console.log(`  - ${t.toolName}: ${t.contactEmail || 'no email'}`));
  
  let success = 0;
  let failed = 0;
  const results: { name: string; slug?: string; status: string }[] = [];
  
  for (const tool of TOOLS_TO_PROCESS) {
    try {
      const result = await processOneTool(tool);
      if (result.success) {
        success++;
        results.push({ name: tool.toolName, slug: result.slug, status: '✅' });
      } else {
        failed++;
        results.push({ name: tool.toolName, status: '❌' });
      }
    } catch (error) {
      console.error(`❌ Error processing ${tool.toolName}:`, error);
      failed++;
      results.push({ name: tool.toolName, status: '❌ error' });
    }
    
    // Delay between tools
    await new Promise(r => setTimeout(r, 3000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${success}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('\nResults:');
  results.forEach(r => {
    console.log(`  ${r.status} ${r.name}: ${r.slug ? `https://sportbotai.com/blog/${r.slug}` : 'N/A'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
