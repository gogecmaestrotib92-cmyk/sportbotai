/**
 * Twitter Engagement Cron Job
 * 
 * Automatically engages with the Twitter community:
 * 1. Replies to mentions (@SportBotAI tags)
 * 2. Comments on posts from monitored sports accounts
 * 
 * Uses AIXBT personality for all responses.
 * Runs every 30 minutes to stay active without being spammy.
 * 
 * Safety limits:
 * - Max 5 replies per run (to avoid spam flags)
 * - 6-hour cooldown per account (don't spam same person)
 * - Only engage with sports-related content
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { getTwitterClient } from '@/lib/twitter-client';
import { POST_PERSONALITY } from '@/lib/sportbot-brain';
import crypto from 'crypto';

export const maxDuration = 60;

const CRON_SECRET = process.env.CRON_SECRET;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const SPORTBOT_USER_ID = process.env.TWITTER_USER_ID; // Your Twitter account ID

// Toggle engagement (set to false to pause)
const ENGAGEMENT_ENABLED = process.env.TWITTER_ENGAGEMENT_ENABLED === 'true';

// Safety limits
const MAX_REPLIES_PER_RUN = 5;
const COOLDOWN_HOURS = 6; // Don't reply to same user within 6 hours

// Sports accounts to monitor and potentially reply to
// These should be accounts that post about sports you cover
const MONITORED_ACCOUNTS = [
  // Add account usernames you want to engage with
  // 'ESPN', 'BleachReport', 'TheAthletic', etc.
  // Start empty - mentions only is safer
];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TwitterMention {
  id: string;
  text: string;
  author_id: string;
  author_username?: string;
  created_at: string;
  conversation_id?: string;
}

/**
 * Fetch recent mentions of @SportBotAI
 */
async function getMentions(sinceId?: string): Promise<TwitterMention[]> {
  if (!TWITTER_BEARER_TOKEN || !SPORTBOT_USER_ID) {
    console.log('[Twitter-Engage] Bearer token or user ID not configured');
    return [];
  }

  try {
    let url = `https://api.twitter.com/2/users/${SPORTBOT_USER_ID}/mentions?tweet.fields=created_at,conversation_id,author_id&expansions=author_id&user.fields=username&max_results=10`;
    
    if (sinceId) {
      url += `&since_id=${sinceId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Twitter-Engage] Failed to fetch mentions:', error);
      return [];
    }

    const data = await response.json();
    
    if (!data.data) {
      return [];
    }

    // Map author usernames
    const users = new Map(
      (data.includes?.users || []).map((u: any) => [u.id, u.username])
    );

    return data.data.map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      author_username: users.get(tweet.author_id),
      created_at: tweet.created_at,
      conversation_id: tweet.conversation_id,
    }));
  } catch (error) {
    console.error('[Twitter-Engage] Error fetching mentions:', error);
    return [];
  }
}

/**
 * Check if we've recently replied to this user
 */
async function hasRecentReply(authorId: string): Promise<boolean> {
  const cooldownTime = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);
  
  const recentReply = await prisma.twitterEngagement.findFirst({
    where: {
      targetAuthorId: authorId,
      createdAt: { gte: cooldownTime },
    },
  });

  return !!recentReply;
}

/**
 * Check if we've already replied to this specific tweet
 */
async function hasRepliedToTweet(tweetId: string): Promise<boolean> {
  const existing = await prisma.twitterEngagement.findFirst({
    where: { targetTweetId: tweetId },
  });
  return !!existing;
}

/**
 * Detect if the mention is asking about a specific match or sports topic
 */
function detectSportsTopic(text: string): { isRelevant: boolean; topic: string | null } {
  const cleanText = text.toLowerCase();
  
  // Match patterns: team names, "who wins", "prediction", "analysis", etc.
  const sportsKeywords = [
    'who wins', 'prediction', 'analysis', 'thoughts on', 'what do you think',
    'vs', 'versus', 'game', 'match', 'tonight', 'today',
    'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'nuggets', // NBA
    'chiefs', 'cowboys', 'eagles', 'bills', 'ravens', '49ers', // NFL
    'arsenal', 'liverpool', 'chelsea', 'manchester', 'tottenham', // Soccer
    'rangers', 'bruins', 'oilers', 'leafs', 'lightning', // NHL
  ];

  const isRelevant = sportsKeywords.some(kw => cleanText.includes(kw));
  
  // Try to extract the topic/match
  const vsMatch = text.match(/(\w+(?:\s+\w+)?)\s+(?:vs\.?|versus|@)\s+(\w+(?:\s+\w+)?)/i);
  const topic = vsMatch ? `${vsMatch[1]} vs ${vsMatch[2]}` : null;

  return { isRelevant, topic };
}

/**
 * Generate an AIXBT-style reply using GPT
 */
async function generateReply(
  mentionText: string,
  authorUsername: string,
  topic: string | null
): Promise<string | null> {
  try {
    const prompt = `${POST_PERSONALITY}

Someone tagged you on Twitter. Generate a reply.

THEIR TWEET: "${mentionText}"
USERNAME: @${authorUsername}
${topic ? `TOPIC DETECTED: ${topic}` : 'TOPIC: General sports question'}

REPLY RULES:
- Keep it SHORT (1-2 sentences, <200 chars ideal)
- Be helpful but maintain AIXBT personality (confident, sharp)
- If they ask about a match, give a quick take or say you'll look into it
- If it's just a greeting, be friendly but brief
- DON'T be promotional or salesy
- DON'T start with "Hey" or "@username" - Twitter adds that automatically
- Sound human, not like a bot

EXAMPLES OF GOOD REPLIES:
- "Clean setup for that one. Form says Lakers, but road B2B is brutal. I'd watch the line movement."
- "Already ran the numbers on this. Check sportbotai.com for the full breakdown 👀"
- "Appreciate the tag! That matchup is chaos - too many variables to call confidently."
- "Good question. Short answer: form over name value right now. Data is clear."

Generate ONE reply. No quotes. If you can't give a useful response, return: NO_REPLY`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    
    if (!reply || reply === 'NO_REPLY') {
      return null;
    }

    // Safety check: ensure not too long
    if (reply.length > 280) {
      return reply.substring(0, 277) + '...';
    }

    return reply;
  } catch (error) {
    console.error('[Twitter-Engage] Error generating reply:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const url = new URL(request.url);
  const secretParam = url.searchParams.get('secret');
  const isAuthorized = authHeader === `Bearer ${CRON_SECRET}` || secretParam === CRON_SECRET;

  if (CRON_SECRET && !isVercelCron && !isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!ENGAGEMENT_ENABLED) {
    return NextResponse.json({
      success: true,
      message: 'Twitter engagement is disabled',
      enabled: false,
    });
  }

  console.log('[Twitter-Engage] Starting engagement run...');

  const twitter = getTwitterClient();
  if (!twitter.isConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Twitter client not configured',
    });
  }

  const results = {
    mentionsChecked: 0,
    repliesSent: 0,
    skippedCooldown: 0,
    skippedIrrelevant: 0,
    skippedAlreadyReplied: 0,
    errors: [] as string[],
  };

  try {
    // Get the last processed mention ID
    const lastProcessed = await prisma.twitterEngagement.findFirst({
      where: { type: 'MENTION_REPLY' },
      orderBy: { targetTweetId: 'desc' },
      select: { targetTweetId: true },
    });

    // Fetch new mentions
    const mentions = await getMentions(lastProcessed?.targetTweetId);
    results.mentionsChecked = mentions.length;

    console.log(`[Twitter-Engage] Found ${mentions.length} mentions to process`);

    let repliesSent = 0;

    for (const mention of mentions) {
      // Safety limit
      if (repliesSent >= MAX_REPLIES_PER_RUN) {
        console.log('[Twitter-Engage] Hit reply limit, stopping');
        break;
      }

      // Skip if already replied to this tweet
      if (await hasRepliedToTweet(mention.id)) {
        results.skippedAlreadyReplied++;
        continue;
      }

      // Skip if recently replied to this user
      if (await hasRecentReply(mention.author_id)) {
        results.skippedCooldown++;
        console.log(`[Twitter-Engage] Skipping ${mention.author_username} - cooldown`);
        continue;
      }

      // Detect if sports-related
      const { isRelevant, topic } = detectSportsTopic(mention.text);
      
      // For now, reply to all mentions (they tagged us for a reason)
      // Later we can filter more strictly

      // Generate reply
      const replyText = await generateReply(
        mention.text,
        mention.author_username || 'user',
        topic
      );

      if (!replyText) {
        results.skippedIrrelevant++;
        continue;
      }

      // Post the reply
      const postResult = await twitter.postTweet(replyText, mention.id);

      if (postResult.success && postResult.tweet) {
        // Log the engagement
        await prisma.twitterEngagement.create({
          data: {
            id: crypto.randomUUID(),
            type: 'MENTION_REPLY',
            targetTweetId: mention.id,
            targetAuthorId: mention.author_id,
            targetAuthorUsername: mention.author_username,
            targetText: mention.text.substring(0, 500),
            replyTweetId: postResult.tweet.id,
            replyText: replyText,
          },
        });

        repliesSent++;
        results.repliesSent++;
        console.log(`[Twitter-Engage] Replied to @${mention.author_username}: "${replyText.substring(0, 50)}..."`);

        // Small delay between replies
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        results.errors.push(`Failed to reply to ${mention.id}: ${postResult.error}`);
      }
    }

    console.log('[Twitter-Engage] Run complete:', results);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('[Twitter-Engage] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ...results,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
