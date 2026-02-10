/**
 * Fix Blog Meta Titles
 * 
 * Updates ONLY tool review posts to have shorter metaTitle
 * Google recommends total title < 60 chars, and layout adds "| SportBot AI" (15 chars)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Max 45 chars (so with " | SportBot AI" it's ~60)
const MAX_META_TITLE_LENGTH = 45;

function shortenToolReviewTitle(title: string): string | null {
  // Only process tool review titles
  // Pattern: "ToolName Review 2026: Features, Pricing & Honest Verdict"
  const reviewMatch = title.match(/^(.+?) Review (\d{4}):\s*Features,?\s*Pricing\s*&\s*Honest Verdict$/i);
  if (reviewMatch) {
    const name = reviewMatch[1];
    const year = reviewMatch[2];
    return `${name} Review ${year} – Worth It?`;
  }

  // Pattern: "ToolName Review: Some Long Subtitle"
  const reviewMatch2 = title.match(/^(.+?) Review:\s*(.{30,})$/i);
  if (reviewMatch2) {
    const name = reviewMatch2[1];
    // Check if subtitle is too long
    const shortTitle = `${name} Review 2026 – Worth It?`;
    if (shortTitle.length <= MAX_META_TITLE_LENGTH) {
      return shortTitle;
    }
    return `${name} Review 2026`;
  }

  // Pattern: "ToolName Review: The Ultimate Guide to..."
  const ultimateMatch = title.match(/^(.+?) Review:\s*(The Ultimate|A Comprehensive|Your Ultimate|Unleashing)/i);
  if (ultimateMatch) {
    return `${ultimateMatch[1]} Review 2026 – Worth It?`;
  }

  // Not a tool review pattern we want to change
  return null;
}

async function main() {
  console.log('🔍 Finding tool review posts with long metaTitle...\n');

  // Only get tool review posts (in tools/ category or tagged as tool-review)
  const posts = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      OR: [
        { slug: { contains: 'tools/' } },
        { slug: { endsWith: '-review' } },
        { tags: { has: 'tool-review' } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      metaTitle: true,
    },
  });

  console.log(`Found ${posts.length} tool review posts to check.\n`);

  let updatedCount = 0;
  const updates: { slug: string; oldTitle: string; newTitle: string }[] = [];

  for (const post of posts) {
    const currentMeta = post.metaTitle || post.title;
    
    // Check if too long (accounting for " | SportBot AI" suffix)
    if (currentMeta.length > MAX_META_TITLE_LENGTH) {
      const newMetaTitle = shortenToolReviewTitle(currentMeta);
      
      if (newMetaTitle && newMetaTitle !== currentMeta) {
        updates.push({
          slug: post.slug,
          oldTitle: currentMeta,
          newTitle: newMetaTitle,
        });
      }
    }
  }

  console.log(`Found ${updates.length} posts that need updating:\n`);

  // Show preview
  for (const update of updates.slice(0, 15)) {
    console.log(`📝 ${update.slug}`);
    console.log(`   OLD (${update.oldTitle.length} chars): ${update.oldTitle}`);
    console.log(`   NEW (${update.newTitle.length} chars): ${update.newTitle}`);
    console.log('');
  }

  if (updates.length > 15) {
    console.log(`... and ${updates.length - 15} more\n`);
  }

  // Ask for confirmation
  const args = process.argv.slice(2);
  if (!args.includes('--apply')) {
    console.log('\n⚠️  DRY RUN - No changes made.');
    console.log('Run with --apply to update the database.\n');
    return;
  }

  // Apply updates
  console.log('\n🔄 Applying updates...\n');

  for (const update of updates) {
    await prisma.blogPost.update({
      where: { slug: update.slug },
      data: { metaTitle: update.newTitle },
    });
    updatedCount++;
  }

  console.log(`✅ Updated ${updatedCount} blog posts.\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
