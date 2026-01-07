import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check specific post
  const slug = process.argv[2];
  
  if (slug) {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { title: true, featuredImage: true, createdAt: true }
    });
    console.log('Post:', JSON.stringify(post, null, 2));
    return;
  }

  const reviews = await prisma.blogPost.findMany({
    where: { category: 'Tools & Resources' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { title: true, featuredImage: true, createdAt: true }
  });
  
  console.log('Recent Tool Reviews:');
  for (const r of reviews) {
    console.log('---');
    console.log('Title:', r.title.substring(0, 60));
    console.log('Image:', r.featuredImage);
    console.log('Created:', r.createdAt);
  }
  
  // Check SCREENSHOTONE_API_KEY
  console.log('\n---');
  console.log('SCREENSHOTONE_API_KEY configured:', !!process.env.SCREENSHOTONE_API_KEY);
  
  // Get URLs for failed tools
  console.log('\n--- FALLBACK IMAGES ---');
  const fallbackPosts = await prisma.blogPost.findMany({
    where: { 
      category: 'Tools & Resources',
      featuredImage: '/sports/football.jpg'
    },
    select: { title: true }
  });
  console.log(`${fallbackPosts.length} posts using fallback image`);
  for (const p of fallbackPosts) {
    console.log(`  - ${p.title.substring(0, 50)}...`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
