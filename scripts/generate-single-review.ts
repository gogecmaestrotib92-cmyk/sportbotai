/**
 * Generate a single tool review with screenshot
 * Usage: npx tsx scripts/generate-single-review.ts
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReview } from '../src/lib/backlink-scout';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';

const prisma = new PrismaClient();

async function main() {
  // NoVig Sportsbook - a tool from sportsbettingtools.io
  const toolUrl = 'https://www.novig.us/';
  const toolName = 'NoVig Sportsbook';
  
  // Find or use directly
  const tool = await prisma.toolReview.findFirst({
    where: { toolUrl: { contains: 'novig' } },
  });
  
  if (!tool) {
    console.log('Tool not found in DB, creating manually...');
  }
  
  console.log('📝 Generating review for:', toolName);
  console.log('   URL:', toolUrl);
  
  // 1. Capture screenshot using Screenshotone
  console.log('\n🖼️ Capturing screenshot...');
  const featuredImage = await captureScreenshotWithFallback(toolUrl, toolName, '/sports/football.jpg');
  console.log('   ✅ Screenshot:', featuredImage);
  
  // 2. Generate AI review
  console.log('\n🤖 Generating AI review...');
  const review = await generateToolReview(toolName, toolUrl, 'A no-vig betting exchange and sportsbook');
  console.log('   ✅ Title:', review.title);
  console.log('   ✅ Content length:', review.content.length, 'chars');
  
  // 3. Create blog post
  const slug = toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-review';
  
  // Check if slug exists
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    console.log('\n⚠️ Blog post already exists:', slug);
    console.log('   Updating featured image...');
    await prisma.blogPost.update({
      where: { id: existing.id },
      data: { featuredImage },
    });
    console.log('   ✅ Updated!');
  } else {
    console.log('\n📰 Creating blog post...');
    const blogPost = await prisma.blogPost.create({
      data: {
        title: review.title,
        slug,
        excerpt: `A comprehensive review of ${toolName} - a sports betting tool. See features, pros, cons, and our verdict.`,
        content: review.content,
        category: 'Tools & Resources',
        tags: ['tool-review', 'sports-betting', 'analytics'],
        status: 'PUBLISHED',
        publishedAt: new Date(),
        postType: 'GENERAL',
        metaTitle: `${toolName} Review: Is It Worth It? | SportBot AI`,
        metaDescription: `Our honest review of ${toolName}. See key features, pros and cons, pricing, and whether it's right for your sports betting strategy.`,
        featuredImage,
      },
    });
    console.log('   ✅ Published:', blogPost.slug);
    
    // Update tool review if exists
    if (tool) {
      await prisma.toolReview.update({
        where: { id: tool.id },
        data: {
          reviewTitle: review.title,
          reviewContent: review.content,
          blogPostId: blogPost.id,
          blogSlug: slug,
          reviewGeneratedAt: new Date(),
        },
      });
      console.log('   ✅ Tool review linked');
    }
  }
  
  console.log('\n🎉 Done! Check: https://sportbotai.com/blog/' + slug);
  
  await prisma.$disconnect();
}

main().catch(console.error);
