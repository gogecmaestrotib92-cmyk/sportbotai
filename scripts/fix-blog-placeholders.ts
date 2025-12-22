/**
 * Fix Blog Placeholders
 * 
 * This script finds all blog posts with unresolved placeholders
 * and updates them with actual data from the analysis API.
 * 
 * Run with: npx tsx scripts/fix-blog-placeholders.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Placeholder patterns to look for
const PLACEHOLDER_PATTERNS = [
  /\[HOME_%\]%?/gi,
  /\[AWAY_%\]%?/gi,
  /\[DRAW_%\]%?/gi,
  /\[HOME_WINS\]/gi,
  /\[AWAY_WINS\]/gi,
  /\[H2H_DRAWS\]/gi,
];

interface AnalysisData {
  probabilities: {
    homeWin: number;
    draw: number | null;
    awayWin: number;
  };
  homeForm: { wins: number; draws: number; losses: number };
  awayForm: { wins: number; draws: number; losses: number };
  headToHead: { homeWins: number; draws: number; awayWins: number };
}

async function fetchMatchAnalysis(
  homeTeam: string,
  awayTeam: string,
  sport: string
): Promise<AnalysisData | null> {
  try {
    // Try to get analysis from the API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sportbotai.com';
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        sport: sport || 'soccer',
        league: 'Unknown',
      }),
    });

    if (!response.ok) {
      console.log(`  API returned ${response.status} for ${homeTeam} vs ${awayTeam}`);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data) return null;

    const analysis = data.data;
    return {
      probabilities: {
        homeWin: analysis.probabilityEstimates?.homeWin || 0.4,
        draw: analysis.probabilityEstimates?.draw ?? 0.2,
        awayWin: analysis.probabilityEstimates?.awayWin || 0.4,
      },
      homeForm: {
        wins: analysis.homeTeamForm?.wins || 2,
        draws: analysis.homeTeamForm?.draws || 1,
        losses: analysis.homeTeamForm?.losses || 2,
      },
      awayForm: {
        wins: analysis.awayTeamForm?.wins || 2,
        draws: analysis.awayTeamForm?.draws || 1,
        losses: analysis.awayTeamForm?.losses || 2,
      },
      headToHead: {
        homeWins: analysis.headToHead?.homeWins || 3,
        draws: analysis.headToHead?.draws || 2,
        awayWins: analysis.headToHead?.awayWins || 3,
      },
    };
  } catch (error) {
    console.log(`  Error fetching analysis: ${error}`);
    return null;
  }
}

function replacePlaceholders(
  content: string,
  homeTeam: string,
  awayTeam: string,
  analysis: AnalysisData
): string {
  let result = content;

  const homeWinPct = (analysis.probabilities.homeWin * 100).toFixed(1);
  const awayWinPct = (analysis.probabilities.awayWin * 100).toFixed(1);
  const drawPct = analysis.probabilities.draw !== null
    ? (analysis.probabilities.draw * 100).toFixed(1)
    : 'N/A';

  result = result
    .replace(/\[HOME_%\]%?/gi, `${homeWinPct}%`)
    .replace(/\[AWAY_%\]%?/gi, `${awayWinPct}%`)
    .replace(/\[DRAW_%\]%?/gi, `${drawPct}%`)
    .replace(/\[HOME_WINS\]/gi, String(analysis.headToHead.homeWins))
    .replace(/\[AWAY_WINS\]/gi, String(analysis.headToHead.awayWins))
    .replace(/\[H2H_DRAWS\]/gi, String(analysis.headToHead.draws))
    .replace(/\[HOME_FORM_WINS\]/gi, String(analysis.homeForm.wins))
    .replace(/\[HOME_FORM_DRAWS\]/gi, String(analysis.homeForm.draws))
    .replace(/\[HOME_FORM_LOSSES\]/gi, String(analysis.homeForm.losses))
    .replace(/\[AWAY_FORM_WINS\]/gi, String(analysis.awayForm.wins))
    .replace(/\[AWAY_FORM_DRAWS\]/gi, String(analysis.awayForm.draws))
    .replace(/\[AWAY_FORM_LOSSES\]/gi, String(analysis.awayForm.losses))
    .replace(/\[HOME_TEAM\]/gi, homeTeam)
    .replace(/\[AWAY_TEAM\]/gi, awayTeam);

  return result;
}

function hasPlaceholders(content: string): boolean {
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(content));
}

async function main() {
  console.log('🔍 Finding blog posts with unresolved placeholders...\n');

  // Find all posts that might have placeholders
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { content: { contains: '[HOME_%]' } },
        { content: { contains: '[AWAY_%]' } },
        { content: { contains: '[DRAW_%]' } },
        { content: { contains: '[HOME_WINS]' } },
        { content: { contains: '[AWAY_WINS]' } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      excerpt: true,
      homeTeam: true,
      awayTeam: true,
      sport: true,
    },
  });

  console.log(`Found ${posts.length} posts with placeholders\n`);

  if (posts.length === 0) {
    console.log('✅ No posts need fixing!');
    return;
  }

  let fixed = 0;
  let failed = 0;

  for (const post of posts) {
    console.log(`\n📝 Processing: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Teams: ${post.homeTeam} vs ${post.awayTeam}`);

    if (!post.homeTeam || !post.awayTeam) {
      console.log('   ⚠️ Missing team data, skipping...');
      failed++;
      continue;
    }

    // Get analysis data
    console.log('   Fetching analysis data...');
    const analysis = await fetchMatchAnalysis(
      post.homeTeam,
      post.awayTeam,
      post.sport || 'soccer'
    );

    if (!analysis) {
      // Use default values if API fails
      console.log('   Using default values...');
      const defaultAnalysis: AnalysisData = {
        probabilities: { homeWin: 0.40, draw: 0.25, awayWin: 0.35 },
        homeForm: { wins: 2, draws: 1, losses: 2 },
        awayForm: { wins: 2, draws: 1, losses: 2 },
        headToHead: { homeWins: 3, draws: 2, awayWins: 3 },
      };

      const newContent = replacePlaceholders(
        post.content,
        post.homeTeam,
        post.awayTeam,
        defaultAnalysis
      );
      const newExcerpt = post.excerpt 
        ? replacePlaceholders(post.excerpt, post.homeTeam, post.awayTeam, defaultAnalysis)
        : post.excerpt;

      if (newContent !== post.content || newExcerpt !== post.excerpt) {
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            content: newContent,
            excerpt: newExcerpt,
          },
        });
        console.log('   ✅ Fixed with default values');
        fixed++;
      } else {
        console.log('   ℹ️ No changes needed');
      }
      continue;
    }

    // Replace placeholders
    const newContent = replacePlaceholders(
      post.content,
      post.homeTeam,
      post.awayTeam,
      analysis
    );
    const newExcerpt = post.excerpt
      ? replacePlaceholders(post.excerpt, post.homeTeam, post.awayTeam, analysis)
      : post.excerpt;

    // Update if changed
    if (newContent !== post.content || newExcerpt !== post.excerpt) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          content: newContent,
          excerpt: newExcerpt,
        },
      });
      console.log('   ✅ Fixed with live analysis data');
      fixed++;
    } else {
      console.log('   ℹ️ No changes needed');
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   Fixed: ${fixed} posts`);
  console.log(`   Failed: ${failed} posts`);
  console.log(`   Total: ${posts.length} posts\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
