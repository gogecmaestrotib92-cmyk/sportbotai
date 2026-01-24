/**
 * Generate reviews for tools that mistakenly got outreach without reviews
 * Run: npx tsx scripts/generate-missing-reviews.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { generateToolReviewContent } from '../src/lib/blog/content-generator';
import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('📝 Finding tools that got outreach without reviews...\n');
  
  // Find tools that were sent outreach but have no blogSlug
  const toolsNeedingReviews = await prisma.toolReview.findMany({
    where: {
      outreachStatus: 'SENT',
      blogSlug: null,
      reviewStatus: { not: 'SKIP' }
    }
  });
  
  console.log(`Found ${toolsNeedingReviews.length} tools needing reviews:\n`);
  toolsNeedingReviews.forEach(t => console.log(`  - ${t.toolName} (${t.toolUrl})`));
  console.log('');
  
  let generated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const tool of toolsNeedingReviews) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📝 Generating review for: ${tool.toolName}`);
      console.log(`   URL: ${tool.toolUrl}`);
      
      // Generate the review content
      const review = await generateToolReviewContent(
        tool.toolName,
        tool.toolUrl,
        tool.toolDescription || '',
        tool.contentExtracted || ''
      );
      
      // Make sure slug starts with tools/
      const slug = review.slug.startsWith('tools/') ? review.slug : `tools/${review.slug}`;
      
      // Check if slug already exists
      const existingPost = await prisma.blogPost.findUnique({ where: { slug } });
      if (existingPost) {
        console.log(`   ⚠️ Blog post already exists: ${slug}`);
        // Just link the tool review to existing post
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: {
            blogPostId: existingPost.id,
            blogSlug: slug,
            reviewStatus: 'PUBLISHED'
          }
        });
        console.log(`   ✅ Linked to existing post`);
        skipped++;
        continue;
      }
      
      // Capture screenshot
      let featuredImage = '/sports/football.jpg';
      try {
        console.log(`   📸 Capturing screenshot...`);
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
      } catch (imgErr) {
        console.log(`   ⚠️ Screenshot failed, using fallback`);
      }
      
      // Create blog post
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
      
      // Link tool review to blog post
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
      generated++;
      
    } catch (err) {
      console.error(`   ❌ Error generating review for ${tool.toolName}:`, err);
      errors++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 Summary:');
  console.log(`   Generated: ${generated}`);
  console.log(`   Linked to existing: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  
  await prisma.$disconnect();
}

main();
