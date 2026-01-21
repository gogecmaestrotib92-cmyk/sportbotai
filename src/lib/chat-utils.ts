/**
 * Chat Utilities
 * 
 * Shared utilities for AI chat routes (streaming and non-streaming).
 * This consolidates data fetching, formatting, and response generation.
 * 
 * All verified data sources are imported here for clean, centralized access.
 */

import { NextRequest } from 'next/server';
import { theOddsClient, calculateAverageOdds } from '@/lib/theOdds/theOddsClient';
import type { MatchAnalysisData } from '@/components/ai-desk/types';

// ============================================
// TYPES
// ============================================

export interface MatchAnalysisResult {
    success: boolean;
    context: string;
    source: 'match-preview' | 'analyze' | 'stored-prediction';
    odds?: {
        home: number;
        draw: number | null;
        away: number;
    };
    // Structured data for rich chat UI display
    structuredData?: MatchAnalysisData;
}

export interface FormattedMatchData {
    homeTeam: string;
    awayTeam: string;
    sport: string;
    sportDisplay?: string;
    odds?: {
        home: number;
        draw: number | null;
        away: number;
    };
}

// ============================================
// TIMEOUT UTILITY
// ============================================

/**
 * Wrap a promise with a timeout
 * Returns null if timeout is reached instead of throwing
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string
): Promise<T | null> {
    const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
            console.log(`[Chat-Utils] ⏱️ ${label} timed out after ${ms}ms`);
            resolve(null);
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]);
}

// ============================================
// ODDS CACHING (30 minute TTL)
// ============================================

interface CachedOdds {
    home: number;
    draw: number | null;
    away: number;
    cachedAt: number;
}

// In-memory cache for odds (key: "sport:home:away")
const oddsCache = new Map<string, CachedOdds>();
const ODDS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getOddsCacheKey(sport: string, homeTeam: string, awayTeam: string): string {
    return `${sport}:${homeTeam.toLowerCase()}:${awayTeam.toLowerCase()}`;
}

function getCachedOdds(sport: string, homeTeam: string, awayTeam: string): { home: number; draw: number | null; away: number } | null {
    const key = getOddsCacheKey(sport, homeTeam, awayTeam);
    const cached = oddsCache.get(key);

    if (cached && Date.now() - cached.cachedAt < ODDS_CACHE_TTL_MS) {
        console.log(`[Chat-Utils] 💾 Using cached odds for ${homeTeam} vs ${awayTeam} (${((Date.now() - cached.cachedAt) / 60000).toFixed(1)} min old)`);
        return { home: cached.home, draw: cached.draw, away: cached.away };
    }

    // Expired or not found
    if (cached) {
        oddsCache.delete(key);
    }
    return null;
}

function setCachedOdds(sport: string, homeTeam: string, awayTeam: string, odds: { home: number; draw: number | null; away: number }): void {
    const key = getOddsCacheKey(sport, homeTeam, awayTeam);
    oddsCache.set(key, {
        ...odds,
        cachedAt: Date.now()
    });
    console.log(`[Chat-Utils] 💾 Cached odds for ${homeTeam} vs ${awayTeam} (TTL: 30 min)`);
}

// Cleanup expired entries periodically (every 10 minutes)
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    const entries = Array.from(oddsCache.entries());
    for (const [key, value] of entries) {
        if (now - value.cachedAt >= ODDS_CACHE_TTL_MS) {
            oddsCache.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[Chat-Utils] 🧹 Cleaned ${cleaned} expired odds cache entries`);
    }
}, 10 * 60 * 1000);

// ============================================
// ODDS FETCHING (with caching)
// ============================================

/**
 * Fetch real bookmaker odds for a match
 * Uses 30-minute cache to reduce API quota usage
 * Returns default odds if fetch fails
 */
export async function fetchRealOdds(
    homeTeam: string,
    awayTeam: string,
    sport: string
): Promise<{ home: number; draw: number | null; away: number }> {
    // Default odds
    const defaultOdds = {
        home: 2.0,
        draw: sport.includes('soccer') ? 3.5 : null,
        away: 2.0,
    };

    // Check cache first
    const cached = getCachedOdds(sport, homeTeam, awayTeam);
    if (cached) {
        return cached;
    }

    try {
        if (!theOddsClient.isConfigured() || sport === 'unknown') {
            return defaultOdds;
        }

        console.log(`[Chat-Utils] 🌐 Fetching real odds for ${homeTeam} vs ${awayTeam} (${sport})...`);

        // Get events for this sport
        const { data: events } = await theOddsClient.getEvents(sport);

        // Find the specific match (fuzzy match team names)
        const matchEvent = events.find((e) => {
            const homeMatch =
                e.home_team.toLowerCase().includes(homeTeam.toLowerCase()) ||
                homeTeam.toLowerCase().includes(e.home_team.toLowerCase());
            const awayMatch =
                e.away_team.toLowerCase().includes(awayTeam.toLowerCase()) ||
                awayTeam.toLowerCase().includes(e.away_team.toLowerCase());
            return homeMatch && awayMatch;
        });

        if (!matchEvent) {
            console.log(`[Chat-Utils] Match not found in upcoming fixtures`);
            return defaultOdds;
        }

        console.log(`[Chat-Utils] ✅ Found match: ${matchEvent.home_team} vs ${matchEvent.away_team}`);

        // Get odds for this specific event
        const { data: eventWithOdds } = await theOddsClient.getEventOdds(
            sport,
            matchEvent.id,
            { regions: ['eu', 'uk'], markets: ['h2h'] }
        );

        const avgOdds = calculateAverageOdds(eventWithOdds);

        if (avgOdds.home > 0 && avgOdds.away > 0) {
            const result = { home: avgOdds.home, draw: avgOdds.draw, away: avgOdds.away };
            console.log(`[Chat-Utils] ✅ Real odds: Home=${result.home}, Draw=${result.draw}, Away=${result.away}`);

            // Cache the result
            setCachedOdds(sport, homeTeam, awayTeam, result);

            return result;
        }

        return defaultOdds;
    } catch (error) {
        console.error('[Chat-Utils] Odds fetch error:', error);
        return defaultOdds;
    }
}


// ============================================
// MATCH PREVIEW FORMATTING
// ============================================

/**
 * Format match-preview data for chat display
 * This is for full Match Insights data from /api/match-preview
 */
export function formatMatchPreviewForChat(
    data: any,
    homeTeam: string,
    awayTeam: string
): string {
    let context = `\n=== SPORTBOT MATCH PREVIEW: ${homeTeam} vs ${awayTeam} ===\n\n`;

    // Story/Narrative (most important for rich context)
    if (data.story?.narrative) {
        context += `📋 MATCH NARRATIVE:\n${data.story.narrative}\n\n`;
    }

    // Prediction/Verdict
    if (data.story?.favored) {
        const favored = data.story.favored;
        const confidence = data.story.confidence;
        const team = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'Draw';
        context += `🎯 PREDICTION: ${team} (${confidence} confidence)\n\n`;
    }

    // Market Edge (the KEY differentiator)
    if (data.marketIntel?.valueEdge?.hasValue) {
        const edge = data.marketIntel.valueEdge;
        context += `💎 VALUE EDGE DETECTED:\n`;
        context += `• Side: ${edge.side}\n`;
        context += `• Odds: ${edge.odds?.toFixed(2)}\n`;
        context += `• Edge: ${edge.edgePercent?.toFixed(1)}%\n`;
        context += `• Our probability: ${edge.ourProb?.toFixed(1)}% vs Market: ${edge.impliedProb?.toFixed(1)}%\n\n`;
    }

    // Bookmaker Odds (show the actual market odds)
    if (data.odds || data.marketIntel?.odds) {
        const odds = data.odds || data.marketIntel?.odds;
        context += `📊 BOOKMAKER ODDS:\n`;
        if (odds.home) context += `• ${homeTeam}: ${odds.home.toFixed(2)}\n`;
        if (odds.draw) context += `• Draw: ${odds.draw.toFixed(2)}\n`;
        if (odds.away) context += `• ${awayTeam}: ${odds.away.toFixed(2)}\n`;
        context += '\n';
    }

    // AI Probabilities
    if (data.probabilities) {
        context += `📈 AI PROBABILITY ESTIMATES:\n`;
        if (data.probabilities.homeWin)
            context += `• ${homeTeam} win: ${Math.round(data.probabilities.homeWin * 100)}%\n`;
        if (data.probabilities.draw !== null && data.probabilities.draw !== undefined) {
            context += `• Draw: ${Math.round(data.probabilities.draw * 100)}%\n`;
        }
        if (data.probabilities.awayWin)
            context += `• ${awayTeam} win: ${Math.round(data.probabilities.awayWin * 100)}%\n`;
        context += '\n';
    }

    // Form Data
    if (data.momentumAndForm?.homeForm?.length > 0 || data.momentumAndForm?.awayForm?.length > 0) {
        context += `📊 RECENT FORM:\n`;
        if (data.momentumAndForm.homeForm?.length > 0) {
            const formStr = data.momentumAndForm.homeForm
                .slice(0, 5)
                .map((m: any) => (m.result === 'W' ? 'W' : m.result === 'L' ? 'L' : 'D'))
                .join('-');
            context += `• ${homeTeam}: ${formStr}\n`;
        }
        if (data.momentumAndForm.awayForm?.length > 0) {
            const formStr = data.momentumAndForm.awayForm
                .slice(0, 5)
                .map((m: any) => (m.result === 'W' ? 'W' : m.result === 'L' ? 'L' : 'D'))
                .join('-');
            context += `• ${awayTeam}: ${formStr}\n`;
        }
        context += '\n';
    }

    // Universal Signals / Key Factors
    if (data.universalSignals?.length > 0) {
        context += `🔑 KEY FACTORS:\n`;
        for (const signal of data.universalSignals.slice(0, 4)) {
            const emoji = signal.favors === 'home' ? '🏠' : signal.favors === 'away' ? '✈️' : '⚖️';
            context += `${emoji} ${signal.name}: ${signal.insight || signal.description}\n`;
        }
        context += '\n';
    }

    // Injuries
    if (data.injuries?.home?.length > 0 || data.injuries?.away?.length > 0) {
        context += `🏥 INJURIES:\n`;
        if (data.injuries.home?.length > 0) {
            context += `• ${homeTeam}: ${data.injuries.home
                .slice(0, 3)
                .map((i: any) => i.player)
                .join(', ')}\n`;
        }
        if (data.injuries.away?.length > 0) {
            context += `• ${awayTeam}: ${data.injuries.away
                .slice(0, 3)
                .map((i: any) => i.player)
                .join(', ')}\n`;
        }
        context += '\n';
    }

    // Risk Level
    if (data.riskFlags?.riskLevel) {
        const riskEmoji =
            data.riskFlags.riskLevel === 'LOW'
                ? '🟢'
                : data.riskFlags.riskLevel === 'MEDIUM'
                    ? '🟡'
                    : '🔴';
        context += `⚠️ RISK: ${riskEmoji} ${data.riskFlags.riskLevel}\n`;
        if (data.riskFlags.warnings?.length > 0) {
            context += `Warnings: ${data.riskFlags.warnings.slice(0, 2).join(', ')}\n`;
        }
        context += '\n';
    }

    context += `⚠️ DISCLAIMER: This is educational analysis, not betting advice. Always gamble responsibly.\n`;
    context += `=== END SPORTBOT MATCH PREVIEW ===\n`;

    return context;
}

// ============================================
// ANALYZE API FORMATTING
// ============================================

/**
 * Format analyze API response for chat context
 * This is for on-demand analysis from /api/analyze
 */
export function formatAnalysisForChat(
    analysis: any,
    homeTeam: string,
    awayTeam: string
): string {
    const {
        probabilities,
        briefing,
        valueAnalysis,
        oddsComparison,
        riskAnalysis,
        tacticalAnalysis,
        momentumAndForm,
        injuryContext,
        preMatchInsights,
        upsetPotential,
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
        ].filter((e) => Math.abs(e.edge) > 1);

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
            const formStr = momentumAndForm.homeForm
                .slice(0, 5)
                .map((m: any) => (m.result === 'W' ? 'W' : m.result === 'L' ? 'L' : 'D'))
                .join('-');
            context += `• ${homeTeam}: ${formStr}`;
            if (momentumAndForm.homeFormScore) context += ` (Form score: ${momentumAndForm.homeFormScore}/10)`;
            context += '\n';
        }
        if (momentumAndForm.awayForm && momentumAndForm.awayForm.length > 0) {
            const formStr = momentumAndForm.awayForm
                .slice(0, 5)
                .map((m: any) => (m.result === 'W' ? 'W' : m.result === 'L' ? 'L' : 'D'))
                .join('-');
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
                context += `• ${homeTeam}: `;
                const injuries = injuryContext.homeTeamInjuries.slice(0, 3);
                context += injuries.map((i: any) => `${i.player} (${i.status})`).join(', ');
                context += '\n';
            }
            if (hasAwayInjuries) {
                context += `• ${awayTeam}: `;
                const injuries = injuryContext.awayTeamInjuries.slice(0, 3);
                context += injuries.map((i: any) => `${i.player} (${i.status})`).join(', ');
                context += '\n';
            }
            context += '\n';
        }
    }

    // Risk Analysis
    if (riskAnalysis?.riskLevel) {
        const riskEmoji =
            riskAnalysis.riskLevel === 'LOW' ? '🟢' : riskAnalysis.riskLevel === 'MEDIUM' ? '🟡' : '🔴';
        context += `⚠️ RISK LEVEL: ${riskEmoji} ${riskAnalysis.riskLevel}\n`;
        if (riskAnalysis.trapMatchWarning) {
            context += `🪤 TRAP MATCH WARNING: ${riskAnalysis.trapMatchWarning}\n`;
        }
        context += '\n';
    }

    // Tactical Analysis
    if (tacticalAnalysis?.keyBattles && tacticalAnalysis.keyBattles.length > 0) {
        context += `⚔️ KEY BATTLES:\n`;
        for (const battle of tacticalAnalysis.keyBattles.slice(0, 2)) {
            context += `• ${battle}\n`;
        }
        context += '\n';
    }

    // Pre-Match Insights / Viral Stats
    if (preMatchInsights?.viralStats && preMatchInsights.viralStats.length > 0) {
        context += `🔥 INTERESTING STATS:\n`;
        for (const stat of preMatchInsights.viralStats.slice(0, 2)) {
            context += `• ${stat}\n`;
        }
        context += '\n';
    }

    // Upset Potential
    if (upsetPotential?.isUpsetLikely) {
        context += `👀 UPSET ALERT: ${upsetPotential.reason}\n\n`;
    }

    context += `⚠️ DISCLAIMER: This is educational analysis, not betting advice. Always gamble responsibly.\n`;
    context += `=== END SPORTBOT ANALYSIS ===\n`;

    return context;
}

// ============================================
// MATCH PREVIEW / ANALYSIS FETCHER
// ============================================

/**
 * Fetch full match analysis - tries match-preview first, then analyze API
 * This ensures chat uses the SAME data as the main Match Insights page
 */
export async function fetchMatchPreviewOrAnalysis(
    homeTeam: string,
    awayTeam: string,
    sport: string,
    request: NextRequest
): Promise<MatchAnalysisResult> {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'sportbot.ai';
    const baseUrl = `${protocol}://${host}`;
    const cookies = request.headers.get('cookie') || '';
    const authHeader = request.headers.get('authorization') || '';

    // Generate match ID for match-preview endpoint
    const slugify = (text: string) =>
        text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    const getSportCode = (sportKey: string) => {
        const parts = sportKey.split('_');
        return parts.length >= 2 ? parts.slice(1).join('-') : sportKey;
    };

    const homeSlug = slugify(homeTeam);
    const awaySlug = slugify(awayTeam);
    const sportCode = getSportCode(sport);

    // Try multiple dates since matches could be yesterday, today, tomorrow, or day after
    // Yesterday is included for analyses generated the day before
    const datesToTry: string[] = [];
    for (let i = -1; i <= 2; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        datesToTry.push(date.toISOString().split('T')[0]);
    }

    console.log(`[Chat-Utils] Trying match-preview for: ${homeTeam} vs ${awayTeam}, dates: ${datesToTry.join(', ')}`);

    // 1. TRY MATCH-PREVIEW FIRST (full Match Insights data) - try multiple dates
    for (const dateStr of datesToTry) {
        const matchId = `${homeSlug}-vs-${awaySlug}-${sportCode}-${dateStr}`;

        try {
            const previewResponse = await withTimeout(
                fetch(`${baseUrl}/api/match-preview/${encodeURIComponent(matchId)}`, {
                    method: 'GET',
                    headers: {
                        Cookie: cookies,
                        Authorization: authHeader,
                    },
                }),
                8000, // Reduced timeout since we're trying multiple dates
                `Match Preview API (${dateStr})`
            );

            if (previewResponse?.ok) {
                const previewData = await previewResponse.json();

                // Check if this is actually good data (not a demo/fallback)
                if (!previewData.isDemo && previewData.story?.narrative) {
                    console.log(`[Chat-Utils] ✅ Got full Match Preview data for date ${dateStr}!`);
                    const context = formatMatchPreviewForChat(previewData, homeTeam, awayTeam);

                    // Build structured data for chat UI (same data as match page)
                    const structuredData: MatchAnalysisData = {
                        matchInfo: {
                            id: matchId,
                            homeTeam: previewData.matchInfo?.homeTeam || homeTeam,
                            awayTeam: previewData.matchInfo?.awayTeam || awayTeam,
                            league: previewData.matchInfo?.league || '',
                            sport: previewData.matchInfo?.sport || sport,
                            kickoff: previewData.matchInfo?.kickoff || dateStr,
                            venue: previewData.matchInfo?.venue,
                        },
                        story: {
                            favored: previewData.story?.favored || 'home',
                            confidence: previewData.story?.confidence || 'moderate',
                            narrative: previewData.story?.narrative,
                            snapshot: previewData.story?.snapshot,
                        },
                        universalSignals: previewData.universalSignals,
                        expectedScores: previewData.expectedScores,
                        matchUrl: `/match/${matchId}`,
                    };

                    return {
                        success: true,
                        context,
                        source: 'match-preview' as const,
                        odds: previewData.odds,
                        structuredData,
                    };
                } else {
                    console.log(`[Chat-Utils] Match-preview for ${dateStr} returned demo/fallback, trying next date...`);
                }
            } else {
                console.log(`[Chat-Utils] Match-preview for ${dateStr} failed (${previewResponse?.status}), trying next date...`);
            }
        } catch (previewError) {
            console.log(`[Chat-Utils] Match-preview error for ${dateStr}:`, previewError);
        }
    }

    console.log(`[Chat-Utils] All date attempts failed, checking Prediction table for fullResponse...`);

    // 2. CHECK PREDICTION TABLE FOR CACHED FULL RESPONSE (from pre-analyze)
    try {
        const { prisma } = await import('@/lib/prisma');

        // Look for a prediction with fullResponse for this match
        const prediction = await prisma.prediction.findFirst({
            where: {
                OR: [
                    {
                        AND: [
                            { matchName: { contains: homeTeam.split(' ')[0], mode: 'insensitive' } },
                            { matchName: { contains: awayTeam.split(' ')[0], mode: 'insensitive' } },
                        ]
                    },
                    {
                        AND: [
                            { matchName: { contains: awayTeam.split(' ')[0], mode: 'insensitive' } },
                            { matchName: { contains: homeTeam.split(' ')[0], mode: 'insensitive' } },
                        ]
                    }
                ],
                kickoff: { gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) }, // Within last 24h or future
            },
            orderBy: { kickoff: 'asc' },
        }) as any; // Cast to any to access fullResponse (Prisma types may be stale)

        if (prediction?.fullResponse) {
            console.log(`[Chat-Utils] ✅ Found Prediction.fullResponse for ${prediction.matchName}!`);
            const fullData = prediction.fullResponse as any;
            const context = formatMatchPreviewForChat(fullData, homeTeam, awayTeam);
            return {
                success: true,
                context,
                source: 'stored-prediction' as const,
                odds: fullData.odds,
            };
        } else {
            console.log(`[Chat-Utils] No Prediction.fullResponse found, falling back to analyze API...`);
        }
    } catch (predictionError) {
        console.log(`[Chat-Utils] Prediction lookup error:`, predictionError);
    }

    // 3. FALLBACK TO ANALYZE API with real odds
    console.log(`[Chat-Utils] Falling back to analyze API for ${homeTeam} vs ${awayTeam}...`);

    // Fetch real odds
    const realOdds = await fetchRealOdds(homeTeam, awayTeam, sport);

    // Call analyze API
    try {
        const analyzeResponse = await withTimeout(
            fetch(`${baseUrl}/api/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: cookies,
                },
                body: JSON.stringify({
                    matchData: {
                        sport,
                        league: 'Auto-detected',
                        homeTeam,
                        awayTeam,
                        matchDate: new Date().toISOString(),
                        sourceType: 'chat-utils',
                        odds: realOdds,
                    },
                }),
            }),
            30000,
            'Analyze API'
        );

        if (analyzeResponse?.ok) {
            const analysisData = await analyzeResponse.json();
            if (analysisData.success) {
                console.log(`[Chat-Utils] ✅ Got analysis from analyze API`);
                const context = formatAnalysisForChat(analysisData, homeTeam, awayTeam);
                return { success: true, context, source: 'analyze', odds: realOdds };
            }
        }
    } catch (analyzeErr) {
        console.log(`[Chat-Utils] Analyze API error:`, analyzeErr);
    }

    return { success: false, context: '', source: 'analyze' };
}

// ============================================
// SPORT DETECTION
// ============================================

/**
 * Detect sport from team names
 * Returns the sport key for API usage
 */
export function detectSportFromTeams(homeTeam: string, awayTeam: string): string {
    const teams = `${homeTeam} ${awayTeam}`.toLowerCase();

    // NBA Teams
    if (
        /lakers|celtics|warriors|bulls|heat|nets|knicks|76ers|bucks|nuggets|suns|mavericks|clippers|spurs|rockets|timberwolves|thunder|pelicans|grizzlies|hawks|hornets|wizards|pistons|pacers|magic|cavaliers|raptors|jazz|blazers|kings/i.test(
            teams
        )
    ) {
        return 'basketball_nba';
    }

    // NFL Teams
    if (
        /chiefs|eagles|49ers|cowboys|bills|bengals|ravens|dolphins|lions|packers|vikings|jets|patriots|broncos|chargers|raiders|titans|colts|jaguars|texans|steelers|browns|commanders|giants|saints|falcons|panthers|buccaneers|seahawks|rams|cardinals|bears/i.test(
            teams
        )
    ) {
        return 'americanfootball_nfl';
    }

    // NHL Teams
    if (
        /bruins|maple leafs|rangers|penguins|oilers|avalanche|panthers|lightning|hurricanes|stars|golden knights|blues|flames|wild|jets|canucks|kings|senators|red wings|islanders|capitals|flyers|devils|blackhawks|kraken|predators|sharks|sabres|canadiens|coyotes|ducks/i.test(
            teams
        )
    ) {
        return 'icehockey_nhl';
    }

    // Premier League
    if (
        /liverpool|manchester (united|city)|chelsea|arsenal|tottenham|newcastle|west ham|brighton|aston villa|everton|wolves|crystal palace|brentford|bournemouth|fulham|nottingham forest|leicester|leeds|southampton|luton/i.test(
            teams
        )
    ) {
        return 'soccer_epl';
    }

    // La Liga
    if (
        /real madrid|barcelona|atletico madrid|sevilla|valencia|villarreal|real betis|athletic bilbao|real sociedad|celta|getafe|osasuna|rayo vallecano|mallorca|girona|almeria|cadiz|granada|las palmas/i.test(
            teams
        )
    ) {
        return 'soccer_spain_la_liga';
    }

    // Serie A
    if (
        /juventus|inter|milan|napoli|roma|lazio|fiorentina|atalanta|bologna|torino|sassuolo|udinese|monza|empoli|genoa|lecce|cagliari|verona|salernitana|frosinone/i.test(
            teams
        )
    ) {
        return 'soccer_italy_serie_a';
    }

    // Bundesliga
    if (
        /bayern|dortmund|leverkusen|leipzig|frankfurt|wolfsburg|gladbach|stuttgart|freiburg|union berlin|werder|hoffenheim|mainz|augsburg|koln|bochum|heidenheim|darmstadt/i.test(
            teams
        )
    ) {
        return 'soccer_germany_bundesliga';
    }

    // Ligue 1
    if (
        /paris saint-germain|psg|marseille|lyon|monaco|lille|nice|lens|rennes|strasbourg|nantes|toulouse|montpellier|reims|lorient|le havre|metz|brest|clermont/i.test(
            teams
        )
    ) {
        return 'soccer_france_ligue_one';
    }

    // EuroLeague Basketball
    if (
        /real madrid|barcelona|fenerbahce|panathinaikos|olympiacos|maccabi|efes|virtus|milano|partizan|zalgiris|monaco|baskonia|alba berlin|ldkl|asvel/i.test(
            teams
        )
    ) {
        return 'basketball_euroleague';
    }

    // Default
    return 'unknown';
}

// ============================================
// MARKDOWN UTILITIES
// ============================================

/**
 * Strip markdown formatting from AI responses
 */
export function stripMarkdown(text: string): string {
    return text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^\s*[-*]\s+/gm, '• ')
        .replace(/  +/g, ' ')
        .trim();
}
