/**
 * Backfill ToolReview entries for 4 tools that were sent outreach but not tracked
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const tools = [
  {
    name: 'PickDawgz',
    url: 'https://pickdawgz.com/',
    email: 'Help@PickDawgz.com',
    slug: 'tools/pickdawgz-review',
    description: 'PickDawgz offers free sports picks and predictions across NFL, NBA, MLB, NHL, and college sports.'
  },
  {
    name: 'Scores and Stats',
    url: 'https://scoresandstats.com/',
    email: 'sales@scoresandstats.com',
    slug: 'tools/scoresandstats-review',
    description: 'ScoresAndStats provides live scores, statistics, and sports data for various leagues worldwide.'
  },
  {
    name: 'XCLSV Media',
    url: 'https://xclsvmedia.com/',
    email: 'zaire@xclsvmedia.com',
    slug: 'tools/xclsv-media-review',
    description: 'XCLSV Media is a sports media and analytics company providing betting content and insights.'
  },
  {
    name: 'StatsAlt',
    url: 'https://statsalt.com/',
    email: null, // No direct email, only contact form
    slug: 'tools/statsalt-review',
    description: 'StatsAlt provides alternative sports statistics and analytics tools for bettors.'
  }
];

async function main() {
  console.log('Backfilling ToolReview entries for 4 tools...\n');
  
  for (const tool of tools) {
    // Find the blog post
    const blogPost = await prisma.blogPost.findUnique({
      where: { slug: tool.slug },
      select: { id: true, title: true }
    });
    
    if (!blogPost) {
      console.log(`❌ Blog post not found for: ${tool.slug}`);
      continue;
    }
    
    // Check if ToolReview already exists
    const existing = await prisma.toolReview.findFirst({
      where: { toolUrl: tool.url }
    });
    
    if (existing) {
      console.log(`⚠️ Already exists: ${tool.name}`);
      continue;
    }
    
    // Create ToolReview entry
    await prisma.toolReview.create({
      data: {
        toolName: tool.name,
        toolUrl: tool.url,
        toolDescription: tool.description,
        contactEmail: tool.email,
        sourceUrl: 'manual-outreach',
        scrapedFrom: 'manual',
        blogPostId: blogPost.id,
        blogSlug: tool.slug,
        reviewTitle: blogPost.title,
        reviewGeneratedAt: new Date(),
        reviewStatus: 'PUBLISHED',
        outreachStatus: tool.email ? 'SENT' : 'NO_EMAIL',
        outreachSentAt: tool.email ? new Date() : null,
      }
    });
    
    console.log(`✅ Created: ${tool.name}${tool.email ? ' (SENT)' : ' (NO_EMAIL)'}`);
  }
  
  console.log('\nDone!');
  await prisma.$disconnect();
}

main().catch(console.error);
