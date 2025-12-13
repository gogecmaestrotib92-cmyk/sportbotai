/**
 * Match Preview API - V2
 * 
 * Generates comprehensive match analysis data:
 * - AI Match Story (verdict + narrative)
 * - Viral Stats (H2H, Form, Key Absence)
 * - Match Headlines (shareable facts)
 * - Home/Away Splits
 * - Goals Timing
 * - Context Factors
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnrichedMatchData, getMatchInjuries, getMatchGoalTiming, getMatchKeyPlayers, getFixtureReferee, getMatchFixtureInfo } from '@/lib/football-api';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RouteParams {
  params: Promise<{ matchId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { matchId } = await params;

    // Parse match ID to extract teams
    const matchInfo = parseMatchId(matchId);
    
    if (!matchInfo) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Fetch enriched data from API-Football
    const [enrichedData, injuries, goalTimingData, keyPlayers, referee, fixtureInfo] = await Promise.all([
      getEnrichedMatchData(
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        matchInfo.league
      ),
      getMatchInjuries(
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        matchInfo.league
      ),
      getMatchGoalTiming(
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        matchInfo.league
      ),
      getMatchKeyPlayers(
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        matchInfo.league
      ),
      getFixtureReferee(
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        matchInfo.league
      ),
      getMatchFixtureInfo(
        matchInfo.homeTeam,
        matchInfo.awayTeam,
        matchInfo.league
      ),
    ]);

    // Use venue from fixture info if available, fallback to matchInfo
    const venue = fixtureInfo.venue || matchInfo.venue;

    // Build form strings
    const homeFormStr = enrichedData.homeForm?.map(m => m.result).join('') || 'DDDDD';
    const awayFormStr = enrichedData.awayForm?.map(m => m.result).join('') || 'DDDDD';

    // Calculate wins/draws/losses from form
    const countForm = (form: string) => ({
      wins: (form.match(/W/g) || []).length,
      draws: (form.match(/D/g) || []).length,
      losses: (form.match(/L/g) || []).length,
      played: form.length,
    });

    const homeFormCounts = countForm(homeFormStr);
    const awayFormCounts = countForm(awayFormStr);

    // Calculate stats
    const homeStats = {
      goalsScored: enrichedData.homeStats?.goalsScored || 0,
      goalsConceded: enrichedData.homeStats?.goalsConceded || 0,
      played: homeFormCounts.played,
      wins: homeFormCounts.wins,
      draws: homeFormCounts.draws,
      losses: homeFormCounts.losses,
    };

    const awayStats = {
      goalsScored: enrichedData.awayStats?.goalsScored || 0,
      goalsConceded: enrichedData.awayStats?.goalsConceded || 0,
      played: awayFormCounts.played,
      wins: awayFormCounts.wins,
      draws: awayFormCounts.draws,
      losses: awayFormCounts.losses,
    };

    // H2H summary
    const h2h = {
      totalMeetings: enrichedData.h2hSummary?.totalMatches || 0,
      homeWins: enrichedData.h2hSummary?.homeWins || 0,
      awayWins: enrichedData.h2hSummary?.awayWins || 0,
      draws: enrichedData.h2hSummary?.draws || 0,
    };

    // Generate AI analysis with new comprehensive prompt
    const aiAnalysis = await generateAIAnalysis({
      homeTeam: matchInfo.homeTeam,
      awayTeam: matchInfo.awayTeam,
      league: matchInfo.league,
      kickoff: matchInfo.kickoff,
      homeForm: homeFormStr,
      awayForm: awayFormStr,
      homeStats,
      awayStats,
      h2h,
    });

    // Build key absence from injuries data
    const findKeyAbsence = () => {
      // Check home team injuries first
      const homeKeyPlayer = injuries.home.find(i => 
        i.position?.toLowerCase().includes('forward') || 
        i.position?.toLowerCase().includes('striker') ||
        i.position?.toLowerCase().includes('midfielder')
      );
      if (homeKeyPlayer) {
        return {
          player: homeKeyPlayer.player,
          team: 'home' as const,
          impact: `${homeKeyPlayer.reason}: ${homeKeyPlayer.details}`,
        };
      }
      // Check away team
      const awayKeyPlayer = injuries.away.find(i => 
        i.position?.toLowerCase().includes('forward') || 
        i.position?.toLowerCase().includes('striker') ||
        i.position?.toLowerCase().includes('midfielder')
      );
      if (awayKeyPlayer) {
        return {
          player: awayKeyPlayer.player,
          team: 'away' as const,
          impact: `${awayKeyPlayer.reason}: ${awayKeyPlayer.details}`,
        };
      }
      // Return first injury if any
      if (injuries.home.length > 0) {
        return {
          player: injuries.home[0].player,
          team: 'home' as const,
          impact: `${injuries.home[0].reason}: ${injuries.home[0].details}`,
        };
      }
      if (injuries.away.length > 0) {
        return {
          player: injuries.away[0].player,
          team: 'away' as const,
          impact: `${injuries.away[0].reason}: ${injuries.away[0].details}`,
        };
      }
      return null;
    };

    // Build viral stats
    const viralStats = {
      h2h: {
        headline: buildH2HHeadline(matchInfo.homeTeam, matchInfo.awayTeam, h2h),
        favors: h2h.homeWins > h2h.awayWins ? 'home' : h2h.awayWins > h2h.homeWins ? 'away' : 'even',
      },
      form: {
        home: homeFormStr.slice(-5),
        away: awayFormStr.slice(-5),
      },
      keyAbsence: findKeyAbsence(),
      streak: detectStreak(homeFormStr, awayFormStr, matchInfo.homeTeam, matchInfo.awayTeam),
    };

    // Build home/away splits (using overall stats as proxy)
    const homeAwaySplits = {
      homeTeamAtHome: {
        played: Math.ceil(homeStats.played / 2),
        wins: Math.ceil(homeStats.wins * 0.6),
        draws: Math.ceil(homeStats.draws / 2),
        losses: Math.floor(homeStats.losses * 0.4),
        goalsFor: Math.ceil(homeStats.goalsScored * 0.55),
        goalsAgainst: Math.floor(homeStats.goalsConceded * 0.45),
        cleanSheets: Math.ceil(homeStats.played * 0.25),
        highlight: homeStats.wins > homeStats.losses ? `Strong at home this season` : null,
      },
      awayTeamAway: {
        played: Math.ceil(awayStats.played / 2),
        wins: Math.floor(awayStats.wins * 0.4),
        draws: Math.ceil(awayStats.draws / 2),
        losses: Math.ceil(awayStats.losses * 0.6),
        goalsFor: Math.floor(awayStats.goalsScored * 0.45),
        goalsAgainst: Math.ceil(awayStats.goalsConceded * 0.55),
        cleanSheets: Math.floor(awayStats.played * 0.15),
        highlight: awayStats.wins > awayStats.losses ? `Good travellers this season` : null,
      },
    };

    // Build goals timing from real API data
    const goalsTiming = buildGoalsTimingFromData(goalTimingData, matchInfo.homeTeam, matchInfo.awayTeam);

    // Build context factors
    const contextFactors = buildContextFactors(matchInfo, homeStats, awayStats, h2h);

    // Generate TTS audio for the narrative (async, don't block)
    let audioUrl: string | undefined;
    if (process.env.ELEVENLABS_API_KEY && aiAnalysis.story?.narrative) {
      try {
        const ttsText = buildTTSScript(
          matchInfo.homeTeam,
          matchInfo.awayTeam,
          aiAnalysis.story.favored,
          aiAnalysis.story.confidence,
          aiAnalysis.story.narrative
        );
        audioUrl = await generateTTSAudio(ttsText, matchId);
      } catch (error) {
        console.error('TTS generation failed:', error);
        // Continue without audio
      }
    }

    const response = {
      matchInfo: {
        id: matchId,
        homeTeam: matchInfo.homeTeam,
        awayTeam: matchInfo.awayTeam,
        league: matchInfo.league,
        sport: 'soccer',
        kickoff: matchInfo.kickoff,
        venue: venue, // Use venue from fixture info
      },
      story: {
        ...aiAnalysis.story,
        audioUrl,
      },
      viralStats,
      headlines: aiAnalysis.headlines,
      homeAwaySplits,
      goalsTiming,
      contextFactors,
      // New viral features
      keyPlayerBattle: keyPlayers.home && keyPlayers.away ? {
        homePlayer: {
          name: keyPlayers.home.name,
          position: keyPlayers.home.position,
          photo: keyPlayers.home.photo,
          seasonGoals: keyPlayers.home.goals,
          seasonAssists: keyPlayers.home.assists,
          form: homeFormStr.slice(-5),
          minutesPlayed: keyPlayers.home.minutesPlayed,
          rating: keyPlayers.home.rating,
        },
        awayPlayer: {
          name: keyPlayers.away.name,
          position: keyPlayers.away.position,
          photo: keyPlayers.away.photo,
          seasonGoals: keyPlayers.away.goals,
          seasonAssists: keyPlayers.away.assists,
          form: awayFormStr.slice(-5),
          minutesPlayed: keyPlayers.away.minutesPlayed,
          rating: keyPlayers.away.rating,
        },
        battleType: 'top-scorers' as const,
      } : null,
      referee: referee,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Match preview error:', error);
    return NextResponse.json(
      { error: 'Failed to generate match preview' },
      { status: 500 }
    );
  }
}

/**
 * Normalize league names for display
 */
function normalizeLeagueName(league: string): string {
  const leagueMap: Record<string, string> = {
    // EPL variations
    'epl': 'Premier League',
    'english premier league': 'Premier League',
    'premier league': 'Premier League',
    'england - premier league': 'Premier League',
    // La Liga
    'la liga': 'La Liga',
    'spain - la liga': 'La Liga',
    'laliga': 'La Liga',
    // Serie A
    'serie a': 'Serie A',
    'italy - serie a': 'Serie A',
    // Bundesliga
    'bundesliga': 'Bundesliga',
    'germany - bundesliga': 'Bundesliga',
    // Ligue 1
    'ligue 1': 'Ligue 1',
    'france - ligue 1': 'Ligue 1',
    // Champions League
    'uefa champions league': 'Champions League',
    'champions league': 'Champions League',
    // Europa League
    'uefa europa league': 'Europa League',
    'europa league': 'Europa League',
  };

  const normalized = league.toLowerCase().trim();
  return leagueMap[normalized] || league;
}

function parseMatchId(matchId: string) {
  try {
    const decoded = Buffer.from(matchId, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    return {
      homeTeam: parsed.homeTeam,
      awayTeam: parsed.awayTeam,
      league: normalizeLeagueName(parsed.league),
      kickoff: parsed.kickoff || new Date().toISOString(),
      venue: parsed.venue || null,
    };
  } catch {
    const parts = matchId.split('_');
    if (parts.length >= 3) {
      return {
        homeTeam: parts[0].replace(/-/g, ' '),
        awayTeam: parts[1].replace(/-/g, ' '),
        league: normalizeLeagueName(parts[2].replace(/-/g, ' ')),
        kickoff: parts[3] ? new Date(parseInt(parts[3])).toISOString() : new Date().toISOString(),
        venue: null,
      };
    }
    return null;
  }
}

function buildH2HHeadline(homeTeam: string, awayTeam: string, h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number }) {
  if (h2h.totalMeetings === 0) return 'First ever meeting';
  
  const dominantTeam = h2h.homeWins > h2h.awayWins ? homeTeam : awayTeam;
  const dominantWins = Math.max(h2h.homeWins, h2h.awayWins);
  
  if (dominantWins >= 5) {
    return `${dominantTeam}: ${dominantWins} wins in last ${h2h.totalMeetings}`;
  }
  if (h2h.draws >= h2h.totalMeetings / 2) {
    return `${h2h.draws} draws in ${h2h.totalMeetings} meetings`;
  }
  return `${h2h.homeWins}-${h2h.draws}-${h2h.awayWins} in ${h2h.totalMeetings} meetings`;
}

function detectStreak(homeForm: string, awayForm: string, homeTeam: string, awayTeam: string) {
  const homeWinStreak = (homeForm.match(/W+$/) || [''])[0].length;
  const awayWinStreak = (awayForm.match(/W+$/) || [''])[0].length;
  const homeUnbeaten = (homeForm.match(/[WD]+$/) || [''])[0].length;
  const awayUnbeaten = (awayForm.match(/[WD]+$/) || [''])[0].length;

  if (homeWinStreak >= 3) return { text: `${homeWinStreak} wins in a row`, team: 'home' as const };
  if (awayWinStreak >= 3) return { text: `${awayWinStreak} wins in a row`, team: 'away' as const };
  if (homeUnbeaten >= 5) return { text: `${homeUnbeaten} unbeaten`, team: 'home' as const };
  if (awayUnbeaten >= 5) return { text: `${awayUnbeaten} unbeaten`, team: 'away' as const };
  
  return null;
}

function buildGoalsTiming(homeGoals: number, awayGoals: number) {
  const distribute = (total: number) => {
    const base = Math.max(1, Math.floor(total / 6));
    return {
      '0-15': base + Math.floor(Math.random() * 2),
      '16-30': base + Math.floor(Math.random() * 2),
      '31-45': base + Math.floor(Math.random() * 3),
      '46-60': base + Math.floor(Math.random() * 2),
      '61-75': base + Math.floor(Math.random() * 3),
      '76-90': base + Math.floor(Math.random() * 4),
    };
  };

  return {
    home: {
      scoring: distribute(homeGoals),
      conceding: distribute(Math.floor(homeGoals * 0.8)),
      insight: homeGoals > 10 ? 'Tend to score late in matches' : null,
    },
    away: {
      scoring: distribute(awayGoals),
      conceding: distribute(Math.floor(awayGoals * 0.8)),
      insight: awayGoals > 10 ? 'Dangerous in second half' : null,
    },
  };
}

function buildContextFactors(
  matchInfo: { homeTeam: string; awayTeam: string; league: string; kickoff: string },
  homeStats: { played: number; wins: number; goalsScored: number },
  awayStats: { played: number; wins: number; goalsScored: number },
  h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number }
) {
  const factors = [];

  if (h2h.totalMeetings > 0) {
    const avgGoals = ((homeStats.goalsScored + awayStats.goalsScored) / Math.max(1, homeStats.played + awayStats.played) * 2).toFixed(1);
    factors.push({
      id: 'fixture-goals',
      icon: '⚽',
      label: 'Fixture Average',
      value: `${avgGoals} goals/game`,
      favors: 'neutral',
    });
  }

  factors.push({
    id: 'stakes',
    icon: '🏆',
    label: 'Stakes',
    value: 'League points at stake',
    favors: 'neutral',
    note: 'Both teams motivated',
  });

  factors.push({
    id: 'home-advantage',
    icon: '🏟️',
    label: 'Home Factor',
    value: `${matchInfo.homeTeam} at home`,
    favors: 'home',
    note: 'Home advantage typically worth 0.5 goals',
  });

  factors.push({
    id: 'rest',
    icon: '⏰',
    label: 'Rest Days',
    value: 'Both teams fresh',
    favors: 'neutral',
  });

  return factors;
}

async function generateAIAnalysis(data: {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  homeForm: string;
  awayForm: string;
  homeStats: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number };
  awayStats: { goalsScored: number; goalsConceded: number; played: number; wins: number; draws: number; losses: number };
  h2h: { totalMeetings: number; homeWins: number; awayWins: number; draws: number };
}) {
  const prompt = `You are an expert football analyst. Analyze this upcoming match and provide your verdict.

MATCH: ${data.homeTeam} vs ${data.awayTeam}
COMPETITION: ${data.league}
DATE: ${data.kickoff}

DATA:
- ${data.homeTeam} form: ${data.homeForm} (Last 5: ${data.homeForm.slice(-5)})
- ${data.homeTeam} season: ${data.homeStats.wins}W-${data.homeStats.draws}D-${data.homeStats.losses}L, ${data.homeStats.goalsScored} goals scored, ${data.homeStats.goalsConceded} conceded
- ${data.awayTeam} form: ${data.awayForm} (Last 5: ${data.awayForm.slice(-5)})  
- ${data.awayTeam} season: ${data.awayStats.wins}W-${data.awayStats.draws}D-${data.awayStats.losses}L, ${data.awayStats.goalsScored} goals scored, ${data.awayStats.goalsConceded} conceded
- Head to Head (${data.h2h.totalMeetings} matches): ${data.homeTeam} ${data.h2h.homeWins} wins, ${data.awayTeam} ${data.h2h.awayWins} wins, ${data.h2h.draws} draws

Generate a compelling analysis. Return JSON:

{
  "story": {
    "favored": "home" | "away" | "draw",
    "confidence": "strong" | "moderate" | "slight",
    "narrative": "2-3 paragraphs explaining WHY you favor this outcome. Use storytelling. Reference specific stats. Be engaging but analytical. Explain the key factors that tip the balance.",
    "supportingStats": [
      { "icon": "emoji", "stat": "Key stat", "context": "Why it matters" }
    ]
  },
  "headlines": [
    { "icon": "emoji", "text": "Shareable one-liner fact", "favors": "home|away|neutral", "viral": true/false }
  ]
}

IMPORTANT:
- Be specific with data, don't be vague
- Your narrative should JUSTIFY your verdict
- Headlines should be screenshot-worthy facts
- No betting advice, just analysis
- Be confident but acknowledge uncertainty
- Use standard ASCII apostrophes (') not fancy quotes
- Use standard ASCII characters only in text`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1200,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error('No content');
    
    // Normalize unicode characters
    const normalizedContent = content
      .replace(/[\u2018\u2019]/g, "'")  // Fancy single quotes to straight
      .replace(/[\u201C\u201D]/g, '"')  // Fancy double quotes to straight
      .replace(/\u2013/g, '-')          // En-dash to hyphen
      .replace(/\u2014/g, '--')         // Em-dash to double hyphen
      .replace(/\u2026/g, '...');       // Ellipsis to dots
    
    return JSON.parse(normalizedContent);
  } catch (error) {
    console.error('AI generation failed:', error);
    
    const homeWinRate = data.homeStats.played > 0 ? data.homeStats.wins / data.homeStats.played : 0.33;
    const awayWinRate = data.awayStats.played > 0 ? data.awayStats.wins / data.awayStats.played : 0.33;
    const favored = homeWinRate > awayWinRate + 0.1 ? 'home' : awayWinRate > homeWinRate + 0.1 ? 'away' : 'draw';

    return {
      story: {
        favored,
        confidence: 'moderate',
        narrative: `${data.homeTeam} welcomes ${data.awayTeam} in what promises to be a competitive ${data.league} fixture.\n\n${data.homeTeam} come into this match with a record of ${data.homeStats.wins} wins from ${data.homeStats.played} games, while ${data.awayTeam} have ${data.awayStats.wins} wins from ${data.awayStats.played}. The head-to-head record shows ${data.h2h.homeWins} wins for the home side and ${data.h2h.awayWins} for the visitors.\n\nBased on current form and home advantage, ${favored === 'home' ? data.homeTeam : favored === 'away' ? data.awayTeam : 'neither side'} appears to have a slight edge heading into this fixture.`,
        supportingStats: [
          { icon: '📊', stat: `${data.homeForm.slice(-5)} recent form`, context: `${data.homeTeam}'s last 5` },
          { icon: '⚔️', stat: `${data.h2h.totalMeetings} meetings`, context: 'Head to head record' },
        ],
      },
      headlines: [
        { icon: '⚽', text: `${data.homeTeam} have scored ${data.homeStats.goalsScored} goals this season`, favors: 'neutral', viral: false },
        { icon: '📈', text: `${data.awayTeam} form: ${data.awayForm.slice(-5)}`, favors: 'neutral', viral: false },
      ],
    };
  }
}

/**
 * Build goals timing from real API data
 */
function buildGoalsTimingFromData(
  goalTimingData: { home: { scoring: Record<string, number>; conceding: Record<string, number>; totalGoals: number }; away: { scoring: Record<string, number>; conceding: Record<string, number>; totalGoals: number } },
  homeTeam: string,
  awayTeam: string
) {
  // Generate insights based on peak scoring times
  const findPeakPeriod = (scoring: Record<string, number>) => {
    let max = 0;
    let peak = '76-90';
    for (const [period, goals] of Object.entries(scoring)) {
      if (goals > max) {
        max = goals;
        peak = period;
      }
    }
    return peak;
  };

  const homePeak = findPeakPeriod(goalTimingData.home.scoring);
  const awayPeak = findPeakPeriod(goalTimingData.away.scoring);

  const periodLabels: Record<string, string> = {
    '0-15': 'early',
    '16-30': 'mid first half',
    '31-45': 'before halftime',
    '46-60': 'after the break',
    '61-75': 'in the final third',
    '76-90': 'late',
  };

  return {
    home: {
      scoring: goalTimingData.home.scoring,
      conceding: goalTimingData.home.conceding,
      insight: goalTimingData.home.totalGoals > 5 
        ? `${homeTeam} tend to score ${periodLabels[homePeak] || 'late'} in matches`
        : null,
    },
    away: {
      scoring: goalTimingData.away.scoring,
      conceding: goalTimingData.away.conceding,
      insight: goalTimingData.away.totalGoals > 5
        ? `${awayTeam} are dangerous ${periodLabels[awayPeak] || 'late'}`
        : null,
    },
  };
}

/**
 * Build TTS script from analysis
 */
function buildTTSScript(
  homeTeam: string,
  awayTeam: string,
  favored: 'home' | 'away' | 'draw',
  confidence: 'strong' | 'moderate' | 'slight',
  narrative: string
): string {
  const favoredTeam = favored === 'home' ? homeTeam : favored === 'away' ? awayTeam : 'a draw';
  const confidenceText = confidence === 'strong' ? 'strongly' : confidence === 'moderate' ? '' : 'slightly';
  
  // Clean narrative for TTS (remove markdown, excessive punctuation)
  const cleanNarrative = narrative
    .replace(/\n+/g, '. ')
    .replace(/[*_#]/g, '')
    .slice(0, 800); // Limit for TTS

  return `Match preview: ${homeTeam} versus ${awayTeam}. Our analysis ${confidenceText} favors ${favoredTeam}. ${cleanNarrative}`;
}

/**
 * Generate TTS audio using ElevenLabs via internal API
 */
async function generateTTSAudio(text: string, matchId: string): Promise<string | undefined> {
  try {
    // Call our TTS API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('TTS API returned error:', response.status);
      return undefined;
    }

    const result = await response.json();
    
    if (result.success && result.audioBase64) {
      // Return as data URL for immediate playback
      return `data:${result.contentType || 'audio/mpeg'};base64,${result.audioBase64}`;
    }

    return undefined;
  } catch (error) {
    console.error('TTS generation error:', error);
    return undefined;
  }
}
