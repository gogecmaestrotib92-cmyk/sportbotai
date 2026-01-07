import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const posts = await prisma.blogPost.findMany({
    where: { 
      OR: [
        { slug: { contains: 'review' } },
        { category: 'Tools & Resources' }
      ]
    },
    select: { slug: true, title: true, featuredImage: true },
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  
  for (const p of posts) {
    const isDefault = p.featuredImage?.includes('/sports/') || !p.featuredImage;
    console.log(`${isDefault ? '❌' : '✅'} ${p.slug}`);
    console.log(`   Image: ${p.featuredImage?.substring(0, 80)}`);
  }
  
  await prisma.$disconnect();
}

check();
