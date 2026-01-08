/**
 * Fix broken IMAGE placeholders in blog posts
 * 
 * Some blog posts have malformed [IMAGE:...] placeholders that weren't 
 * properly replaced during generation. This script finds and fixes them.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Slugs of affected blog posts from Ahrefs audit
const AFFECTED_SLUGS = [
  'premier-league-corners-betting-strategy',
  'nfl-player-props-betting-guide',
  'nfl-bye-week-betting-strategy',
  'understanding-sports-betting-algorithms',
  'best-markets-for-premier-league-betting',
  'mastering-nhl-game-analysis',
];

function createPlaceholderUrl(description: string): string {
  // Create a properly formatted placeholder image URL
  const cleanDesc = description.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim();
  return `https://placehold.co/1200x630/1e40af/ffffff?text=${encodeURIComponent(cleanDesc)}`;
}

function fixImagePlaceholders(content: string): { fixed: string; count: number } {
  let fixedContent = content;
  let count = 0;
  
  // Pattern 1: Full img src with [IMAGE:...] placeholder
  // e.g., src="[IMAGE:description]"
  const imgSrcPattern = /src=["']\[IMAGE:([^\]]+)\]["']/g;
  fixedContent = fixedContent.replace(imgSrcPattern, (match, description) => {
    count++;
    const placeholderUrl = createPlaceholderUrl(description);
    return `src="${placeholderUrl}"`;
  });
  
  // Pattern 2: Plain [IMAGE:...] placeholder (not in src)
  const plainPattern = /\[IMAGE:([^\]]+)\]/g;
  fixedContent = fixedContent.replace(plainPattern, (match, description) => {
    count++;
    return createPlaceholderUrl(description);
  });
  
  return { fixed: fixedContent, count };
}

async function main() {
  console.log('🔍 Searching for blog posts with broken IMAGE placeholders...\n');
  
  // Find all posts with [IMAGE: in content
  const postsWithImages = await prisma.blogPost.findMany({
    where: {
      OR: [
        { content: { contains: '[IMAGE:' } },
        { contentSr: { contains: '[IMAGE:' } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      contentSr: true,
    },
  });
  
  console.log(`Found ${postsWithImages.length} posts with IMAGE placeholders\n`);
  
  let totalFixed = 0;
  
  for (const post of postsWithImages) {
    console.log(`\n📝 Processing: ${post.slug}`);
    
    let updates: { content?: string; contentSr?: string } = {};
    let fixCountEn = 0;
    let fixCountSr = 0;
    
    // Fix English content
    if (post.content && post.content.includes('[IMAGE:')) {
      const { fixed, count } = fixImagePlaceholders(post.content);
      updates.content = fixed;
      fixCountEn = count;
      console.log(`   - Fixed ${count} placeholders in English content`);
    }
    
    // Fix Serbian content
    if (post.contentSr && post.contentSr.includes('[IMAGE:')) {
      const { fixed, count } = fixImagePlaceholders(post.contentSr);
      updates.contentSr = fixed;
      fixCountSr = count;
      console.log(`   - Fixed ${count} placeholders in Serbian content`);
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: updates,
      });
      totalFixed += fixCountEn + fixCountSr;
      console.log(`   ✅ Updated post`);
    }
  }
  
  console.log(`\n✅ Complete! Fixed ${totalFixed} IMAGE placeholders across ${postsWithImages.length} posts`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
