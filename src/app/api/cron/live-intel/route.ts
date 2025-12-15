/**
 * Live Intel Auto-Post Cron Job
 * 
 * Automatically generates SportBot Agent posts for the Live Intel Feed.
 * Runs every 30 minutes to keep the feed fresh with new content.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { POST_CATEGORIES, buildAgentPostPrompt, sanitizeAgentPost, type PostCategory } from '@/lib/config/sportBotAgent';
import { quickMatchResearch } from '@/lib/perplexity';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

// Categories to rotate through
const AUTO_POST_CATEGORIES: PostCategory[] = [
  'LINEUP_INTEL',
  'MOMENTUM_SHIFT',
  'FORM_ANALYSIS',
  'MATCH_COMPLEXITY',
  'AI_INSIGHT',
];

interface UpcomingMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  kickoff: string;
}

/**
 * Get upcoming matches from the odds API cache or database
 */
async function getUpcomingMatches(): Promise<UpcomingMatch[]> {
  try {
    // Try to get from cached match data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/match-data`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    
    if (response.ok) {
      const data = await response.json();
      const matches: UpcomingMatch[] = [];
      
      // Parse matches from all sports
      for (const sport of Object.keys(data)) {
        const sportMatches = data[sport];
        if (Array.isArray(sportMatches)) {
          for (const match of sportMatches.slice(0, 3)) { // Take top 3 per sport
            if (match.homeTeam && match.awayTeam) {
              matches.push({
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                league: match.league || sport,
                sport: match.sport || sport,
                kickoff: match.kickoff || new Date().toISOString(),
              });
            }
          }
        }
      }
      
      return matches;
    }
  } catch (error) {
    console.error('[Live-Intel-Cron] Failed to fetch matches:', error);
  }
  
  return [];
}

/**
 * Generate a single agent post with real-time research
 */
async function generatePost(match: UpcomingMatch, category: PostCategory): Promise<{
  content: string;
  confidence: number;
  realTimeData: boolean;
  citations: string[];
} | null> {
  try {
    // Get real-time research
    let researchContext = '';
    let citations: string[] = [];
    let realTimeData = false;
    
    try {
      const research = await quickMatchResearch(
        match.homeTeam,
        match.awayTeam,
        match.league
      );
      
      if (research.success && research.content) {
        researchContext = `\n\n[LIVE INTELLIGENCE]\n${research.content}`;
        citations = research.citations || [];
        realTimeData = true;
      }
    } catch (researchError) {
      console.log('[Live-Intel-Cron] Research unavailable, continuing without');
    }
    
    // Build match context string
    const matchContext = `${match.homeTeam} vs ${match.awayTeam} | ${match.league} | ${match.sport}`;
    
    // Build prompt with correct function signature
    const prompt = buildAgentPostPrompt(category, matchContext, researchContext);
    
    // Generate with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.8,
    });
    
    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) return null;
    
    const sanitized = sanitizeAgentPost(rawContent);
    const content = sanitized.safe ? sanitized.post : rawContent;
    
    // Determine confidence based on data availability (1-10 scale)
    let confidence = 6; // Default medium
    if (realTimeData && citations.length >= 2) {
      confidence = 8; // High confidence with multiple sources
    } else if (!realTimeData) {
      confidence = 4; // Lower without real-time data
    }
    
    return { content, confidence, realTimeData, citations };
  } catch (error) {
    console.error('[Live-Intel-Cron] Post generation failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization');
  
  // Verify cron secret in production
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    console.log('[Live-Intel-Cron] Unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Live-Intel-Cron] Starting auto-post generation...');
  
  try {
    // Get upcoming matches
    const matches = await getUpcomingMatches();
    
    if (matches.length === 0) {
      console.log('[Live-Intel-Cron] No upcoming matches found');
      return NextResponse.json({
        success: true,
        message: 'No upcoming matches to post about',
        postsGenerated: 0,
      });
    }
    
    console.log(`[Live-Intel-Cron] Found ${matches.length} matches`);
    
    // Pick a random match and category
    const randomMatch = matches[Math.floor(Math.random() * matches.length)];
    const randomCategory = AUTO_POST_CATEGORIES[Math.floor(Math.random() * AUTO_POST_CATEGORIES.length)];
    
    console.log(`[Live-Intel-Cron] Generating ${randomCategory} for ${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`);
    
    // Generate the post
    const postResult = await generatePost(randomMatch, randomCategory);
    
    if (!postResult) {
      console.log('[Live-Intel-Cron] Failed to generate post');
      return NextResponse.json({
        success: false,
        error: 'Post generation failed',
      }, { status: 500 });
    }
    
    // Save to database
    const post = await prisma.agentPost.create({
      data: {
        category: randomCategory,
        content: postResult.content,
        matchRef: `${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`,
        homeTeam: randomMatch.homeTeam,
        awayTeam: randomMatch.awayTeam,
        sport: randomMatch.sport,
        league: randomMatch.league,
        confidence: postResult.confidence,
        realTimeData: postResult.realTimeData,
        citations: postResult.citations,
      },
    });
    
    console.log(`[Live-Intel-Cron] Created post ${post.id} in ${Date.now() - startTime}ms`);
    
    // Optionally post to Twitter
    if (process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
        
        await fetch(`${baseUrl}/api/twitter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'post',
            content: postResult.content,
          }),
        });
        console.log('[Live-Intel-Cron] Posted to Twitter');
      } catch (twitterError) {
        console.error('[Live-Intel-Cron] Twitter post failed:', twitterError);
      }
    }
    
    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        category: randomCategory,
        match: `${randomMatch.homeTeam} vs ${randomMatch.awayTeam}`,
        confidence: postResult.confidence,
        realTimeData: postResult.realTimeData,
      },
      duration: Date.now() - startTime,
    });
    
  } catch (error) {
    console.error('[Live-Intel-Cron] Error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
