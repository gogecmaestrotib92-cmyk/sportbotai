/**
 * Team Profile Page
 * 
 * Deep dive into a single team's statistics, form, and upcoming matches.
 * Part of Phase 5: Retention features.
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Trophy,
  Target,
  Shield,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { TeamProfileData } from '@/app/api/team/[teamId]/route';
import FavoriteButton from '@/components/FavoriteButton';

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export default function TeamProfilePage({ params }: PageProps) {
  const { teamId } = use(params);
  const [profile, setProfile] = useState<TeamProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/team/${teamId}`);
        const data = await res.json();
        
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error || 'Failed to load team profile');
        }
      } catch (err) {
        setError('Failed to fetch team data');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading team profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-danger/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Team Not Found</h2>
          <p className="text-text-secondary mb-6">{error || 'Unable to load team data'}</p>
          <Link href="/analyzer" className="btn-primary">
            Back to Analyzer
          </Link>
        </div>
      </div>
    );
  }

  const { team, league, standing, stats, recentMatches, upcomingMatches } = profile;

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link 
            href="/my-teams"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Teams
          </Link>

          {/* Team Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Team Logo */}
            <div className="relative">
              <img
                src={team.logo}
                alt={team.name}
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/team-placeholder.png';
                }}
              />
            </div>

            {/* Team Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{team.name}</h1>
                <FavoriteButton 
                  teamName={team.name}
                  teamId={team.id.toString()}
                  sport="soccer"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                {league && (
                  <span className="flex items-center gap-2">
                    <img src={league.logo} alt={league.name} className="w-5 h-5" />
                    {league.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {team.country}
                </span>
                {team.founded && (
                  <span>Est. {team.founded}</span>
                )}
              </div>

              {team.venue && (
                <p className="text-text-muted text-sm mt-2">
                  🏟️ {team.venue.name}, {team.venue.city} ({team.venue.capacity?.toLocaleString()} capacity)
                </p>
              )}
            </div>

            {/* Standing Badge */}
            {standing && (
              <div className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-2xl p-4 text-center min-w-[120px]">
                <span className="text-4xl font-bold text-white">#{standing.position}</span>
                <p className="text-text-secondary text-sm mt-1">{standing.points} pts</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Form Section */}
          {stats && (
            <div className="bg-bg-card rounded-xl border border-divider p-6">
              <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Current Form
              </h3>
              
              {/* Form Display */}
              <div className="flex gap-1.5 mb-4">
                {stats.formArray.slice(-5).map((result, i) => (
                  <span
                    key={i}
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                      ${result === 'W' ? 'bg-green-500/20 text-green-400' : ''}
                      ${result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      ${result === 'L' ? 'bg-red-500/20 text-red-400' : ''}
                    `}
                  >
                    {result}
                  </span>
                ))}
              </div>

              {/* Form Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-bg rounded-lg p-3">
                  <span className="text-text-muted">Goals Scored</span>
                  <p className="text-xl font-bold text-white">{stats.goalsScored}</p>
                  <span className="text-xs text-text-muted">
                    {stats.avgGoalsScored.toFixed(2)}/game
                  </span>
                </div>
                <div className="bg-bg rounded-lg p-3">
                  <span className="text-text-muted">Goals Conceded</span>
                  <p className="text-xl font-bold text-white">{stats.goalsConceded}</p>
                  <span className="text-xs text-text-muted">
                    {stats.avgGoalsConceded.toFixed(2)}/game
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Home/Away Split */}
          {stats && (
            <div className="bg-bg-card rounded-xl border border-divider p-6">
              <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Home vs Away
              </h3>
              
              <div className="space-y-4">
                {/* Home Record */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Home</span>
                    <span className="text-white">
                      {stats.homeRecord.wins}W {stats.homeRecord.draws}D {stats.homeRecord.losses}L
                    </span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(stats.homeRecord.wins / stats.homeRecord.played) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-yellow-500"
                      style={{ width: `${(stats.homeRecord.draws / stats.homeRecord.played) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${(stats.homeRecord.losses / stats.homeRecord.played) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Away Record */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Away</span>
                    <span className="text-white">
                      {stats.awayRecord.wins}W {stats.awayRecord.draws}D {stats.awayRecord.losses}L
                    </span>
                  </div>
                  <div className="h-2 bg-bg rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${(stats.awayRecord.wins / stats.awayRecord.played) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-yellow-500"
                      style={{ width: `${(stats.awayRecord.draws / stats.awayRecord.played) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${(stats.awayRecord.losses / stats.awayRecord.played) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="bg-bg rounded-lg p-3 text-center">
                  <Shield className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{stats.cleanSheets}</p>
                  <span className="text-xs text-text-muted">Clean Sheets</span>
                </div>
                <div className="bg-bg rounded-lg p-3 text-center">
                  <Target className="w-5 h-5 text-warning mx-auto mb-1" />
                  <p className="text-xl font-bold text-white">{stats.failedToScore}</p>
                  <span className="text-xs text-text-muted">Failed to Score</span>
                </div>
              </div>
            </div>
          )}

          {/* League Standing */}
          {standing && (
            <div className="bg-bg-card rounded-xl border border-divider p-6">
              <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                League Standing
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Position</span>
                  <span className="text-2xl font-bold text-white">#{standing.position}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Points</span>
                  <span className="text-xl font-bold text-accent">{standing.points}</span>
                </div>
                <div className="h-px bg-divider" />
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-green-400 font-bold">{standing.wins}</p>
                    <span className="text-text-muted text-xs">Wins</span>
                  </div>
                  <div>
                    <p className="text-yellow-400 font-bold">{standing.draws}</p>
                    <span className="text-text-muted text-xs">Draws</span>
                  </div>
                  <div>
                    <p className="text-red-400 font-bold">{standing.losses}</p>
                    <span className="text-text-muted text-xs">Losses</span>
                  </div>
                </div>
                <div className="h-px bg-divider" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Goal Difference</span>
                  <span className={`font-bold ${standing.goalDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {standing.goalDiff > 0 ? '+' : ''}{standing.goalDiff}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Matches */}
          <div className="bg-bg-card rounded-xl border border-divider p-6 md:col-span-2">
            <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recent Matches
            </h3>
            
            {recentMatches.length > 0 ? (
              <div className="space-y-2">
                {recentMatches.slice(0, 5).map((match, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 bg-bg rounded-lg"
                  >
                    {/* Result Badge */}
                    <span className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                      ${match.result === 'W' ? 'bg-green-500/20 text-green-400' : ''}
                      ${match.result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                      ${match.result === 'L' ? 'bg-red-500/20 text-red-400' : ''}
                    `}>
                      {match.result}
                    </span>

                    {/* Opponent */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img 
                        src={match.opponentLogo} 
                        alt={match.opponent}
                        className="w-6 h-6 object-contain"
                      />
                      <span className="text-white truncate">
                        {match.home ? 'vs' : '@'} {match.opponent}
                      </span>
                    </div>

                    {/* Score */}
                    <span className="text-white font-mono font-bold">
                      {match.score}
                    </span>

                    {/* Date */}
                    <span className="text-text-muted text-xs shrink-0">
                      {new Date(match.date).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-center py-6">No recent matches found</p>
            )}
          </div>

          {/* Upcoming Matches */}
          <div className="bg-bg-card rounded-xl border border-divider p-6">
            <h3 className="text-sm font-medium text-text-muted mb-4 flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              Upcoming Fixtures
            </h3>
            
            {upcomingMatches.length > 0 ? (
              <div className="space-y-2">
                {upcomingMatches.slice(0, 5).map((match, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-3 bg-bg rounded-lg"
                  >
                    {/* Opponent */}
                    <img 
                      src={match.opponentLogo} 
                      alt={match.opponent}
                      className="w-6 h-6 object-contain"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm truncate block">
                        {match.home ? 'vs' : '@'} {match.opponent}
                      </span>
                      <span className="text-text-muted text-xs">{match.competition}</span>
                    </div>

                    {/* Date */}
                    <span className="text-text-secondary text-xs shrink-0">
                      {new Date(match.date).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted text-center py-6">No upcoming fixtures</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
