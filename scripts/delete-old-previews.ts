/**
 * Delete old match preview blog posts that have incorrect player data
 * 
 * Run with: npx tsx scripts/delete-old-previews.ts
 * 
 * Use --dry-run to preview what will be deleted without actually deleting
 * Use --delete to actually delete the posts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteOldPreviews() {
  const isDryRun = !process.argv.includes('--delete');
  
  console.log('=== Delete Old NBA/NHL Match Previews ===\n');
  console.log(isDryRun ? '🔍 DRY RUN MODE (use --delete to actually delete)\n' : '⚠️  DELETE MODE\n');
  
  // Find only NBA and NHL match preview posts
  const matchPreviews = await prisma.blogPost.findMany({
    where: {
      postType: 'MATCH_PREVIEW',
      OR: [
        { sport: 'NBA' },
        { sport: 'NHL' },
        { sport: 'basketball' },
        { sport: 'hockey' },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      sport: true,
      homeTeam: true,
      awayTeam: true,
      matchDate: true,
      createdAt: true,
      publishedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  console.log(`Found ${matchPreviews.length} match preview posts:\n`);
  
  for (const post of matchPreviews) {
    const matchInfo = post.homeTeam && post.awayTeam 
      ? `${post.homeTeam} vs ${post.awayTeam}` 
      : 'Unknown teams';
    const matchDate = post.matchDate 
      ? new Date(post.matchDate).toLocaleDateString() 
      : 'No date';
    
    console.log(`  - [${post.sport || 'Unknown'}] ${matchInfo}`);
    console.log(`    Title: ${post.title}`);
    console.log(`    Match Date: ${matchDate}`);
    console.log(`    Created: ${post.createdAt.toLocaleDateString()}`);
    console.log(`    Slug: ${post.slug}`);
    console.log('');
  }
  
  if (matchPreviews.length === 0) {
    console.log('No match preview posts found.');
    return;
  }
  
  if (isDryRun) {
    console.log(`\n⚠️  Would delete ${matchPreviews.length} NBA/NHL posts.`);
    console.log('Run with --delete to actually delete these posts.');
  } else {
    console.log(`\n🗑️  Deleting ${matchPreviews.length} NBA/NHL posts...`);
    
    const result = await prisma.blogPost.deleteMany({
      where: {
        postType: 'MATCH_PREVIEW',
        OR: [
          { sport: 'NBA' },
          { sport: 'NHL' },
          { sport: 'basketball' },
          { sport: 'hockey' },
        ],
      },
    });
    
    console.log(`✅ Deleted ${result.count} NBA/NHL match preview posts.`);
  }
}

deleteOldPreviews()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
