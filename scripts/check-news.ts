import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check for NEWS type blog posts
  const newsCount = await prisma.blogPost.count({
    where: { postType: 'NEWS' }
  });
  console.log('NEWS blog posts in database:', newsCount);
  
  // If any exist, show details
  if (newsCount > 0) {
    const newsPosts = await prisma.blogPost.findMany({
      where: { postType: 'NEWS' },
      select: { id: true, title: true, slug: true, createdAt: true },
      take: 10
    });
    console.log('Sample NEWS posts:');
    newsPosts.forEach(p => console.log(`  - ${p.slug}: "${p.title}" (${p.createdAt})`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
