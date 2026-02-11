import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { isBase64, parseMatchSlug, decodeBase64MatchId } from '@/lib/match-utils';
import { findMatchingDemo } from '@/lib/demo-matches';
import { getDataLayer } from '@/lib/data-layer';
import { normalizeSport } from '@/lib/data-layer/bridge';

export type FastMatchPreviewData = any;

// Replicated from MatchPreviewClientV3 / logic
function parseMatchIdServer(matchId: string) {
  if (isBase64(matchId)) {
    const decoded = decodeBase64MatchId(matchId);
    if (decoded) {
      return {
        homeTeam: decoded.homeTeam || 'Home Team',
        awayTeam: decoded.awayTeam || 'Away Team',
        league: decoded.league || '',
        sport: decoded.sport || 'soccer',
        kickoff: decoded.kickoff || new Date().toISOString(),
      };
    }
  }

  const parsed = parseMatchSlug(matchId);
  if (parsed) {
    const toDisplayName = (slug: string) =>
      slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const sportCodeMap: Record<string, string> = {
      'nba': 'basketball_nba',
      'nhl': 'icehockey_nhl',
      'nfl': 'americanfootball_nfl',
      'epl': 'soccer_epl',
      'la-liga': 'soccer_spain_la_liga',
      'bundesliga': 'soccer_germany_bundesliga',
      'serie-a': 'soccer_italy_serie_a',
      'ligue-one': 'soccer_france_ligue_one',
      'euroleague': 'basketball_euroleague',
      'mls': 'soccer_usa_mls',
    };
    const sport = sportCodeMap[parsed.sportCode] || `soccer_${parsed.sportCode}`;

    return {
      homeTeam: toDisplayName(parsed.homeSlug),
      awayTeam: toDisplayName(parsed.awaySlug),
      league: parsed.sportCode.toUpperCase(),
      sport: sport,
      // Use date from slug, time will be filled from database/API with real kickoff time
      kickoff: parsed.date ? `${parsed.date}T00:00:00Z` : '',
    };
  }
  
  // Fallback underscore
   const parts = matchId.split('_');
  if (parts.length >= 3) {
    // Safely parse timestamp - only use if it's a valid number
    // Use empty string as fallback to avoid hydration mismatch (new Date() differs server/client)
    let kickoff = '';
    if (parts[3]) {
      const timestamp = parseInt(parts[3]);
      if (!isNaN(timestamp) && timestamp > 0) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          kickoff = date.toISOString();
        }
      }
    }
    return {
      homeTeam: parts[0].replace(/-/g, ' '),
      awayTeam: parts[1].replace(/-/g, ' '),
      league: parts[2].replace(/-/g, ' '),
      sport: 'soccer',
      kickoff: kickoff || undefined,
    };
  }

  return null;
}

/**
 * Quick bookmaker odds fetch for enriching pre-analyzed data that lacks odds.
 */
async function fetchBookmakerOddsForSSR(
  homeTeam: string,
  awayTeam: string,
  sport: string
): Promise<Array<{
  bookmaker: string;
  homeOdds: number;
  drawOdds?: number | null;
  awayOdds: number;
  lastUpdate?: string;
  spread?: { home: { line: number; odds: number }; away: { line: number; odds: number } };
  total?: { over: { line: number; odds: number }; under: { line: number; odds: number } };
}>> {
  try {
    const dataLayer = getDataLayer();
    const normalizedSport = normalizeSport(sport) as 'soccer' | 'basketball' | 'hockey' | 'american_football' | 'baseball' | 'mma' | 'tennis';

    const oddsResult = await dataLayer.getOdds(normalizedSport, homeTeam, awayTeam, {
      markets: ['h2h', 'spreads', 'totals'],
      sportKey: sport,
    });

    if (!oddsResult.success || !oddsResult.data || oddsResult.data.length === 0) {
      return [];
    }

    const bookmakerOdds: Array<{
      bookmaker: string;
      homeOdds: number;
      drawOdds?: number | null;
      awayOdds: number;
      lastUpdate?: string;
      spread?: { home: { line: number; odds: number }; away: { line: number; odds: number } };
      total?: { over: { line: number; odds: number }; under: { line: number; odds: number } };
    }> = [];

    for (const bm of oddsResult.data) {
      if (bm.moneyline) {
        bookmakerOdds.push({
          bookmaker: bm.bookmaker,
          homeOdds: bm.moneyline.home,
          drawOdds: bm.moneyline.draw ?? null,
          awayOdds: bm.moneyline.away,
          lastUpdate: bm.lastUpdate?.toISOString(),
          spread: bm.spread ? {
            home: { line: bm.spread.home.line, odds: bm.spread.home.odds },
            away: { line: bm.spread.away.line, odds: bm.spread.away.odds },
          } : undefined,
          total: bm.total ? {
            over: { line: bm.total.over.line, odds: bm.total.over.odds },
            under: { line: bm.total.under.line, odds: bm.total.under.odds },
          } : undefined,
        });
      }
    }

    return bookmakerOdds;
  } catch (error) {
    console.error('[Match-Preview-Server] Failed to fetch bookmaker odds:', error);
    return [];
  }
}

export async function getFastMatchData(matchId: string, isAnonymous: boolean): Promise<FastMatchPreviewData | null> {
    const matchInfo = parseMatchIdServer(matchId);
    if (!matchInfo) return null;

    // 1. Check Too Far Away
    if (matchInfo.kickoff) {
      // Logic: If kickoff is invalid, skip
      const kickoffTime = new Date(matchInfo.kickoff).getTime();
      if (!isNaN(kickoffTime)) {
          const kickoffDate = new Date(matchInfo.kickoff);
          const now = new Date();
          const hoursUntilKickoff = (kickoffDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          if (hoursUntilKickoff > 48) {
             const availableDate = new Date(kickoffDate.getTime() - 48 * 60 * 60 * 1000);
             const hoursUntilAvailable = (availableDate.getTime() - now.getTime()) / (1000 * 60 * 60);
             const daysUntilAvailable = Math.ceil(hoursUntilAvailable / 24);
            
             return {
              tooFarAway: true,
              hoursUntilKickoff,
              daysUntilKickoff: daysUntilAvailable,
              availableDate: availableDate.toISOString(),
              matchInfo: {
                id: matchId,
                ...matchInfo
              },
              message: `Analysis available in ${daysUntilAvailable} day${daysUntilAvailable > 1 ? 's' : ''}`,
              reason: 'Our AI analysis becomes available 48 hours before kickoff.',
             };
          }
      }
    }

    // 2. Check Pre-Analyzed
     const homeWord = matchInfo.homeTeam.split(/\s+/)[0];
     const awayWord = matchInfo.awayTeam.split(/\s+/)[0];
      
      const preAnalyzed = await prisma.prediction.findFirst({
        where: {
          AND: [
            { matchName: { contains: homeWord, mode: 'insensitive' } },
            { matchName: { contains: awayWord, mode: 'insensitive' } },
          ],
          kickoff: { gte: new Date() },
          NOT: { fullResponse: { equals: Prisma.DbNull } },
        },
        orderBy: { kickoff: 'asc' },
      });

      if (preAnalyzed?.fullResponse) {
          const fullData = preAnalyzed.fullResponse as any;

          // Enrich with bookmaker odds if missing (pre-analyzed before this feature)
          if (!fullData.bookmakerOdds || fullData.bookmakerOdds.length === 0) {
            try {
              const freshOdds = await fetchBookmakerOddsForSSR(
                fullData.matchInfo?.homeTeam || matchInfo.homeTeam,
                fullData.matchInfo?.awayTeam || matchInfo.awayTeam,
                fullData.matchInfo?.sport || matchInfo.sport
              );
              if (freshOdds.length > 0) {
                fullData.bookmakerOdds = freshOdds;
                console.log(`[Match-Preview-Server] Enriched pre-analyzed data with ${freshOdds.length} bookmaker odds`);
              }
            } catch (e) {
              console.error('[Match-Preview-Server] Failed to enrich with bookmaker odds:', e);
            }
          }

          return {
              matchInfo: fullData.matchInfo || { id: matchId, ...matchInfo },
              ...fullData,
               preAnalyzed: true,
               creditUsed: false,
          };
      }

    // 3. Check Demo (only if anonymous)
    if (isAnonymous) {
        const matchingDemo = findMatchingDemo(matchInfo.homeTeam, matchInfo.awayTeam, matchInfo.sport);
        if (matchingDemo) {
            return {
                ...matchingDemo.data,
                // Ensure matchInfo is correct
                matchInfo: {
                    ...matchingDemo.data.matchInfo,
                    id: matchId,
                    homeTeam: matchInfo.homeTeam,
                    awayTeam: matchInfo.awayTeam, // Use URL names to avoid mismatch
                },
                 isDemo: true,
                 demoId: matchingDemo.id,
            };
        }
    }

    return null;
}
