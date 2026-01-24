/**
 * Check and Send Outreach Emails for Tool Reviews
 * 
 * This script:
 * 1. Finds recent tool reviews that haven't had outreach sent
 * 2. Sends badge exchange outreach emails
 * 
 * Run: npx tsx scripts/check-and-send-outreach.ts
 * Dry run: npx tsx scripts/check-and-send-outreach.ts --dry
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { sendToolReviewOutreach } from '../src/lib/email';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry');

async function main() {
  console.log('🔍 Checking outreach status for recent tool reviews...\n');
  if (isDryRun) console.log('⚠️  DRY RUN MODE - No emails will be sent\n');

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Get recent blog posts with their tool review links
  const recentPosts = await prisma.blogPost.findMany({
    where: {
      category: 'Tools & Resources',
      slug: { endsWith: '-review' },
      createdAt: { gte: weekAgo },
    },
    select: { id: true, slug: true, title: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${recentPosts.length} tool reviews from last 7 days\n`);

  const needsOutreach: Array<{
    postId: string;
    toolReviewId: string;
    toolName: string;
    email: string;
    slug: string;
  }> = [];

  // Check each post's outreach status
  for (const post of recentPosts) {
    const toolReview = await prisma.toolReview.findFirst({
      where: { blogPostId: post.id },
      select: {
        id: true,
        toolName: true,
        contactEmail: true,
        outreachStatus: true,
      },
    });

    const shortTitle = post.title.substring(0, 40);

    if (!toolReview) {
      console.log(`❌ NO LINK: ${shortTitle}...`);
    } else if (!toolReview.contactEmail) {
      console.log(`📭 NO EMAIL: ${shortTitle}...`);
    } else if (toolReview.outreachStatus === 'SENT') {
      console.log(`✅ ALREADY SENT: ${shortTitle}... → ${toolReview.contactEmail}`);
    } else {
      console.log(`📧 NEEDS OUTREACH: ${shortTitle}... → ${toolReview.contactEmail}`);
      needsOutreach.push({
        postId: post.id,
        toolReviewId: toolReview.id,
        toolName: toolReview.toolName,
        email: toolReview.contactEmail,
        slug: post.slug,
      });
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Summary: ${needsOutreach.length} tools need outreach emails`);
  console.log(`========================================\n`);

  if (needsOutreach.length === 0) {
    console.log('✨ All caught up! No outreach emails needed.');
    await prisma.$disconnect();
    return;
  }

  // Send outreach emails
  console.log('📤 Sending outreach emails...\n');

  let sent = 0;
  let failed = 0;

  for (const tool of needsOutreach) {
    const reviewUrl = `https://www.sportbotai.com/blog/${tool.slug}`;

    if (isDryRun) {
      console.log(`[DRY RUN] Would send to: ${tool.email}`);
      console.log(`          Tool: ${tool.toolName}`);
      console.log(`          URL: ${reviewUrl}\n`);
      sent++;
      continue;
    }

    try {
      const success = await sendToolReviewOutreach(tool.email, tool.toolName, reviewUrl);

      if (success) {
        // Update outreach status
        await prisma.toolReview.update({
          where: { id: tool.toolReviewId },
          data: {
            outreachStatus: 'SENT',
            outreachSentAt: new Date(),
          },
        });
        console.log(`✅ Sent to ${tool.email} for ${tool.toolName}`);
        sent++;
      } else {
        console.log(`❌ Failed to send to ${tool.email}`);
        failed++;
      }

      // Small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ Error sending to ${tool.email}: ${error}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`📧 Outreach Complete`);
  console.log(`   Sent: ${sent}`);
  console.log(`   Failed: ${failed}`);
  console.log(`========================================\n`);

  await prisma.$disconnect();
}

main().catch(console.error);
