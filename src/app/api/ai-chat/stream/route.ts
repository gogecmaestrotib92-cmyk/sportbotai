/**
 * AI Chat API - STREAMING VERSION
 * 
 * Same logic as the main ai-chat endpoint but streams the response
 * for a more responsive UX.
 * 
 * Features:
 * - Response streaming (SSE)
 * - Query caching (category-based TTL)
 * - Multi-language support
 * - Tier-based rate limiting
 * - Favorite team context
 */

// Vercel: Extend function timeout to 60 seconds (Pro plan)
// This is needed for complex queries that require multiple API calls
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { theOddsClient } from '@/lib/theOdds';
import { getPerplexityClient } from '@/lib/perplexity';
import { detectChatMode, buildSystemPrompt, type BrainMode, calculateDataConfidence, type DataConfidence } from '@/lib/sportbot-brain';
import { trackQuery, getCachedAnswer, shouldSkipCache } from '@/lib/sportbot-memory';
import { saveKnowledge, buildLearnedContext, getTerminologyForSport } from '@/lib/sportbot-knowledge';
import { cacheGet, cacheSet, CACHE_KEYS, hashChatQuery, getChatTTL } from '@/lib/cache';
import { checkChatRateLimit, getClientIp, CHAT_RATE_LIMITS } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { normalizeSport } from '@/lib/data-layer/bridge';
import { getUnifiedMatchData, type MatchIdentifier } from '@/lib/unified-match-service';
// Query Intelligence - smarter query understanding
import { understandQuery, mapIntentToCategory, expandQuery, type QueryUnderstanding, type QueryCategory } from '@/lib/query-intelligence';
// Verified stats imports for all sports
import { isStatsQuery, getVerifiedPlayerStats, formatVerifiedPlayerStats } from '@/lib/verified-nba-stats';
import { isNFLStatsQuery, getVerifiedNFLPlayerStats, formatVerifiedNFLPlayerStats } from '@/lib/verified-nfl-stats';
import { isNHLStatsQuery, getVerifiedNHLPlayerStats, formatVerifiedNHLPlayerStats } from '@/lib/verified-nhl-stats';
import { isSoccerStatsQuery, getVerifiedSoccerPlayerStats, formatVerifiedSoccerPlayerStats } from '@/lib/verified-soccer-stats';
import { isEuroleagueStatsQuery, getVerifiedEuroleaguePlayerStats, formatVerifiedEuroleaguePlayerStats } from '@/lib/verified-euroleague-stats';
// Team match statistics (shots, corners per game, etc.)
import { isTeamMatchStatsQuery, getVerifiedTeamMatchStats, getOpponentAnalysis, formatTeamMatchStatsContext } from '@/lib/verified-team-match-stats';
// League leaders (top scorers/assists)
import { isTopScorersQuery, isTopAssistsQuery, getVerifiedTopScorers, getVerifiedTopAssists, formatLeagueLeadersContext } from '@/lib/verified-league-leaders';
// Match lineups
import { isLineupQuery, getVerifiedLineup, formatLineupContext } from '@/lib/verified-lineups';
// Coach information
import { isCoachQuery, getVerifiedCoach, formatCoachContext } from '@/lib/verified-coach';
// Match events (goals, cards)
import { isMatchEventsQuery, getVerifiedMatchEvents, formatMatchEventsContext } from '@/lib/verified-match-events';
// Match prediction (our pre-match analysis for upcoming games within 48h)
import { getUpcomingMatchPrediction, formatMatchPredictionContext, checkIfMatchIsInPast } from '@/lib/verified-match-prediction';
// Query Learning - systematic improvement over time
import { trackQuery as trackQueryForLearning, detectMismatch, recordMismatch, type QueryTrackingData } from '@/lib/query-learning';
// A/B Testing
import { getVariantFromCookies, getTestCookieName, type Variant } from '@/lib/ab-testing';
// Conversation Memory - multi-turn context
import {
  getConversationMemory,
  addToMemory,
  resolvePronouns,
  formatConversationHistory,
  extractEntitiesForMemory
} from '@/lib/chat-memory';
// Chat Learning - makes AI smarter over time
import {
  getOrCreateSession,
  addMessage as addLearningMessage,
  getUserTopicsForPrompt,
  buildUserContext,
  updateUserPreferences,
  getConversationHistoryForPrompt,
  findLearnedResponse,
} from '@/lib/chat-learning';
// Chat Tools - function calling for data retrieval
import { CHAT_TOOLS, executeTool, formatToolResults, type ToolResult } from '@/lib/chat-tools';
import * as toolDeps from '@/lib/chat-tool-deps';
// Shared Chat Utilities (consolidated)
import {
  withTimeout,
  fetchMatchPreviewOrAnalysis,
  formatMatchPreviewForChat,
  formatAnalysisForChat,
  fetchRealOdds,
  detectSportFromTeams,
  stripMarkdown,
} from '@/lib/chat-utils';

// ============================================
// TYPES
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

// ============================================
// OPENAI CLIENT
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// withTimeout and stripMarkdown are now imported from @/lib/chat-utils

/**
 * Format live analyze API response for chat context
 * This creates a structured context that the LLM can use to answer
 * INCLUDES ALL RICH DATA: form, injuries, insights, edge, etc.
 */
function formatLiveAnalysisForChat(analysis: any, homeTeam: string, awayTeam: string): string {
  const {
    probabilities, briefing, valueAnalysis, oddsComparison, riskAnalysis,
    tacticalAnalysis, responsibleGambling, momentumAndForm, injuryContext,
    preMatchInsights, upsetPotential, marketStability
  } = analysis;

  let context = `\n=== SPORTBOT MATCH ANALYSIS: ${homeTeam} vs ${awayTeam} ===\n\n`;

  // AI Briefing (MOST IMPORTANT)
  if (briefing?.headline) {
    context += `📋 HEADLINE: ${briefing.headline}\n`;
    if (briefing.verdict) {
      context += `🎯 VERDICT: ${briefing.verdict}\n`;
    }
    if (briefing.confidenceRating) {
      context += `⭐ CONFIDENCE: ${briefing.confidenceRating}/5\n`;
    }
    if (briefing.keyPoints && briefing.keyPoints.length > 0) {
      context += `\n🔑 KEY INSIGHTS:\n`;
      for (const point of briefing.keyPoints) {
        context += `• ${point}\n`;
      }
    }
    context += '\n';
  }

  // Probabilities
  if (probabilities) {
    context += `📊 AI PROBABILITY ESTIMATES:\n`;
    if (probabilities.homeWin) {
      context += `• ${homeTeam} win: ${Math.round(probabilities.homeWin * 100)}%\n`;
    }
    if (probabilities.draw !== null && probabilities.draw !== undefined) {
      context += `• Draw: ${Math.round(probabilities.draw * 100)}%\n`;
    }
    if (probabilities.awayWin) {
      context += `• ${awayTeam} win: ${Math.round(probabilities.awayWin * 100)}%\n`;
    }
    context += '\n';
  }

  // Edge/Value Detection
  if (oddsComparison) {
    const edges = [
      { name: homeTeam, edge: oddsComparison.homeEdge || 0 },
      { name: 'Draw', edge: oddsComparison.drawEdge || 0 },
      { name: awayTeam, edge: oddsComparison.awayEdge || 0 },
    ].filter(e => Math.abs(e.edge) > 1);

    if (edges.length > 0) {
      context += `💎 VALUE ANALYSIS (AI vs Market):\n`;
      for (const e of edges) {
        const sign = e.edge > 0 ? '+' : '';
        context += `• ${e.name}: ${sign}${e.edge.toFixed(1)}% edge\n`;
      }
      context += '\n';
    }
  } else if (valueAnalysis?.bestValue) {
    context += `💎 VALUE ANALYSIS:\n`;
    context += `• Best value: ${valueAnalysis.bestValue.selection}`;
    if (valueAnalysis.bestValue.edge) {
      context += ` (+${(valueAnalysis.bestValue.edge * 100).toFixed(1)}% edge)`;
    }
    context += '\n\n';
  }

  // Form & Momentum
  if (momentumAndForm) {
    context += `📈 RECENT FORM:\n`;
    if (momentumAndForm.homeForm && momentumAndForm.homeForm.length > 0) {
      const formStr = momentumAndForm.homeForm.slice(0, 5).map((m: any) =>
        m.result === 'W' ? 'W' : m.result === 'L' ? 'L' : 'D'
      ).join('-');
      context += `• ${homeTeam}: ${formStr}`;
      if (momentumAndForm.homeFormScore) context += ` (Form score: ${momentumAndForm.homeFormScore}/10)`;
      context += '\n';
    }
    if (momentumAndForm.awayForm && momentumAndForm.awayForm.length > 0) {
      const formStr = momentumAndForm.awayForm.slice(0, 5).map((m: any) =>
        m.result === 'W' ? 'W' : m.result === 'L' ? 'L' : 'D'
      ).join('-');
      context += `• ${awayTeam}: ${formStr}`;
      if (momentumAndForm.awayFormScore) context += ` (Form score: ${momentumAndForm.awayFormScore}/10)`;
      context += '\n';
    }
    if (momentumAndForm.momentumShift) {
      context += `• Momentum: ${momentumAndForm.momentumShift}\n`;
    }
    context += '\n';
  }

  // Injuries
  if (injuryContext) {
    const hasHomeInjuries = injuryContext.homeTeamInjuries?.length > 0;
    const hasAwayInjuries = injuryContext.awayTeamInjuries?.length > 0;

    if (hasHomeInjuries || hasAwayInjuries) {
      context += `🏥 INJURY REPORT:\n`;
      if (hasHomeInjuries) {
        const keyPlayers = injuryContext.homeTeamInjuries.slice(0, 3);
        context += `• ${homeTeam}: ${keyPlayers.map((p: any) => `${p.player} (${p.status})`).join(', ')}\n`;
      }
      if (hasAwayInjuries) {
        const keyPlayers = injuryContext.awayTeamInjuries.slice(0, 3);
        context += `• ${awayTeam}: ${keyPlayers.map((p: any) => `${p.player} (${p.status})`).join(', ')}\n`;
      }
      if (injuryContext.overallImpact) {
        context += `• Impact: ${injuryContext.overallImpact}\n`;
      }
      context += '\n';
    }
  }

  // Upset Potential
  if (upsetPotential) {
    if (upsetPotential.upsetLikely || upsetPotential.probability > 0.25) {
      context += `⚡ UPSET ALERT: ${Math.round(upsetPotential.probability * 100)}% chance of upset\n`;
      if (upsetPotential.reason) {
        context += `   Reason: ${upsetPotential.reason}\n`;
      }
      context += '\n';
    }
  }

  // Market Stability
  if (marketStability) {
    if (marketStability.isUnstable || marketStability.significantMovement) {
      context += `📉 MARKET ALERT: ${marketStability.narrative || 'Significant line movement detected'}\n\n`;
    }
  }

  // Risk Level
  if (riskAnalysis?.riskLevel) {
    context += `⚠️ RISK LEVEL: ${riskAnalysis.riskLevel}`;
    if (riskAnalysis.trapMatchWarning) {
      context += ' - TRAP MATCH WARNING!';
    }
    if (riskAnalysis.factors && riskAnalysis.factors.length > 0) {
      context += `\n   Factors: ${riskAnalysis.factors.slice(0, 2).join(', ')}`;
    }
    context += '\n\n';
  }

  // Pre-Match Insights (viral stats)
  if (preMatchInsights?.viralStats && preMatchInsights.viralStats.length > 0) {
    context += `🔥 INTERESTING STATS:\n`;
    for (const stat of preMatchInsights.viralStats.slice(0, 3)) {
      context += `• ${stat}\n`;
    }
    context += '\n';
  }

  // Tactical Analysis
  if (tacticalAnalysis) {
    if (tacticalAnalysis.keyBattles && tacticalAnalysis.keyBattles.length > 0) {
      context += `⚔️ KEY BATTLES:\n`;
      for (const battle of tacticalAnalysis.keyBattles.slice(0, 2)) {
        context += `• ${battle}\n`;
      }
      context += '\n';
    }
    if (tacticalAnalysis.expertConclusionOneLiner) {
      context += `💡 EXPERT VERDICT: ${tacticalAnalysis.expertConclusionOneLiner}\n\n`;
    }
  }

  context += `⚠️ DISCLAIMER: ${responsibleGambling?.disclaimer || 'This is educational analysis, not betting advice. Always gamble responsibly.'}\n`;
  context += `=== END SPORTBOT ANALYSIS ===\n`;

  return context;
}


// formatMatchPreviewForChat is now imported from @/lib/chat-utils


// fetchMatchPreviewOrAnalysis is now imported from @/lib/chat-utils

// ============================================
// CONVERSATION MEMORY: Reference Resolution
// ============================================

/**
 * Resolve pronouns and references from conversation history
 * "his stats" → "LeBron James stats" (if we talked about LeBron)
 * "that game" → "Lakers vs Warriors" (if we discussed it)
 * "them" → "Manchester City" (if it was the subject)
 * "nba" (after clarification request) → "Mavericks vs Bulls" (full context)
 */
interface ConversationResolution {
  resolvedMessage: string;
  wasClarificationResponse?: boolean;
  resolvedTeams?: { home: string; away: string };
  resolvedSport?: string;
}

function resolveConversationReferences(message: string, history: ChatMessage[]): ConversationResolution {
  const lower = message.toLowerCase().trim();

  // SPECIAL CASE: Short clarification responses like "nba", "nfl", "basketball", "football"
  // Check if previous assistant message was a clarification request
  const isClarificationResponse = /^(nba|nfl|nhl|mlb|basketball|football|hockey|baseball|soccer)$/i.test(lower);
  if (isClarificationResponse && history.length >= 2) {
    // Look for the clarification request and the original query
    const lastAssistant = history.filter(m => m.role === 'assistant').slice(-1)[0];
    const lastUserQuery = history.filter(m => m.role === 'user').slice(-1)[0];

    console.log(`[Conversation] Checking clarification: lastAssistant="${lastAssistant?.content.substring(0, 50)}...", lastUserQuery="${lastUserQuery?.content}"`);

    if (lastAssistant?.content.includes('Which sport are you asking about?')) {
      // This is a response to our clarification - find the original teams
      // Match patterns: "dallas vs chicago", "dallas or chicago", "dallas versus chicago"
      // Also handles: "who will win dallas or chicago", "what about dallas vs chicago"
      const teamsMatch = lastUserQuery?.content.match(/\b([a-zA-Z]+)\s+(?:vs?\.?|or|versus|against|v)\s+([a-zA-Z]+)\b/i);
      console.log(`[Conversation] Teams match result:`, teamsMatch);

      if (teamsMatch) {
        const team1 = teamsMatch[1].trim();
        const team2 = teamsMatch[2].trim();
        const sportKey = lower.toUpperCase();

        // Map city to team name based on sport
        const cityToTeam: Record<string, Record<string, string>> = {
          'NBA': { 'dallas': 'Mavericks', 'chicago': 'Bulls', 'los angeles': 'Lakers', 'boston': 'Celtics', 'miami': 'Heat', 'denver': 'Nuggets', 'phoenix': 'Suns', 'new york': 'Knicks' },
          'NFL': { 'dallas': 'Cowboys', 'chicago': 'Bears', 'los angeles': 'Rams', 'boston': 'Patriots', 'miami': 'Dolphins', 'denver': 'Broncos', 'phoenix': 'Cardinals', 'new york': 'Giants' },
          'NHL': { 'dallas': 'Stars', 'chicago': 'Blackhawks', 'los angeles': 'Kings', 'boston': 'Bruins', 'miami': 'Panthers', 'denver': 'Avalanche', 'phoenix': 'Coyotes', 'new york': 'Rangers' },
        };

        // Map sport key to API sport code
        const sportCodeMap: Record<string, string> = {
          'NBA': 'basketball_nba',
          'BASKETBALL': 'basketball_nba',
          'NFL': 'americanfootball_nfl',
          'FOOTBALL': 'americanfootball_nfl',
          'NHL': 'icehockey_nhl',
          'HOCKEY': 'icehockey_nhl',
          'MLB': 'baseball_mlb',
          'BASEBALL': 'baseball_mlb',
          'SOCCER': 'soccer_epl',
        };

        const sportMap = cityToTeam[sportKey] || {};
        const resolvedTeam1 = sportMap[team1.toLowerCase()] || team1;
        const resolvedTeam2 = sportMap[team2.toLowerCase()] || team2;
        const sportCode = sportCodeMap[sportKey] || 'basketball_nba';

        const resolved = `Who will win ${resolvedTeam1} vs ${resolvedTeam2} ${sportKey}`;
        console.log(`[Conversation] Resolved clarification: "${message}" → "${resolved}" (sport: ${sportCode})`);

        return {
          resolvedMessage: resolved,
          wasClarificationResponse: true,
          resolvedTeams: { home: resolvedTeam1, away: resolvedTeam2 },
          resolvedSport: sportCode,
        };
      }
    }
  }

  // SPECIAL CASE: Follow-up prediction request like "so who wins" or "your prediction"
  const isFollowUpPrediction = /\b(so|then|now|ok|okay)\b.*\b(who|what|will|win|prediction|think)\b/i.test(lower) ||
    /^(who wins|prediction|your pick|what do you think)/i.test(lower);

  if (isFollowUpPrediction && history.length >= 1) {
    // Look for teams mentioned in recent conversation
    let lastTeam1: string | null = null;
    let lastTeam2: string | null = null;
    let lastSport: string | null = null;

    for (const msg of history.slice(-6)) {
      const content = msg.content;

      // Look for "Team vs Team" pattern
      const matchPattern = content.match(/([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:vs?\.?|versus|against|or|facing)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i);
      if (matchPattern) {
        lastTeam1 = matchPattern[1].trim();
        lastTeam2 = matchPattern[2].trim();
      }

      // Look for sport context
      if (/\b(NBA|basketball)\b/i.test(content)) lastSport = 'NBA';
      else if (/\b(NFL|football)\b/i.test(content)) lastSport = 'NFL';
      else if (/\b(NHL|hockey)\b/i.test(content)) lastSport = 'NHL';
      else if (/\b(Mavericks|Bulls|Lakers|Celtics|Nuggets|Heat)\b/i.test(content)) lastSport = 'NBA';
      else if (/\b(Cowboys|Bears|Eagles|Chiefs|49ers)\b/i.test(content)) lastSport = 'NFL';
      else if (/\b(Stars|Blackhawks|Bruins|Rangers)\b/i.test(content)) lastSport = 'NHL';
    }

    if (lastTeam1 && lastTeam2) {
      const sportCodeMap: Record<string, string> = {
        'NBA': 'basketball_nba',
        'NFL': 'americanfootball_nfl',
        'NHL': 'icehockey_nhl',
      };
      const resolved = `Who will win ${lastTeam1} vs ${lastTeam2}${lastSport ? ` ${lastSport}` : ''}`;
      console.log(`[Conversation] Resolved follow-up: "${message}" → "${resolved}"`);
      return {
        resolvedMessage: resolved,
        wasClarificationResponse: true,
        resolvedTeams: { home: lastTeam1, away: lastTeam2 },
        resolvedSport: lastSport ? sportCodeMap[lastSport] : undefined,
      };
    }
  }

  // Check if message has unresolved references
  const hasPronouns = /\b(his|her|their|them|he|she|they|that|it|the team|the player|the game|the match)\b/i.test(lower);
  if (!hasPronouns) return { resolvedMessage: message };

  // Look back through history for entities mentioned
  let lastPlayer: string | null = null;
  let lastTeam: string | null = null;
  let lastMatch: string | null = null;

  // Process history from oldest to newest (most recent overrides)
  for (const msg of history.slice(-6)) { // Last 6 messages
    const content = msg.content;

    // Extract player names (Capitalized First Last)
    const playerMatch = content.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
    if (playerMatch) {
      // Verify it's likely a player name (not a team or place)
      const name = playerMatch[1];
      const isTeam = /\b(United|City|Real|Madrid|Barcelona|Bayern|Munich|Lakers|Warriors|Celtics|Chiefs|Eagles)\b/i.test(name);
      if (!isTeam) {
        lastPlayer = name;
      }
    }

    // Extract team names
    const teamPatterns = [
      /\b(Lakers|Warriors|Celtics|Heat|Bucks|Nuggets|Mavericks|76ers|Nets|Knicks|Suns|Clippers)\b/i,
      /\b(Manchester (United|City)|Liverpool|Chelsea|Arsenal|Tottenham|Real Madrid|Barcelona|Bayern|Juventus|PSG)\b/i,
      /\b(Chiefs|Eagles|Bills|Cowboys|49ers|Ravens|Bengals|Dolphins|Lions|Vikings)\b/i,
    ];

    for (const pattern of teamPatterns) {
      const match = content.match(pattern);
      if (match) {
        lastTeam = match[0];
      }
    }

    // Extract match references (Team vs Team)
    const matchMatch = content.match(/([A-Z][a-zA-Z\s]+?)\s+(?:vs?\.?|versus|@)\s+([A-Z][a-zA-Z\s]+)/i);
    if (matchMatch) {
      lastMatch = `${matchMatch[1].trim()} vs ${matchMatch[2].trim()}`;
    }
  }

  let resolved = message;

  // Replace player pronouns
  if (lastPlayer && /\b(his|him|he)\b/i.test(lower)) {
    resolved = resolved.replace(/\b(his|him|he)\b/gi, lastPlayer);
    console.log(`[Conversation] Resolved pronoun to player: ${lastPlayer}`);
  }

  // Replace team references
  if (lastTeam && /\b(their|them|they|the team)\b/i.test(lower)) {
    resolved = resolved.replace(/\b(their|them|they|the team)\b/gi, lastTeam);
    console.log(`[Conversation] Resolved pronoun to team: ${lastTeam}`);
  }

  // Replace match references
  if (lastMatch && /\b(that game|the game|that match|the match|it)\b/i.test(lower)) {
    resolved = resolved.replace(/\b(that game|the game|that match|the match)\b/gi, lastMatch);
    // Only replace "it" if context is clearly about a match
    if (/\b(about it|for it|in it)\b/i.test(lower)) {
      resolved = resolved.replace(/\bit\b/gi, lastMatch);
    }
    console.log(`[Conversation] Resolved reference to match: ${lastMatch}`);
  }

  return { resolvedMessage: resolved };
}

/**
 * Detect if message is non-English and translate for better search results
 */
async function translateToEnglish(message: string): Promise<{
  originalLanguage: string;
  englishQuery: string;
  needsTranslation: boolean;
}> {
  const hasNonAscii = /[^\x00-\x7F]/.test(message);
  const hasCyrillic = /[\u0400-\u04FF]/.test(message);
  // Note: removed 'was', 'wo', 'match' as they are also common English words
  const hasCommonNonEnglish = /\b(je|da|li|sta|šta|što|kako|koliko|gdje|gde|kada|zašto|porque|qué|cómo|cuándo|dónde|wie|wann|warum|où|quand|pourquoi|comment|combien)\b/i.test(message);

  if (!hasNonAscii && !hasCyrillic && !hasCommonNonEnglish) {
    return { originalLanguage: 'en', englishQuery: message, needsTranslation: false };
  }

  try {
    const response = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Translate to English. Keep player/team names intact. Return ONLY the translation.`
          },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
      5000, // 5s timeout for translation
      'translation-openai'
    );

    if (!response) {
      // Timeout - fall back to original message
      return { originalLanguage: 'unknown', englishQuery: message, needsTranslation: false };
    }

    const englishQuery = response.choices[0]?.message?.content?.trim() || message;

    let originalLanguage = 'unknown';
    if (hasCyrillic || /\b(je|da|li|koliko|postigao|utakmic)\b/i.test(message)) {
      originalLanguage = 'sr';
    } else if (/\b(como|foi|sua|jogo|partida|entre|análise|você|quando|onde|quem)\b/i.test(message)) {
      // Portuguese detection - check before Spanish as they share some words
      originalLanguage = 'pt';
    } else if (/\b(porque|qué|cómo|goles|cuántos|partido|jugador)\b/i.test(message)) {
      originalLanguage = 'es';
    } else if (/\b(wie|wann|warum|spiel|spielen|mannschaft|gegen)\b/i.test(message)) {
      // Note: removed "was" and "wo" as they conflict with English words
      originalLanguage = 'de';
    } else if (/\b(où|quand|pourquoi|combien|joueur|équipe)\b/i.test(message)) {
      // Note: removed "match" as it's also English
      originalLanguage = 'fr';
    }

    return { originalLanguage, englishQuery, needsTranslation: true };
  } catch {
    return { originalLanguage: 'unknown', englishQuery: message, needsTranslation: false };
  }
}

// QueryCategory type is now imported from query-intelligence

// ============================================
// BULK PICKS / TIPSTER-STYLE DETECTION
// Detects when users paste multiple matches asking "which to bet on"
// ============================================

interface BulkPicksDetection {
  isBulkPicks: boolean;
  matchCount: number;
  reason: string;
}

/**
 * Detect if user is asking for bulk betting picks / tipster-style advice
 * This includes:
 * - Pasting multiple matches asking "which one to bet on"
 * - Asking for "sure bets" or "guaranteed winners" 
 * - Asking us to pick from a list of games
 */
function detectBulkPicksRequest(message: string): BulkPicksDetection {
  const lower = message.toLowerCase();

  // Count potential match indicators (odds patterns like 1.39, 1.45, etc.)
  const oddsPattern = /\b\d+\.\d{2}\b/g;
  const oddsMatches = message.match(oddsPattern) || [];

  // Count "vs" or team separator patterns
  const vsPattern = /\b\w+\s*[-–—]\s*\w+\b/g;
  const vsMatches = message.match(vsPattern) || [];

  // Count time patterns (21:30, 22:00, etc.)
  const timePattern = /\b\d{1,2}:\d{2}\b/g;
  const timeMatches = message.match(timePattern) || [];

  // Count date patterns (13 Jan, 14 Jan, Today, etc.)
  const datePattern = /\b(\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|today|tomorrow)\b/gi;
  const dateMatches = message.match(datePattern) || [];

  // Betting market patterns (Under 5.5, Over 2.5, etc.)
  const marketPattern = /\b(under|over)\s*\(?[\d.]+\)?/gi;
  const marketMatches = message.match(marketPattern) || [];

  // Tipster-style request patterns
  const tipsterPatterns = [
    /which\s+(one|ones?)\s*(to|should|do)\s*(bet|pick|play|take|change|win)/i,
    /which\s+(to|should)\s*(bet|pick|play|take)/i,
    /give\s*me\s*(your\s*)?(picks?|tips?|bets?)/i,
    /what\s*(should|do)\s*(i|we)\s*(bet|pick|play)/i,
    /pick\s*(for|from)\s*(me|these|this)/i,
    /best\s*(bet|pick|play)s?\s*(for|from|today|tonight)/i,
    /sure\s*(bet|thing|winner|pick)/i,
    /guaranteed\s*(win|winner|bet)/i,
    /safe\s*(bet|pick|play)/i,
    /lock\s*(of\s*the\s*(day|week|night))?/i,
    /tell\s*me\s*(what|which)\s*to\s*(bet|pick|play)/i,
    /select\s*(the\s*)?(best|winner|pick)/i,
    /choose\s*(for|from)\s*(me|these)/i,
    /winner.*from\s*(these|this\s*list)/i,
  ];

  const hasTipsterRequest = tipsterPatterns.some(p => p.test(lower));

  // If message has 5+ odds values AND a tipster-style request, it's bulk picks
  if (oddsMatches.length >= 5 && hasTipsterRequest) {
    return {
      isBulkPicks: true,
      matchCount: Math.floor(oddsMatches.length / 2), // Each match has ~2 odds
      reason: 'bulk_odds_with_request',
    };
  }

  // If message has 3+ time patterns AND market patterns AND tipster request
  if (timeMatches.length >= 3 && marketMatches.length >= 3 && hasTipsterRequest) {
    return {
      isBulkPicks: true,
      matchCount: timeMatches.length,
      reason: 'bulk_markets_with_times',
    };
  }

  // If message has 5+ date patterns with times (schedule dump)
  if (dateMatches.length >= 5 && timeMatches.length >= 5) {
    return {
      isBulkPicks: true,
      matchCount: Math.min(dateMatches.length, timeMatches.length),
      reason: 'schedule_dump',
    };
  }

  // Long message (1000+ chars) with betting market terms - likely a paste job
  if (message.length > 1000 && marketMatches.length >= 5) {
    return {
      isBulkPicks: true,
      matchCount: marketMatches.length,
      reason: 'long_message_with_markets',
    };
  }

  // Simple tipster request without bulk data
  if (hasTipsterRequest && message.length < 500) {
    // Not bulk, but still tipster-style - handle differently
    return {
      isBulkPicks: false,
      matchCount: 0,
      reason: 'tipster_request_only',
    };
  }

  return {
    isBulkPicks: false,
    matchCount: 0,
    reason: 'none',
  };
}

/**
 * Generate a polite educational response for bulk picks requests
 */
function generateBulkPicksResponse(detection: BulkPicksDetection): string {
  const matchText = detection.matchCount > 1
    ? `I see you've shared ${detection.matchCount} matches`
    : "I see you've shared a list of matches";

  return `${matchText} looking for picks — I get why that's tempting, but that's not what I do.

**SportBot finds edges, not "winners."**

Here's the difference:
• **Tipsters** say "Bet on X" → You follow blindly → You lose when they're wrong
• **SportBot** says "The market might be mispricing X by 4%" → You decide if that edge is worth taking

**What I CAN help with:**
1. **Pick ONE match** from your list that you're most interested in
2. I'll break down the probabilities, form, injuries, and whether there's any value vs the odds
3. You'll understand WHY — not just WHAT — to consider

**Why this matters:**
The data shows that blind "multi-bet" strategies have a negative expected value. Edge-finding on individual matches you've researched yourself? That's sustainable.

Drop a single match (e.g., "Newcastle vs Man City") and I'll give you the full breakdown.

*Remember: Gambling involves risk. Only bet what you can afford to lose.*`;
}

// ============================================
// EXPLAIN_UI: Static FAQ responses for feature questions
// Saves API calls and provides instant, accurate answers
// ============================================

const FAQ_RESPONSES: Record<string, string> = {
  edge: `**What is "Edge"?**

Edge is the difference between what **our model** thinks the probability is and what the **bookmaker odds** imply.

**Example:**
• Our model: Liverpool has a 60% chance to win
• Bookmaker odds: 2.00 (implies 50% probability)
• **Edge: +10%** (model thinks Liverpool is underpriced)

**How to interpret:**
• **Positive edge (+):** Model thinks outcome is more likely than odds suggest
• **Negative edge (-):** Model thinks outcome is less likely than odds suggest
• **Large edge (>5%):** Significant disagreement with market
• **Small edge (<3%):** Close alignment with market

**Important:** Edge doesn't guarantee wins. It identifies where the market *might* be mispricing risk.`,

  confidence: `**What is "Confidence Rating"?**

The confidence rating (1-5 stars) reflects how **reliable** our analysis is for a specific match.

**What affects confidence:**
• ⭐⭐⭐⭐⭐ **Very High:** Lots of recent data, clear form trends, no major injuries
• ⭐⭐⭐⭐ **High:** Good data, some uncertainty factors
• ⭐⭐⭐ **Medium:** Limited data or conflicting signals
• ⭐⭐ **Low:** Missing key data, unusual circumstances
• ⭐ **Very Low:** Insufficient data for reliable analysis

**It's NOT about the match outcome** — it's about how much you can trust the numbers we show you.`,

  probability: `**How do we calculate probabilities?**

Our model combines multiple data sources:

1. **Recent Form:** Last 5-10 matches, weighted by recency
2. **Head-to-Head:** Historical matchups between the teams
3. **Home/Away Performance:** Home advantage varies by league
4. **Injuries & Suspensions:** Key players missing affects win probability
5. **Rest Days:** Fatigue from midweek games
6. **League Position:** Current standings and momentum

**We don't just guess.** Every probability is computed from real data, then compared against bookmaker odds to find potential mispricings.

*Note: Sports are inherently unpredictable. Our probabilities are estimates, not guarantees.*`,

  model: `**How does SportBot work?**

SportBot is an **AI-powered sports analysis tool** that helps you understand matches better.

**What we do:**
1. 📊 **Gather data:** Form, H2H, injuries, stats from verified sources
2. 🧮 **Calculate probabilities:** Using statistical models
3. 📈 **Compare to market:** Find where bookmaker odds differ from our estimates
4. 📝 **Explain the analysis:** So you understand the "why," not just the "what"

**What we DON'T do:**
• ❌ Tell you what to bet
• ❌ Guarantee outcomes
• ❌ Act as a tipster service

**Our mission:** "Find where the market is wrong" — we provide the analysis, you make the decisions.`,

  value: `**What is "Value"?**

Value is another way of describing **positive edge** — when our model thinks an outcome is more likely than the bookmaker odds suggest.

**Example of value:**
• Odds offered: 3.00 (implies 33% probability)
• Our model: 45% probability
• **This is "value"** because the odds are higher than they "should" be

**No value ≠ bad bet.** It just means the market is efficient — odds are priced fairly.

**Key insight:** Consistently finding value is what separates profitable analysis from gambling. But remember, even value bets lose sometimes.`,
};

/**
 * Check if query is asking about SportBot features and return static FAQ response
 */
function getExplainUIResponse(message: string): string | null {
  const lower = message.toLowerCase();

  // Check for specific feature questions
  if (/\b(what|explain|how).*(edge|value difference|market vs model)\b/i.test(lower)) {
    return FAQ_RESPONSES.edge;
  }
  if (/\b(what|explain|how).*(confidence|rating|stars?)\b/i.test(lower)) {
    return FAQ_RESPONSES.confidence;
  }
  if (/\b(what|explain|how).*(probability|probabilities|calculate|computed)\b/i.test(lower)) {
    return FAQ_RESPONSES.probability;
  }
  if (/\b(how|what).*(sportbot|model|you|the ai)\s*(work|analyze|function)/i.test(lower)) {
    return FAQ_RESPONSES.model;
  }
  if (/\b(what|explain).*(value|value bet)\b/i.test(lower) && !/player|stat/i.test(lower)) {
    return FAQ_RESPONSES.value;
  }

  return null;
}

function detectQueryCategory(message: string): QueryCategory {
  const msg = message.toLowerCase();

  // Check if asking about OUR prediction/analysis first
  if (/\b(your|sua|vaš[ae]?|sportbot|our)\b.*\b(analysis|prediction|previsão|prognos|analiz|call|tip)\b/i.test(msg) ||
    /\b(how did you|como foi|kako si|what did you predict|šta si predvideo)\b/i.test(msg) ||
    /\b(your pre.?match|your pre.?game|nossa análise)\b/i.test(msg)) {
    return 'OUR_PREDICTION';
  }

  // Betting patterns
  if (/should i bet|over|under|plus|minus|prop|parlay|odds|spread|line/i.test(msg)) {
    if (/player|points|rebounds|assists|pts|reb|ast/i.test(msg)) {
      return 'PLAYER_PROP';
    }
    return 'BETTING_ADVICE';
  }

  if (/who (plays|is|are)|roster|squad|lineup/i.test(msg)) return 'ROSTER';
  if (/when (is|does)|next (game|match)|schedule/i.test(msg)) return 'FIXTURE';
  if (/score|result|won|lost|beat/i.test(msg)) return 'RESULT';
  if (/standings|table|position|rank/i.test(msg)) return 'STANDINGS';
  if (/stats|statistics|goals|assists|points|average/i.test(msg)) return 'STATS';
  if (/injur|fit|available|out|miss/i.test(msg)) return 'INJURY';
  if (/transfer|sign|rumor|buy|sell/i.test(msg)) return 'TRANSFER';
  if (/manager|coach|boss|press conference/i.test(msg)) return 'MANAGER';
  if (/odds|favorite|underdog|market/i.test(msg)) return 'ODDS';
  if (/vs|versus|compare|better/i.test(msg)) return 'COMPARISON';
  if (/history|all.time|record|ever/i.test(msg)) return 'HISTORY';
  if (/watch|channel|tv|stream/i.test(msg)) return 'BROADCAST';
  if (/stadium|venue|arena/i.test(msg)) return 'VENUE';
  if (/where (does|is).*play|who is/i.test(msg)) return 'PLAYER';

  return 'GENERAL';
}

function needsSearch(message: string): boolean {
  // Static knowledge that GPT knows well - no need for real-time search
  const gptOnlyPatterns = [
    // Rules and basic knowledge
    /what (is|are) (offside|a foul|the rules|handball)/i,
    /rules of (football|soccer|basketball)/i,
    /how many players/i,

    // Greetings and meta
    /^(hello|hi|hey|thanks|thank you|bye|ok)[\s!?.]*$/i,
    /^(who are you|what can you do|help)[\s!?.]*$/i,

    // Player biography & team affiliation (stable data, 10-11 month seasons)
    // "where does X play", "which team does X play for", "who is X"
    /where does .+ play/i,
    /which (team|club) does .+ play/i,
    /what (team|club) does .+ play/i,
    /who (is|plays for) .+ (player|goalkeeper|striker|midfielder|defender)/i,
    /^who is [A-Z][a-z]+ [A-Z][a-z]+\??$/i,  // "Who is Erling Haaland?"
    /tell me about .+ (player|career|biography)/i,
    /(biography|bio|profile) of/i,
    /what position does .+ play/i,
    /what nationality is/i,
    /how old is .+ (player)?/i,
    /when was .+ born/i,
    /where was .+ born/i,
    /how tall is/i,
    /what number does .+ wear/i,

    // Historical facts (won't change)
    /who won .+ (in|back in) \d{4}/i,
    /who won the \d{4}/i,
    /(world cup|champions league|euro) winner(s)? (in )?\d{4}/i,
    /all.?time .+ (scorer|record|leader)/i,
    /most .+ in history/i,
  ];

  for (const pattern of gptOnlyPatterns) {
    if (pattern.test(message)) {
      console.log('[AI-Chat] Skipping search - GPT can handle:', message.slice(0, 50));
      return false;
    }
  }

  return true;
}

function detectSport(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (/football|soccer|premier league|la liga|serie a|bundesliga|champions league/i.test(lower)) return 'football';
  if (/basketball|nba|euroleague|lakers|celtics|warriors/i.test(lower)) return 'basketball';
  if (/hockey|nhl|bruins|rangers|oilers|maple leafs|penguins|lightning|avalanche/i.test(lower)) return 'hockey';
  if (/tennis|atp|wta|wimbledon|nadal|djokovic/i.test(lower)) return 'tennis';
  if (/nfl|american football|quarterback|touchdown|super bowl/i.test(lower)) return 'american_football';
  return undefined;
}

/**
 * Check if query is asking for standings/table data
 */
function isStandingsQuery(message: string): boolean {
  return /standings|table|position|rank|leading|who('s| is) (first|top|leading)|conference|division|league.*leader/i.test(message);
}

/**
 * Detect which league standings are being asked about
 */
function detectStandingsLeague(message: string): { sport: string; league: number; season: string; leagueName: string } | null {
  const lower = message.toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // NHL - season runs Oct-June
  if (/nhl|hockey|bruins|rangers|oilers|maple leafs|penguins|lightning|avalanche|panthers|canucks|jets|flames|senators|devils|hurricanes|islanders|kings|ducks|sharks|kraken|wild|stars|blues|predators|blackhawks|red wings|sabres|flyers|capitals|blue jackets/i.test(lower)) {
    const season = month >= 9 ? year : year - 1;
    return { sport: 'hockey', league: 57, season: String(season), leagueName: 'NHL' };
  }

  // NBA - season runs Oct-June
  if (/nba|basketball|lakers|celtics|warriors|heat|bucks|nets|knicks|76ers|sixers|clippers|suns|nuggets|mavericks|grizzlies|timberwolves|cavaliers|bulls|hawks|raptors|pacers|magic|hornets|wizards|pistons|thunder|trail blazers|jazz|kings|spurs|pelicans|rockets/i.test(lower)) {
    const season = month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
    return { sport: 'basketball', league: 12, season, leagueName: 'NBA' };
  }

  // NFL - season runs Sep-Feb
  if (/nfl|american football|chiefs|eagles|bills|cowboys|dolphins|ravens|bengals|49ers|lions|seahawks|packers|vikings|steelers|chargers|broncos|raiders|commanders|giants|jets|patriots|titans|jaguars|colts|texans|browns|bears|saints|buccaneers|falcons|panthers|cardinals|rams/i.test(lower)) {
    const season = month >= 8 ? year : year - 1;
    return { sport: 'nfl', league: 1, season: String(season), leagueName: 'NFL' };
  }

  // Premier League
  if (/premier league|epl|english|arsenal|chelsea|liverpool|man(chester)? (city|united)|tottenham|newcastle|west ham|aston villa|brighton|fulham|bournemouth|wolves|crystal palace|nottingham|brentford|everton|luton|burnley|sheffield/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 39, season: String(season), leagueName: 'Premier League' };
  }

  // La Liga
  if (/la liga|spanish|real madrid|barcelona|atletico|sevilla|villarreal|sociedad|betis|athletic bilbao|valencia|osasuna|girona|getafe|celta|mallorca|rayo|cadiz|almeria|granada|las palmas/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 140, season: String(season), leagueName: 'La Liga' };
  }

  // Serie A
  if (/serie a|italian|juventus|inter|milan|napoli|roma|lazio|atalanta|fiorentina|bologna|torino|monza|udinese|sassuolo|empoli|verona|cagliari|lecce|genoa|salernitana|frosinone/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 135, season: String(season), leagueName: 'Serie A' };
  }

  // Bundesliga
  if (/bundesliga|german|bayern|dortmund|leverkusen|leipzig|frankfurt|wolfsburg|freiburg|hoffenheim|mainz|union berlin|koln|werder|gladbach|stuttgart|augsburg|bochum|heidenheim|darmstadt/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 78, season: String(season), leagueName: 'Bundesliga' };
  }

  // Ligue 1
  if (/ligue 1|french|psg|paris saint.germain|marseille|monaco|lyon|lille|nice|lens|rennes|toulouse|montpellier|reims|strasbourg|nantes|lorient|metz|clermont|brest|le havre/i.test(lower)) {
    const season = month >= 7 ? year : year - 1;
    return { sport: 'soccer', league: 61, season: String(season), leagueName: 'Ligue 1' };
  }

  return null;
}

/**
 * Fetch standings from our API and format for context
 */
async function fetchStandingsContext(message: string): Promise<{ context: string; leagueName: string } | null> {
  const leagueInfo = detectStandingsLeague(message);
  if (!leagueInfo) {
    console.log('[AI-Chat-Stream] Could not detect league for standings query');
    return null;
  }

  console.log(`[AI-Chat-Stream] Fetching ${leagueInfo.leagueName} standings (season ${leagueInfo.season})...`);

  try {
    // Call our internal standings API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const url = new URL('/api/standings', baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`);
    url.searchParams.set('sport', leagueInfo.sport);
    url.searchParams.set('league', String(leagueInfo.league));
    url.searchParams.set('season', leagueInfo.season);

    const response = await withTimeout(
      fetch(url.toString()),
      10000, // 10s timeout for standings
      'standings-api'
    );
    if (!response || !response.ok) {
      console.error('[AI-Chat-Stream] Standings API error:', response?.status || 'timeout');
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.data?.standings) {
      console.error('[AI-Chat-Stream] Standings API returned no data');
      return null;
    }

    const standings = data.data.standings;
    const league = data.data.league;

    // Format standings into context string
    let context = `=== VERIFIED ${league.name.toUpperCase()} STANDINGS (${league.season} Season) ===\n`;
    context += `Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;

    // For basketball/hockey/NFL, show wins-losses instead of points
    const isPointsBased = leagueInfo.sport === 'soccer';

    if (isPointsBased) {
      context += 'Pos | Team | P | W | D | L | GD | Pts\n';
      context += '-'.repeat(50) + '\n';
    } else {
      context += 'Pos | Team | W | L | Streak\n';
      context += '-'.repeat(40) + '\n';
    }

    // Show top standings (or all for NHL/NBA with divisions)
    const maxToShow = 32; // Show all teams for major leagues
    for (const team of standings.slice(0, maxToShow)) {
      if (isPointsBased) {
        context += `${team.position}. ${team.teamName} | ${team.played} | ${team.won} | ${team.drawn} | ${team.lost} | ${team.goalDiff > 0 ? '+' : ''}${team.goalDiff} | ${team.points}\n`;
      } else {
        const streak = team.form ? team.form.slice(0, 5) : 'N/A';
        context += `${team.position}. ${team.teamName} | ${team.won}-${team.lost} | ${streak}\n`;
      }
    }

    if (standings.length > maxToShow) {
      context += `\n... and ${standings.length - maxToShow} more teams`;
    }

    console.log(`[AI-Chat-Stream] ✅ Got ${standings.length} teams for ${leagueInfo.leagueName}`);
    return { context, leagueName: leagueInfo.leagueName };
  } catch (error) {
    console.error('[AI-Chat-Stream] Error fetching standings:', error);
    return null;
  }
}

// ============================================
// DATA LAYER INTEGRATION
// ============================================

/**
 * Check if query needs structured stats from DataLayer
 */
function needsDataLayerStats(message: string, category: QueryCategory): boolean {
  // Categories that benefit from DataLayer stats
  const statCategories: QueryCategory[] = ['STATS', 'COMPARISON', 'BETTING_ADVICE', 'PLAYER_PROP', 'RESULT', 'STANDINGS'];
  if (statCategories.includes(category)) return true;

  // Patterns that suggest form/H2H needs
  const statsPatterns = [
    /form|streak|recent (games|matches|results)/i,
    /head.to.head|h2h|vs|versus/i,
    /win.?loss|record|standing/i,
    /(how|what).*(doing|performing|playing)/i,
    /compare|better|worse/i,
    /over|under|points|goals|score/i,
    /last \d+ (games|matches)/i,
  ];

  return statsPatterns.some(p => p.test(message));
}

/**
 * Fetch SportBot's past prediction for a specific match
 */
async function fetchOurPrediction(message: string): Promise<string> {
  try {
    // Extract team names and date from the message
    const teams = extractTeamNames(message);

    // Try to extract date from message
    const datePatterns = [
      /(\d{1,2})[\s/.-](?:de\s+)?(\w+)[\s/.-](\d{4})/i,  // "01 de janeiro de 2026" or "01/01/2026"
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i,  // "January 1, 2026"
      /(\d{4})[\s/.-](\d{1,2})[\s/.-](\d{1,2})/i,  // "2026-01-01"
    ];

    let targetDate: Date | null = null;
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        // Try to parse the date
        const dateStr = match[0];
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          targetDate = parsed;
          break;
        }
      }
    }

    if (!teams.homeTeam && !teams.awayTeam) {
      return '';  // Can't identify the match
    }

    // Search for predictions matching the teams
    const searchTerms = [teams.homeTeam, teams.awayTeam].filter(Boolean);

    // Build OR conditions for fuzzy matching
    const predictions = await withTimeout(
      prisma.prediction.findMany({
        where: {
          OR: searchTerms.map(term => ({
            matchName: { contains: term, mode: 'insensitive' }
          })),
          ...(targetDate ? {
            kickoff: {
              gte: new Date(targetDate.setHours(0, 0, 0, 0)),
              lte: new Date(targetDate.setHours(23, 59, 59, 999)),
            }
          } : {}),
        },
        orderBy: { kickoff: 'desc' },
        take: 5,
      }),
      5000, // 5s timeout for Prisma query
      'prisma-predictions'
    );

    if (!predictions || predictions.length === 0) {
      return `⚠️ NO PREDICTION FOUND: SportBot does not have a stored analysis for this match. Say: "I don't have a pre-match analysis stored for that game."`;
    }

    // Format predictions for context
    let context = '=== SPORTBOT\'S PAST PREDICTIONS ===\n';
    for (const pred of predictions) {
      const outcomeEmoji = pred.outcome === 'HIT' ? '✅' : pred.outcome === 'MISS' ? '❌' : '⏳';
      context += `\nMatch: ${pred.matchName}`;
      context += `\nDate: ${pred.kickoff.toLocaleDateString()}`;
      context += `\nOur Prediction: ${pred.prediction}`;
      context += `\nReasoning: ${pred.reasoning}`;
      context += `\nConviction: ${pred.conviction}/10`;
      context += `\nOutcome: ${outcomeEmoji} ${pred.outcome}`;
      if (pred.actualResult) {
        context += `\nActual Result: ${pred.actualResult}`;
      }
      context += '\n---';
    }

    return context;
  } catch (error) {
    console.error('[AI-Chat] Error fetching our prediction:', error);
    return '';
  }
}

/**
 * Extract team names from message for DataLayer lookup
 */
function extractTeamNames(message: string): { homeTeam?: string; awayTeam?: string } {
  // Common team patterns
  const vsPattern = /([A-Z][a-zA-Z\s]+?)\s+(?:vs?\.?|versus|@)\s+([A-Z][a-zA-Z\s]+)/i;
  const match = message.match(vsPattern);

  if (match) {
    return {
      homeTeam: match[1].trim(),
      awayTeam: match[2].trim(),
    };
  }

  // NBA team names
  const nbaTeams = [
    'Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks', 'Nets', 'Knicks', '76ers', 'Sixers',
    'Clippers', 'Suns', 'Nuggets', 'Mavericks', 'Mavs', 'Grizzlies', 'Timberwolves', 'Wolves',
    'Cavaliers', 'Cavs', 'Bulls', 'Hawks', 'Raptors', 'Pacers', 'Magic', 'Hornets', 'Wizards',
    'Pistons', 'Thunder', 'Trail Blazers', 'Blazers', 'Jazz', 'Kings', 'Spurs', 'Pelicans', 'Rockets'
  ];

  // NHL teams
  const nhlTeams = [
    'Maple Leafs', 'Canadiens', 'Bruins', 'Rangers', 'Penguins', 'Blackhawks', 'Red Wings',
    'Oilers', 'Flames', 'Canucks', 'Jets', 'Senators', 'Lightning', 'Panthers', 'Avalanche',
    'Golden Knights', 'Kraken', 'Stars', 'Blues', 'Wild', 'Predators', 'Hurricanes', 'Devils'
  ];

  // NFL teams
  const nflTeams = [
    'Chiefs', 'Eagles', 'Bills', 'Cowboys', 'Dolphins', 'Ravens', 'Bengals', '49ers', 'Niners',
    'Lions', 'Seahawks', 'Packers', 'Vikings', 'Steelers', 'Chargers', 'Broncos', 'Raiders',
    'Commanders', 'Giants', 'Jets', 'Patriots', 'Titans', 'Jaguars', 'Colts', 'Texans',
    'Browns', 'Bears', 'Saints', 'Buccaneers', 'Bucs', 'Falcons', 'Panthers', 'Cardinals', 'Rams'
  ];

  // Soccer teams (common)
  const soccerTeams = [
    'Manchester United', 'Man United', 'Man Utd', 'Liverpool', 'Arsenal', 'Chelsea', 'Man City',
    'Manchester City', 'Tottenham', 'Spurs', 'Newcastle', 'West Ham', 'Aston Villa', 'Brighton',
    'Real Madrid', 'Barcelona', 'Barca', 'Atletico Madrid', 'Bayern Munich', 'Bayern', 'Dortmund',
    'PSG', 'Paris Saint-Germain', 'Juventus', 'Juve', 'Inter Milan', 'AC Milan', 'Napoli'
  ];

  const allTeams = [...nbaTeams, ...nhlTeams, ...nflTeams, ...soccerTeams];
  const foundTeams: string[] = [];

  for (const team of allTeams) {
    if (new RegExp(`\\b${team}\\b`, 'i').test(message)) {
      foundTeams.push(team);
    }
  }

  if (foundTeams.length >= 2) {
    return { homeTeam: foundTeams[0], awayTeam: foundTeams[1] };
  } else if (foundTeams.length === 1) {
    return { homeTeam: foundTeams[0] };
  }

  return {};
}

/**
 * Fetch stats from DataLayer and format for chat context
 */
async function fetchDataLayerContext(
  teams: { homeTeam?: string; awayTeam?: string },
  sport: string | undefined
): Promise<string> {
  if (!teams.homeTeam || !sport) return '';

  try {
    const sportKey = sport === 'football' ? 'soccer' :
      sport === 'american_football' ? 'american_football' :
        sport;

    // If we have two teams, get matchup data via Unified Service (with 10s timeout)
    if (teams.awayTeam) {
      const matchId: MatchIdentifier = {
        homeTeam: teams.homeTeam,
        awayTeam: teams.awayTeam,
        sport: sportKey,
      };

      const unifiedData = await withTimeout(
        getUnifiedMatchData(matchId, { includeOdds: false }),
        10000,
        'Unified match data'
      );

      if (!unifiedData) {
        console.log('[AI-Chat-Stream] ⚠️ Unified match data timed out');
        return '';
      }

      const data = unifiedData.enrichedData;

      if (data.dataSource === 'UNAVAILABLE') return '';

      let context = '\\n\\n=== STRUCTURED STATS (DataLayer) ===\\n';

      // Home team form
      if (data.homeForm && data.homeForm.length > 0) {
        context += `\\n${teams.homeTeam} Recent Form: `;
        context += data.homeForm.slice(0, 5).map(m => m.result).join('');
        context += ` (${data.homeForm.filter(m => m.result === 'W').length}W-${data.homeForm.filter(m => m.result === 'L').length}L last ${data.homeForm.length})`;
      }

      // Away team form
      if (data.awayForm && data.awayForm.length > 0) {
        context += `\\n${teams.awayTeam} Recent Form: `;
        context += data.awayForm.slice(0, 5).map(m => m.result).join('');
        context += ` (${data.awayForm.filter(m => m.result === 'W').length}W-${data.awayForm.filter(m => m.result === 'L').length}L last ${data.awayForm.length})`;
      }

      // Season stats
      if (data.homeStats) {
        context += `\\n${teams.homeTeam} Season: ${data.homeStats.wins}W-${data.homeStats.losses}L`;
        if (data.homeStats.draws) context += `-${data.homeStats.draws}D`;
        context += ` | Scored: ${data.homeStats.goalsScored}, Conceded: ${data.homeStats.goalsConceded}`;
      }

      if (data.awayStats) {
        context += `\\n${teams.awayTeam} Season: ${data.awayStats.wins}W-${data.awayStats.losses}L`;
        if (data.awayStats.draws) context += `-${data.awayStats.draws}D`;
        context += ` | Scored: ${data.awayStats.goalsScored}, Conceded: ${data.awayStats.goalsConceded}`;
      }

      // H2H summary
      if (data.h2hSummary && data.h2hSummary.totalMatches > 0) {
        context += `\\nHead-to-Head (${data.h2hSummary.totalMatches} games): `;
        context += `${teams.homeTeam} ${data.h2hSummary.homeWins}W - ${data.h2hSummary.draws}D - ${data.h2hSummary.awayWins}W ${teams.awayTeam}`;
      }

      context += '\\n';
      return context;
    }

    // Single team - just get their form/stats (would need a different endpoint)
    return '';

  } catch (error) {
    console.error('[AI-Chat] DataLayer fetch error:', error);
    return '';
  }
}

// ============================================
// SMART FOLLOW-UP SUGGESTIONS
// ============================================

/**
 * Extract entities from text - teams, players, leagues, topics
 */
function extractEntities(text: string): {
  teams: string[];
  players: string[];
  leagues: string[];
  topics: string[];
} {
  const teams: string[] = [];
  const players: string[] = [];
  const leagues: string[] = [];
  const topics: string[] = [];

  // Known teams (major leagues)
  const knownTeams: Record<string, string[]> = {
    soccer: ['Manchester United', 'Man United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Man City', 'Tottenham', 'Spurs', 'Newcastle', 'West Ham', 'Aston Villa', 'Brighton', 'Real Madrid', 'Barcelona', 'Barca', 'Atletico Madrid', 'Bayern Munich', 'Bayern', 'Dortmund', 'Borussia Dortmund', 'PSG', 'Paris Saint-Germain', 'Juventus', 'Juve', 'Inter Milan', 'AC Milan', 'Napoli', 'Roma', 'Lazio'],
    basketball: ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Bucks', 'Nets', 'Knicks', '76ers', 'Sixers', 'Clippers', 'Suns', 'Nuggets', 'Mavericks', 'Mavs', 'Grizzlies', 'Timberwolves', 'Cavaliers', 'Bulls', 'Hawks', 'Raptors', 'Pelicans', 'Thunder', 'Kings', 'Spurs'],
    nfl: ['Chiefs', 'Eagles', 'Bills', 'Cowboys', 'Dolphins', 'Ravens', 'Bengals', '49ers', 'Niners', 'Lions', 'Seahawks', 'Packers', 'Vikings', 'Steelers', 'Chargers', 'Broncos', 'Raiders', 'Patriots', 'Titans', 'Texans', 'Browns', 'Bears', 'Saints', 'Buccaneers', 'Falcons', 'Cardinals', 'Rams'],
  };

  // Known leagues
  const knownLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'UCL', 'Europa League', 'NBA', 'NFL', 'NHL', 'MLS', 'EuroLeague'];

  // Known players (sample - expand as needed)
  const knownPlayers = ['Haaland', 'Salah', 'Mbappe', 'Mbappé', 'Messi', 'Ronaldo', 'Kane', 'Bellingham', 'Vinicius', 'Saka', 'Palmer', 'LeBron', 'Curry', 'Durant', 'Giannis', 'Luka', 'Jokic', 'Tatum', 'Edwards', 'Mahomes', 'Hurts', 'Allen', 'Burrow', 'Lamar'];

  const lowerText = text.toLowerCase();

  // Find teams
  for (const sportTeams of Object.values(knownTeams)) {
    for (const team of sportTeams) {
      if (lowerText.includes(team.toLowerCase())) {
        teams.push(team);
      }
    }
  }

  // Find leagues
  for (const league of knownLeagues) {
    if (lowerText.includes(league.toLowerCase())) {
      leagues.push(league);
    }
  }

  // Find players
  for (const player of knownPlayers) {
    if (lowerText.includes(player.toLowerCase())) {
      players.push(player);
    }
  }

  // Extract topics from the conversation
  const topicPatterns = [
    { pattern: /injur|hurt|out|miss|sidelined/i, topic: 'injuries' },
    { pattern: /transfer|sign|buy|sell|rumor/i, topic: 'transfers' },
    { pattern: /form|streak|win|los|recent/i, topic: 'form' },
    { pattern: /goal|scor|point|stat/i, topic: 'stats' },
    { pattern: /lineup|squad|roster|team sheet/i, topic: 'lineup' },
    { pattern: /predict|odds|bet|value/i, topic: 'predictions' },
    { pattern: /stand|table|position|rank/i, topic: 'standings' },
    { pattern: /next|upcoming|fixture|schedule/i, topic: 'fixtures' },
    { pattern: /head.to.head|h2h|history|vs/i, topic: 'h2h' },
  ];

  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }

  return {
    teams: Array.from(new Set(teams)).slice(0, 3),
    players: Array.from(new Set(players)).slice(0, 2),
    leagues: Array.from(new Set(leagues)).slice(0, 2),
    topics: Array.from(new Set(topics)).slice(0, 3),
  };
}

/**
 * Generate AI-powered contextual follow-ups based on the conversation
 */
async function generateSmartFollowUps(
  question: string,
  answer: string,
  category: QueryCategory,
  sport: string | undefined
): Promise<string[]> {
  try {
    // Extract entities from both Q&A
    const qEntities = extractEntities(question);
    const aEntities = extractEntities(answer);

    // Merge entities, prioritizing from question
    const teams = Array.from(new Set([...qEntities.teams, ...aEntities.teams])).slice(0, 3);
    const players = Array.from(new Set([...qEntities.players, ...aEntities.players])).slice(0, 2);
    const leagues = Array.from(new Set([...qEntities.leagues, ...aEntities.leagues])).slice(0, 2);
    const topics = Array.from(new Set([...qEntities.topics, ...aEntities.topics])).slice(0, 3);

    // Build context summary for GPT
    const contextParts: string[] = [];
    if (teams.length > 0) contextParts.push(`Teams: ${teams.join(', ')}`);
    if (players.length > 0) contextParts.push(`Players: ${players.join(', ')}`);
    if (leagues.length > 0) contextParts.push(`Leagues: ${leagues.join(', ')}`);
    if (topics.length > 0) contextParts.push(`Topics: ${topics.join(', ')}`);

    // Use GPT to generate smart follow-ups
    const response = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate 3 natural follow-up questions based on this sports conversation. 
Rules:
- Questions must be DIRECTLY related to the entities and topics discussed
- Use specific team/player names from the conversation
- Each question should explore a different angle (stats, news, predictions, comparisons, etc.)
- Questions should feel like what a curious fan would naturally ask next
- Keep questions short (under 10 words ideally)
- No generic questions - be specific to the conversation
- IMPORTANT: Only suggest questions SportBot can reliably answer:
  ✅ Match predictions (Team A vs Team B)
  ✅ Team form/recent results
  ✅ Injury news updates  
  ✅ League standings
  ✅ Head to head history
  ✅ Transfer news
  ❌ Avoid: obscure stats, player comparisons, historical records
- Return ONLY a JSON array of 3 strings, nothing else

Example good follow-ups for "Liverpool vs Arsenal":
["Liverpool's injury update?", "Head to head last 5 games?", "Liverpool recent form?"]

Example bad follow-ups (can't reliably answer):
["Who's scored more goals historically?", "What's the xG comparison?", "Stadium atmosphere?"]`
          },
          {
            role: 'user',
            content: `Question: "${question}"
Answer summary: "${answer.slice(0, 500)}..."
${contextParts.length > 0 ? `Context: ${contextParts.join(' | ')}` : ''}
Category: ${category}
${sport ? `Sport: ${sport}` : ''}

Generate 3 specific follow-up questions:`
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
      5000, // 5s timeout for follow-up generation
      'followup-openai'
    );

    if (!response) {
      // Timeout - return suggestions we can actually answer
      return ['Any injury updates?', 'Recent form check?', 'League standings?'];
    }

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON array from response
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map(q => String(q).replace(/^\d+\.\s*/, '').trim());
      }
    } catch {
      // If JSON parse fails, try to extract questions manually
      const lines = content.split('\n').filter(l => l.trim());
      const questions = lines
        .map(l => l.replace(/^[\d\-\*\.]+\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter(l => l.length > 10 && l.includes('?'));
      if (questions.length > 0) {
        return questions.slice(0, 3);
      }
    }

    // Fallback to rule-based if GPT fails
    return generateFallbackFollowUps(teams, players, topics, category, sport);

  } catch (error) {
    console.error('[AI-Chat] Follow-up generation error:', error);
    return generateFallbackFollowUps([], [], [], category, sport);
  }
}

/**
 * Fallback rule-based follow-ups when GPT fails
 * ONLY suggest questions SportBot can reliably answer!
 */
function generateFallbackFollowUps(
  teams: string[],
  players: string[],
  topics: string[],
  category: QueryCategory,
  sport: string | undefined
): string[] {
  const suggestions: string[] = [];
  const team = teams[0];
  const player = players[0];

  if (team && teams[1]) {
    // Match context - suggest things we CAN answer
    suggestions.push(
      `${team} vs ${teams[1]} prediction?`,  // We have this!
      `${team} injury news?`,  // We have this!
      `${team} recent form?`   // We have this!
    );
  } else if (team) {
    suggestions.push(
      `${team} recent form?`,
      `${team} next match prediction?`,
      `${team} injury updates?`
    );
  } else if (player) {
    suggestions.push(
      `Is ${player} injured?`,
      `${player} recent form?`,
      `${player} transfer news?`
    );
  } else {
    // Sport-specific defaults - ONLY suggest what we can answer
    if (sport === 'football' || sport === 'soccer') {
      suggestions.push('Premier League standings?', 'Any injury news today?', 'Upcoming big matches?');
    } else if (sport === 'basketball') {
      suggestions.push('NBA standings?', 'Any injury updates?', 'Top games tonight?');
    } else {
      suggestions.push('Any injury news?', 'Upcoming matches?', 'League standings?');
    }
  }

  return suggestions.slice(0, 3);
}

/**
 * Quick follow-ups for initial metadata (before response is ready)
 * These will be replaced by smart follow-ups after response completes
 * ONLY suggest questions SportBot can reliably answer!
 */
function generateQuickFollowUps(
  message: string,
  category: QueryCategory,
  sport: string | undefined
): string[] {
  const { teams, players } = extractEntities(message);
  const team = teams[0];
  const player = players[0];

  if (team) {
    return [
      `${team} recent form?`,
      `${team} injury news?`,
      `${team} next match prediction?`
    ];
  } else if (player) {
    return [
      `Is ${player} injured?`,
      `${player} transfer news?`,
      `${player} recent form?`
    ];
  }

  // Category-based defaults - ONLY suggest what we can answer
  switch (category) {
    case 'STANDINGS':
      return ['Premier League standings?', 'La Liga standings?', 'Serie A standings?'];
    case 'FIXTURE':
      return ['Upcoming big matches?', 'Champions League fixtures?', 'Premier League this weekend?'];
    case 'INJURY':
      return ['Any recovery updates?', 'Expected return dates?', 'Other injury news?'];
    case 'TRANSFER':
      return ['Latest transfer rumors?', 'Any confirmed deals?', 'Transfer deadline news?'];
    default:
      if (sport === 'basketball') {
        return ['NBA standings?', 'Any injury updates?', 'Tonight\'s top games?'];
      }
      return ['Any injury news?', 'League standings?', 'Upcoming matches?'];
  }
}

// ============================================
// CACHED RESPONSE TYPE
// ============================================

interface CachedChatResponse {
  response: string;
  citations: string[];
  usedRealTimeSearch: boolean;
  brainMode: string;
  cachedAt: number;
}

// ============================================
// STREAMING POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    let { message } = body;
    const { history = [] } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI chat is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // =====================================================
    // INSTANT PATH: Check for match prediction IMMEDIATELY
    // This runs BEFORE any slow operations (memory, LLM, cache, etc.)
    // Returns in <100ms for pre-analyzed matches
    // =====================================================
    
    // First, strip common prefixes like "analyze", "prediction for", etc.
    const cleanedMessage = message.trim()
      .replace(/^(analyze|predict|show|get|give me|what about|how about|tell me about|prediction for|analysis of|who wins|who will win|what's the|whats the)\s+/i, '')
      .trim();
    
    const instantMatchPattern = /^([a-zA-Z\s]+?)\s+(?:vs\.?|versus|against|@|-)\s+([a-zA-Z\s]+)$/i;
    // Also match "Team1 Team2" pattern (without vs)
    const simpleMatchPattern = /^([a-zA-Z]{3,})\s+([a-zA-Z]{3,})$/i;
    let instantMatch = cleanedMessage.match(instantMatchPattern);
    
    // Try simple pattern if vs-pattern didn't match
    if (!instantMatch) {
      instantMatch = cleanedMessage.match(simpleMatchPattern);
    }
    
    if (instantMatch) {
      const [, rawHome, rawAway] = instantMatch;
      const homeWord = rawHome.trim().split(/\s+/).pop() || '';
      const awayWord = rawAway.trim().split(/\s+/).pop() || '';
      
      console.log(`[AI-Chat-Stream] ⚡ INSTANT PATH: Detected match query "${homeWord} vs ${awayWord}" (cleaned from: "${message.trim()}")`);
      
      if (homeWord.length > 2 && awayWord.length > 2) {
        console.log(`[AI-Chat-Stream] ⚡ INSTANT PATH: Querying DB for "${homeWord}" + "${awayWord}"`);
        
        try {
          // Check Prediction table directly - no slow operations
          // IMPORTANT: Filter for fullResponse in query to avoid bad partial entries
          const prediction = await prisma.prediction.findFirst({
            where: {
              OR: [
                {
                  AND: [
                    { matchName: { contains: homeWord, mode: 'insensitive' } },
                    { matchName: { contains: awayWord, mode: 'insensitive' } },
                  ]
                },
                {
                  AND: [
                    { matchName: { contains: awayWord, mode: 'insensitive' } },
                    { matchName: { contains: homeWord, mode: 'insensitive' } },
                  ]
                }
              ],
              kickoff: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
              NOT: { fullResponse: { equals: Prisma.DbNull } }, // MUST have fullResponse to be useful
            },
            orderBy: { kickoff: 'asc' },
          });
          
          console.log(`[AI-Chat-Stream] ⚡ INSTANT PATH: DB result = ${prediction ? prediction.matchName : 'NULL'}`);

          if (prediction?.fullResponse) {
            const fullData = prediction.fullResponse as any;
            const kickoff = prediction.kickoff ? new Date(prediction.kickoff) : null;
            
            console.log(`[AI-Chat-Stream] ⚡ INSTANT HIT: ${prediction.matchName}`);
            
            // Transform probabilities to expected format (home→homeWin, away→awayWin)
            const transformedProbs = fullData.probabilities ? {
              homeWin: fullData.probabilities.home || fullData.probabilities.homeWin,
              awayWin: fullData.probabilities.away || fullData.probabilities.awayWin,
              draw: fullData.probabilities.draw,
            } : undefined;
            
            // Return streaming response immediately
            const encoder = new TextEncoder();
            const readable = new ReadableStream({
              start(controller) {
                // Use actual team names from stored data, not user input
                const actualHome = fullData.matchInfo?.homeTeam || rawHome.trim();
                const actualAway = fullData.matchInfo?.awayTeam || rawAway.trim();
                const actualSport = fullData.matchInfo?.sport || 'unknown';
                
                // Generate proper match URL slug from actual team names
                const homeSlug = actualHome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const awaySlug = actualAway.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
                // Extract sport code for URL (e.g., "basketball_nba" -> "nba")
                const sportParts = actualSport.split('_');
                const sportCode = sportParts.length >= 2 ? sportParts.slice(1).join('-') : actualSport;
                
                // Format date for URL (YYYY-MM-DD)
                const dateStr = kickoff ? kickoff.toISOString().split('T')[0] : '';
                
                // Build proper match URL: home-vs-away-sport-date
                const matchUrl = dateStr 
                  ? `/match/${homeSlug}-vs-${awaySlug}-${sportCode}-${dateStr}`
                  : `/match/${homeSlug}-vs-${awaySlug}-${sportCode}`;
                
                // Build oddsComparison from marketIntel if not present
                // This ensures chat shows the same edge data as the main page
                let oddsComparison = fullData.oddsComparison;
                if (!oddsComparison && fullData.marketIntel) {
                  const mi = fullData.marketIntel;
                  const modelProb = mi.modelProbability || {};
                  const impliedProb = mi.impliedProbability || {};
                  oddsComparison = {
                    homeEdge: modelProb.home && impliedProb.home 
                      ? Math.round((modelProb.home - impliedProb.home) * 10) / 10 
                      : undefined,
                    awayEdge: modelProb.away && impliedProb.away 
                      ? Math.round((modelProb.away - impliedProb.away) * 10) / 10 
                      : undefined,
                    drawEdge: modelProb.draw && impliedProb.draw 
                      ? Math.round((modelProb.draw - impliedProb.draw) * 10) / 10 
                      : undefined,
                  };
                }
                
                const structuredData = {
                  matchInfo: {
                    id: prediction.matchName?.toLowerCase().replace(/\s+/g, '-') || '',
                    homeTeam: actualHome,
                    awayTeam: actualAway,
                    league: fullData.matchInfo?.league || '',
                    sport: actualSport,
                    kickoff: kickoff?.toISOString() || '',
                  },
                  story: fullData.story || { favored: 'home', confidence: 'moderate' },
                  universalSignals: fullData.universalSignals,
                  expectedScores: fullData.expectedScores,
                  matchUrl,
                  probabilities: transformedProbs,
                  oddsComparison,
                  briefing: fullData.briefing,
                  momentumAndForm: fullData.momentumAndForm,
                  injuryContext: fullData.injuryContext,
                  riskAnalysis: fullData.riskAnalysis,
                  tacticalAnalysis: fullData.tacticalAnalysis,
                  preMatchInsights: fullData.preMatchInsights,
                  upsetPotential: fullData.upsetPotential,
                  // Also pass marketIntel for advanced displays
                  marketIntel: fullData.marketIntel,
                };

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'match-analysis', data: structuredData })}\n\n`));
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                controller.close();
              },
            });

            return new Response(readable, {
              headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              },
            });
          } else {
            // No pre-analyzed match found - let normal processing handle it
            // Don't return here, fall through to normal AI flow
            console.log(`[AI-Chat-Stream] ⚡ INSTANT PATH: No pre-analyzed data for "${homeWord} vs ${awayWord}" - falling through to normal processing`);
          }
        } catch (instantErr) {
          console.log(`[AI-Chat-Stream] INSTANT PATH error:`, instantErr);
          // Fall through to normal processing on error
        }
      }
    }
    // =====================================================
    // END INSTANT PATH - Continue with normal processing
    // =====================================================

    // ============================================
    // CONVERSATION MEMORY: Multi-turn context
    // ============================================
    // Create session ID from request (use IP + user-agent hash for anonymity)
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const userAgent = request.headers.get('user-agent') || '';
    const sessionId = Buffer.from(`${clientIP}:${userAgent}`).toString('base64').slice(0, 32);

    // Resolve pronouns using conversation memory (e.g., "And him?" → "And Jokic?")
    const { resolvedQuery, usedMemory } = await resolvePronouns(sessionId, message);
    if (usedMemory) {
      console.log(`[AI-Chat-Stream] 🧠 Memory used: "${message}" → "${resolvedQuery}"`);
      message = resolvedQuery;
    }

    // Get conversation history for LLM context
    const conversationMemory = await getConversationMemory(sessionId);
    const conversationHistoryContext = formatConversationHistory(conversationMemory);

    // ============================================
    // BULK PICKS DETECTION: Politely decline tipster-style requests
    // "Which of these 25 matches should I bet on?" → Educational response
    // ============================================
    const bulkPicksDetection = detectBulkPicksRequest(message);
    if (bulkPicksDetection.isBulkPicks) {
      console.log(`[AI-Chat-Stream] 🚫 Bulk picks detected: ${bulkPicksDetection.reason} (${bulkPicksDetection.matchCount} matches)`);

      const encoder = new TextEncoder();
      const educationalResponse = generateBulkPicksResponse(bulkPicksDetection);

      const readable = new ReadableStream({
        start(controller) {
          // Send metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'metadata',
            citations: [],
            usedRealTimeSearch: false,
            brainMode: 'educational',
            followUps: [
              'Analyze Newcastle vs Man City',
              'How does edge detection work?',
              'What makes a good value bet?',
            ],
          })}\n\n`));

          // Stream the educational response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'content',
            content: educationalResponse,
          })}\n\n`));

          // Send done
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // ============================================
    // EXPLAIN_UI: Instant FAQ responses (no API calls needed)
    // "What does edge mean?" → Static educational response
    // ============================================
    const faqResponse = getExplainUIResponse(message);
    if (faqResponse) {
      console.log(`[AI-Chat-Stream] 📚 FAQ response for: "${message.slice(0, 50)}..."`);

      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        start(controller) {
          // Send metadata
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'metadata',
            citations: [],
            usedRealTimeSearch: false,
            brainMode: 'educational',
            followUps: [
              'How do you calculate probabilities?',
              'What is value in betting?',
              'Analyze a match for me',
            ],
          })}\n\n`));

          // Stream the FAQ response
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'content',
            content: faqResponse,
          })}\n\n`));

          // Send done
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // ============================================
    // CONVERSATION MEMORY: Resolve pronouns/references from history
    // "his stats" → "LeBron James stats" (if we talked about LeBron earlier)
    // "nba" (after clarification) → resolved teams + sport
    // ============================================
    let clarificationContext: ConversationResolution | null = null;
    if (history.length > 0) {
      clarificationContext = resolveConversationReferences(message, history);
      if (clarificationContext.resolvedMessage !== message) {
        console.log(`[AI-Chat-Stream] Resolved references: "${message}" → "${clarificationContext.resolvedMessage}"`);
        if (clarificationContext.wasClarificationResponse) {
          console.log(`[AI-Chat-Stream] ✅ Clarification resolved! Teams: ${clarificationContext.resolvedTeams?.home} vs ${clarificationContext.resolvedTeams?.away}, Sport: ${clarificationContext.resolvedSport}`);
        }
        message = clarificationContext.resolvedMessage;
      }
    }

    // ==========================================
    // TIER-BASED RATE LIMITING (with 3s timeout on auth/rate check)
    // ==========================================
    const session = await withTimeout(getServerSession(authOptions), 3000, 'Auth session');
    const userId = session?.user?.id;
    const userPlan = session?.user?.plan || null;
    const identifier = userId || getClientIp(request);

    const rateLimit = await withTimeout(
      checkChatRateLimit(identifier, userPlan),
      3000,
      'Rate limit check'
    ) || { success: true, tier: 'FREE', remaining: 10, reset: Date.now() + 86400000 };

    if (!rateLimit.success) {
      const limits = CHAT_RATE_LIMITS[rateLimit.tier as keyof typeof CHAT_RATE_LIMITS];
      const retryAfter = Math.ceil((rateLimit.reset - Date.now()) / 1000);

      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: `You've reached your daily limit of ${limits.requests} messages. ${!userPlan || userPlan === 'FREE'
          ? 'Upgrade to Pro for 50/day or Premium for unlimited.'
          : userPlan === 'PRO'
            ? 'Upgrade to Premium for unlimited messages.'
            : ''
          }`,
        remaining: 0,
        limit: limits.requests,
        retryAfter,
        tier: rateLimit.tier,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limits.requests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.reset),
        }
      });
    }

    // ==========================================
    // FETCH USER'S FAVORITE TEAMS FOR CONTEXT (with 3s timeout)
    // ==========================================
    let favoriteTeamsContext = '';
    let favoriteTeamsList: string[] = [];
    if (userId) {
      try {
        const favorites = await withTimeout(
          prisma.favoriteTeam.findMany({
            where: { userId },
            select: { teamName: true, sport: true, league: true },
            take: 5,
          }),
          3000,
          'Favorite teams lookup'
        );

        if (favorites && favorites.length > 0) {
          favoriteTeamsList = favorites.map(f => f.teamName);
          const teamsList = favorites.map(f =>
            `${f.teamName} (${f.sport}${f.league ? `, ${f.league}` : ''})`
          ).join(', ');
          favoriteTeamsContext = `USER'S FAVORITE TEAMS: ${teamsList}. 
PROACTIVE BEHAVIOR: If the user asks a general question (like "what's happening today" or "any good matches"), 
proactively mention any matches or news about their favorite teams FIRST before other content.
If their favorite team has a match today/tonight, lead with that information.`;
        }
      } catch (err) {
        console.log('[AI-Chat-Stream] Could not fetch favorites:', err);
      }
    }

    // ==========================================
    // FETCH USER LEARNING CONTEXT (cross-session memory)
    // ==========================================
    let userLearningContext = '';
    let learningSessionId: string | null = null;
    if (userId) {
      try {
        // Get or create a persistent chat session for this user
        learningSessionId = await withTimeout(
          getOrCreateSession(userId),
          2000,
          'Learning session'
        );

        // Build user context from past interactions
        const userContext = await withTimeout(
          getUserTopicsForPrompt(userId),
          2000,
          'User learning context'
        );

        if (userContext) {
          userLearningContext = userContext;
          console.log('[AI-Chat-Stream] User learning context loaded');
        }
      } catch (err) {
        console.log('[AI-Chat-Stream] Could not fetch learning context:', err);
      }
    }

    // ============================================
    // STEP 0: SMART QUERY UNDERSTANDING
    // Use LLM-backed classification for better intent detection
    // ============================================
    const requestStartTime = Date.now(); // Track latency for learning

    // A/B Test: Query Classification Strategy
    const abTestId = 'query-classification-2026-01';
    const abCookieName = getTestCookieName(abTestId);
    const abCookieValue = request.cookies.get(abCookieName)?.value;
    const abVariant = getVariantFromCookies(abTestId, abCookieValue) as Variant;
    console.log(`[AI-Chat-Stream] A/B Test ${abTestId}: Variant ${abVariant}`);

    let queryUnderstanding: QueryUnderstanding | null = null;
    try {
      // Timeout query intelligence to prevent slow LLM classification from hanging
      queryUnderstanding = await withTimeout(
        understandQuery(message, abVariant, conversationHistoryContext),
        8000,
        'Query Intelligence'
      );

      if (queryUnderstanding) {
        console.log(`[AI-Chat-Stream] Query Intelligence: intent=${queryUnderstanding.intent} (${(queryUnderstanding.intentConfidence * 100).toFixed(0)}%), entities=${queryUnderstanding.entities.map(e => e.name).join(', ')}, sport=${queryUnderstanding.sport || 'unknown'}`);

        if (queryUnderstanding.isAmbiguous) {
          console.log(`[AI-Chat-Stream] ⚠️ Ambiguous query detected. Alternatives: ${queryUnderstanding.alternativeIntents?.join(', ')}`);
        }
      } else {
        console.log('[AI-Chat-Stream] ⚠️ Query Intelligence timed out, proceeding with defaults');
      }

      // HANDLE CLARIFICATION NEEDED (e.g., "Dallas vs Chicago" - which sport?)
      if (queryUnderstanding?.needsClarification && queryUnderstanding.clarifyingQuestion) {
        console.log(`[AI-Chat-Stream] 🤔 Needs clarification - returning question to user`);

        return new Response(
          new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();

              // Send the clarifying question as the response
              const clarificationResponse = queryUnderstanding!.clarifyingQuestion!;

              // Stream the response character by character for nice UX
              for (const char of clarificationResponse) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: char })}\n\n`));
              }

              // Send done signal
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              controller.close();
            },
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          }
        );
      }

      // HANDLE OFF_TOPIC QUERIES - Politely decline non-sports questions
      if (queryUnderstanding?.intent === 'OFF_TOPIC') {
        console.log(`[AI-Chat-Stream] 🚫 OFF_TOPIC query detected: "${message.slice(0, 50)}..."`);

        const offTopicResponse = "I'm SportBot - sports is my specialty! 🏀⚽🏈\n\nI can help you with:\n• Match predictions and analysis\n• Player stats and form\n• Team standings and schedules\n• Injury news and transfers\n• Betting analysis and value picks\n\nWhat sports question can I answer for you?";

        return new Response(
          new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder();

              // Stream the response
              for (const char of offTopicResponse) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: char })}\n\n`));
              }

              // Send done signal
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              controller.close();
            },
          }),
          {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          }
        );
      }
    } catch (err) {
      console.error('[AI-Chat-Stream] Query intelligence failed, using fallback:', err);
    }

    // Check cache first (only for queries without conversation history)
    const queryHash = hashChatQuery(message);
    const cacheKey = CACHE_KEYS.chat(queryHash);
    // Use smart classification if available, fallback to legacy
    const queryCategory = queryUnderstanding ? mapIntentToCategory(queryUnderstanding.intent) : detectQueryCategory(message);
    const detectedSport = queryUnderstanding?.sport || detectSport(message);

    // Skip cache for player stats queries to ensure verified stats are used
    // This covers NBA, NFL, NHL, and Soccer player stats
    const statsKeywords = /\b(average|averaging|ppg|rpg|apg|points|rebounds|assists|stats|statistics|goals|assists|touchdowns|yards|passing|rushing|receiving|saves|shutouts)\b/i;
    const playerKeywords = /\b(player|embiid|jokic|lebron|curry|durant|wembanyama|tatum|doncic|giannis|morant|mahomes|allen|burrow|jackson|henry|mccaffrey|hill|jefferson|chase|kelce|mcdavid|crosby|matthews|draisaitl|ovechkin|haaland|salah|mbappe|bellingham|kane|ronaldo|messi)\b/i;
    const isPlayerStatsQuery = statsKeywords.test(message) && playerKeywords.test(message);

    // Also skip cache for time-sensitive queries (live scores, today's games, etc.)
    const isTimeSensitive = shouldSkipCache(message);

    if (history.length === 0 && !isPlayerStatsQuery && !isTimeSensitive) {
      const cached = await withTimeout(cacheGet<CachedChatResponse>(cacheKey), 3000, 'Redis cache lookup');
      if (cached) {
        console.log(`[AI-Chat-Stream] Cache HIT for: "${message.slice(0, 50)}..."`);

        // Generate follow-up suggestions based on cached response
        const followUps = generateQuickFollowUps(message, queryCategory, detectedSport);

        // Return cached response as a streaming-like response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            // Send metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              citations: cached.citations,
              usedRealTimeSearch: cached.usedRealTimeSearch,
              brainMode: cached.brainMode,
              fromCache: true,
              followUps,
            })}\n\n`));

            // Send content all at once (cached)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: cached.response,
            })}\n\n`));

            // Send done
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }

      // Check database cache (longer-term storage) - with 5s timeout to prevent DB hangs
      const dbCached = await withTimeout(getCachedAnswer(message), 5000, 'DB cache lookup');
      if (dbCached) {
        console.log(`[AI-Chat-Stream] DB Cache HIT for: "${message.slice(0, 50)}..."`);

        const followUps = generateQuickFollowUps(message, queryCategory, detectedSport);

        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              citations: dbCached.citations || [],
              usedRealTimeSearch: dbCached.usedRealTimeSearch,
              brainMode: dbCached.brainMode,
              fromCache: true,
              fromDbCache: true,
              followUps,
            })}\n\n`));

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: dbCached.answer,
            })}\n\n`));

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          },
        });

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // Step 0: Translate if needed (with 5s timeout - translation should be fast)
    const translation = await withTimeout(
      translateToEnglish(message),
      5000,
      'Translation'
    ) || { englishQuery: message, originalLanguage: 'en', needsTranslation: false };
    let searchMessage = translation.englishQuery;
    const originalLanguage = translation.originalLanguage;

    // Step 0.5: Expand short queries with player/team context
    // "LeBron stats" → "LeBron James Los Angeles Lakers NBA stats 2025-26 season"
    const { expandedQuery, playerContext } = expandQuery(searchMessage);
    if (expandedQuery !== searchMessage) {
      console.log(`[AI-Chat-Stream] Query expanded: "${searchMessage}" → "${expandedQuery}"`);
      searchMessage = expandedQuery;
    }

    let perplexityContext = '';
    let citations: string[] = [];

    // Smart data source selection based on query understanding
    // If we have verified data sources suggested, try those FIRST before Perplexity
    const shouldSkipPerplexity = queryUnderstanding &&
      queryUnderstanding.needsVerifiedStats &&
      !queryUnderstanding.needsRealTimeData;

    const shouldSearch = !shouldSkipPerplexity && needsSearch(searchMessage);

    console.log(`[AI-Chat-Stream] Data strategy: ${shouldSkipPerplexity ? 'VERIFIED-FIRST' : 'PERPLEXITY-FIRST'}, sources: ${queryUnderstanding?.suggestedDataSources?.join(', ') || 'auto'}`);

    // queryCategory already defined above for caching

    // Create streaming response early so we can send status updates
    const encoder = new TextEncoder();
    let fullResponse = '';
    let streamController: ReadableStreamDefaultController | null = null;

    // Helper to send status updates
    const sendStatus = (status: string) => {
      if (streamController) {
        streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status })}\n\n`));
      }
    };

    const readable = new ReadableStream({
      async start(controller) {
        streamController = controller;

        try {
          // =====================================================
          // ULTRA-FAST PATH: Check Prediction table IMMEDIATELY
          // This runs FIRST, before ANY slow operations
          // For pre-analyzed matches, returns instantly
          // =====================================================
          const matchQueryPattern = /(?:analyze|analyse|preview|predict|prediction)?\s*([a-zA-Z\s]+?)\s+(?:vs\.?|versus|against|@)\s+([a-zA-Z\s]+)/i;
          const quickMatch = searchMessage.match(matchQueryPattern);

          if (quickMatch) {
            const [, rawHome, rawAway] = quickMatch;
            const homeWord = rawHome.trim().split(/\s+/).pop() || '';
            const awayWord = rawAway.trim().split(/\s+/).pop() || '';

            if (homeWord.length > 2 && awayWord.length > 2) {
              console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST CHECK: ${homeWord} vs ${awayWord}`);

              try {
                // First try exact match
                let prediction = await prisma.prediction.findFirst({
                  where: {
                    OR: [
                      {
                        AND: [
                          { matchName: { contains: homeWord, mode: 'insensitive' } },
                          { matchName: { contains: awayWord, mode: 'insensitive' } },
                        ]
                      },
                      {
                        AND: [
                          { matchName: { contains: awayWord, mode: 'insensitive' } },
                          { matchName: { contains: homeWord, mode: 'insensitive' } },
                        ]
                      }
                    ],
                    kickoff: { gte: new Date(new Date().getTime() - 72 * 60 * 60 * 1000) }, // 72h lookback
                    NOT: [
                      { fullResponse: { equals: undefined } },
                      { matchName: { startsWith: 'Analyze', mode: 'insensitive' } }, // Exclude manually created records
                    ],
                  },
                  orderBy: { kickoff: 'asc' }, // Earliest match first (pre-analyzed before manual)
                });

                // FUZZY FALLBACK: If not found, try with first 4 chars of each team (handles typos)
                if (!prediction?.fullResponse && homeWord.length >= 4 && awayWord.length >= 4) {
                  const homePrefix = homeWord.substring(0, 4);
                  const awayPrefix = awayWord.substring(0, 4);
                  console.log(`[AI-Chat-Stream] ⚡ FUZZY FALLBACK: Trying ${homePrefix}... vs ${awayPrefix}...`);
                  
                  prediction = await prisma.prediction.findFirst({
                    where: {
                      OR: [
                        {
                          AND: [
                            { matchName: { contains: homePrefix, mode: 'insensitive' } },
                            { matchName: { contains: awayPrefix, mode: 'insensitive' } },
                          ]
                        },
                        {
                          AND: [
                            { matchName: { contains: awayPrefix, mode: 'insensitive' } },
                            { matchName: { contains: homePrefix, mode: 'insensitive' } },
                          ]
                        }
                      ],
                      kickoff: { gte: new Date(new Date().getTime() - 72 * 60 * 60 * 1000) },
                      NOT: [
                        { fullResponse: { equals: undefined } },
                        { matchName: { startsWith: 'Analyze', mode: 'insensitive' } },
                      ],
                    },
                    orderBy: { kickoff: 'asc' },
                  });
                  
                  if (prediction?.fullResponse) {
                    console.log(`[AI-Chat-Stream] ⚡ FUZZY MATCH FOUND: ${prediction.matchName}`);
                  }
                }

                if (prediction?.fullResponse) {
                  const fullData = prediction.fullResponse as any;
                  const kickoff = prediction.kickoff ? new Date(prediction.kickoff) : null;
                  const now = new Date();

                  // Past match handling
                  if (kickoff && kickoff < now) {
                    const hoursAgo = Math.floor((now.getTime() - kickoff.getTime()) / (1000 * 60 * 60));

                    // Only return instantly if we have the actual score
                    if (prediction.actualScore || prediction.actualResult) {
                      console.log(`[AI-Chat-Stream] ⚡ INSTANT: Past match ${prediction.matchName} (${hoursAgo}h ago) with score`);

                      let pastMessage = `⚠️ **This match has already been played!**\n\n`;
                      pastMessage += `**${prediction.matchName}** was played ${hoursAgo} hours ago.\n\n`;
                      if (prediction.actualScore) pastMessage += `**Final Score:** ${prediction.actualScore}\n\n`;
                      if (prediction.actualResult) pastMessage += `**Result:** ${prediction.actualResult}\n\n`;
                      if (prediction.outcome && prediction.prediction) {
                        const emoji = prediction.outcome === 'HIT' ? '✅' : prediction.outcome === 'MISS' ? '❌' : '⏳';
                        pastMessage += `**Our Prediction:** ${prediction.prediction} ${emoji}\n\n`;
                      }
                      pastMessage += `Would you like me to analyze an upcoming match instead?`;

                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: pastMessage })}\n\n`));
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                      controller.close();
                      return;
                    } else {
                      // Past match but no score - skip fast path, let Perplexity find the result
                      console.log(`[AI-Chat-Stream] Past match ${prediction.matchName} without score - falling back to search`);
                      // Continue to normal processing
                    }
                  }

                  // Future match - return structured data instantly WITH FULL ANALYSIS
                  console.log(`[AI-Chat-Stream] ⚡ INSTANT: Future match ${prediction.matchName} with FULL analysis data`);
                  const structuredData = {
                    matchInfo: {
                      id: prediction.matchName?.toLowerCase().replace(/\s+/g, '-') || '',
                      homeTeam: fullData.matchInfo?.homeTeam || rawHome.trim(),
                      awayTeam: fullData.matchInfo?.awayTeam || rawAway.trim(),
                      league: fullData.matchInfo?.league || '',
                      sport: fullData.matchInfo?.sport || 'unknown',
                      kickoff: kickoff?.toISOString() || '',
                    },
                    story: fullData.story || { favored: 'home', confidence: 'moderate' },
                    universalSignals: fullData.universalSignals,
                    expectedScores: fullData.expectedScores,
                    matchUrl: `/match/${rawHome.trim().toLowerCase().replace(/\s+/g, '-')}-vs-${rawAway.trim().toLowerCase().replace(/\s+/g, '-')}`,
                    // FULL ANALYSIS DATA - the good stuff!
                    probabilities: fullData.probabilities,
                    oddsComparison: fullData.oddsComparison,
                    briefing: fullData.briefing,
                    momentumAndForm: fullData.momentumAndForm,
                    injuryContext: fullData.injuryContext,
                    riskAnalysis: fullData.riskAnalysis,
                    tacticalAnalysis: fullData.tacticalAnalysis,
                    preMatchInsights: fullData.preMatchInsights,
                    upsetPotential: fullData.upsetPotential,
                  };

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'match-analysis', data: structuredData })}\n\n`));
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                  controller.close();
                  return;
                } else {
                  // No pre-analyzed match found - FALL THROUGH to do fresh analysis
                  // Don't return static message - let the normal processing path handle it
                  console.log(`[AI-Chat-Stream] ⚡ No pre-analyzed match found for "${homeWord} vs ${awayWord}" - falling through to FRESH ANALYSIS`);
                  // Continue to normal processing below
                }
              } catch (fastPathErr) {
                console.log(`[AI-Chat-Stream] Fast path DB error, continuing:`, fastPathErr);
              }
            }
          }
          // =====================================================
          // END ULTRA-FAST PATH - Continue with normal processing
          // =====================================================

          // ============================================
          // SMART DATA FETCHING: Verified sources FIRST, Perplexity as fallback
          // ============================================

          // Step 1: Perplexity search if needed (skipped if verified data expected)
          if (shouldSearch) {
            const perplexity = getPerplexityClient();

            if (perplexity.isConfigured()) {
              // Send category-specific status message
              const statusMessages: Record<string, string> = {
                'STATS': '🔍 Searching 2025-26 season statistics...',
                'PLAYER_PROP': '📊 Fetching current player averages...',
                'STANDINGS': '📋 Loading latest standings...',
                'RESULT': '🏆 Checking recent results...',
                'INJURY': '🏥 Checking injury reports...',
                'TRANSFER': '📰 Searching transfer news...',
                'FIXTURE': '📅 Looking up fixtures...',
                'ROSTER': '👥 Loading current roster...',
                'PLAYER': '🔎 Searching player info...',
                'BETTING_ADVICE': '📈 Gathering performance data...',
              };
              const statusMsg = statusMessages[queryCategory] || 'Searching real-time data...';
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: statusMsg })} \n\n`));
              console.log('[AI-Chat-Stream] Fetching real-time context...');

              // Detect query types that need different recency windows
              const isLastGameQuery = /last (game|match|night)|yesterday|most recent|tonight|scored last|played last/i.test(searchMessage);
              const isInjuryQuery = /injur|injured|injury|is .+ (out|hurt|playing|available)|status|health/i.test(searchMessage);
              const isBreakingNewsQuery = /breaking|latest|recent|any\s*news|what('s| is)\s*(happening|new|going on)/i.test(searchMessage);

              // Add current date to search for recency context
              const today = new Date();
              const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

              // For injury queries, ask for CURRENT STATUS (not just news)
              // This helps find ongoing injuries that aren't in recent news
              let enhancedSearch = searchMessage;
              if (isBreakingNewsQuery) {
                // "Breaking news" = ALL sports news: injuries, transfers, trades, suspensions, etc.
                enhancedSearch = `Today's top sports news ${dateStr}: major transfers, injuries, trades, suspensions, and breaking stories in NBA, NFL, soccer, NHL. What are the biggest sports stories right now?`;
              } else if (isLastGameQuery) {
                enhancedSearch = `${searchMessage} (as of ${dateStr}, get the most recent game data only)`;
              } else if (isInjuryQuery) {
                // Extract player name from AI-extracted entities first (more reliable)
                // Fallback to regex for cases where AI didn't run
                let playerName = '';

                // Use AI-extracted entities if available
                const playerEntity = queryUnderstanding?.entities?.find(
                  e => e.type === 'PLAYER' || e.type === 'UNKNOWN'
                );
                if (playerEntity) {
                  playerName = playerEntity.name;
                  console.log(`[AI-Chat-Stream] Using AI-extracted player: "${playerName}"`);
                } else {
                  // Fallback: Extract from message (case-insensitive)
                  const playerMatch = searchMessage.match(/(?:is\s+)?([a-z]+(?:\s+[a-z]+)?)\s+(?:still\s+)?(?:injured|hurt|out|playing)/i);
                  playerName = playerMatch ? playerMatch[1] : '';
                  if (playerName) {
                    console.log(`[AI-Chat-Stream] Using regex-extracted player: "${playerName}"`);
                  }
                }

                enhancedSearch = `${playerName || searchMessage} current injury status ${dateStr} - is player injured, out, or available to play? Check official injury reports and team news.`;
              }

              // Determine recency filter:
              // - Breaking news: 'day' (most recent)
              // - Last game queries: 'day' (very recent)
              // - Injury queries: 'month' (injuries can last weeks without new articles)
              // - Default: 'week'
              const recencyFilter = isBreakingNewsQuery || isLastGameQuery ? 'day' : isInjuryQuery ? 'month' : 'week';

              // Use timeout to prevent hanging (15 second limit for Perplexity)
              const searchResult = await withTimeout(
                perplexity.search(enhancedSearch, {
                  recency: recencyFilter,
                  model: 'sonar-pro',
                  maxTokens: 1000,
                }),
                15000,
                'Perplexity search'
              );

              if (searchResult?.success && searchResult.content) {
                perplexityContext = searchResult.content;
                citations = searchResult.citations || [];
                // Send found status for stats queries
                if (queryCategory === 'STATS') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '✅ Found current stats, analyzing...' })}\n\n`));
                }
                if (queryCategory === 'INJURY') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '✅ Found injury info, analyzing...' })}\n\n`));
                }
              } else {
                // Search returned nothing - log it and signal to AI to be cautious
                console.log('[AI-Chat-Stream] ⚠️ Perplexity search returned no data for:', searchMessage.slice(0, 50));
                // DO NOT set perplexityContext to a warning - keep it empty so data confidence knows we have no real data
                // The warning will be in the system prompt instead
                perplexityContext = ''; // Keep empty!

                // Set a flag for the system prompt
                if (queryCategory === 'INJURY') {
                  // Will be handled in system prompt via dataConfidence
                  console.log('[AI-Chat-Stream] ⚠️ No injury data found - will warn in response');
                } else if (queryCategory === 'STATS') {
                  console.log('[AI-Chat-Stream] ⚠️ No stats data found - will warn in response');
                }
              }
            }
          }

          // Step 1.4: Fetch our past predictions if user asks about them (with 10s timeout)
          let ourPredictionContext = '';
          if (queryCategory === 'OUR_PREDICTION') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📊 Looking up our prediction...' })}\n\n`));
            const predictionResult = await withTimeout(
              fetchOurPrediction(searchMessage),
              10000,
              'Our prediction lookup'
            );
            if (predictionResult) {
              ourPredictionContext = predictionResult;
              console.log('[AI-Chat-Stream] Found our past prediction');
            }
          }

          // Step 1.5: DataLayer stats if needed (form, H2H, season stats)
          // USE QUERY INTELLIGENCE FLAGS - not pattern matching
          let dataLayerContext = '';
          const needsOurStats = queryUnderstanding?.needsVerifiedStats ||
            ['PLAYER_STATS', 'TEAM_STATS', 'FORM_CHECK', 'HEAD_TO_HEAD'].includes(queryUnderstanding?.intent || '');

          if (needsOurStats) {
            const teams = extractTeamNames(searchMessage);
            if (teams.homeTeam) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'Fetching team stats...' })}\n\n`));
              console.log('[AI-Chat-Stream] Fetching DataLayer stats for:', teams);
              // Timeout DataLayer fetch to prevent hanging (10 second limit)
              const dataLayerResult = await withTimeout(
                fetchDataLayerContext(teams, detectedSport),
                10000,
                'DataLayer stats'
              );
              dataLayerContext = dataLayerResult || '';
              if (dataLayerContext) {
                console.log('[AI-Chat-Stream] DataLayer context added');
              }
            }
          }

          // Step 1.6: Verified Player Stats for ALL SPORTS (bypasses Perplexity for accurate stats)
          let verifiedPlayerStatsContext = '';
          const isPlayerStatsIntent = queryUnderstanding?.intent === 'PLAYER_STATS';
          const isAnyStatsQuery = isPlayerStatsIntent || isStatsQuery(searchMessage) || isNFLStatsQuery(searchMessage) || isNHLStatsQuery(searchMessage) || isSoccerStatsQuery(searchMessage) || isEuroleagueStatsQuery(searchMessage);

          if (isAnyStatsQuery) {
            console.log('[AI-Chat-Stream] Stats query detected, determining sport...');
            console.log(`[AI-Chat-Stream] API_FOOTBALL_KEY configured: ${!!process.env.API_FOOTBALL_KEY}`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🔍 Fetching verified player stats...' })}\n\n`));

            // Try each sport in order of likelihood based on query
            // DISABLED: Euroleague stats - API data unreliable for team assignments
            // TODO: Re-enable when we have reliable Euroleague data source
            if (isEuroleagueStatsQuery(searchMessage)) {
              // Euroleague stats DISABLED - unreliable team/player data
              console.log('[AI-Chat-Stream] ⚠️ Euroleague stats disabled - data quality issues');
              // Let Perplexity handle Euroleague queries instead
            } else if (isStatsQuery(searchMessage)) {
              // NBA stats (with 10s timeout)
              const verifiedStatsResult = await withTimeout(
                getVerifiedPlayerStats(searchMessage),
                10000,
                'NBA stats'
              );
              if (verifiedStatsResult?.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ NBA stats: ${stats.playerFullName} - ${stats.stats.pointsPerGame} PPG`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found NBA stats for ${stats.playerFullName}` })}\n\n`));
              }
            } else if (isNFLStatsQuery(searchMessage)) {
              // NFL stats (with 10s timeout)
              const verifiedStatsResult = await withTimeout(
                getVerifiedNFLPlayerStats(searchMessage),
                10000,
                'NFL stats'
              );
              if (verifiedStatsResult?.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedNFLPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ NFL stats: ${stats.playerFullName}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found NFL stats for ${stats.playerFullName}` })}\n\n`));
              }
            } else if (isNHLStatsQuery(searchMessage)) {
              // NHL stats (with 10s timeout)
              const verifiedStatsResult = await withTimeout(
                getVerifiedNHLPlayerStats(searchMessage),
                10000,
                'NHL stats'
              );
              if (verifiedStatsResult?.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedNHLPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ NHL stats: ${stats.playerFullName}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found NHL stats for ${stats.playerFullName}` })}\n\n`));
              }
            } else if (isSoccerStatsQuery(searchMessage)) {
              // Soccer stats (with 10s timeout)
              const verifiedStatsResult = await withTimeout(
                getVerifiedSoccerPlayerStats(searchMessage),
                10000,
                'Soccer stats'
              );
              if (verifiedStatsResult?.success && verifiedStatsResult.data) {
                const stats = verifiedStatsResult.data;
                verifiedPlayerStatsContext = formatVerifiedSoccerPlayerStats(stats);
                console.log(`[AI-Chat-Stream] ✅ Soccer stats: ${stats.playerFullName} - ${stats.stats.goals}G ${stats.stats.assists}A`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found soccer stats for ${stats.playerFullName}` })}\n\n`));
              }
            }

            // If we got verified stats, override Perplexity context to prevent wrong data
            if (verifiedPlayerStatsContext) {
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get verified player stats, falling back to Perplexity');
            }
          }

          // Step 1.7: Verified Standings for standings queries (bypasses Perplexity for accurate data)
          let verifiedStandingsContext = '';
          if (isStandingsQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Standings query detected, fetching from API...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📊 Fetching verified standings...' })}\n\n`));

            const standingsResult = await withTimeout(
              fetchStandingsContext(searchMessage),
              10000,
              'Standings'
            );
            if (standingsResult) {
              verifiedStandingsContext = standingsResult.context;
              console.log(`[AI-Chat-Stream] ✅ Got ${standingsResult.leagueName} standings`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Loaded ${standingsResult.leagueName} standings` })}\n\n`));

              // Override Perplexity context to prevent outdated data
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get verified standings, falling back to Perplexity');
            }
          }

          // Step 1.8: Verified Team Match Statistics (shots, corners per game analysis)
          let verifiedTeamMatchStatsContext = '';
          if (isTeamMatchStatsQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Team match stats query detected...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📊 Analyzing match statistics...' })}\n\n`));

            // Wrap both calls with timeout
            const matchStatsResult = await withTimeout(
              getVerifiedTeamMatchStats(searchMessage),
              10000,
              'Team match stats'
            );
            if (matchStatsResult?.success && matchStatsResult.data) {
              // Also get opponent analysis for comparison queries
              const opponentAnalysis = await withTimeout(
                getOpponentAnalysis(searchMessage),
                5000,
                'Opponent analysis'
              );
              verifiedTeamMatchStatsContext = formatTeamMatchStatsContext(matchStatsResult, opponentAnalysis || undefined);

              console.log(`[AI-Chat-Stream] ✅ Got ${matchStatsResult.data.fixtures.length} matches for ${matchStatsResult.data.team.name}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Analyzed ${matchStatsResult.data.fixtures.length} matches` })}\n\n`));

              // Override Perplexity context to use verified data
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get team match stats:', matchStatsResult?.error || 'timeout');
            }
          }

          // Step 1.9: Verified League Leaders (top scorers/assists) - SOCCER ONLY
          // For NBA/NFL/NHL, skip this and let Perplexity handle it
          let verifiedLeagueLeadersContext = '';
          const isSoccerSport = !detectedSport || detectedSport === 'soccer' || detectedSport === 'football';
          const isNonSoccerSport = /\b(nba|nfl|nhl|mlb|basketball|hockey|baseball|american football)\b/i.test(searchMessage);

          // Only try soccer league leaders API for soccer queries
          const isTopScorersIntent = isSoccerSport && !isNonSoccerSport && (
            (queryUnderstanding?.intent === 'PLAYER_STATS' &&
              /\b(top|leading|best|most)\b.*\b(scor|goal)/i.test(searchMessage)) ||
            isTopScorersQuery(searchMessage)
          );

          const isTopAssistsIntent = isSoccerSport && !isNonSoccerSport && (
            (queryUnderstanding?.intent === 'PLAYER_STATS' &&
              /\b(top|leading|best|most)\b.*\b(assist)/i.test(searchMessage)) ||
            isTopAssistsQuery(searchMessage)
          );

          if (isTopScorersIntent) {
            console.log('[AI-Chat-Stream] Soccer top scorers query detected...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🏆 Fetching top scorers...' })}\n\n`));

            const leadersResult = await withTimeout(
              getVerifiedTopScorers(searchMessage),
              10000,
              'Top scorers'
            );
            if (leadersResult?.success && leadersResult.data) {
              verifiedLeagueLeadersContext = formatLeagueLeadersContext(leadersResult);
              console.log(`[AI-Chat-Stream] ✅ Got top ${leadersResult.data.players.length} scorers for ${leadersResult.data.league.name}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found ${leadersResult.data.players.length} top scorers` })}\n\n`));
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get top scorers:', leadersResult?.error || 'timeout');
            }
          } else if (isTopAssistsIntent) {
            console.log('[AI-Chat-Stream] Top assists query detected (via QI or regex)...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🏆 Fetching top assists...' })}\n\n`));

            const leadersResult = await withTimeout(
              getVerifiedTopAssists(searchMessage),
              10000,
              'Top assists'
            );
            if (leadersResult?.success && leadersResult.data) {
              verifiedLeagueLeadersContext = formatLeagueLeadersContext(leadersResult);
              console.log(`[AI-Chat-Stream] ✅ Got top ${leadersResult.data.players.length} assists for ${leadersResult.data.league.name}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found ${leadersResult.data.players.length} top assists` })}\n\n`));
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get top assists:', leadersResult?.error || 'timeout');
            }
          }

          // Step 1.10: Verified Lineups
          let verifiedLineupContext = '';
          if (isLineupQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Lineup query detected...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '📋 Fetching team lineups...' })}\n\n`));

            const lineupResult = await withTimeout(
              getVerifiedLineup(searchMessage),
              10000,
              'Lineups'
            );
            if (lineupResult?.success && lineupResult.data) {
              verifiedLineupContext = formatLineupContext(lineupResult);
              console.log(`[AI-Chat-Stream] ✅ Got lineups for ${lineupResult.data.home.team.name} vs ${lineupResult.data.away.team.name}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Lineups found` })}\n\n`));
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get lineups:', lineupResult?.error || 'timeout');
            }
          }

          // Step 1.11: Verified Coach Info
          let verifiedCoachContext = '';
          if (isCoachQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Coach query detected...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '👔 Fetching coach info...' })}\n\n`));

            const coachResult = await withTimeout(
              getVerifiedCoach(searchMessage),
              10000,
              'Coach info'
            );
            if (coachResult?.success && coachResult.data) {
              verifiedCoachContext = formatCoachContext(coachResult);
              console.log(`[AI-Chat-Stream] ✅ Got coach info: ${coachResult.data.name}`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found: ${coachResult.data.name}` })}\n\n`));
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get coach info:', coachResult?.error || 'timeout');
            }
          }

          // Step 1.12: Verified Match Events (goals, cards)
          let verifiedMatchEventsContext = '';
          if (isMatchEventsQuery(searchMessage)) {
            console.log('[AI-Chat-Stream] Match events query detected...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '⚽ Fetching match events...' })}\n\n`));

            const eventsResult = await withTimeout(
              getVerifiedMatchEvents(searchMessage),
              10000,
              'Match events'
            );
            if (eventsResult?.success && eventsResult.data) {
              verifiedMatchEventsContext = formatMatchEventsContext(eventsResult);
              const goalCount = eventsResult.data.events.filter(e => e.type === 'Goal').length;
              console.log(`[AI-Chat-Stream] ✅ Got ${goalCount} goals for match`);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ Found ${goalCount} goals` })}\n\n`));
              perplexityContext = '';
              citations = [];
            } else {
              console.log('[AI-Chat-Stream] ⚠️ Could not get match events:', eventsResult?.error || 'timeout');
            }
          }

          // Step 1.13: Our Match Prediction (for upcoming games within 48h)
          // SIMPLIFIED: Only trigger for MATCH_PREDICTION or OUR_ANALYSIS intent
          // Trust Query Intelligence - don't duplicate pattern matching here
          let verifiedMatchPredictionContext = '';

          // EARLY PAST GAME CHECK: Before any prediction logic, check if user is asking about a past match
          // This catches cases like "denver nuggets nba" where the game was yesterday
          // IMPORTANT: Include BOTH team nicknames AND city names to catch all variations
          const hasTeamMentions = /\b(nuggets|pelicans|lakers|celtics|warriors|bulls|heat|nets|knicks|bucks|suns|mavericks|mavs|clippers|rockets|spurs|thunder|grizzlies|kings|jazz|blazers|timberwolves|wolves|hornets|hawks|magic|pistons|pacers|wizards|cavaliers|cavs|raptors|sixers|76ers|chiefs|eagles|bills|49ers|cowboys|ravens|lions|dolphins|bengals|chargers|broncos|jets|patriots|giants|raiders|saints|packers|steelers|seahawks|commanders|falcons|buccaneers|cardinals|rams|bears|vikings|browns|texans|colts|jaguars|titans|panthers|maple leafs|canadiens|bruins|rangers|penguins|blackhawks|red wings|flyers|avalanche|lightning|kraken|oilers|flames|canucks|predators|hurricanes|wild|knights|los angeles|boston|golden state|miami|milwaukee|brooklyn|new york|phoenix|denver|dallas|memphis|minnesota|cleveland|chicago|atlanta|toronto|indiana|orlando|charlotte|washington|detroit|oklahoma city|portland|utah|sacramento|san antonio|new orleans|houston|kansas city|philadelphia|buffalo|baltimore|cincinnati|san francisco|seattle|green bay|pittsburgh|las vegas|tennessee|jacksonville|indianapolis|tampa bay|carolina|arizona|montreal|edmonton|calgary|vancouver|winnipeg|ottawa|florida|colorado|vegas|st louis|nashville|new jersey)\b/i.test(searchMessage);

          if (hasTeamMentions && !verifiedMatchPredictionContext) {
            const pastMatch = await withTimeout(
              checkIfMatchIsInPast(searchMessage),
              5000,
              'Early past match check'
            );

            if (pastMatch?.isPast) {
              console.log(`[AI-Chat-Stream] ⚠️ EARLY CHECK: Match already played ${pastMatch.hoursAgo}h ago: ${pastMatch.matchName}`);

              let pastGameMessage = `⚠️ **This match has already been played!**\n\n`;
              pastGameMessage += `**${pastMatch.matchName}** was played ${pastMatch.hoursAgo} hours ago.\n\n`;

              if (pastMatch.actualResult) {
                pastGameMessage += `**Final Result:** ${pastMatch.actualResult}\n\n`;
              }

              if (pastMatch.outcome && pastMatch.prediction) {
                const outcomeEmoji = pastMatch.outcome === 'HIT' ? '✅' : pastMatch.outcome === 'MISS' ? '❌' : '⏳';
                pastGameMessage += `**Our Prediction:** ${pastMatch.prediction} ${outcomeEmoji}\n\n`;
              }

              pastGameMessage += `Would you like me to analyze an **upcoming** match instead?`;

              verifiedMatchPredictionContext = pastGameMessage;
              // Don't use Perplexity - we have our answer
              perplexityContext = '';
              citations = [];
            }
          }

          // FAST PATH: If this is a resolved clarification response, skip query intelligence and call analyze directly
          const hasClarificationTeams = clarificationContext?.wasClarificationResponse &&
            clarificationContext?.resolvedTeams?.home &&
            clarificationContext?.resolvedTeams?.away;

          if (hasClarificationTeams) {
            console.log(`[AI-Chat-Stream] 🚀 FAST PATH: Clarification resolved to ${clarificationContext!.resolvedTeams!.home} vs ${clarificationContext!.resolvedTeams!.away}`);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🎯 Generating match analysis...' })}\n\n`));

            const homeTeam = clarificationContext!.resolvedTeams!.home;
            const awayTeam = clarificationContext!.resolvedTeams!.away;
            const sport = clarificationContext!.resolvedSport || 'basketball_nba';

            try {
              // Call the analyze API directly
              const protocol = request.headers.get('x-forwarded-proto') || 'https';
              const host = request.headers.get('host') || 'www.sportbotai.com';
              const baseUrl = `${protocol}://${host}`;
              const cookies = request.headers.get('cookie') || '';

              const analyzeRequest = {
                matchData: {
                  sport: sport,
                  league: 'Auto-detected',
                  homeTeam: homeTeam,
                  awayTeam: awayTeam,
                  matchDate: new Date().toISOString(),
                  sourceType: 'chat-clarification',
                  odds: {
                    home: 2.0,
                    draw: sport.includes('soccer') ? 3.5 : null,
                    away: 2.0,
                  },
                },
              };

              console.log(`[AI-Chat-Stream] Calling analyze API for clarified query: ${homeTeam} vs ${awayTeam} (${sport})`);

              const analyzeResponse = await withTimeout(
                fetch(`${baseUrl}/api/analyze`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies,
                  },
                  body: JSON.stringify(analyzeRequest),
                }),
                30000,
                'Analyze API (clarified)'
              );

              if (analyzeResponse?.ok) {
                const analysisData = await analyzeResponse.json();

                if (analysisData.success) {
                  // Format the analysis for chat using our proper formatter
                  verifiedMatchPredictionContext = formatLiveAnalysisForChat(analysisData, homeTeam, awayTeam);
                  console.log(`[AI-Chat-Stream] ✅ Clarification analysis complete for ${homeTeam} vs ${awayTeam}`);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '✅ Analysis ready!' })}\n\n`));
                  // Use our data, not Perplexity
                  perplexityContext = '';
                  citations = [];
                } else {
                  console.log(`[AI-Chat-Stream] ⚠️ Analyze API returned success=false:`, analysisData.error);
                }
              } else if (analyzeResponse) {
                console.log(`[AI-Chat-Stream] ⚠️ Analyze API failed: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
                const errorBody = await analyzeResponse.text();
                console.log(`[AI-Chat-Stream] Error body: ${errorBody.substring(0, 200)}`);
              } else {
                console.log(`[AI-Chat-Stream] ⚠️ Analyze API timed out`);
              }
            } catch (analyzeError) {
              console.error('[AI-Chat-Stream] Clarification analyze error:', analyzeError);
            }
          }

          // NORMAL PATH: Use query intelligence for prediction intent
          let isPredictionIntent = queryUnderstanding?.intent === 'MATCH_PREDICTION' ||
            queryUnderstanding?.intent === 'OUR_ANALYSIS' ||
            queryUnderstanding?.intent === 'BETTING_ANALYSIS';

          // FALLBACK: If Query Intelligence failed/timed out OR returned wrong intent,
          // use regex patterns to detect match queries
          if (!isPredictionIntent) {
            const matchPredictionPatterns = [
              /\b(?:analyze|analyse|preview|breakdown|prediction|predict)\b/i,
              /\b(?:vs\.?|versus|against)\b/i,  // Note: removed @ to avoid false positives
              /\bwho\s+(?:will|would|gonna|is going to)\s+win\b/i,
            ];
            const hasMatchPattern = matchPredictionPatterns.some(p => p.test(searchMessage));
            if (hasMatchPattern) {
              console.log(`[AI-Chat-Stream] ⚡ Fallback: Detected match prediction pattern via regex (QI intent was: ${queryUnderstanding?.intent || 'null'})`);
              isPredictionIntent = true;
            }
          }

          // ULTIMATE FALLBACK for short match queries like "Celta Osasuna" (no vs required)
          if (!isPredictionIntent) {
            const msgLower = searchMessage.toLowerCase().trim();
            const words = msgLower.split(/\s+/);
            
            // Only try if 2-5 words and no question words
            if (words.length >= 2 && words.length <= 5 && !/\b(who|what|when|where|why|how|will|can|should|is|are)\b/i.test(msgLower)) {
              const footballTeamPatterns = [
                // La Liga
                /\b(real madrid|barcelona|barca|atletico|atletico madrid|sevilla|villarreal|real sociedad|sociedad|real betis|betis|athletic bilbao|athletic|celta|celta vigo|osasuna|getafe|rayo vallecano|rayo|mallorca|alaves|las palmas|leganes|valladolid|espanyol|girona|valencia)\b/gi,
                // Premier League
                /\b(arsenal|chelsea|liverpool|man united|manchester united|man city|manchester city|tottenham|spurs|newcastle|west ham|aston villa|brighton|crystal palace|fulham|brentford|everton|wolves|wolverhampton|bournemouth|nottingham forest|forest|burnley|sheffield|luton|ipswich|leicester|leeds|sunderland)\b/gi,
                // Serie A
                /\b(roma|as roma|lazio|napoli|juventus|juve|inter|ac milan|milan|atalanta|fiorentina|torino|bologna|sassuolo|udinese|cagliari|verona|monza|empoli|lecce|genoa|parma|como|venezia)\b/gi,
                // Bundesliga
                /\b(bayern|bayern munich|dortmund|borussia dortmund|bvb|rb leipzig|leipzig|leverkusen|bayer leverkusen|frankfurt|eintracht|wolfsburg|freiburg|hoffenheim|mainz|augsburg|werder bremen|bremen|koln|cologne|union berlin|bochum|heidenheim|st pauli|monchengladbach|gladbach|stuttgart|hertha)\b/gi,
                // Ligue 1
                /\b(psg|paris saint-germain|paris|marseille|lyon|monaco|lille|nice|lens|rennes|strasbourg|nantes|montpellier|toulouse|reims|brest|lorient|clermont|metz|le havre|auxerre|angers|saint-etienne)\b/gi,
                // Other European
                /\b(benfica|porto|sporting|ajax|psv|feyenoord|club brugge|anderlecht|genk|galatasaray|fenerbahce|besiktas|celtic|rangers|salzburg|young boys|olympiacos|panathinaikos|aek|paok)\b/gi,
              ];
              
              const foundTeams: string[] = [];
              for (const pattern of footballTeamPatterns) {
                let match: RegExpExecArray | null;
                while ((match = pattern.exec(msgLower)) !== null) {
                  if (!foundTeams.some(t => t.toLowerCase() === match![0].toLowerCase())) {
                    foundTeams.push(match[0]);
                  }
                }
              }
              
              if (foundTeams.length >= 2) {
                console.log(`[AI-Chat-Stream] ⚡ ULTIMATE FALLBACK: Short match query detected! Teams: ${foundTeams.join(', ')}`);
                isPredictionIntent = true;
              }
            }
          }

          console.log(`[AI-Chat-Stream] Match Prediction Check: isPredictionIntent=${isPredictionIntent}, intent=${queryUnderstanding?.intent}, entities=${queryUnderstanding?.entities?.length || 0}, searchMessage="${searchMessage.substring(0, 50)}"`);

          // Skip if we already got context from clarification fast path
          // NEW APPROACH: Go directly to fetchMatchPreviewOrAnalysis (uses same data as match page)
          if (!verifiedMatchPredictionContext && isPredictionIntent) {
            console.log(`[AI-Chat-Stream] Prediction query detected - using fetchMatchPreviewOrAnalysis directly...`);

            // =====================================================
            // ULTRA-FAST PATH: Check Prediction table FIRST
            // This returns instantly for pre-analyzed matches, skipping ALL slow HTTP calls
            // =====================================================
            try {
              let homeWord = '';
              let awayWord = '';
              
              // Method 1: Try traditional "vs" pattern first
              const quickTeamMatch = searchMessage.match(/(?:analyze|analyse|preview)?\s*([a-zA-Z\s]+?)\s+(?:vs\.?|versus|against|@)\s+([a-zA-Z\s]+)/i);
              if (quickTeamMatch) {
                const [, rawHome, rawAway] = quickTeamMatch;
                homeWord = rawHome.trim().split(/\s+/).pop() || '';
                awayWord = rawAway.trim().split(/\s+/).pop() || '';
                console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST: Found teams via 'vs' pattern: ${homeWord} vs ${awayWord}`);
              }
              
              // Method 2: Short match query detection (no "vs" needed)
              if (!homeWord || !awayWord) {
                const msgLower = searchMessage.toLowerCase().trim();
                const footballTeamPatterns = [
                  /\b(real madrid|barcelona|barca|atletico|atletico madrid|sevilla|villarreal|real sociedad|sociedad|real betis|betis|athletic bilbao|athletic|celta|celta vigo|osasuna|getafe|rayo vallecano|rayo|mallorca|alaves|las palmas|leganes|valladolid|espanyol|girona|valencia)\b/gi,
                  /\b(arsenal|chelsea|liverpool|man united|manchester united|man city|manchester city|tottenham|spurs|newcastle|west ham|aston villa|brighton|crystal palace|fulham|brentford|everton|wolves|wolverhampton|bournemouth|nottingham forest|forest|burnley|sheffield|luton|ipswich|leicester|leeds|sunderland)\b/gi,
                  /\b(roma|as roma|lazio|napoli|juventus|juve|inter|ac milan|milan|atalanta|fiorentina|torino|bologna|sassuolo|udinese|cagliari|verona|monza|empoli|lecce|genoa|parma|como|venezia)\b/gi,
                  /\b(bayern|bayern munich|dortmund|borussia dortmund|bvb|rb leipzig|leipzig|leverkusen|bayer leverkusen|frankfurt|eintracht|wolfsburg|freiburg|hoffenheim|mainz|augsburg|werder bremen|bremen|koln|cologne|union berlin|bochum|heidenheim|st pauli|monchengladbach|gladbach|stuttgart|hertha)\b/gi,
                  /\b(psg|paris saint-germain|paris|marseille|lyon|monaco|lille|nice|lens|rennes|strasbourg|nantes|montpellier|toulouse|reims|brest|lorient|clermont|metz|le havre|auxerre|angers|saint-etienne)\b/gi,
                  /\b(benfica|porto|sporting|ajax|psv|feyenoord|club brugge|anderlecht|genk|galatasaray|fenerbahce|besiktas|celtic|rangers|salzburg|young boys|olympiacos|panathinaikos|aek|paok)\b/gi,
                ];
                
                const foundTeams: string[] = [];
                for (const pattern of footballTeamPatterns) {
                  let match: RegExpExecArray | null;
                  while ((match = pattern.exec(msgLower)) !== null) {
                    if (!foundTeams.some(t => t.toLowerCase() === match![0].toLowerCase())) {
                      foundTeams.push(match[0]);
                    }
                  }
                }
                
                if (foundTeams.length >= 2) {
                  homeWord = foundTeams[0];
                  awayWord = foundTeams[1];
                  console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST: Found teams via pattern detection: ${homeWord} vs ${awayWord}`);
                }
              }
              
              // Method 3: Use LLM entities from query understanding
              if (!homeWord || !awayWord) {
                const teamEntities = queryUnderstanding?.entities?.filter(e => e.type === 'TEAM' || e.type === 'MATCH') || [];
                if (teamEntities.length >= 2) {
                  homeWord = teamEntities[0].name.split(/\s+/).pop() || '';
                  awayWord = teamEntities[1].name.split(/\s+/).pop() || '';
                  console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST: Found teams via LLM entities: ${homeWord} vs ${awayWord}`);
                }
              }

              if (homeWord && awayWord) {
                console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST: Checking Prediction table for ${homeWord} vs ${awayWord}...`);

                  const prediction = await prisma.prediction.findFirst({
                    where: {
                      OR: [
                        {
                          AND: [
                            { matchName: { contains: homeWord, mode: 'insensitive' } },
                            { matchName: { contains: awayWord, mode: 'insensitive' } },
                          ]
                        },
                        {
                          AND: [
                            { matchName: { contains: awayWord, mode: 'insensitive' } },
                            { matchName: { contains: homeWord, mode: 'insensitive' } },
                          ]
                        }
                      ],
                      kickoff: { gte: new Date(new Date().getTime() - 72 * 60 * 60 * 1000) }, // 72h lookback
                      NOT: { fullResponse: { equals: undefined } },
                    },
                    orderBy: { kickoff: 'asc' },
                  });

                  if (prediction?.fullResponse) {
                    console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST HIT: Found ${prediction.matchName} with fullResponse!`);
                    const fullData = prediction.fullResponse as any;
                    const kickoff = prediction.kickoff ? new Date(prediction.kickoff) : null;
                    const now = new Date();

                    // Check if match is in the past
                    if (kickoff && kickoff < now) {
                      const hoursAgo = Math.floor((now.getTime() - kickoff.getTime()) / (1000 * 60 * 60));
                      console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST: Match already played ${hoursAgo}h ago!`);

                      // Build past match response
                      let pastMessage = `⚠️ **This match has already been played!**\n\n`;
                      pastMessage += `**${prediction.matchName}** was played ${hoursAgo} hours ago.\n\n`;

                      if (prediction.actualResult) {
                        pastMessage += `**Final Result:** ${prediction.actualResult}\n\n`;
                      }

                      if (prediction.outcome && prediction.prediction) {
                        const outcomeEmoji = prediction.outcome === 'HIT' ? '✅' : prediction.outcome === 'MISS' ? '❌' : '⏳';
                        pastMessage += `**Our Prediction:** ${prediction.prediction} ${outcomeEmoji}\n\n`;
                      }

                      pastMessage += `Would you like me to analyze an upcoming match instead?`;

                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: pastMessage })}\n\n`));
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                      controller.close();
                      return; // INSTANT RETURN for past matches!
                    }

                    // Future match - build structured data and return immediately
                    const structuredData = {
                      matchInfo: {
                        id: prediction.matchName?.toLowerCase().replace(/\s+/g, '-') || '',
                        homeTeam: fullData.matchInfo?.homeTeam || homeWord,
                        awayTeam: fullData.matchInfo?.awayTeam || awayWord,
                        league: fullData.matchInfo?.league || '',
                        sport: fullData.matchInfo?.sport || 'basketball_nba',
                        kickoff: prediction.kickoff?.toISOString() || '',
                      },
                      story: {
                        favored: fullData.story?.favored || 'home',
                        confidence: fullData.story?.confidence || 'moderate',
                        narrative: fullData.story?.narrative,
                        snapshot: fullData.story?.snapshot,
                      },
                      universalSignals: fullData.universalSignals,
                      expectedScores: fullData.expectedScores,
                      matchUrl: `/match/${homeWord.toLowerCase().replace(/\s+/g, '-')}-vs-${awayWord.toLowerCase().replace(/\s+/g, '-')}-nba-${new Date().toISOString().split('T')[0]}`,
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'match-analysis',
                      data: structuredData
                    })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                    controller.close();
                    return; // INSTANT RETURN - no more processing needed!
                  }
                  console.log(`[AI-Chat-Stream] ⚡ ULTRA-FAST MISS: No cached prediction, continuing to slow path...`);
                }
            } catch (ultraFastError) {
              console.log(`[AI-Chat-Stream] Ultra-fast path error, continuing:`, ultraFastError);
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🎯 Fetching our match analysis...' })}\n\n`));

            // First check if game has ALREADY BEEN PLAYED
            const pastMatch = await withTimeout(
              checkIfMatchIsInPast(searchMessage),
              5000,
              'Past match check'
            );

            if (pastMatch?.isPast) {
              // Game has already been played - don't generate pre-match analysis!
              console.log(`[AI-Chat-Stream] ⚠️ Match already played ${pastMatch.hoursAgo}h ago: ${pastMatch.matchName}`);

              let pastGameMessage = `⚠️ **This match has already been played!**\n\n`;
              pastGameMessage += `**${pastMatch.matchName}** was played ${pastMatch.hoursAgo} hours ago.\n\n`;

              if (pastMatch.actualResult) {
                pastGameMessage += `**Final Result:** ${pastMatch.actualResult}\n\n`;
              }

              if (pastMatch.outcome && pastMatch.prediction) {
                const outcomeEmoji = pastMatch.outcome === 'HIT' ? '✅' : pastMatch.outcome === 'MISS' ? '❌' : '⏳';
                pastGameMessage += `**Our Prediction:** ${pastMatch.prediction} ${outcomeEmoji}\n\n`;
              }

              pastGameMessage += `Would you like me to analyze an **upcoming** match instead?`;

              verifiedMatchPredictionContext = pastGameMessage;
              // Don't use Perplexity - we have our answer
              perplexityContext = '';
              citations = [];
            } else {
              // Game is upcoming or not found as past - fetch from match preview API
              console.log('[AI-Chat-Stream] Fetching analysis from match-preview API (same data as match page)...');
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🔬 Loading match analysis...' })}\n\n`));

              // Extract team names from entities OR parse from MATCH entity
              let homeTeam: string | null = null;
              let awayTeam: string | null = null;

              // First, check for MATCH entity (e.g., "Real Madrid vs Barcelona")
              const matchEntity = queryUnderstanding?.entities.find(e => e.type === 'MATCH');
              if (matchEntity) {
                // Parse the match entity into two teams
                const vsMatch = matchEntity.name.match(/(.+?)\s+(?:vs?\.?|versus|@)\s+(.+)/i);
                if (vsMatch) {
                  homeTeam = vsMatch[1].trim();
                  awayTeam = vsMatch[2].trim();
                  console.log(`[AI-Chat-Stream] Parsed MATCH entity: home="${homeTeam}", away="${awayTeam}"`);
                }
              }

              // If no MATCH entity, try extracting from TEAM/UNKNOWN entities
              if (!homeTeam || !awayTeam) {
                const teamEntities = queryUnderstanding?.entities.filter(e =>
                  e.type === 'TEAM' || e.type === 'UNKNOWN'
                ).map(e => e.name.replace(/^Will\s+/i, '')) || [];

                if (teamEntities.length >= 2) {
                  homeTeam = teamEntities[0];
                  awayTeam = teamEntities[1];
                }
              }

              // Last resort: try to parse directly from the search message
              if (!homeTeam || !awayTeam) {
                const directMatch = searchMessage.match(/(?:analy[sz]e|preview|predict|breakdown)?\s*([A-Za-z\s]+?)\s+(?:vs?\.?|versus|@|against)\s+([A-Za-z\s]+)/i);
                if (directMatch) {
                  homeTeam = directMatch[1].trim();
                  awayTeam = directMatch[2].trim();
                  console.log(`[AI-Chat-Stream] Parsed from message directly: home="${homeTeam}", away="${awayTeam}"`);
                }
              }

              // ULTIMATE FALLBACK: Short match query detection (handles "Celta Osasuna" without vs)
              // Same logic as query-intelligence isShortMatchQuery
              if (!homeTeam || !awayTeam) {
                const msgLower = searchMessage.toLowerCase().trim();
                const words = msgLower.split(/\s+/);
                
                // Only try if it's a short query (2-5 words) without question words
                if (words.length >= 2 && words.length <= 5 && !/\b(who|what|when|where|why|how|will|can|should|is|are)\b/i.test(msgLower)) {
                  const foundTeams: string[] = [];
                  
                  // All major football leagues patterns
                  const allFootballPatterns = [
                    // La Liga
                    /\b(real madrid|barcelona|barca|atletico|atletico madrid|sevilla|villarreal|real sociedad|sociedad|real betis|betis|athletic bilbao|athletic|celta|celta vigo|osasuna|getafe|rayo vallecano|rayo|mallorca|alaves|las palmas|leganes|valladolid|espanyol|girona|valencia)\b/gi,
                    // Premier League
                    /\b(arsenal|chelsea|liverpool|man united|manchester united|man city|manchester city|tottenham|spurs|newcastle|west ham|aston villa|brighton|crystal palace|fulham|brentford|everton|wolves|wolverhampton|bournemouth|nottingham forest|forest|burnley|sheffield|luton|ipswich|leicester|leeds|sunderland)\b/gi,
                    // Serie A
                    /\b(roma|as roma|lazio|napoli|juventus|juve|inter|ac milan|milan|atalanta|fiorentina|torino|bologna|sassuolo|udinese|cagliari|verona|monza|empoli|lecce|genoa|parma|como|venezia)\b/gi,
                    // Bundesliga
                    /\b(bayern|bayern munich|dortmund|borussia dortmund|bvb|rb leipzig|leipzig|leverkusen|bayer leverkusen|frankfurt|eintracht|wolfsburg|freiburg|hoffenheim|mainz|augsburg|werder bremen|bremen|koln|cologne|union berlin|bochum|heidenheim|st pauli|monchengladbach|gladbach|stuttgart|hertha)\b/gi,
                    // Ligue 1
                    /\b(psg|paris saint-germain|paris|marseille|lyon|monaco|lille|nice|lens|rennes|strasbourg|nantes|montpellier|toulouse|reims|brest|lorient|clermont|metz|le havre|auxerre|angers|saint-etienne)\b/gi,
                    // Other leagues
                    /\b(benfica|porto|sporting|ajax|psv|feyenoord|club brugge|anderlecht|genk|galatasaray|fenerbahce|besiktas|celtic|rangers|salzburg|young boys|olympiacos|panathinaikos|aek|paok)\b/gi,
                  ];
                  
                  for (const pattern of allFootballPatterns) {
                    let match: RegExpExecArray | null;
                    while ((match = pattern.exec(msgLower)) !== null) {
                      if (!foundTeams.some(t => t.toLowerCase() === match![0].toLowerCase())) {
                        foundTeams.push(match[0]);
                      }
                    }
                  }
                  
                  if (foundTeams.length >= 2) {
                    homeTeam = foundTeams[0].charAt(0).toUpperCase() + foundTeams[0].slice(1);
                    awayTeam = foundTeams[1].charAt(0).toUpperCase() + foundTeams[1].slice(1);
                    console.log(`[AI-Chat-Stream] 🎯 ULTIMATE FALLBACK: Detected short match query "${homeTeam} vs ${awayTeam}" from "${searchMessage}"`);
                  }
                }
              }

              if (homeTeam && awayTeam) {
                // Detect sport from team names if not already detected
                let sport = queryUnderstanding?.sport || detectSportFromTeams(homeTeam, awayTeam);
                if (!sport || sport === 'unknown') {
                  // Fallback sport detection
                  if (/lakers|celtics|warriors|bulls|heat|nets|knicks|76ers|bucks|nuggets|suns|mavericks|clippers|spurs|rockets|timberwolves|thunder|pelicans|grizzlies|hawks|hornets|wizards|pistons|pacers|magic|cavaliers|raptors|jazz|blazers|kings/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'basketball_nba';
                  } else if (/chiefs|eagles|49ers|cowboys|bills|bengals|ravens|dolphins|lions|packers|vikings|jets|patriots|broncos|chargers|raiders|seahawks|rams/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'americanfootball_nfl';
                  } else if (/bruins|maple leafs|rangers|penguins|oilers|avalanche|panthers|lightning|hurricanes|stars|golden knights/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'icehockey_nhl';
                  } else if (/real madrid|barcelona|atletico madrid|sevilla|valencia|villarreal|real betis|athletic bilbao|real sociedad|celta/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'soccer_spain_la_liga';
                  } else if (/liverpool|manchester (united|city)|chelsea|arsenal|tottenham|newcastle|west ham|brighton|aston villa|everton/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'soccer_epl';
                  } else if (/juventus|inter|milan|napoli|roma|lazio|fiorentina|atalanta|bologna|torino/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'soccer_italy_serie_a';
                  } else if (/bayern|dortmund|leverkusen|leipzig|frankfurt|wolfsburg|gladbach|stuttgart|freiburg|union berlin/i.test(`${homeTeam} ${awayTeam}`)) {
                    sport = 'soccer_germany_bundesliga';
                  } else {
                    sport = 'soccer_epl'; // Default
                  }
                }

                console.log(`[AI-Chat-Stream] Using fetchMatchPreviewOrAnalysis for: ${homeTeam} vs ${awayTeam} (${sport})`);

                try {
                  // USE MATCH-PREVIEW API: Same data source as the match page!
                  const result = await fetchMatchPreviewOrAnalysis(homeTeam, awayTeam, sport, request);

                  if (result.success) {
                    // If we have structured data, stream it for rich UI rendering
                    if (result.structuredData) {
                      console.log(`[AI-Chat-Stream] ✅ Streaming match-analysis structured data for rich UI`);
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'match-analysis',
                        data: result.structuredData
                      })}\n\n`));
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                      controller.close();
                      return; // Early return - no need for AI text generation
                    }

                    // Fallback: use text context for AI generation
                    verifiedMatchPredictionContext = result.context;
                    console.log(`[AI-Chat-Stream] ✅ Got analysis from ${result.source}`);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `✅ ${result.source === 'match-preview' ? 'Match Preview' : 'Live analysis'} ready!` })}\n\n`));
                    // Use our data, not Perplexity
                    perplexityContext = '';
                    citations = [];
                  } else {
                    // NO CACHED ANALYSIS - Direct user to the match page
                    console.log(`[AI-Chat-Stream] ⚠️ No cached analysis for ${homeTeam} vs ${awayTeam} - directing to match page`);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '⚠️ Analysis not pre-generated yet...' })}\n\n`));
                    
                    // Build a match URL slug
                    const slugify = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    const getSportCode = (sportKey: string) => {
                      const parts = sportKey.split('_');
                      return parts.length >= 2 ? parts[1] : sportKey;
                    };
                    const matchSlug = `${slugify(homeTeam)}-vs-${slugify(awayTeam)}-${getSportCode(sport)}-${new Date().toISOString().split('T')[0]}`;
                    const matchUrl = `/match/${matchSlug}`;
                    
                    const noAnalysisMessage = `I don't have a pre-generated analysis for **${homeTeam} vs ${awayTeam}** yet.

🔗 **[Click here to generate the full analysis](${matchUrl})**

The match page will create a comprehensive breakdown including:
• Win probability estimates
• Form & momentum analysis  
• Key injury impacts
• Value detection vs market odds

The analysis takes about 20-30 seconds to generate on the match page, but once it's created, I'll be able to discuss it with you instantly here! 🎯`;

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: noAnalysisMessage })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
                    controller.close();
                    return; // Early return
                  }
                } catch (analyzeError) {
                  console.error('[AI-Chat-Stream] fetchMatchPreviewOrAnalysis error:', analyzeError);
                }
              } else {
                console.log(`[AI-Chat-Stream] ⚠️ Could not extract team names. home="${homeTeam}", away="${awayTeam}"`);
              }
            }
          }

          // ============================================
          // PERPLEXITY FALLBACK: If we skipped Perplexity but got no verified data
          // ============================================
          const hasAnyVerifiedData = verifiedPlayerStatsContext || verifiedTeamMatchStatsContext ||
            verifiedStandingsContext || verifiedLineupContext || verifiedMatchPredictionContext ||
            verifiedMatchEventsContext || verifiedLeagueLeadersContext || verifiedCoachContext ||
            ourPredictionContext;

          if (shouldSkipPerplexity && !hasAnyVerifiedData && needsSearch(searchMessage)) {
            console.log('[AI-Chat-Stream] No verified data found, falling back to Perplexity...');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: '🔍 Searching for additional data...' })}\n\n`));

            const perplexity = getPerplexityClient();
            if (perplexity.isConfigured()) {
              try {
                const searchResult = await withTimeout(
                  perplexity.search(searchMessage, {
                    recency: 'week',
                    model: 'sonar-pro',
                    maxTokens: 1000,
                  }),
                  15000,
                  'Perplexity fallback'
                );

                if (searchResult?.success && searchResult.content) {
                  perplexityContext = searchResult.content;
                  citations = searchResult.citations || [];
                  console.log('[AI-Chat-Stream] ✅ Perplexity fallback succeeded');
                }
              } catch (err) {
                console.log('[AI-Chat-Stream] Perplexity fallback failed:', err);
              }
            }
          }

          // Send status: generating
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: 'Generating response...' })}\n\n`));

          // Step 2: Calculate data confidence and build system prompt
          const dataConfidence: DataConfidence = calculateDataConfidence({
            hasVerifiedStats: !!verifiedPlayerStatsContext || !!verifiedTeamMatchStatsContext,
            hasVerifiedStandings: !!verifiedStandingsContext,
            hasVerifiedLineups: !!verifiedLineupContext,
            hasVerifiedPrediction: !!verifiedMatchPredictionContext,
            hasVerifiedEvents: !!verifiedMatchEventsContext,
            hasPerplexityData: !!perplexityContext,
            hasDataLayerStats: !!dataLayerContext,
            queryCategory: queryCategory,
          });

          console.log(`[AI-Chat-Stream] Data Confidence: ${dataConfidence.level} (${dataConfidence.score}/100), sources: ${dataConfidence.sources.join(', ') || 'none'}`);

          // Log if we're going to refuse to answer
          if (!dataConfidence.canAnswer) {
            console.log(`[AI-Chat-Stream] ⚠️ Insufficient data to answer. Missing: ${dataConfidence.missingCritical.join(', ')}`);
          }

          // STRICTER DATA REFUSAL: For data-critical queries with no data, refuse instead of hallucinating
          // Note: INJURY is intentionally excluded - it should use Perplexity real-time search
          const DATA_CRITICAL_CATEGORIES = ['STATS', 'STANDINGS', 'BETTING_ADVICE', 'PLAYER_PROP', 'OUR_PREDICTION', 'COMPARISON'];
          const isDataCriticalQuery = DATA_CRITICAL_CATEGORIES.includes(queryCategory.toUpperCase());

          // EXCEPTIONS: Don't refuse if we have good enough data to answer
          // 1. Basic knowledge questions GPT can answer
          const isBasicKnowledgeQuery = /\b(who leads|who is leading|top scorer|mvp|best player)\b/i.test(searchMessage) &&
            /\b(nba|nfl|nhl|mlb)\b/i.test(searchMessage);

          // 2. General team form/performance questions - Perplexity data is sufficient
          const isGeneralTeamQuestion = /\b(how is|how are|how's|performing|performance|doing|form|season|playing)\b/i.test(searchMessage) &&
            /\b(team|club|fc|united|city|villa|arsenal|chelsea|liverpool|barcelona|madrid|juventus|bayern|milan)\b/i.test(searchMessage);

          // 3. If we have Perplexity data, that's good enough for general questions
          const hasPerplexityFallback = !!perplexityContext && perplexityContext.length > 100;

          // 4. Injury queries should ALWAYS use Perplexity if available - it's the best source for real-time injury info
          const isInjuryQueryWithData = queryCategory.toUpperCase() === 'INJURY' && hasPerplexityFallback;

          // 5. If we have our stored match prediction, definitely don't refuse!
          const hasOurPrediction = !!verifiedMatchPredictionContext && verifiedMatchPredictionContext.length > 0;

          // Only refuse if: no data confidence AND is data-critical AND none of the exceptions apply
          const shouldRefuse = !dataConfidence.canAnswer &&
            isDataCriticalQuery &&
            !isBasicKnowledgeQuery &&
            !isGeneralTeamQuestion &&
            !hasPerplexityFallback &&
            !isInjuryQueryWithData &&
            !hasOurPrediction;  // NEW: Don't refuse if we have our stored prediction!

          if (shouldRefuse) {
            console.log(`[AI-Chat-Stream] 🛑 REFUSING to answer - data-critical query with insufficient data`);

            const refusalMessage = dataConfidence.missingCritical.length > 0
              ? `I don't have verified data for this query. I'm missing: ${dataConfidence.missingCritical.join(', ')}.

I could give you a guess, but that's not what we do here. SportBot only provides analysis backed by real data.

**Try:**
- A different match or player that I might have data for
- Check back closer to match time for lineups/injuries
- Ask about Premier League, La Liga, Serie A, or other major leagues`
              : `I don't have enough verified data to answer this accurately.

Rather than make something up, I'll be honest - I can't find reliable stats for this query.

**Try:**
- Rephrasing with a specific team, player, or match
- Asking about major leagues where I have better coverage
- Check back later as data updates regularly`;

            // Send refusal using existing controller
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content: refusalMessage })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
            return; // Exit the start() callback
          }

          const brainMode: BrainMode =
            (queryCategory === 'BETTING_ADVICE' || queryCategory === 'PLAYER_PROP')
              ? 'betting'
              : detectChatMode(message);

          let systemPrompt = buildSystemPrompt(brainMode, {
            hasRealTimeData: !!perplexityContext,
            dataConfidence, // NEW: pass confidence scoring
          });

          // Enhance system prompt when DataLayer stats are available
          if (dataLayerContext) {
            systemPrompt += `\n\nYou have access to VERIFIED STRUCTURED DATA including team form, head-to-head records, and season statistics. Prioritize this data for factual claims about records and stats.`;
          }

          // Add learned context (using detectedSport defined earlier) - with 3s timeout
          try {
            const learnedContext = await withTimeout(
              buildLearnedContext(message, detectedSport),
              3000,
              'Learned context'
            );
            const sportTerminology = detectedSport ? getTerminologyForSport(detectedSport) : [];

            if (learnedContext) systemPrompt += `\n\n${learnedContext}`;
            if (sportTerminology.length > 0) {
              systemPrompt += `\n\nSPORT TERMINOLOGY: ${sportTerminology.slice(0, 10).join(', ')}`;
            }
          } catch { /* ignore */ }

          // Add favorite teams context for personalized responses
          if (favoriteTeamsContext) {
            systemPrompt += `\n\n${favoriteTeamsContext}`;
          }

          // Add user learning context (cross-session memory)
          if (userLearningContext) {
            systemPrompt += `\n\n${userLearningContext}`;
          }

          // Add language instruction
          if (translation.needsTranslation && originalLanguage !== 'en') {
            const langNames: Record<string, string> = {
              'sr': 'Serbian/Croatian', 'es': 'Spanish', 'de': 'German', 'fr': 'French', 'pt': 'Portuguese', 'unknown': 'the user\'s language'
            };
            systemPrompt += `\n\nIMPORTANT: Respond in ${langNames[originalLanguage] || langNames['unknown']}, not English.`;
          }

          // Build messages
          const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
          ];

          // Add history
          for (const msg of history.slice(-10)) {
            messages.push({ role: msg.role, content: msg.content });
          }

          // Add user message with context
          let userContent = message;

          // ============================================
          // TOOL EXECUTION: Intelligent data retrieval
          // Execute tools based on query intent and entities
          // ============================================
          const toolResults: ToolResult[] = [];
          const toolDepsBundle = {
            searchNews: toolDeps.searchNews,
            getPlayerStats: toolDeps.getPlayerStats,
            getMatchPrediction: toolDeps.getMatchPrediction,
            getTeamForm: toolDeps.getTeamForm,
            getStandings: toolDeps.getStandings,
            getInjuryStatus: toolDeps.getInjuryStatus,
          };

          // Decide which tools to call based on intent
          if (queryUnderstanding && !verifiedPlayerStatsContext && !verifiedMatchPredictionContext) {
            const intent = queryUnderstanding.intent;
            const entities = queryUnderstanding.entities || [];

            // For injury queries without verified data
            if (intent === 'INJURY_NEWS' && entities.length > 0) {
              const playerEntity = entities.find(e => e.type === 'PLAYER');
              if (playerEntity) {
                console.log(`[AI-Chat-Stream] 🔧 Tool: get_player_injury_status for ${playerEntity.name}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `🔍 Checking injury status...` })}\n\n`));
                const result = await executeTool('get_player_injury_status', {
                  playerName: playerEntity.name,
                  team: undefined,
                  sport: playerEntity.sport || 'basketball',
                }, toolDepsBundle);
                toolResults.push(result);
              }
            }

            // For player stats queries without verified data
            if (intent === 'PLAYER_STATS' && entities.length > 0) {
              const playerEntity = entities.find(e => e.type === 'PLAYER');
              if (playerEntity) {
                console.log(`[AI-Chat-Stream] 🔧 Tool: get_player_stats for ${playerEntity.name}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `📊 Fetching player stats...` })}\n\n`));
                const result = await executeTool('get_player_stats', {
                  playerName: playerEntity.name,
                  sport: playerEntity.sport || queryUnderstanding.sport || 'basketball',
                }, toolDepsBundle);
                toolResults.push(result);
              }
            }

            // For match prediction queries without stored prediction
            if ((intent === 'MATCH_PREDICTION' || intent === 'BETTING_ANALYSIS') && !verifiedMatchPredictionContext) {
              const teamEntities = entities.filter(e => e.type === 'TEAM');
              if (teamEntities.length >= 2) {
                console.log(`[AI-Chat-Stream] 🔧 Tool: get_match_prediction for ${teamEntities[0].name} vs ${teamEntities[1].name}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', status: `🎯 Fetching match prediction...` })}\n\n`));
                const result = await executeTool('get_match_prediction', {
                  team1: teamEntities[0].name,
                  team2: teamEntities[1].name,
                  sport: queryUnderstanding.sport || 'soccer',
                }, toolDepsBundle);
                toolResults.push(result);
              }
            }

            // For standings queries without verified data
            if (intent === 'STANDINGS' && !verifiedStandingsContext) {
              const sport = queryUnderstanding.sport || 'basketball';
              const league = sport === 'basketball' ? 'NBA' : sport === 'soccer' ? 'Premier League' : 'NFL';
              console.log(`[AI-Chat-Stream] 🔧 Tool: get_standings for ${league}`);
              const result = await executeTool('get_standings', { league }, toolDepsBundle);
              toolResults.push(result);
            }
          }

          // Format tool results for context
          const toolResultsContext = formatToolResults(toolResults);
          if (toolResultsContext) {
            console.log(`[AI-Chat-Stream] 🔧 Executed ${toolResults.length} tool(s) successfully`);
          }

          const hasContext = perplexityContext || dataLayerContext || verifiedPlayerStatsContext || ourPredictionContext || verifiedStandingsContext || verifiedTeamMatchStatsContext || verifiedLeagueLeadersContext || verifiedLineupContext || verifiedCoachContext || verifiedMatchEventsContext || verifiedMatchPredictionContext || toolResultsContext;

          if (hasContext) {
            // For match prediction queries (who will win, prediction for match)
            if (verifiedMatchPredictionContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking for our match analysis/prediction. Use ONLY the data below.

${verifiedMatchPredictionContext}

RESPONSE RULES - Present ALL of this data naturally:
1. Start with the headline/verdict if available
2. Show win probabilities with clear percentages
3. Include VALUE/EDGE if there's a market discrepancy (this is our key differentiator!)
4. Mention FORM - recent results (W-L-D) for both teams
5. Include KEY INJURIES affecting the match
6. Show INTERESTING STATS/VIRAL STATS if available
7. Mention the RISK LEVEL and any trap match warnings
8. Include KEY BATTLES or tactical insights
9. End with the expert verdict/conclusion
10. ALWAYS include the gambling disclaimer
11. Answer in the user's language

FORMAT GUIDELINES:
- Use clear sections with emojis for visual appeal
- Lead with the most impactful insight (often the edge or verdict)
- Make it feel like expert analysis, not just data dumps
- If something is missing from the data, just skip that section`;
              // For league leaders queries (top scorers/assists)
            } else if (verifiedLeagueLeadersContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: Use ONLY the verified league leaders data below.

${verifiedLeagueLeadersContext}

RESPONSE RULES:
1. Present the top scorers/assists in a clear ranked format
2. Include player name, team, and goals/assists count
3. Use the exact numbers from the data - they are VERIFIED
4. Answer in the user's language`;
              // For lineup queries
            } else if (verifiedLineupContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: Use ONLY the verified lineup data below.

${verifiedLineupContext}

RESPONSE RULES:
1. Present the starting XI clearly by position
2. Include the formation
3. List substitutes
4. Mention the coach
5. Answer in the user's language`;
              // For coach queries
            } else if (verifiedCoachContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: Use ONLY the verified coach data below.

${verifiedCoachContext}

RESPONSE RULES:
1. Include coach name, nationality, age
2. Mention current position and tenure
3. List recent career history
4. Answer in the user's language`;
              // For match events queries
            } else if (verifiedMatchEventsContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: Use ONLY the verified match events data below.

${verifiedMatchEventsContext}

RESPONSE RULES:
1. Present goals with scorer, minute, and assist
2. Include cards if asked
3. Use the exact data provided - it's VERIFIED
4. Answer in the user's language`;
              // For team match statistics queries (shots, corners per game)
            } else if (verifiedTeamMatchStatsContext) {
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking about MATCH STATISTICS. Use ONLY the verified data below.

${verifiedTeamMatchStatsContext}

STRICT RULES:
1. ONLY use the match-by-match statistics provided above - they are VERIFIED from API-Sports
2. When comparing to averages, use the exact numbers provided
3. Format your response with clear match-by-match details if asked
4. Include dates and scores for context
5. If asked about opponent patterns, analyze how opponents performed compared to their norms

RESPONSE FORMAT:
- Answer the specific question directly first
- Use bullet points for match-by-match breakdowns
- Include the opponent name, date, and specific stats
- Summarize any patterns you notice
- Mention this is verified data from official match statistics`;
              // For OUR_PREDICTION queries, use our stored analysis
            } else if (queryCategory === 'OUR_PREDICTION' && ourPredictionContext) {
              userContent = `USER QUESTION: ${message}

The user is asking about SportBot's past prediction/analysis. Here is what we found:

${ourPredictionContext}

INSTRUCTIONS:
1. If we found a prediction, summarize it naturally: what we predicted, our reasoning, and the outcome
2. If outcome is HIT ✅, acknowledge we got it right
3. If outcome is MISS ❌, acknowledge we got it wrong and what actually happened
4. If outcome is PENDING ⏳, note that the match hasn't been played yet or result not updated
5. If no prediction was found (⚠️ NO PREDICTION FOUND), say: "I don't have a stored analysis for that specific match"
6. DO NOT make up an analysis if we don't have one`;
            } else if (queryCategory === 'STANDINGS' && verifiedStandingsContext) {
              // Prioritize verified standings data
              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking about CURRENT STANDINGS. Your training data is OUTDATED.

${verifiedStandingsContext}

STRICT RULES:
1. ONLY use the standings data provided above - it is VERIFIED and CURRENT
2. DO NOT use any standings from your training data (it's outdated)
3. When mentioning positions, be specific: "Team X is currently in 1st place with a 25-10 record"
4. Include relevant stats like wins, losses, win streak if asked
5. For conference/division questions, group teams appropriately

RESPONSE FORMAT:
- Be conversational but accurate
- Lead with the most relevant information for what was asked
- If they asked about a specific team, focus on that team's position first
- Include comparison to rivals or nearby teams if relevant`;
            } else if (queryCategory === 'STATS') {
              // Prioritize verified player stats over Perplexity
              const statsData = verifiedPlayerStatsContext || perplexityContext || 'No real-time data available';

              userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking about CURRENT SEASON STATISTICS. Your training data is OUTDATED.

REAL-TIME DATA (December 2025 - USE ONLY THIS):
${statsData}
${dataLayerContext ? `\nSTRUCTURED STATS:\n${dataLayerContext}` : ''}

STRICT RULES:
1. ONLY use the numbers from the REAL-TIME DATA above
2. DO NOT use any statistics from your training data (it's from 2023 or earlier)
3. If the real-time data doesn't have the exact stat requested, say "Based on the available data..." and give what you have
4. NEVER guess or estimate numbers - only report what's in the real-time data
5. Lead with the current stats, then add context

RESPONSE FORMAT:
- Start with the CURRENT SEASON stat: "In the 2025-26 season, [Player] is averaging..."
- Then add recent performance context
- Keep it factual and concise`;
            } else {
              // Check if this is a MATCH_PREDICTION query but we don't have a stored prediction
              const isPredictionQuery = queryUnderstanding?.intent === 'MATCH_PREDICTION' ||
                queryUnderstanding?.intent === 'BETTING_ANALYSIS' ||
                queryUnderstanding?.intent === 'OUR_ANALYSIS';

              if (isPredictionQuery && !verifiedMatchPredictionContext) {
                // NO STORED PREDICTION - Don't make up analysis!
                userContent = `USER QUESTION: ${message}

⚠️ CRITICAL: The user is asking for match analysis/prediction, but we DO NOT have a stored prediction for this match.

${perplexityContext ? `REAL-TIME CONTEXT (for general info only):\n${perplexityContext}` : ''}
${dataLayerContext ? `\nSTRUCTURED STATS:\n${dataLayerContext}` : ''}

STRICT RULES - NEVER HALLUCINATE:
1. DO NOT make up win probabilities (like "55% vs 45%") - you don't have our model's data
2. DO NOT claim to have "our analysis" or "SportBot's prediction" - we don't have one for this match
3. You CAN share:
   - General information about the teams from the real-time context
   - Recent form and stats if available
   - Injury updates
   - Schedule information
4. Be HONEST: If asked for probabilities/prediction, say: "I don't have our pre-match analysis for this specific game yet. Here's what I know about the teams..."
5. If the match has ALREADY BEEN PLAYED, check the context for results and inform the user

The user deserves to know when we have verified analysis vs when we're just sharing general info.`;
              } else {
                userContent = `USER QUESTION: ${message}`;

                if (toolResultsContext) {
                  userContent += `\n\n${toolResultsContext}`;
                }

                if (dataLayerContext) {
                  userContent += `\n\nSTRUCTURED STATS (verified data):\n${dataLayerContext}`;
                }

                if (perplexityContext) {
                  userContent += `\n\nREAL-TIME NEWS & INFO:\n${perplexityContext}`;
                }

                userContent += '\n\nIMPORTANT: Use ONLY the data provided above for current season stats. Your training data may be outdated. Be sharp and specific.';
              }
            }
          }
          messages.push({ role: 'user', content: userContent });

          // Step 3: Create streaming response (with 30s timeout to prevent hanging)
          const streamPromise = openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages,
            max_tokens: 800,
            temperature: 0.7,
            stream: true,
          });

          const stream = await withTimeout(streamPromise, 30000, 'OpenAI stream creation');

          if (!stream) {
            console.error('[AI-Chat-Stream] OpenAI stream creation timed out');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'content',
              content: "I'm having trouble connecting right now. Please try again in a moment."
            })}\n\n`));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
            return;
          }

          // Generate quick follow-ups initially (will be replaced by smart ones after response)
          const quickFollowUps = generateQuickFollowUps(message, queryCategory, detectedSport);

          // Send metadata (including data confidence for feedback tracking)
          const metadata = {
            type: 'metadata',
            citations,
            usedRealTimeSearch: !!perplexityContext,
            usedDataLayer: !!dataLayerContext,
            brainMode,
            followUps: quickFollowUps,
            dataConfidenceLevel: dataConfidence.level,
            dataConfidenceScore: dataConfidence.score,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(metadata)}\n\n`));

          // Stream the response with per-chunk timeout to prevent hanging
          let streamTimedOut = false;
          const STREAM_CHUNK_TIMEOUT = 30000; // 30s max wait between chunks
          let lastChunkTime = Date.now();

          // Create a promise race for streaming with timeout
          const streamWithTimeout = async () => {
            for await (const chunk of stream) {
              // Check if we've exceeded chunk timeout
              const now = Date.now();
              if (now - lastChunkTime > STREAM_CHUNK_TIMEOUT) {
                console.error('[AI-Chat-Stream] Stream chunk timeout exceeded');
                streamTimedOut = true;
                break;
              }
              lastChunkTime = now;

              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
              }
            }
          };

          // Race the stream against an absolute timeout
          const streamPromiseRace = Promise.race([
            streamWithTimeout(),
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('Stream absolute timeout')), 45000)
            )
          ]);

          try {
            await streamPromiseRace;
          } catch (streamErr) {
            console.error('[AI-Chat-Stream] Stream error:', streamErr);
            streamTimedOut = true;
            if (!fullResponse) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                content: "I'm having trouble completing this response. Please try again."
              })}\n\n`));
            }
          }

          // Generate smart follow-ups based on the full conversation (with timeout to prevent blocking)
          let smartFollowUps: string[] = quickFollowUps;
          try {
            const followUpResult = await withTimeout(
              generateSmartFollowUps(message, fullResponse, queryCategory, detectedSport),
              5000,
              'Smart follow-ups'
            );
            if (followUpResult) {
              smartFollowUps = followUpResult;
            }
          } catch (err) {
            console.error('[AI-Chat] Smart follow-up generation failed:', err);
          }

          // Send updated follow-ups
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'followUps', followUps: smartFollowUps })}\n\n`));

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();

          // Calculate response latency
          const latencyMs = Date.now() - requestStartTime;

          // Determine primary response source for learning
          let responseSource: 'CACHE' | 'VERIFIED_STATS' | 'PERPLEXITY' | 'OUR_PREDICTION' | 'LLM' | 'HYBRID' = 'LLM';
          if (verifiedPlayerStatsContext || verifiedTeamMatchStatsContext || verifiedStandingsContext) {
            responseSource = perplexityContext ? 'HYBRID' : 'VERIFIED_STATS';
          } else if (verifiedMatchPredictionContext) {
            responseSource = 'OUR_PREDICTION';
          } else if (perplexityContext) {
            responseSource = 'PERPLEXITY';
          }

          // Track query with answer for caching (async) + LEARNING FIELDS
          trackQuery({
            query: message,
            answer: fullResponse,  // Save the answer for future cache hits
            category: queryCategory,
            brainMode,
            sport: detectSport(message),
            usedRealTimeSearch: !!perplexityContext,
            responseLength: fullResponse.length,
            hadCitations: citations.length > 0,
            citations,  // Save citations for reuse
            userId,     // Track who submitted the query
            // Data confidence metrics for quality tracking
            dataConfidenceLevel: dataConfidence.level,
            dataConfidenceScore: dataConfidence.score,
            dataSources: dataConfidence.sources,

            // ============================================
            // QUERY LEARNING FIELDS (for systematic improvement)
            // ============================================

            // Classification tracking
            detectedIntent: queryUnderstanding?.intent,
            intentConfidence: queryUnderstanding?.intentConfidence,
            entitiesDetected: queryUnderstanding?.entities.map(e => e.name),
            expandedQuery: expandedQuery !== message ? expandedQuery : undefined,
            patternMatched: queryUnderstanding?.patternMatched,
            wasLLMClassified: queryUnderstanding?.usedLLM ?? false,

            // Response tracking
            responseSource,
            cacheHit: false,
            latencyMs,

            // A/B Testing
            abTestVariant: abVariant,
            abTestId: abTestId,
          }).catch(() => { });

          // ============================================
          // SAVE TO LEARNING SYSTEM (for cross-session memory)
          // ============================================
          if (userId && learningSessionId) {
            try {
              // Save user message
              await addLearningMessage(learningSessionId, {
                role: 'user',
                content: message,
                teams: queryUnderstanding?.entities.filter(e => e.type === 'TEAM').map(e => e.name) || [],
                players: queryUnderstanding?.entities.filter(e => e.type === 'PLAYER').map(e => e.name) || [],
                sport: detectedSport,
                intent: queryUnderstanding?.intent,
              });

              // Save assistant response
              await addLearningMessage(learningSessionId, {
                role: 'assistant',
                content: fullResponse.slice(0, 5000), // Limit stored content
                sport: detectedSport,
              });

              // Update user preferences based on this interaction
              await updateUserPreferences(userId, {
                sport: detectedSport,
                teams: queryUnderstanding?.entities.filter(e => e.type === 'TEAM').map(e => e.name),
                intent: queryUnderstanding?.intent,
              });

              console.log('[AI-Chat-Stream] Learning: saved messages and updated preferences');
            } catch (err) {
              console.log('[AI-Chat-Stream] Learning save failed (non-critical):', err);
            }
          }

          // Detect entity mismatch (asked about X, answered about Y)
          // This helps us learn from mistakes
          if (queryUnderstanding && queryUnderstanding.entities.length > 0) {
            const mismatch = detectMismatch(message, fullResponse);
            if (mismatch.hasMismatch && mismatch.details) {
              console.warn(`[AI-Chat-Stream] ⚠️ ENTITY MISMATCH DETECTED: ${mismatch.details}`);
              // Record for learning - fire and forget
              recordMismatch(queryHash, mismatch.details).catch(() => { });
            }
          }

          saveKnowledge({
            question: message,
            answer: fullResponse,
            sport: detectSport(message),
            category: queryCategory,
            hadRealTimeData: !!perplexityContext,
            citations,
          }).catch(() => { });

          // Cache the response (only for queries without history context)
          if (history.length === 0 && fullResponse.length > 50) {
            const cacheTTL = getChatTTL(queryCategory);
            cacheSet<CachedChatResponse>(cacheKey, {
              response: fullResponse,
              citations,
              usedRealTimeSearch: !!perplexityContext,
              brainMode,
              cachedAt: Date.now(),
            }, cacheTTL).catch(() => { });
            console.log(`[AI-Chat-Stream] Cached response (TTL: ${cacheTTL}s)`);
          }

        } catch (error) {
          console.error('[AI-Chat-Stream] Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Stream failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[AI-Chat-Stream] Error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
