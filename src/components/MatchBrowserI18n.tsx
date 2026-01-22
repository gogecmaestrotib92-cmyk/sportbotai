/**
 * Match Browser Component - i18n Version
 * 
 * Browse matches organized by Sport → League with locale support.
 * Sports: Soccer, Basketball, American Football, Hockey
 * Links to Match Preview pages.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MatchData } from '@/types';
import MatchCardI18n from '@/components/MatchCardI18n';
import { StaggeredItem } from '@/components/ui';
import LeagueLogo from '@/components/ui/LeagueLogo';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator';
import { Locale, getTranslations } from '@/lib/i18n/translations';
import SportLeagueSelectorI18n from '@/components/SportLeagueSelectorI18n';
import { 
  getTrendingMatches, 
  TrendingMatch, 
  getValueFlaggedMatches, 
  ValueFlaggedMatch,
  getValueContextLine 
} from '@/components/match-selector/trending';

// View mode type
type ViewMode = 'ai-picks' | 'all';
type TimeFilter = 'today' | 'tomorrow' | 'later';

interface MatchBrowserI18nProps {
  initialSport?: string;
  initialLeague?: string;
  maxMatches?: number;
  locale: Locale;
}

// Sports with their leagues organized - now uses locale for display names
const getSports = (locale: Locale) => {
  const t = getTranslations(locale);
  return [
    {
      id: 'soccer',
      name: t.matches.sports.soccer,
      icon: '⚽',
      leagues: [
        { key: 'soccer_epl', name: 'Premier League' },
        { key: 'soccer_spain_la_liga', name: 'La Liga' },
        { key: 'soccer_germany_bundesliga', name: 'Bundesliga' },
        { key: 'soccer_italy_serie_a', name: 'Serie A' },
        { key: 'soccer_france_ligue_one', name: 'Ligue 1' },
        { key: 'soccer_portugal_primeira_liga', name: 'Primeira Liga' },
        { key: 'soccer_netherlands_eredivisie', name: 'Eredivisie' },
        { key: 'soccer_turkey_super_league', name: 'Süper Lig' },
        { key: 'soccer_belgium_first_div', name: 'Jupiler Pro League' },
        { key: 'soccer_spl', name: 'Scottish Premiership' },
        { key: 'soccer_uefa_champs_league', name: 'Champions League' },
        { key: 'soccer_uefa_europa_league', name: 'Europa League' },
      ],
    },
    {
      id: 'basketball',
      name: t.matches.sports.basketball,
      icon: '🏀',
      leagues: [
        { key: 'basketball_nba', name: 'NBA' },
        { key: 'basketball_euroleague', name: 'EuroLeague' },
      ],
    },
    {
      id: 'americanfootball',
      name: t.matches.sports.americanFootball,
      icon: '🏈',
      leagues: [
        { key: 'americanfootball_nfl', name: 'NFL' },
        { key: 'americanfootball_ncaaf', name: 'NCAA Football' },
      ],
    },
    {
      id: 'hockey',
      name: t.matches.sports.hockey,
      icon: '🏒',
      leagues: [
        { key: 'icehockey_nhl', name: 'NHL' },
      ],
    },
  ];
};

// Tournaments that have off-seasons or breaks
const SEASONAL_LEAGUES = [
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league', 
  'soccer_uefa_europa_conference_league',
  'americanfootball_ncaaf',
];

// Generate context line based on match hot factors
function getMatchContext(match: TrendingMatch): string {
  const factors = match.hotFactors;
  
  if (factors.derbyScore >= 10) {
    return 'Rivalry match • High market interest';
  }
  if (factors.proximityScore >= 8) {
    return 'Starting soon • Market active';
  }
  if (factors.marketScore >= 7) {
    return 'Multiple markets available';
  }
  if (factors.bookmakerScore >= 6) {
    return 'High bookmaker coverage';
  }
  if (factors.leagueScore >= 8) {
    return 'Top-tier fixture';
  }
  return 'Market signals detected';
}

// Type for AI picks data from API
interface AiPickData {
  aiReason: string;
  valueBetEdge: number | null;
  conviction: number;
}

// Create normalized key for matching (same logic as API)
function createMatchKey(homeTeam: string, awayTeam: string): string {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${normalize(homeTeam)}_vs_${normalize(awayTeam)}`;
}

export default function MatchBrowserI18n({ initialSport, initialLeague, maxMatches = 12, locale }: MatchBrowserI18nProps) {
  const t = getTranslations(locale);
  const SPORTS = getSports(locale);
  
  const [selectedSport, setSelectedSport] = useState(initialSport || 'soccer');
  const [selectedLeague, setSelectedLeague] = useState(initialLeague || SPORTS[0].leagues[0].key);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [leagueMatchCounts, setLeagueMatchCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // AI Picks from pre-analyzed predictions (real AI data)
  // Using matchKey (team names) for reliable matching instead of matchId
  const [aiPicksData, setAiPicksData] = useState<{
    flaggedMatchKeys: Record<string, boolean>;
    aiPicksMap: Record<string, AiPickData>;
  }>({ flaggedMatchKeys: {}, aiPicksMap: {} });
  
  // New state for filters
  const [viewMode, setViewMode] = useState<ViewMode>('ai-picks');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

  // Get locale path prefix for links
  const localePath = locale === 'sr' ? '/sr' : '';

  const currentSport = SPORTS.find(s => s.id === selectedSport) || SPORTS[0];
  const currentLeague = currentSport.leagues.find(l => l.key === selectedLeague) || currentSport.leagues[0];

  // Set initial sport from league param
  useEffect(() => {
    if (initialLeague) {
      // Find which sport contains this league
      const sportWithLeague = SPORTS.find(s => 
        s.leagues.some(l => l.key === initialLeague)
      );
      if (sportWithLeague) {
        setSelectedSport(sportWithLeague.id);
        setSelectedLeague(initialLeague);
      }
    }
  }, [initialLeague]);

  // When sport changes, select first league of that sport (only if current league isn't valid)
  useEffect(() => {
    const sport = SPORTS.find(s => s.id === selectedSport);
    if (sport && sport.leagues.length > 0 && !initialLeague) {
      // Only reset if current league doesn't belong to the new sport
      const leagueBelongsToSport = sport.leagues.some(l => l.key === selectedLeague);
      if (!leagueBelongsToSport) {
        setSelectedLeague(sport.leagues[0].key);
      }
    }
  }, [selectedSport, initialLeague, selectedLeague]);

  // Pre-fetch match counts for ALL leagues (for badges and trending)
  useEffect(() => {
    async function fetchLeagueCounts() {
      const counts: Record<string, number> = {};
      const allLeagues = SPORTS.flatMap(sport => sport.leagues);
      
      // Fetch counts in parallel for all leagues across all sports
      await Promise.all(
        allLeagues.map(async (league) => {
          try {
            const response = await fetch(`/api/match-data?sportKey=${league.key}&includeOdds=false`);
            if (response.ok) {
              const data = await response.json();
              counts[league.key] = data.events?.length || 0;
            } else {
              counts[league.key] = 0;
            }
          } catch {
            counts[league.key] = 0;
          }
        })
      );
      
      setLeagueMatchCounts(counts);
    }

    fetchLeagueCounts();
  }, []); // Fetch once on mount for all leagues

  // Fetch AI Picks from pre-analyzed predictions (real AI data)
  const fetchAiPicks = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-picks?limit=50');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.aiPicks) {
          const flaggedIds: Record<string, boolean> = {};
          const picksMap: Record<string, AiPickData> = {};
          
          // Use matchKey for reliable matching (team-name based)
          for (const pick of data.aiPicks) {
            const matchKey = pick.matchKey || createMatchKey(pick.homeTeam, pick.awayTeam);
            flaggedIds[matchKey] = true;
            picksMap[matchKey] = {
              aiReason: pick.aiReason,
              valueBetEdge: pick.valueBetEdge,
              conviction: pick.conviction,
            };
          }
          
          setAiPicksData({ flaggedMatchKeys: flaggedIds, aiPicksMap: picksMap });
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI picks:', err);
    }
  }, []);

  // Fetch AI picks once on mount
  useEffect(() => {
    fetchAiPicks();
  }, [fetchAiPicks]);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/match-data?sportKey=${selectedLeague}&includeOdds=false`);
      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
      setMatches(data.events || []);
    } catch {
      setError('Could not load matches');
    } finally {
      setIsLoading(false);
    }
  }, [selectedLeague]);

  // Calculate hot matches for the selected league
  const hotMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    return getTrendingMatches(matches, 3);
  }, [matches]);

  // Get hot match IDs for badge display
  const hotMatchIds = useMemo(() => {
    return new Set(hotMatches.map(m => m.matchId));
  }, [hotMatches]);

  // Filter matches by time
  const filterMatchesByTime = useCallback((matchList: MatchData[], filter: TimeFilter): MatchData[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    return matchList.filter(match => {
      const matchDate = new Date(match.commenceTime);
      if (filter === 'today') {
        return matchDate >= today && matchDate < tomorrow;
      } else if (filter === 'tomorrow') {
        return matchDate >= tomorrow && matchDate < dayAfterTomorrow;
      } else {
        return matchDate >= dayAfterTomorrow;
      }
    });
  }, []);

  // AI-flagged matches: Use REAL pre-analyzed data from /api/ai-picks
  const aiFlaggedMatches = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    // Primary: Use real AI picks from pre-analyze cron (stored in DB)
    const hasFlaggedData = Object.keys(aiPicksData.flaggedMatchKeys).length > 0;
    if (hasFlaggedData) {
      // Filter using matchKey for reliable matching
      const flagged = matches.filter(m => {
        const matchKey = createMatchKey(m.homeTeam, m.awayTeam);
        return aiPicksData.flaggedMatchKeys[matchKey];
      });
      
      // If we have flagged matches for THIS league, use them
      if (flagged.length > 0) {
        return flagged.sort((a, b) => {
          const aKey = createMatchKey(a.homeTeam, a.awayTeam);
          const bKey = createMatchKey(b.homeTeam, b.awayTeam);
          const aData = aiPicksData.aiPicksMap[aKey];
          const bData = aiPicksData.aiPicksMap[bKey];
          const aScore = (aData?.valueBetEdge || 0) + (aData?.conviction || 0) / 10;
          const bScore = (bData?.valueBetEdge || 0) + (bData?.conviction || 0) / 10;
          return bScore - aScore;
        });
      }
      // If no matches for this league, fall through to heuristic
    }
    
    // Fallback: client-side heuristic if no pre-analyzed data for current matches
    return getValueFlaggedMatches(matches, Math.min(10, matches.length));
  }, [matches, aiPicksData]);

  // Create a map for quick lookup of value data
  const valueFlaggedMap = useMemo(() => {
    const map = new Map<string, ValueFlaggedMatch>();
    // Only use fallback if no API data
    const hasFlaggedData = Object.keys(aiPicksData.flaggedMatchKeys).length > 0;
    if (!hasFlaggedData) {
      const fallbackMatches = getValueFlaggedMatches(matches, Math.min(10, matches.length));
      fallbackMatches.forEach(m => map.set(m.matchId, m));
    }
    return map;
  }, [matches, Object.keys(aiPicksData.flaggedMatchKeys).length]);

  // Apply filters to get final match list
  const filteredMatches = useMemo(() => {
    let result = matches;
    
    // Apply time filter first
    result = filterMatchesByTime(result, timeFilter);
    
    // Apply view mode filter
    // Only filter to AI picks if there are flagged matches in this time period
    if (viewMode === 'ai-picks') {
      const flaggedIds = new Set(aiFlaggedMatches.map(m => m.matchId));
      const aiPicksInTimeFilter = result.filter(m => flaggedIds.has(m.matchId));
      
      // Only apply filter if there are AI picks in this time period
      // Otherwise show all matches (graceful degradation)
      if (aiPicksInTimeFilter.length > 0) {
        result = aiPicksInTimeFilter;
      }
    }
    
    return result;
  }, [matches, timeFilter, viewMode, aiFlaggedMatches, filterMatchesByTime]);

  // Count matches per time period
  const matchCountsByTime = useMemo(() => {
    return {
      today: filterMatchesByTime(matches, 'today').length,
      tomorrow: filterMatchesByTime(matches, 'tomorrow').length,
      later: filterMatchesByTime(matches, 'later').length,
    };
  }, [matches, filterMatchesByTime]);

  // Count AI-flagged matches per time period
  const flaggedCountsByTime = useMemo(() => {
    const flaggedIds = new Set(aiFlaggedMatches.map(m => m.matchId));
    return {
      today: filterMatchesByTime(matches, 'today').filter(m => flaggedIds.has(m.matchId)).length,
      tomorrow: filterMatchesByTime(matches, 'tomorrow').filter(m => flaggedIds.has(m.matchId)).length,
      later: filterMatchesByTime(matches, 'later').filter(m => flaggedIds.has(m.matchId)).length,
    };
  }, [matches, aiFlaggedMatches, filterMatchesByTime]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Pull-to-refresh DISABLED - causing scroll issues on Android Chrome
  // Users can use browser's native pull-to-refresh or the refresh button
  const isRefreshing = false;
  const pullDistance = 0;

  return (
    <section className="py-8 sm:py-12">
      {/* Pull to Refresh Indicator - DISABLED */}
      {/* <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing} 
      /> */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sport & League Selector - Responsive Design */}
        <SportLeagueSelectorI18n
          sports={SPORTS}
          selectedSport={selectedSport}
          selectedLeague={selectedLeague}
          leagueMatchCounts={leagueMatchCounts}
          onSportChange={setSelectedSport}
          onLeagueChange={setSelectedLeague}
          locale={locale}
        />

        {/* AI Picks / All Toggle + Time Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 py-4 border-b border-white/5">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-1">
            <button
              onClick={() => setViewMode('ai-picks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'ai-picks'
                  ? 'bg-accent text-bg-primary shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
              {t.matches.aiPicks}
              {aiFlaggedMatches.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  viewMode === 'ai-picks' ? 'bg-bg-primary/30' : 'bg-white/10'
                }`}>
                  {flaggedCountsByTime[timeFilter]}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t.matches.allMatches}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                viewMode === 'all' ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {matchCountsByTime[timeFilter]}
              </span>
            </button>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center gap-1 bg-bg-elevated rounded-lg p-1">
            <button
              onClick={() => setTimeFilter('today')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeFilter === 'today'
                  ? 'bg-white/10 text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t.matches.today}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                timeFilter === 'today' ? 'bg-accent/20 text-accent' : 'bg-white/5'
              }`}>
                {viewMode === 'ai-picks' ? flaggedCountsByTime.today : matchCountsByTime.today}
              </span>
            </button>
            <button
              onClick={() => setTimeFilter('tomorrow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeFilter === 'tomorrow'
                  ? 'bg-white/10 text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t.matches.tomorrow}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                timeFilter === 'tomorrow' ? 'bg-accent/20 text-accent' : 'bg-white/5'
              }`}>
                {viewMode === 'ai-picks' ? flaggedCountsByTime.tomorrow : matchCountsByTime.tomorrow}
              </span>
            </button>
            <button
              onClick={() => setTimeFilter('later')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                timeFilter === 'later'
                  ? 'bg-white/10 text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {t.matches.later}
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                timeFilter === 'later' ? 'bg-accent/20 text-accent' : 'bg-white/5'
              }`}>
                {viewMode === 'ai-picks' ? flaggedCountsByTime.later : matchCountsByTime.later}
              </span>
            </button>
          </div>
        </div>

        {/* 🔥 Hot Matches Section - Only show in All mode */}
        {!isLoading && !error && hotMatches.length > 0 && viewMode === 'all' && (
          <div className="mb-6 -mx-4 sm:mx-0 relative">
            <div className="flex items-center justify-between px-4 sm:px-0 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-semibold text-white">{t.matches.hotIn} {currentLeague.name}</span>
                <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full">{hotMatches.length} {t.matches.signals}</span>
              </div>
              {/* Navigation arrows - visible when more than 1 card */}
              {hotMatches.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const container = document.getElementById('hot-matches-scroll-sr');
                      if (container) container.scrollBy({ left: -320, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    aria-label="Prethodno"
                  >
                    <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const container = document.getElementById('hot-matches-scroll-sr');
                      if (container) container.scrollBy({ left: 320, behavior: 'smooth' });
                    }}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    aria-label="Sledeće"
                  >
                    <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div 
              id="hot-matches-scroll-sr"
              className="flex gap-4 overflow-x-auto pb-3 px-4 md:px-0 scrollbar-hide snap-x snap-mandatory overflow-y-visible pt-3 scroll-px-4 md:scroll-px-0"
            >
              {hotMatches.map((match, index) => (
                <div 
                  key={match.matchId} 
                  className="flex-shrink-0 w-[280px] sm:w-[320px] snap-start md:snap-start"
                >
                  <MatchCardI18n
                    matchId={match.matchId}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    league={currentLeague.name}
                    sportKey={selectedLeague}
                    commenceTime={match.commenceTime}
                    locale={locale}
                    badge={index === 0 ? '🔥 Hottest' : '📊 Trending'}
                    contextLine={getMatchContext(match)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current League Header */}
        <div className="flex items-center gap-3 mb-4 py-3 border-t border-white/5">
          <LeagueLogo leagueName={currentLeague.name} sport={selectedLeague} size="md" />
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{currentLeague.name}</h3>
            <p className="text-sm text-text-muted">
              {isLoading ? t.matches.loadingMatches : (
                viewMode === 'ai-picks' 
                  ? flaggedCountsByTime[timeFilter] > 0
                    ? `${flaggedCountsByTime[timeFilter]} ${t.matches.aiFlaggedMatches}`
                    : `${filteredMatches.length} ${t.matches.matchesText} • ${locale === 'sr' ? 'Nema AI izbora za' : 'No AI picks for'} ${timeFilter}`
                  : `${filteredMatches.length} ${t.matches.of} ${matches?.length || 0} ${t.matches.matchesText}`
              )}
            </p>
          </div>
        </div>

        {/* Loading State with Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-glass rounded-xl p-4">
                {/* League & Time Skeleton */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="w-20 h-3 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  </div>
                  <div className="w-10 h-5 rounded-full bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
                {/* Teams Skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="w-24 h-4 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  </div>
                  <div className="w-6 h-4 rounded bg-white/5 mx-2" />
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="w-24 h-4 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className="w-8 h-8 rounded-lg bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  </div>
                </div>
                {/* Footer Skeleton */}
                <div className="mt-3 pt-3 border-t border-divider flex items-center justify-between">
                  <div className="w-16 h-3 rounded bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  <div className="w-20 h-7 rounded-full bg-white/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16 bg-gradient-to-b from-red-500/5 to-transparent rounded-2xl border border-red-500/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t.matches.connectionIssue}</h3>
            <p className="text-gray-400 mb-6 max-w-sm mx-auto">
              {t.matches.connectionError} {currentLeague.name}. {t.matches.temporaryIssue}
            </p>
            <button 
              onClick={() => setSelectedLeague(selectedLeague)} 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {t.matches.tryAgain}
            </button>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && !error && filteredMatches && filteredMatches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.slice(0, maxMatches).map((match, index) => {
              // Get AI data from real API or fallback heuristic
              const matchKey = createMatchKey(match.homeTeam, match.awayTeam);
              const aiPickData = aiPicksData.aiPicksMap[matchKey];
              const valueFlagged = valueFlaggedMap.get(match.matchId);
              const trendingMatch = hotMatches.find(m => m.matchId === match.matchId);
              
              // Determine badge and context based on view mode
              let badge: string | undefined;
              let contextLine: string | undefined;
              
              if (viewMode === 'ai-picks') {
                badge = `🎯 ${t.matches.aiFlagged}`;
                // Priority: Real AI reason > fallback heuristic > generic
                if (aiPickData) {
                  contextLine = aiPickData.aiReason;
                } else if (valueFlagged) {
                  contextLine = getValueContextLine(valueFlagged);
                }
              } else if (trendingMatch) {
                contextLine = getMatchContext(trendingMatch);
              }
              
              return (
                <StaggeredItem key={match.matchId} index={index} staggerDelay={50} initialDelay={80}>
                  <MatchCardI18n
                    matchId={match.matchId}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    league={currentLeague.name}
                    sportKey={selectedLeague}
                    commenceTime={match.commenceTime}
                    locale={locale}
                    badge={badge}
                    contextLine={contextLine}
                  />
                </StaggeredItem>
              );
            })}
          </div>
        )}

        {/* Empty State - No matches after filters */}
        {!isLoading && !error && filteredMatches.length === 0 && matches.length > 0 && (
          <div className="text-center py-12 bg-gradient-to-b from-accent/5 to-transparent rounded-2xl border border-accent/10">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {matchCountsByTime[timeFilter] === 0 
                ? (locale === 'sr' 
                    ? `Nema utakmica ${timeFilter === 'today' ? 'danas' : timeFilter === 'tomorrow' ? 'sutra' : 'ove nedelje'}`
                    : `No matches ${timeFilter === 'today' ? 'today' : timeFilter === 'tomorrow' ? 'tomorrow' : 'this week'}`)
                : t.matches.noAiPicksForTimeframe
              }
            </h3>
            <p className="text-gray-400 mb-4 max-w-sm mx-auto text-sm">
              {matchCountsByTime[timeFilter] === 0
                ? (locale === 'sr'
                    ? `Nema zakazanih utakmica. Probajte drugi dan.`
                    : `No matches scheduled. Check another day.`)
                : `${t.matches.noAiPicksForTimeframe}. ${t.matches.viewAllMatches}`
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {viewMode === 'ai-picks' && matchCountsByTime[timeFilter] > 0 && (
                <button
                  onClick={() => setViewMode('all')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t.matches.viewAllMatches}
                </button>
              )}
              {timeFilter !== 'tomorrow' && matchCountsByTime.tomorrow > 0 && (
                <button
                  onClick={() => setTimeFilter('tomorrow')}
                  className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
                >
                  {t.matches.checkTomorrow} ({matchCountsByTime.tomorrow})
                </button>
              )}
              {timeFilter !== 'later' && matchCountsByTime.later > 0 && (
                <button
                  onClick={() => setTimeFilter('later')}
                  className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors"
                >
                  {locale === 'sr' ? 'Pogledaj kasnije' : 'Check Later'} ({matchCountsByTime.later})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!matches || matches.length === 0) && (
          <div className="text-center py-16 bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {SEASONAL_LEAGUES.includes(selectedLeague) ? t.matches.competitionOnBreak : t.matches.noUpcomingMatches}
            </h3>
            <p className="text-gray-400 mb-2 max-w-sm mx-auto">
              {SEASONAL_LEAGUES.includes(selectedLeague) 
                ? `${currentLeague.name} ${t.matches.betweenMatchdays}`
                : `${t.matches.noScheduledMatches} ${currentLeague.name} ${t.matches.atTheMoment}`
              }
            </p>
            <p className="text-sm text-text-muted mb-6">
              {SEASONAL_LEAGUES.includes(selectedLeague)
                ? t.matches.exploreOtherLeagues
                : t.matches.checkBackLater
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentSport.leagues
                .filter(l => l.key !== selectedLeague && (leagueMatchCounts[l.key] || 0) > 0)
                .slice(0, 3)
                .map((league) => (
                <button
                  key={league.key}
                  onClick={() => setSelectedLeague(league.key)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  <LeagueLogo leagueName={league.name} sport={league.key} size="xs" />
                  {league.name}
                  <span className="text-xs text-primary">({leagueMatchCounts[league.key]})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show More */}
        {!isLoading && filteredMatches && filteredMatches.length > maxMatches && (
          <div className="text-center mt-6">
            <p className="text-sm text-text-muted">
              {t.matches.showingOf} {maxMatches} {t.matches.of} {filteredMatches.length} {t.matches.matchesText}
              {viewMode === 'ai-picks' && ` (${matches.length} total)`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
