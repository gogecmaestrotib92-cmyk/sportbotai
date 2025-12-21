/**
 * Script to list all blog posts from the database
 * Run with: npx ts-node scripts/list-blog-posts.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching blog posts...\n');
  
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      views: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${posts.length} blog posts:\n`);
  console.log('Status\t\tViews\tSlug');
  console.log('------\t\t-----\t----');
  
  posts.forEach((post) => {
    console.log(`${post.status}\t\t${post.views}\t${post.slug}`);
  });

  // Also show posts that have broken internal links
  console.log('\n\nSearching for broken internal links...\n');
  
  const postsWithContent = await prisma.blogPost.findMany({
    select: {
      slug: true,
      content: true,
    },
  });

  const allSlugs = new Set(posts.map((p) => p.slug));
  const brokenLinks: { postSlug: string; brokenLink: string }[] = [];

  postsWithContent.forEach((post) => {
    // Find all internal links in content
    const linkRegex = /\/blog\/([a-z0-9-]+)/g;
    let match;
    while ((match = linkRegex.exec(post.content)) !== null) {
      const linkedSlug = match[1];
      if (!allSlugs.has(linkedSlug)) {
        brokenLinks.push({ postSlug: post.slug, brokenLink: linkedSlug });
      }
    }
  });

  if (brokenLinks.length > 0) {
    console.log(`Found ${brokenLinks.length} broken internal links:\n`);
    console.log('In Post\t\t\t\t\t\t-> Broken Link');
    console.log('-------\t\t\t\t\t\t-----------');
    brokenLinks.forEach((bl) => {
      console.log(`${bl.postSlug.substring(0, 40)}\t-> ${bl.brokenLink}`);
    });
  } else {
    console.log('No broken internal links found!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
