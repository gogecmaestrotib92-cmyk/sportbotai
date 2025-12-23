/**
 * Find Blog Posts with Potentially Outdated Player Data
 * 
 * Searches NBA, NHL, NFL blog posts for mentions of players
 * who may have been traded since AI training data cutoff.
 * 
 * Usage: npx tsx scripts/find-outdated-blogs.ts
 */

import { prisma } from '../src/lib/prisma';

// Major trades/moves in 2024-2025 season that AI models might not know about
// Add players here as trades happen
const OUTDATED_PLAYER_ASSOCIATIONS: Record<string, { oldTeam: string; newTeam: string; date: string }> = {
  // NBA 2024-2025 trades
  'Luka Dončić': { oldTeam: 'Mavericks', newTeam: 'Lakers', date: 'Jan 2025' },
  'Luka Doncic': { oldTeam: 'Mavericks', newTeam: 'Lakers', date: 'Jan 2025' },
  'Dončić': { oldTeam: 'Mavericks', newTeam: 'Lakers', date: 'Jan 2025' },
  'Doncic': { oldTeam: 'Mavericks', newTeam: 'Lakers', date: 'Jan 2025' },
  // Add more as needed...
};

// Player name patterns to search for
const PLAYER_PATTERNS = Object.keys(OUTDATED_PLAYER_ASSOCIATIONS);

interface OutdatedBlog {
  id: string;
  slug: string;
  title: string;
  homeTeam: string | null;
  awayTeam: string | null;
  league: string | null;
  publishedAt: Date | null;
  issues: string[];
}

async function findOutdatedBlogs(): Promise<OutdatedBlog[]> {
  console.log('🔍 Searching for NBA/NHL/NFL blog posts with potentially outdated player data...\n');

  // Find all NBA, NHL, NFL blog posts
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { sport: { contains: 'basketball' } },
        { sport: { contains: 'nba' } },
        { sport: { contains: 'hockey' } },
        { sport: { contains: 'nhl' } },
        { sport: { contains: 'americanfootball' } },
        { sport: { contains: 'nfl' } },
        { league: { contains: 'NBA' } },
        { league: { contains: 'NHL' } },
        { league: { contains: 'NFL' } },
      ],
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      homeTeam: true,
      awayTeam: true,
      league: true,
      sport: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: 'desc' },
  });

  console.log(`Found ${posts.length} NBA/NHL/NFL blog posts to scan\n`);

  const outdatedBlogs: OutdatedBlog[] = [];

  for (const post of posts) {
    const issues: string[] = [];
    const content = post.content.toLowerCase();
    const teams = [post.homeTeam, post.awayTeam].filter(Boolean).map(t => t!.toLowerCase());

    // Check each player pattern
    for (const playerName of PLAYER_PATTERNS) {
      const playerLower = playerName.toLowerCase();
      
      if (content.includes(playerLower)) {
        const info = OUTDATED_PLAYER_ASSOCIATIONS[playerName];
        const oldTeamLower = info.oldTeam.toLowerCase();
        const newTeamLower = info.newTeam.toLowerCase();
        
        // Check if the blog mentions the player with their OLD team
        const mentionsOldTeam = teams.some(t => t.includes(oldTeamLower) || oldTeamLower.includes(t));
        const mentionsNewTeam = teams.some(t => t.includes(newTeamLower) || newTeamLower.includes(t));
        
        if (mentionsOldTeam && !mentionsNewTeam) {
          issues.push(`⚠️ Mentions "${playerName}" but this match involves ${info.oldTeam}. Player now plays for ${info.newTeam} (traded ${info.date})`);
        }
      }
    }

    // Also flag any post mentioning specific old team + player name in content
    for (const playerName of PLAYER_PATTERNS) {
      const playerLower = playerName.toLowerCase();
      const info = OUTDATED_PLAYER_ASSOCIATIONS[playerName];
      
      // Check if content specifically associates player with old team
      const oldTeamPatterns = [
        `${info.oldTeam.toLowerCase()} ${playerLower}`,
        `${playerLower} ${info.oldTeam.toLowerCase()}`,
        `${info.oldTeam.toLowerCase()}'s ${playerLower}`,
        `${playerLower} for ${info.oldTeam.toLowerCase()}`,
        `${playerLower} leads ${info.oldTeam.toLowerCase()}`,
      ];
      
      for (const pattern of oldTeamPatterns) {
        if (content.includes(pattern)) {
          const alreadyFlagged = issues.some(i => i.includes(playerName));
          if (!alreadyFlagged) {
            issues.push(`⚠️ Content associates "${playerName}" with ${info.oldTeam} - player now at ${info.newTeam} (traded ${info.date})`);
          }
          break;
        }
      }
    }

    if (issues.length > 0) {
      outdatedBlogs.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        homeTeam: post.homeTeam,
        awayTeam: post.awayTeam,
        league: post.league,
        publishedAt: post.publishedAt,
        issues,
      });
    }
  }

  return outdatedBlogs;
}

async function main() {
  try {
    const outdated = await findOutdatedBlogs();

    if (outdated.length === 0) {
      console.log('✅ No blog posts found with potentially outdated player data!\n');
      return;
    }

    console.log(`\n❌ Found ${outdated.length} blog posts with potentially outdated player data:\n`);
    console.log('='.repeat(80));

    for (const blog of outdated) {
      console.log(`\n📝 ${blog.title}`);
      console.log(`   URL: /blog/${blog.slug}`);
      console.log(`   Match: ${blog.homeTeam} vs ${blog.awayTeam}`);
      console.log(`   League: ${blog.league}`);
      console.log(`   Published: ${blog.publishedAt?.toISOString().split('T')[0] || 'Draft'}`);
      console.log(`   Issues:`);
      for (const issue of blog.issues) {
        console.log(`     ${issue}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📋 Summary: ${outdated.length} posts need review`);
    console.log('\nTo fix these posts:');
    console.log('1. Regenerate the blog post via /admin/blog');
    console.log('2. Or manually edit the content in the database');
    console.log('3. The updated blog generator now includes Perplexity roster lookup for accuracy\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
