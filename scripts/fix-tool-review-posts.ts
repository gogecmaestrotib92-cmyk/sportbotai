bro/**
 * Fix Tool Review Posts - Add tools/ prefix and publish
 * 
 * This script:
 * 1. Finds all tool review blog posts (category = 'Tools & Resources')
 * 2. Ensures they have 'tools/' prefix in their slug
 * 3. Sets status to PUBLISHED if they were DRAFT
 * 
 * Run: npx tsx scripts/fix-tool-review-posts.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing tool review blog posts...\n');

  // Find all tool review posts (Tools & Resources category with -review suffix)
  const toolReviewPosts = await prisma.blogPost.findMany({
    where: {
      category: 'Tools & Resources',
      slug: { endsWith: '-review' },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
    },
  });

  console.log(`Found ${toolReviewPosts.length} tool review posts\n`);

  let updated = 0;
  let alreadyCorrect = 0;

  for (const post of toolReviewPosts) {
    const needsPrefix = !post.slug.startsWith('tools/');
    const needsPublish = post.status !== 'PUBLISHED';
    
    if (!needsPrefix && !needsPublish) {
      alreadyCorrect++;
      console.log(`✓ Already correct: ${post.slug}`);
      continue;
    }

    const newSlug = needsPrefix ? `tools/${post.slug}` : post.slug;
    const updates: Record<string, unknown> = {};

    if (needsPrefix) {
      updates.slug = newSlug;
    }

    if (needsPublish) {
      updates.status = 'PUBLISHED';
      updates.publishedAt = post.publishedAt || new Date();
    }

    try {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: updates,
      });

      // Also update the linked ToolReview record if exists
      if (needsPrefix) {
        await prisma.toolReview.updateMany({
          where: { blogPostId: post.id },
          data: { blogSlug: newSlug },
        });
      }

      updated++;
      const changes = [];
      if (needsPrefix) changes.push(`slug: ${post.slug} → ${newSlug}`);
      if (needsPublish) changes.push(`status: ${post.status} → PUBLISHED`);
      console.log(`✅ Updated: ${post.title.substring(0, 40)}... (${changes.join(', ')})`);
    } catch (error) {
      console.error(`❌ Failed to update ${post.title}: ${error}`);
    }
  }

  console.log('\n========================================');
  console.log(`📊 Summary:`);
  console.log(`   Total tool review posts: ${toolReviewPosts.length}`);
  console.log(`   Already correct: ${alreadyCorrect}`);
  console.log(`   Updated: ${updated}`);
  console.log('========================================\n');

  // List all tool review URLs
  console.log('📋 Tool Review URLs:\n');
  const finalPosts = await prisma.blogPost.findMany({
    where: {
      category: 'Tools & Resources',
      slug: { endsWith: '-review' },
      status: 'PUBLISHED',
    },
    select: { slug: true, title: true },
    orderBy: { createdAt: 'desc' },
  });

  for (const post of finalPosts) {
    console.log(`https://www.sportbotai.com/blog/${post.slug}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
