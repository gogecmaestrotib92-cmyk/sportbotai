/**
 * Backfill news content for existing match previews
 * 
 * This script transforms SEO-optimized blog content into Google News-friendly
 * journalistic content by:
 * - Removing CTA boxes and promotional content
 * - Rewriting titles to be more news-like
 * - Making content more factual and less promotional
 * 
 * Run with: npx ts-node scripts/backfill-news-content.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' }); // Load .env.local file

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Transform blog content to news content
async function transformToNewsContent(
  title: string,
  content: string,
  homeTeam: string,
  awayTeam: string,
  league: string,
  matchDate: Date | null
): Promise<{ newsTitle: string; newsContent: string }> {
  const dateStr = matchDate
    ? matchDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'upcoming';

  const prompt = `Transform this sports blog post into a Google News-friendly article.

ORIGINAL TITLE: ${title}
MATCH: ${homeTeam} vs ${awayTeam}
LEAGUE: ${league}
DATE: ${dateStr}

ORIGINAL CONTENT:
${content}

REQUIREMENTS FOR NEWS VERSION:

1. NEW TITLE: Create a news-style headline (50-70 chars)
   - Use present tense verbs: "face", "meet", "clash", "prepare"
   - Lead with the news angle (injuries, form, stakes)
   - Examples: "${homeTeam} Face Injury Crisis Ahead of ${awayTeam} Clash"
   - NO words like "prediction", "preview", "tips", "best bets"

2. CONTENT TO KEEP (these are informational, not promotional):
   ✅ Match Info Box (teams, date, time, competition)
   ✅ Form Comparison Table (W/D/L records)
   ✅ Head-to-Head Box (historical stats)
   ✅ Key Players Boxes (player information)
   ✅ Prediction Box with probabilities (reframe as "analysis suggests" not "betting value")
   ✅ All statistical tables and data visualizations
   ✅ Injury/suspension lists

3. CONTENT TO REMOVE (promotional/sales-focused):
   ❌ "Try SportBot AI" or "Get Started Free" CTAs
   ❌ "Start Free Trial" or "View Plans" buttons
   ❌ "Pro tip" boxes with links to /register or /pricing
   ❌ "Unlock Advanced Stats" promotional boxes
   ❌ "Ready for Deeper Analysis?" end CTAs
   ❌ Any div with gradient background containing registration links
   ❌ Betting language: "best bet", "stake", "wager", "betting value"

4. WRITING STYLE:
   - Write in journalistic third-person style
   - Lead with the most newsworthy angle (injury news, stakes, rivalry)
   - Use quotes if available (manager statements, etc.)
   - Frame predictions as "analysis suggests" or "statistical models indicate"
   - Replace "gamblers/bettors" with "fans" or "observers"

5. STRUCTURE:
   - Opening paragraph: News lead (who, what, when, why it matters)
   - Match Info Box (keep from original)
   - Match context: What's at stake for each team
   - Team news: Injuries, suspensions, form (keep Form Table)
   - Head-to-head: Brief historical context (keep H2H Box)
   - Key players section (keep Key Players Boxes)
   - Analysis: Include Prediction Box with probabilities
   - Closing: Match details (date, time, venue)

6. END CTA - Replace aggressive CTAs with this subtle box:
<div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; border: 1px solid #334155;">
  <p style="color: #94a3b8; font-size: 14px; margin: 0;">
    📊 Want deeper match analysis? <a href="/matches" style="color: #10b981; text-decoration: none;">Explore all matches</a> with AI-powered insights.
  </p>
</div>

Return your response in this exact JSON format:
{
  "newsTitle": "Your news-style headline here",
  "newsContent": "The full transformed HTML content here"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.choices[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      newsTitle: parsed.newsTitle || title,
      newsContent: parsed.newsContent || content,
    };
  } catch (error) {
    console.error('Error transforming content:', error);
    // Fallback: strip CTAs programmatically
    return {
      newsTitle: title.replace(/prediction|preview|tips|odds/gi, 'Analysis'),
      newsContent: stripCTAs(content),
    };
  }
}

// Fallback: programmatically strip CTA content
function stripCTAs(content: string): string {
  // Remove CTA divs
  let cleaned = content
    // Remove promotional divs with "Try SportBot", "Get Started", etc.
    .replace(/<div[^>]*>[\s\S]*?(Try SportBot|Get Started|Start Free|View Plans|See Pro Features|Unlock Advanced)[\s\S]*?<\/div>/gi, '')
    // Remove anchor tags to /register, /pricing
    .replace(/<a[^>]*href="\/(?:register|pricing)"[^>]*>[\s\S]*?<\/a>/gi, '')
    // Remove "Pro tip" boxes
    .replace(/<p[^>]*>[\s\S]*?Pro tip[\s\S]*?<\/p>/gi, '')
    // Remove gradients with CTA patterns
    .replace(/<div[^>]*background:\s*linear-gradient[^>]*>[\s\S]*?(Register|Subscribe|Join|Start)[\s\S]*?<\/div>/gi, '')
    // Remove betting language
    .replace(/best bet|betting value|stake|wager/gi, 'analysis')
    .replace(/gamblers?|bettors?/gi, 'fans');

  return cleaned;
}

async function backfillNewsContent() {
  // Check for --test flag to only process 2 posts
  const isTest = process.argv.includes('--test');
  const limit = isTest ? 2 : 50;
  
  console.log(`🔍 Finding match previews without news content... (${isTest ? 'TEST MODE - 2 posts' : 'batch of 50'})\n`);

  const posts = await prisma.blogPost.findMany({
    where: {
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
      status: 'PUBLISHED',
      newsContent: null,
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });

  console.log(`Found ${posts.length} posts to process\n`);

  let processed = 0;
  let errors = 0;

  for (const post of posts) {
    console.log(`[${processed + 1}/${posts.length}] Processing: ${post.title}`);

    try {
      const { newsTitle, newsContent } = await transformToNewsContent(
        post.title,
        post.content,
        post.homeTeam || '',
        post.awayTeam || '',
        post.league || '',
        post.matchDate
      );

      await prisma.blogPost.update({
        where: { id: post.id },
        data: {
          newsTitle,
          newsContent,
        },
      });

      console.log(`   ✅ Created news version: "${newsTitle}"`);
      processed++;

      // Rate limiting - avoid API throttling
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
      errors++;
    }
  }

  console.log(`\n✅ Processed: ${processed}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Total: ${posts.length}`);
}

// Quick mode: just strip CTAs without AI rewrite
async function quickStripCTAs() {
  console.log('🔧 Quick mode: Stripping CTAs from existing content...\n');

  const posts = await prisma.blogPost.findMany({
    where: {
      postType: { in: ['MATCH_PREVIEW', 'NEWS'] },
      status: 'PUBLISHED',
      newsContent: null,
    },
  });

  console.log(`Found ${posts.length} posts to process\n`);

  for (const post of posts) {
    const newsTitle = post.title
      .replace(/\s*[|\-–]\s*Prediction.*$/i, '')
      .replace(/\s*[|\-–]\s*Preview.*$/i, '')
      .replace(/\s*[|\-–]\s*Tips.*$/i, '')
      .replace(/\s*[|\-–]\s*Odds.*$/i, '');

    const newsContent = stripCTAs(post.content);

    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        newsTitle,
        newsContent,
      },
    });

    console.log(`✅ ${post.title}`);
  }

  console.log(`\n✅ Done! Processed ${posts.length} posts`);
}

// Main
const mode = process.argv[2];

if (mode === '--quick') {
  quickStripCTAs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
} else {
  backfillNewsContent()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
