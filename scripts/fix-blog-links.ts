/**
 * Script to fix broken internal links in blog posts
 * 
 * This script:
 * 1. Finds all internal links in blog posts
 * 2. Identifies which links are broken (link to non-existent posts)
 * 3. Either removes the broken links or replaces them with valid ones
 * 
 * Run with: npx ts-node scripts/fix-blog-links.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Scanning blog posts for broken internal links...\n');

  // Get all posts
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
    },
  });

  // Get set of valid slugs
  const validSlugs = new Set(posts.map((p) => p.slug));
  console.log(`Found ${posts.length} blog posts with ${validSlugs.size} unique slugs\n`);

  let totalBrokenLinks = 0;
  let postsFixed = 0;

  for (const post of posts) {
    // Find all internal blog links
    const linkRegex = /\[([^\]]+)\]\(\/blog\/([a-z0-9-]+)\)/g;
    let content = post.content;
    let hasChanges = false;
    const brokenLinks: string[] = [];

    // Find broken links
    let match;
    while ((match = linkRegex.exec(post.content)) !== null) {
      const linkText = match[1];
      const linkedSlug = match[2];
      
      if (!validSlugs.has(linkedSlug)) {
        brokenLinks.push(`"${linkText}" -> /blog/${linkedSlug}`);
        // Remove the broken link, keeping just the text
        content = content.replace(match[0], linkText);
        hasChanges = true;
        totalBrokenLinks++;
      }
    }

    // Also check for href style links
    const hrefRegex = /href="\/blog\/([a-z0-9-]+)"/g;
    while ((match = hrefRegex.exec(post.content)) !== null) {
      const linkedSlug = match[1];
      
      if (!validSlugs.has(linkedSlug)) {
        brokenLinks.push(`href -> /blog/${linkedSlug}`);
        // Remove the broken href
        content = content.replace(match[0], 'href="#"');
        hasChanges = true;
        totalBrokenLinks++;
      }
    }

    if (hasChanges) {
      console.log(`\n📄 ${post.title}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   Broken links found:`);
      brokenLinks.forEach((bl) => console.log(`     ❌ ${bl}`));

      // Update the post
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { content },
      });
      
      console.log(`   ✅ Fixed!`);
      postsFixed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   Total broken links found: ${totalBrokenLinks}`);
  console.log(`   Posts fixed: ${postsFixed}`);
  console.log(`   Posts unchanged: ${posts.length - postsFixed}`);
  console.log('\n✨ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
