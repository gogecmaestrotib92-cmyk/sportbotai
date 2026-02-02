/**
 * Create ScoresAndStats ToolReview entry
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find existing entry
  const existing = await prisma.toolReview.findFirst({
    where: { toolUrl: 'https://scoresandstats.com/' }
  });
  
  if (existing) {
    console.log('Found existing:', existing.toolName, existing.outreachStatus);
    await prisma.$disconnect();
    return;
  }
  
  // Find blog post
  const blogPost = await prisma.blogPost.findUnique({
    where: { slug: 'tools/scores-and-stats-review' },
    select: { id: true, title: true }
  });
  
  if (!blogPost) {
    console.log('Blog post not found');
    await prisma.$disconnect();
    return;
  }
  
  // Create entry
  await prisma.toolReview.create({
    data: {
      toolName: 'Scores and Stats',
      toolUrl: 'https://scoresandstats.com/',
      toolDescription: 'ScoresAndStats provides live scores, statistics, and sports data for various leagues worldwide.',
      contactEmail: 'sales@scoresandstats.com',
      sourceUrl: 'manual-outreach',
      scrapedFrom: 'manual',
      blogPostId: blogPost.id,
      blogSlug: 'tools/scores-and-stats-review',
      reviewTitle: blogPost.title,
      reviewGeneratedAt: new Date(),
      reviewStatus: 'PUBLISHED',
      outreachStatus: 'SENT',
      outreachSentAt: new Date(),
    }
  });
  
  console.log('✅ Created Scores and Stats entry');
  await prisma.$disconnect();
}

main().catch(console.error);
