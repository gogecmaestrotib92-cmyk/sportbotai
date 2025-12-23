import { prisma } from '../src/lib/prisma';

async function main() {
  // Find all NBA/NHL/NFL posts that are NOT the new test one
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { category: 'NBA' },
        { category: 'NHL' },
        { category: 'NFL' },
        { slug: { contains: 'nba' } },
        { slug: { contains: 'nhl' } },
        { slug: { contains: 'nfl' } },
        { slug: { contains: 'thunder' } },
        { slug: { contains: 'bulls' } },
        { slug: { contains: 'lakers' } },
        { slug: { contains: 'celtics' } },
      ],
    },
    select: { id: true, slug: true, createdAt: true, matchId: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${posts.length} NBA/NHL/NFL posts:\n`);
  for (const p of posts) {
    const isNew = p.matchId?.startsWith('test-') || p.createdAt > new Date('2025-12-23T14:00:00Z');
    console.log(`${isNew ? '✓ NEW' : '✗ OLD'} ${p.slug} (${p.createdAt.toISOString().split('T')[0]})`);
  }
  
  // Ask for confirmation
  const oldPosts = posts.filter(p => !p.matchId?.startsWith('test-') && p.createdAt < new Date('2025-12-23T14:00:00Z'));
  console.log(`\n${oldPosts.length} old posts to delete.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
