/**
 * Match Preview Client Component V2
 * 
 * AI-powered match analysis with storytelling approach.
 * Shows AI verdict, viral stats, and shareable insights.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  MatchStory,
  ViralStatsBar,
  MatchHeadlines,
  HomeAwaySplits,
  GoalsTiming,
  ContextFactors,
  ShareCard,
  KeyPlayerBattle,
  RefereeProfile,
} from '@/components/analysis';
import TeamLogo from '@/components/ui/TeamLogo';
import LeagueLogo from '@/components/ui/LeagueLogo';

interface MatchPreviewClientProps {
  matchId: string;
}

// Type for goals timing periods
interface GoalsTimingData {
  scoring: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90': number;
  };
  conceding: {
    '0-15': number;
    '16-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76-90': number;
  };
  insight?: string;
}

interface MatchPreviewData {
  matchInfo: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    kickoff: string;
    venue?: string;
  };
  story: {
    favored: 'home' | 'away' | 'draw';
    confidence: 'strong' | 'moderate' | 'slight';
    narrative: string;
    supportingStats: Array<{
      icon: string;
      stat: string;
      context: string;
    }>;
  };
  viralStats: {
    h2h: {
      headline: string;
      favors: 'home' | 'away' | 'even';
    };
    form: {
      home: string;
      away: string;
    };
    keyAbsence: {
      player: string;
      team: 'home' | 'away';
      impact: string;
    } | null;
    streak: {
      text: string;
      team: 'home' | 'away';
    } | null;
  };
  headlines: Array<{
    icon: string;
    text: string;
    favors: 'home' | 'away' | 'neutral';
    viral?: boolean;
  }>;
  homeAwaySplits: {
    homeTeamAtHome: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      cleanSheets: number;
      highlight?: string | null;
    };
    awayTeamAway: {
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      cleanSheets: number;
      highlight?: string | null;
    };
  };
  goalsTiming: {
    home: {
      scoring: Record<string, number>;
      conceding: Record<string, number>;
      insight?: string | null;
    };
    away: {
      scoring: Record<string, number>;
      conceding: Record<string, number>;
      insight?: string | null;
    };
  };
  contextFactors: Array<{
    id: string;
    icon: string;
    label: string;
    value: string;
    favors: string;
    note?: string;
  }>;
  keyPlayerBattle: {
    homePlayer: {
      name: string;
      position: string;
      photo?: string;
      seasonGoals: number;
      seasonAssists: number;
      form: string;
      minutesPlayed: number;
      rating?: number;
    };
    awayPlayer: {
      name: string;
      position: string;
      photo?: string;
      seasonGoals: number;
      seasonAssists: number;
      form: string;
      minutesPlayed: number;
      rating?: number;
    };
    battleType: 'attack-vs-defense' | 'midfield-duel' | 'top-scorers';
  } | null;
  referee: {
    name: string;
    photo?: string;
    matchesThisSeason: number;
    avgYellowCards: number;
    avgRedCards: number;
    avgFouls: number;
    penaltiesAwarded: number;
    homeWinRate: number;
    avgAddedTime: number;
  } | null;
}

export default function MatchPreviewClient({ matchId }: MatchPreviewClientProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<MatchPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/match-preview/${matchId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load match preview');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchPreview();
  }, [matchId]);

  if (loading) {
    return <MatchPreviewSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Match Not Found</h1>
          <p className="text-text-secondary mb-6">
            {error || "We couldn't find this match. It may have already been played or the link is incorrect."}
          </p>
          <Link 
            href="/matches"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-white font-medium hover:bg-primary/90 transition-colors"
          >
            <span>←</span>
            <span>Browse Matches</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Back button */}
        <Link 
          href="/matches"
          className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">All Matches</span>
        </Link>

        {/* Match Header */}
        <MatchHeader 
          homeTeam={data.matchInfo.homeTeam}
          awayTeam={data.matchInfo.awayTeam}
          league={data.matchInfo.league}
          sport={data.matchInfo.sport}
          kickoff={data.matchInfo.kickoff}
          venue={data.matchInfo.venue}
        />

        {/* Viral Stats Bar - The hook */}
        <div className="mt-6">
          <ViralStatsBar
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            stats={{
              h2h: {
                headline: data.viralStats.h2h.headline,
                favors: data.viralStats.h2h.favors,
              },
              form: {
                home: data.viralStats.form.home,
                away: data.viralStats.form.away,
              },
              keyAbsence: data.viralStats.keyAbsence ? {
                team: data.viralStats.keyAbsence.team,
                player: data.viralStats.keyAbsence.player,
                impact: 'key' as const,
              } : undefined,
              streak: data.viralStats.streak || undefined,
            }}
          />
        </div>

        {/* AI Match Story - The verdict */}
        <div className="mt-8">
          <MatchStory
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            favored={data.story.favored}
            confidence={data.story.confidence}
            narrative={data.story.narrative}
            supportingStats={data.story.supportingStats}
          />
        </div>

        {/* Match Headlines */}
        {data.headlines && data.headlines.length > 0 && (
          <div className="mt-8">
            <MatchHeadlines
              headlines={data.headlines}
              homeTeam={data.matchInfo.homeTeam}
              awayTeam={data.matchInfo.awayTeam}
            />
          </div>
        )}

        {/* Home/Away Splits */}
        <div className="mt-8">
          <HomeAwaySplits
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            homeTeamAtHome={{
              played: data.homeAwaySplits.homeTeamAtHome.played,
              wins: data.homeAwaySplits.homeTeamAtHome.wins,
              draws: data.homeAwaySplits.homeTeamAtHome.draws,
              losses: data.homeAwaySplits.homeTeamAtHome.losses,
              goalsFor: data.homeAwaySplits.homeTeamAtHome.goalsFor,
              goalsAgainst: data.homeAwaySplits.homeTeamAtHome.goalsAgainst,
              cleanSheets: data.homeAwaySplits.homeTeamAtHome.cleanSheets,
              highlight: data.homeAwaySplits.homeTeamAtHome.highlight || undefined,
            }}
            awayTeamAway={{
              played: data.homeAwaySplits.awayTeamAway.played,
              wins: data.homeAwaySplits.awayTeamAway.wins,
              draws: data.homeAwaySplits.awayTeamAway.draws,
              losses: data.homeAwaySplits.awayTeamAway.losses,
              goalsFor: data.homeAwaySplits.awayTeamAway.goalsFor,
              goalsAgainst: data.homeAwaySplits.awayTeamAway.goalsAgainst,
              cleanSheets: data.homeAwaySplits.awayTeamAway.cleanSheets,
              highlight: data.homeAwaySplits.awayTeamAway.highlight || undefined,
            }}
          />
        </div>

        {/* Goals Timing */}
        <div className="mt-8">
          <GoalsTiming
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            homeTiming={{
              scoring: data.goalsTiming.home.scoring as GoalsTimingData['scoring'],
              conceding: data.goalsTiming.home.conceding as GoalsTimingData['conceding'],
              insight: data.goalsTiming.home.insight || undefined,
            }}
            awayTiming={{
              scoring: data.goalsTiming.away.scoring as GoalsTimingData['scoring'],
              conceding: data.goalsTiming.away.conceding as GoalsTimingData['conceding'],
              insight: data.goalsTiming.away.insight || undefined,
            }}
          />
        </div>

        {/* Context Factors */}
        <div className="mt-8">
          <ContextFactors 
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            factors={data.contextFactors.map(f => ({
              ...f,
              favors: f.favors as 'home' | 'away' | 'neutral',
            }))} 
          />
        </div>

        {/* Key Player Battle */}
        {data.keyPlayerBattle && (
          <div className="mt-8">
            <KeyPlayerBattle
              homeTeam={data.matchInfo.homeTeam}
              awayTeam={data.matchInfo.awayTeam}
              homePlayer={data.keyPlayerBattle.homePlayer}
              awayPlayer={data.keyPlayerBattle.awayPlayer}
              battleType={data.keyPlayerBattle.battleType}
            />
          </div>
        )}

        {/* Referee Profile - only show if we have valid referee data */}
        {data.referee && data.referee.name && data.referee.name !== 'TBA' && (
          <div className="mt-8">
            <RefereeProfile
              referee={data.referee}
              homeTeam={data.matchInfo.homeTeam}
              awayTeam={data.matchInfo.awayTeam}
            />
          </div>
        )}

        {/* Share Card */}
        <div className="mt-8">
          <ShareCard
            matchId={matchId}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            verdict={data.headlines?.[0]?.text || `${data.matchInfo.homeTeam} vs ${data.matchInfo.awayTeam} analysis`}
            kickoff={data.matchInfo.kickoff}
          />
        </div>

        {/* Footer disclaimer */}
        <p className="text-center text-xs text-text-muted mt-12 max-w-lg mx-auto">
          SportBot AI provides match intelligence for educational purposes. 
          This is not betting advice. Always gamble responsibly if you choose to bet.
        </p>
      </div>
    </div>
  );
}

// Inline MatchHeader component
function MatchHeader({ 
  homeTeam, 
  awayTeam, 
  league,
  sport,
  kickoff, 
  venue 
}: { 
  homeTeam: string; 
  awayTeam: string; 
  league: string;
  sport: string;
  kickoff: string; 
  venue?: string;
}) {
  const kickoffDate = new Date(kickoff);
  const formattedDate = kickoffDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = kickoffDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="text-center">
      {/* League badge */}
      <div className="inline-flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full mb-6">
        <LeagueLogo leagueName={league} sport={sport} size="sm" />
        <span className="text-sm font-medium text-text-secondary">{league}</span>
      </div>

      {/* Teams with Logos */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center sm:items-end gap-3">
          <TeamLogo teamName={homeTeam} sport={sport} league={league} size="xl" />
          <div className="text-center sm:text-right">
            <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">{homeTeam}</h1>
            <span className="text-[10px] uppercase tracking-wider text-accent font-semibold">Home</span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex-shrink-0 px-3 sm:px-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center border border-white/10">
            <span className="text-lg sm:text-xl font-bold text-white/80">VS</span>
          </div>
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center sm:items-start gap-3">
          <TeamLogo teamName={awayTeam} sport={sport} league={league} size="xl" />
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight">{awayTeam}</h1>
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">Away</span>
          </div>
        </div>
      </div>

      {/* Match info */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
          <span className="text-base">📅</span>
          <span className="text-sm text-white font-medium">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
          <span className="text-base">⏰</span>
          <span className="text-sm text-white font-medium">{formattedTime}</span>
        </div>
        {venue && (
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
            <span className="text-base">📍</span>
            <span className="text-sm text-white font-medium">{venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Inline Skeleton component
function MatchPreviewSkeleton() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header skeleton */}
        <div className="text-center mb-8 animate-pulse">
          <div className="h-6 w-32 bg-white/10 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-center gap-8 mb-4">
            <div className="h-8 w-32 bg-white/10 rounded" />
            <div className="h-10 w-12 bg-primary/20 rounded" />
            <div className="h-8 w-32 bg-white/10 rounded" />
          </div>
          <div className="h-4 w-48 bg-white/10 rounded mx-auto" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
