/**
 * Delete NBA/NHL/NFL Blog Posts
 * 
 * Removes all basketball, hockey, and american football blog posts
 * so they can be regenerated with accurate roster data from Perplexity.
 * 
 * Usage: npx tsx scripts/delete-nba-nhl-nfl-blogs.ts
 */

import { prisma } from '../src/lib/prisma';

async function deleteNonSoccerBlogs() {
  console.log('🗑️  Finding NBA/NHL/NFL blog posts to delete...\n');

  // First, list what will be deleted
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { sport: { contains: 'basketball' } },
        { sport: { contains: 'nba' } },
        { sport: { contains: 'hockey' } },
        { sport: { contains: 'nhl' } },
        { sport: { contains: 'americanfootball' } },
        { sport: { contains: 'nfl' } },
        { league: { contains: 'NBA' } },
        { league: { contains: 'NHL' } },
        { league: { contains: 'NFL' } },
        { league: { contains: 'Euroleague' } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      league: true,
      sport: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  });

  if (posts.length === 0) {
    console.log('✅ No NBA/NHL/NFL blog posts found to delete.\n');
    return;
  }

  console.log(`Found ${posts.length} blog posts to delete:\n`);
  console.log('='.repeat(80));

  for (const post of posts) {
    console.log(`📝 ${post.title}`);
    console.log(`   League: ${post.league || post.sport}`);
    console.log(`   Slug: ${post.slug}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n⚠️  About to delete ${posts.length} blog posts...\n`);

  // Delete the posts
  const result = await prisma.blogPost.deleteMany({
    where: {
      OR: [
        { sport: { contains: 'basketball' } },
        { sport: { contains: 'nba' } },
        { sport: { contains: 'hockey' } },
        { sport: { contains: 'nhl' } },
        { sport: { contains: 'americanfootball' } },
        { sport: { contains: 'nfl' } },
        { league: { contains: 'NBA' } },
        { league: { contains: 'NHL' } },
        { league: { contains: 'NFL' } },
        { league: { contains: 'Euroleague' } },
      ],
    },
  });

  console.log(`✅ Deleted ${result.count} blog posts.\n`);
  console.log('Next steps:');
  console.log('1. Push code changes to git');
  console.log('2. Deploy to Vercel');
  console.log('3. Trigger match preview generation via /admin/blog or cron');
}

async function main() {
  try {
    await deleteNonSoccerBlogs();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
