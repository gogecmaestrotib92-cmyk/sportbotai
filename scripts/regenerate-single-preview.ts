/**
 * Regenerate a single match preview blog post with fresh data (including injuries)
 * Run: npx tsx scripts/regenerate-single-preview.ts denver-nuggets-vs-milwaukee-bucks-prediction-2026
 */

// Load env FIRST before any imports
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import modules that need env vars
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const slug = process.argv[2];
  
  if (!slug) {
    console.error('Usage: npx tsx scripts/regenerate-single-preview.ts <slug>');
    console.error('Example: npx tsx scripts/regenerate-single-preview.ts denver-nuggets-vs-milwaukee-bucks-prediction-2026');
    process.exit(1);
  }

  console.log(`🔄 Regenerating match preview: ${slug}\n`);
  
  // Find the existing post
  const existingPost = await prisma.blogPost.findFirst({
    where: { 
      slug,
      postType: 'MATCH_PREVIEW'
    }
  });
  
  if (!existingPost) {
    console.error(`❌ Post not found: ${slug}`);
    process.exit(1);
  }
  
  console.log(`Found post: ${existingPost.title}`);
  console.log(`Match: ${existingPost.homeTeam} vs ${existingPost.awayTeam}`);
  console.log(`Sport: ${existingPost.sport} / ${existingPost.league}\n`);
  
  // Delete existing post so we can regenerate
  console.log('🗑️ Deleting existing post to allow regeneration...');
  await prisma.blogPost.delete({ where: { id: existingPost.id } });
  
  // Now import and call the generator (import after deletion to avoid conflicts)
  const { generateMatchPreview } = await import('../src/lib/blog/match-generator');
  
  // Build match info for regeneration
  const matchInfo = {
    matchId: existingPost.matchId || '',
    homeTeam: existingPost.homeTeam || '',
    awayTeam: existingPost.awayTeam || '',
    commenceTime: existingPost.matchDate?.toISOString() || new Date().toISOString(),
    sport: existingPost.sport || '',
    sportKey: existingPost.sport || '',
    league: existingPost.league || '',
    odds: existingPost.homeOdds && existingPost.awayOdds ? {
      home: existingPost.homeOdds,
      away: existingPost.awayOdds,
      draw: existingPost.drawOdds || undefined,
    } : undefined,
  };
  
  console.log('🔍 Regenerating with fresh injury data...\n');
  
  try {
    // Generate new content
    const result = await generateMatchPreview(matchInfo);
    
    if (!result.success || !result.slug) {
      console.error(`❌ Failed to regenerate: ${result.error}`);
      process.exit(1);
    }
    
    console.log('✅ Post regenerated successfully!');
    console.log(`\n🌐 View at: https://www.sportbotai.com/news/${result.slug}`);
    console.log('\nNote: The content was regenerated with injury data from Perplexity.');
    console.log('Give it ~30 seconds for Vercel cache to update, then check the page.');
    
  } catch (error) {
    console.error('❌ Error regenerating:', error);
    process.exit(1);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
