/**
 * Generate match preview blogs manually for testing
 * 
 * Run with: npx tsx scripts/generate-test-previews.ts
 */

// Load env FIRST before any imports that use process.env
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Test matches to generate previews for - use matches with existing odds for better results
const TEST_MATCHES = [
  {
    homeTeam: 'Oklahoma City Thunder',
    awayTeam: 'Chicago Bulls',
    sport: 'basketball',
    sportKey: 'basketball_nba',
    league: 'NBA',
    commenceTime: new Date('2025-12-25T20:00:00Z').toISOString(),
    // Add mock odds to help the analysis
    odds: { home: 1.45, away: 2.80 },
  },
];

async function generateTestPreviews() {
  // Dynamic import after env is loaded
  const { generateMatchPreview } = await import('../src/lib/blog/match-generator');
  
  console.log('=== Generating Test Match Previews ===\n');
  
  for (const match of TEST_MATCHES) {
    console.log(`\n🏀 Generating: ${match.homeTeam} vs ${match.awayTeam}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await generateMatchPreview({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        sport: match.sport,
        sportKey: match.sportKey,
        league: match.league,
        commenceTime: match.commenceTime,
        matchId: `test-${Date.now()}`,
        odds: match.odds,
      });
      
      if (result.success) {
        console.log(`✅ Generated! Post ID: ${result.postId}`);
        console.log(`   Slug: ${result.slug}`);
        console.log(`   Duration: ${result.duration}ms`);
        
        // Fetch the post from DB to show content
        const { prisma } = await import('../src/lib/prisma');
        const post = await prisma.blogPost.findUnique({
          where: { id: result.postId },
          select: { title: true, excerpt: true, content: true }
        });
        
        if (post) {
          console.log(`   Title: ${post.title}`);
          console.log(`   Excerpt: ${post.excerpt?.substring(0, 100)}...`);
          
          // Show key players section if present
          const keyPlayersMatch = post.content?.match(/Key Players to Watch([\s\S]*?)(?=##|<h|$)/i);
          if (keyPlayersMatch) {
            console.log('\n   📋 Key Players Section:');
            console.log(keyPlayersMatch[1].substring(0, 500) + '...');
          }
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error:`, error);
    }
    
    console.log('');
  }
  
  console.log('\n=== Done ===');
}

generateTestPreviews().catch(console.error);
