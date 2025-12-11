/**
 * Rest & Schedule Analysis Component
 * 
 * Displays detailed schedule context for both teams:
 * - Rest days since last game ("3 days rest" vs "1 day rest")
 * - Schedule density ("Playing 4th game in 6 days")
 * - Rest advantage calculation
 * - Fatigue risk assessment
 * 
 * Uses form data dates to calculate these metrics.
 */

'use client';

import { AnalyzeResponse, FormMatch } from '@/types';
import { useMemo } from 'react';
import TeamLogo from '../ui/TeamLogo';

interface RestScheduleCardProps {
  result: AnalyzeResponse;
}

interface TeamScheduleInfo {
  team: string;
  restDays: number | null;
  lastGameDate: string | null;
  gamesInLast7Days: number;
  gamesInLast14Days: number;
  isBackToBack: boolean;
  fatigueFactor: 'fresh' | 'normal' | 'tired' | 'exhausted';
}

// Calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Parse date string to Date object
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Calculate schedule info from form data
function calculateScheduleInfo(
  teamName: string,
  formMatches: FormMatch[] | undefined,
  matchDate: string
): TeamScheduleInfo {
  const now = new Date();
  const targetDate = parseDate(matchDate) || now;
  
  // Default values when no data
  if (!formMatches || formMatches.length === 0) {
    return {
      team: teamName,
      restDays: null,
      lastGameDate: null,
      gamesInLast7Days: 0,
      gamesInLast14Days: 0,
      isBackToBack: false,
      fatigueFactor: 'normal',
    };
  }

  // Sort matches by date (most recent first)
  const matchesWithDates = formMatches
    .map(m => ({ ...m, parsedDate: parseDate(m.date) }))
    .filter(m => m.parsedDate !== null)
    .sort((a, b) => b.parsedDate!.getTime() - a.parsedDate!.getTime());

  if (matchesWithDates.length === 0) {
    return {
      team: teamName,
      restDays: null,
      lastGameDate: null,
      gamesInLast7Days: 0,
      gamesInLast14Days: 0,
      isBackToBack: false,
      fatigueFactor: 'normal',
    };
  }

  const lastGame = matchesWithDates[0];
  const restDays = daysBetween(lastGame.parsedDate!, targetDate);
  
  // Count games in time windows
  const gamesInLast7Days = matchesWithDates.filter(m => 
    daysBetween(m.parsedDate!, targetDate) <= 7
  ).length;
  
  const gamesInLast14Days = matchesWithDates.filter(m => 
    daysBetween(m.parsedDate!, targetDate) <= 14
  ).length;

  // Determine fatigue factor
  let fatigueFactor: 'fresh' | 'normal' | 'tired' | 'exhausted' = 'normal';
  if (restDays >= 5) {
    fatigueFactor = 'fresh';
  } else if (restDays <= 1 || gamesInLast7Days >= 4) {
    fatigueFactor = 'exhausted';
  } else if (restDays <= 2 || gamesInLast7Days >= 3) {
    fatigueFactor = 'tired';
  }

  return {
    team: teamName,
    restDays,
    lastGameDate: lastGame.date || null,
    gamesInLast7Days,
    gamesInLast14Days,
    isBackToBack: restDays <= 1,
    fatigueFactor,
  };
}

// Get fatigue display config
function getFatigueConfig(factor: 'fresh' | 'normal' | 'tired' | 'exhausted'): {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
} {
  switch (factor) {
    case 'fresh':
      return {
        label: 'Well Rested',
        icon: '💪',
        color: 'text-success',
        bgColor: 'bg-success/10',
        description: '5+ days rest - peak recovery',
      };
    case 'normal':
      return {
        label: 'Normal Rest',
        icon: '✓',
        color: 'text-info',
        bgColor: 'bg-info/10',
        description: '3-4 days rest - standard recovery',
      };
    case 'tired':
      return {
        label: 'Limited Rest',
        icon: '⚠️',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        description: '2 days rest - some fatigue expected',
      };
    case 'exhausted':
      return {
        label: 'Fatigued',
        icon: '😓',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
        description: 'Back-to-back or heavy schedule',
      };
  }
}

export default function RestScheduleCard({ result }: RestScheduleCardProps) {
  const { matchInfo, momentumAndForm } = result;
  const { homeForm, awayForm } = momentumAndForm;

  const scheduleAnalysis = useMemo(() => {
    const homeSchedule = calculateScheduleInfo(
      matchInfo.homeTeam,
      homeForm,
      matchInfo.matchDate
    );
    const awaySchedule = calculateScheduleInfo(
      matchInfo.awayTeam,
      awayForm,
      matchInfo.matchDate
    );

    // Calculate rest advantage
    let restAdvantage: 'home' | 'away' | 'even' | 'unknown' = 'unknown';
    let restDiff = 0;
    
    if (homeSchedule.restDays !== null && awaySchedule.restDays !== null) {
      restDiff = homeSchedule.restDays - awaySchedule.restDays;
      if (restDiff >= 2) restAdvantage = 'home';
      else if (restDiff <= -2) restAdvantage = 'away';
      else restAdvantage = 'even';
    }

    return { homeSchedule, awaySchedule, restAdvantage, restDiff };
  }, [matchInfo, homeForm, awayForm]);

  const { homeSchedule, awaySchedule, restAdvantage, restDiff } = scheduleAnalysis;
  const homeFatigue = getFatigueConfig(homeSchedule.fatigueFactor);
  const awayFatigue = getFatigueConfig(awaySchedule.fatigueFactor);

  // Check if we have any meaningful data
  const hasData = homeSchedule.restDays !== null || awaySchedule.restDays !== null;

  return (
    <div className="bg-bg-card rounded-2xl border border-divider shadow-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-accent to-info rounded-lg flex items-center justify-center">
          <span className="text-sm">📅</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary">Rest & Schedule</h3>
          <p className="text-[10px] text-text-muted">Fatigue analysis</p>
        </div>
        
        {/* Rest Advantage Badge */}
        {restAdvantage !== 'unknown' && restAdvantage !== 'even' && (
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
            ${restAdvantage === 'home' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
            {restAdvantage === 'home' ? matchInfo.homeTeam : matchInfo.awayTeam} +{Math.abs(restDiff)}d rest
          </span>
        )}
      </div>

      {/* Rest Days Comparison */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        {/* Home Team */}
        <div className={`rounded-xl p-3 ${homeFatigue.bgColor} border border-divider/50`}>
          <div className="flex items-center gap-2 mb-1">
            <TeamLogo teamName={matchInfo.homeTeam} sport={matchInfo.sport} size="sm" />
            <p className="text-[10px] text-text-muted truncate">{matchInfo.homeTeam}</p>
          </div>
          
          {homeSchedule.restDays !== null ? (
            <>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl sm:text-3xl font-black text-text-primary">
                  {homeSchedule.restDays}
                </span>
                <span className="text-xs text-text-muted">days rest</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${homeFatigue.bgColor} ${homeFatigue.color} text-[10px] font-semibold`}>
                {homeFatigue.icon} {homeFatigue.label}
              </div>
            </>
          ) : (
            <div className="text-text-muted text-sm py-2">No schedule data</div>
          )}
        </div>

        {/* Away Team */}
        <div className={`rounded-xl p-3 ${awayFatigue.bgColor} border border-divider/50`}>
          <div className="flex items-center gap-2 mb-1">
            <TeamLogo teamName={matchInfo.awayTeam} sport={matchInfo.sport} size="sm" />
            <p className="text-[10px] text-text-muted truncate">{matchInfo.awayTeam}</p>
          </div>
          
          {awaySchedule.restDays !== null ? (
            <>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl sm:text-3xl font-black text-text-primary">
                  {awaySchedule.restDays}
                </span>
                <span className="text-xs text-text-muted">days rest</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${awayFatigue.bgColor} ${awayFatigue.color} text-[10px] font-semibold`}>
                {awayFatigue.icon} {awayFatigue.label}
              </div>
            </>
          ) : (
            <div className="text-text-muted text-sm py-2">No schedule data</div>
          )}
        </div>
      </div>

      {/* Schedule Density */}
      {hasData && (
        <div className="border-t border-divider pt-3">
          <p className="text-[10px] font-medium text-text-muted mb-2">📊 Schedule Density (Last 7 Days)</p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Home Schedule */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-5 rounded-sm transition-all ${
                      i < homeSchedule.gamesInLast7Days 
                        ? homeSchedule.gamesInLast7Days >= 3 ? 'bg-warning' : 'bg-primary'
                        : 'bg-bg-tertiary'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-text-secondary">
                {homeSchedule.gamesInLast7Days} game{homeSchedule.gamesInLast7Days !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Away Schedule */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-5 rounded-sm transition-all ${
                      i < awaySchedule.gamesInLast7Days 
                        ? awaySchedule.gamesInLast7Days >= 3 ? 'bg-warning' : 'bg-danger/70'
                        : 'bg-bg-tertiary'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-text-secondary">
                {awaySchedule.gamesInLast7Days} game{awaySchedule.gamesInLast7Days !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Schedule Insight */}
          {(homeSchedule.gamesInLast7Days >= 3 || awaySchedule.gamesInLast7Days >= 3) && (
            <div className="mt-3 p-2 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-[10px] text-warning">
                ⚠️ Heavy schedule detected: {
                  homeSchedule.gamesInLast7Days >= 3 && awaySchedule.gamesInLast7Days >= 3
                    ? 'Both teams have dense fixtures'
                    : homeSchedule.gamesInLast7Days >= 3
                      ? `${matchInfo.homeTeam} playing ${homeSchedule.gamesInLast7Days} games in 7 days`
                      : `${matchInfo.awayTeam} playing ${awaySchedule.gamesInLast7Days} games in 7 days`
                }
              </p>
            </div>
          )}

          {/* Back-to-back alert */}
          {(homeSchedule.isBackToBack || awaySchedule.isBackToBack) && (
            <div className="mt-2 p-2 bg-danger/10 rounded-lg border border-danger/20">
              <p className="text-[10px] text-danger">
                🔴 Back-to-back: {
                  homeSchedule.isBackToBack && awaySchedule.isBackToBack
                    ? 'Both teams on B2B'
                    : homeSchedule.isBackToBack
                      ? `${matchInfo.homeTeam} on back-to-back`
                      : `${matchInfo.awayTeam} on back-to-back`
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Rest Impact Note */}
      {restAdvantage !== 'unknown' && (
        <div className="mt-3 pt-3 border-t border-divider">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-text-muted">Rest Impact</span>
            <span className={`font-semibold ${
              restAdvantage === 'home' ? 'text-primary' : 
              restAdvantage === 'away' ? 'text-danger' : 
              'text-text-secondary'
            }`}>
              {restAdvantage === 'even' 
                ? 'Similar rest - no clear advantage'
                : `${Math.abs(restDiff)}+ day advantage to ${restAdvantage === 'home' ? matchInfo.homeTeam : matchInfo.awayTeam}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
