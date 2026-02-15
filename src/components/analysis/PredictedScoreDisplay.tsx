/**
 * Game Outlook Display Component — Premium Visual Edition
 * 
 * Sport-aware display with SVG-based visuals:
 * - Soccer/Hockey: Predicted score with radial progress rings + glow
 * - NBA/NFL: O/U line with animated comparison bars
 * 
 * Design: Apple Health / Linear / Stripe aesthetic
 */

'use client';

import { useState, useEffect } from 'react';
import PremiumIcon from '@/components/ui/PremiumIcon';

// Format O/U line to 1 decimal place (e.g., 226.6153846 → 226.5)
const formatLine = (line: number): string => {
    const rounded = Math.round(line * 2) / 2;
    return rounded.toFixed(1);
};

// Helper to detect high-scoring sports where exact score prediction doesn't make sense
const isHighScoringSport = (sport: string): boolean => {
    const lowerSport = sport.toLowerCase();
    return lowerSport.includes('basketball') ||
        lowerSport.includes('nba') ||
        lowerSport.includes('nfl') ||
        lowerSport.includes('americanfootball') ||
        (lowerSport.includes('football') && !lowerSport.includes('soccer'));
};

// i18n translations
const translations = {
    en: {
        predictedScore: 'Predicted Score',
        basedOnModel: 'AI statistical model',
        gameOutlook: 'Game Outlook',
        bettingInsight: 'Betting insights',
        totalPoints: 'Total Points',
        spread: 'Spread',
        favored: 'Favored',
        favoredBy: 'by',
        expectedTotal: 'Our Model',
        marketLine: 'Market Line',
        over: 'Over',
        under: 'Under',
        valueOver: 'Value on OVER',
        valueUnder: 'Value on UNDER',
        noData: 'No line available',
        goals: 'goals',
        expectedGoals: 'xG Total',
    },
    sr: {
        predictedScore: 'Predviđen Rezultat',
        basedOnModel: 'AI statistički model',
        gameOutlook: 'Pregled Utakmice',
        bettingInsight: 'Kladioničarski uvid',
        totalPoints: 'Ukupno Poena',
        spread: 'Hendikep',
        favored: 'Favorit',
        favoredBy: 'za',
        expectedTotal: 'Naš Model',
        marketLine: 'Linija',
        over: 'Više',
        under: 'Manje',
        valueOver: 'Vrednost na VIŠE',
        valueUnder: 'Vrednost na MANJE',
        noData: 'Linija nije dostupna',
        goals: 'golova',
        expectedGoals: 'xG Ukupno',
    },
};

// ============================================
// SVG Score Ring — Circular ring around score number
// ============================================
function ScoreRing({ 
    score, 
    maxScore = 5, 
    color, 
    glowColor, 
    size = 96,
    animate = true,
}: { 
    score: number; 
    maxScore?: number; 
    color: string; 
    glowColor: string; 
    size?: number;
    animate?: boolean;
}) {
    const [progress, setProgress] = useState(animate ? 0 : score / maxScore);
    
    useEffect(() => {
        if (!animate) return;
        const timer = setTimeout(() => setProgress(Math.min(score / maxScore, 1)), 100);
        return () => clearTimeout(timer);
    }, [score, maxScore, animate]);

    const strokeWidth = 3;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <filter id={`glow-${color.replace('#', '')}`}>
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ 
                        transition: animate ? 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                        filter: `drop-shadow(0 0 6px ${glowColor})`,
                    }}
                />
            </svg>
            {/* Score number */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span 
                    className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight"
                    style={{ color }}
                >
                    {Math.round(score)}
                </span>
            </div>
        </div>
    );
}

// ============================================
// O/U Comparison Bar — Visual bar showing model vs market
// ============================================
function OUComparisonBar({
    modelValue,
    marketValue,
    animate = true,
}: {
    modelValue: number;
    marketValue: number;
    animate?: boolean;
}) {
    const [animated, setAnimated] = useState(!animate);
    useEffect(() => {
        if (!animate) return;
        const timer = setTimeout(() => setAnimated(true), 100);
        return () => clearTimeout(timer);
    }, [animate]);

    const min = Math.min(modelValue, marketValue) * 0.85;
    const max = Math.max(modelValue, marketValue) * 1.15;
    const range = max - min;

    const modelPos = range > 0 ? ((modelValue - min) / range) * 100 : 50;
    const marketPos = range > 0 ? ((marketValue - min) / range) * 100 : 50;
    const diff = Math.abs(modelValue - marketValue);
    const isOver = modelValue > marketValue;
    const isNeutral = diff < 0.3; // No meaningful difference

    // Colors based on direction (neutral when values are ~equal)
    const indicatorColor = isNeutral ? '#71717a' : isOver ? '#2AF6A0' : '#ef4444';
    const indicatorGlow = isNeutral ? 'none' : `0 0 8px ${isOver ? 'rgba(42,246,160,0.5)' : 'rgba(239,68,68,0.5)'}`;

    return (
        <div className="relative h-10 rounded-full bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            {/* Fill from market to model — only show when there's a meaningful diff */}
            {!isNeutral && (
                <div
                    className="absolute top-0 bottom-0 rounded-full transition-all duration-1000 ease-out"
                    style={{
                        left: `${Math.min(modelPos, marketPos)}%`,
                        width: animated ? `${Math.abs(modelPos - marketPos)}%` : '0%',
                        background: isOver
                            ? 'linear-gradient(90deg, rgba(42,246,160,0.15), rgba(42,246,160,0.3))'
                            : 'linear-gradient(90deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                    }}
                />
            )}
            {/* Single marker when values are equal, or market + model markers when different */}
            {isNeutral ? (
                /* Merged neutral marker — centered, subtle */
                <div
                    className="absolute top-1 bottom-1 w-0.5 bg-zinc-500 rounded-full"
                    style={{ left: `${marketPos}%` }}
                />
            ) : (
                <>
                    {/* Market line marker */}
                    <div
                        className="absolute top-1 bottom-1 w-0.5 bg-zinc-500 rounded-full"
                        style={{ left: `${marketPos}%` }}
                    />
                    {/* Model line marker */}
                    <div
                        className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-1000 ease-out"
                        style={{
                            left: animated ? `${modelPos}%` : `${marketPos}%`,
                            background: indicatorColor,
                            boxShadow: indicatorGlow,
                        }}
                    />
                </>
            )}
            {/* Diff label */}
            {diff >= 0.3 && (
                <div
                    className="absolute top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold transition-opacity duration-700"
                    style={{
                        left: `${(modelPos + marketPos) / 2}%`,
                        transform: 'translate(-50%, -50%)',
                        color: isOver ? '#2AF6A0' : '#ef4444',
                        opacity: animated ? 1 : 0,
                    }}
                >
                    {isOver ? '+' : '-'}{diff.toFixed(1)}
                </div>
            )}
        </div>
    );
}

interface PredictedScoreDisplayProps {
    homeTeam: string;
    awayTeam: string;
    expectedScores: {
        home: number;
        away: number;
    };
    overUnder?: {
        line: number;
        overOdds?: number;
        underOdds?: number;
    };
    spread?: {
        line: number;
        favorite: 'home' | 'away';
    };
    odds?: {
        homeOdds: number;
        awayOdds: number;
        drawOdds?: number;
    };
    sport?: string;
    locale?: 'en' | 'sr';
}

export default function PredictedScoreDisplay({
    homeTeam,
    awayTeam,
    expectedScores,
    overUnder,
    spread,
    odds,
    sport = 'soccer',
    locale = 'en',
}: PredictedScoreDisplayProps) {
    const t = translations[locale];
    const isHighScoring = isHighScoringSport(sport);

    const totalExpected = (expectedScores?.home || 0) + (expectedScores?.away || 0);
    const totalExpectedDisplay = totalExpected.toFixed(1);

    let valueIndicator: 'over' | 'under' | null = null;
    if (overUnder?.line && totalExpected > 0) {
        const diff = totalExpected - overUnder.line;
        if (diff >= 0.3) valueIndicator = 'over';
        else if (diff <= -0.3) valueIndicator = 'under';
    }

    const getFavorite = (): { team: string; isFavorite: 'home' | 'away' } | null => {
        if (spread?.favorite) {
            return {
                team: spread.favorite === 'home' ? homeTeam : awayTeam,
                isFavorite: spread.favorite,
            };
        }
        if (odds?.homeOdds && odds?.awayOdds) {
            const favorite = odds.homeOdds < odds.awayOdds ? 'home' : 'away';
            return {
                team: favorite === 'home' ? homeTeam : awayTeam,
                isFavorite: favorite,
            };
        }
        return null;
    };

    const favorite = getFavorite();

    // ===== HIGH-SCORING SPORTS (NBA/NFL) =====
    if (isHighScoring) {
        return (
            <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <PremiumIcon name="basketball" size="md" className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{t.gameOutlook}</h3>
                        <p className="text-[10px] text-zinc-500">{t.bettingInsight}</p>
                    </div>
                </div>

                {/* Favorite Display */}
                {favorite && (
                    <div className="text-center py-4 mx-5 mb-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.favored}</p>
                        <p className="text-xl font-bold text-white">{favorite.team}</p>
                        {spread?.line && (
                            <p className="text-sm text-orange-400 mt-0.5">
                                {t.favoredBy} {Math.abs(spread.line).toFixed(1)} pts
                            </p>
                        )}
                    </div>
                )}

                {/* O/U Visual Bar */}
                {overUnder?.line ? (
                    <div className="px-5 pb-5 space-y-4">
                        {/* Labels */}
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                            <span className="text-zinc-500">{t.totalPoints}</span>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                                    <span className="text-zinc-500">{t.marketLine}: {formatLine(overUnder.line)}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${valueIndicator === 'over' ? 'bg-emerald-400' : valueIndicator === 'under' ? 'bg-red-400' : 'bg-white'}`} />
                                    <span className={valueIndicator === 'over' ? 'text-emerald-400' : valueIndicator === 'under' ? 'text-red-400' : 'text-zinc-300'}>
                                        {t.expectedTotal}: {totalExpectedDisplay}
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Visual bar */}
                        <OUComparisonBar modelValue={totalExpected} marketValue={overUnder.line} />

                        {/* O/U Odds */}
                        {(overUnder.overOdds || overUnder.underOdds) && (
                            <div className="flex gap-2">
                                {overUnder.overOdds && (
                                    <div className={`flex-1 py-3 rounded-xl text-center transition-colors ${valueIndicator === 'over' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.04]'}`}>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{t.over} {formatLine(overUnder.line)}</p>
                                        <p className={`text-lg font-bold ${valueIndicator === 'over' ? 'text-emerald-400' : 'text-white'}`}>
                                            {overUnder.overOdds.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                {overUnder.underOdds && (
                                    <div className={`flex-1 py-3 rounded-xl text-center transition-colors ${valueIndicator === 'under' ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/[0.03] border border-white/[0.04]'}`}>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{t.under} {formatLine(overUnder.line)}</p>
                                        <p className={`text-lg font-bold ${valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                            {overUnder.underOdds.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Value Indicator */}
                        {valueIndicator && (
                            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium ${valueIndicator === 'over'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                : 'bg-red-500/10 text-red-400 border border-red-500/15'
                                }`}>
                                <PremiumIcon name={valueIndicator === 'over' ? 'trending' : 'trending-down'} size="xs" />
                                {valueIndicator === 'over' ? t.valueOver : t.valueUnder}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-center text-sm text-zinc-500 pb-5">{t.noData}</p>
                )}
            </div>
        );
    }

    // ===== LOW-SCORING SPORTS (Soccer/Hockey) =====
    const homeGoals = expectedScores?.home ? Math.round(expectedScores.home) : 0;
    const awayGoals = expectedScores?.away ? Math.round(expectedScores.away) : 0;
    const hasValidScore = homeGoals > 0 || awayGoals > 0;
    const homeIsWinning = homeGoals > awayGoals;
    const awayIsWinning = awayGoals > homeGoals;
    const isDraw = homeGoals === awayGoals;

    return (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-1">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <PremiumIcon name="target" size="md" className="text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{hasValidScore ? t.predictedScore : t.gameOutlook}</h3>
                        <p className="text-[10px] text-zinc-500">{hasValidScore ? t.basedOnModel : t.bettingInsight}</p>
                    </div>
                </div>
            </div>

            {/* Premium Score Display with SVG Rings */}
            {hasValidScore && (
                <div className="flex items-center justify-center gap-4 sm:gap-8 py-6 px-5">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-2">
                        <ScoreRing
                            score={homeGoals}
                            maxScore={Math.max(homeGoals, awayGoals, 3)}
                            color={homeIsWinning ? '#3b82f6' : isDraw ? '#a1a1aa' : 'rgba(161,161,170,0.5)'}
                            glowColor={homeIsWinning ? 'rgba(59,130,246,0.4)' : 'transparent'}
                            size={88}
                        />
                        <span className={`text-[11px] font-medium uppercase tracking-wider truncate max-w-[90px] text-center ${
                            homeIsWinning ? 'text-blue-400' : 'text-zinc-500'
                        }`}>
                            {homeTeam}
                        </span>
                    </div>

                    {/* Center separator */}
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="w-px h-6 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
                        <div className="w-6 h-6 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                            <span className="text-[10px] text-zinc-600 font-medium">vs</span>
                        </div>
                        <div className="w-px h-6 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-2">
                        <ScoreRing
                            score={awayGoals}
                            maxScore={Math.max(homeGoals, awayGoals, 3)}
                            color={awayIsWinning ? '#f43f5e' : isDraw ? '#a1a1aa' : 'rgba(161,161,170,0.5)'}
                            glowColor={awayIsWinning ? 'rgba(244,63,94,0.4)' : 'transparent'}
                            size={88}
                        />
                        <span className={`text-[11px] font-medium uppercase tracking-wider truncate max-w-[90px] text-center ${
                            awayIsWinning ? 'text-rose-400' : 'text-zinc-500'
                        }`}>
                            {awayTeam}
                        </span>
                    </div>
                </div>
            )}

            {/* xG Total + O/U Section */}
            <div className="px-5 pb-5">
                {overUnder?.line ? (
                    <div className="space-y-4 pt-2">
                        {/* xG total badge */}
                        <div className="flex items-center justify-center">
                            <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-2">{t.expectedGoals}</span>
                                <span className={`text-sm font-bold ${
                                    valueIndicator === 'over' ? 'text-emerald-400' : 
                                    valueIndicator === 'under' ? 'text-red-400' : 'text-white'
                                }`}>
                                    {totalExpectedDisplay}
                                </span>
                            </div>
                        </div>

                        {/* Visual O/U bar */}
                        <div>
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-2">
                                <span className="text-zinc-500 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                    {t.marketLine}: {formatLine(overUnder.line)}
                                </span>
                                <span className={`flex items-center gap-1.5 ${
                                    valueIndicator === 'over' ? 'text-emerald-400' : 
                                    valueIndicator === 'under' ? 'text-red-400' : 'text-zinc-300'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        valueIndicator === 'over' ? 'bg-emerald-400' : 
                                        valueIndicator === 'under' ? 'bg-red-400' : 'bg-white'
                                    }`} />
                                    {t.expectedTotal}: {totalExpectedDisplay}
                                </span>
                            </div>
                            <OUComparisonBar modelValue={totalExpected} marketValue={overUnder.line} />
                        </div>

                        {/* O/U Odds pills */}
                        {(overUnder.overOdds || overUnder.underOdds) && (
                            <div className="flex gap-2">
                                {overUnder.overOdds && (
                                    <div className={`flex-1 py-2.5 rounded-xl text-center transition-colors ${valueIndicator === 'over' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.04]'}`}>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{t.over} {formatLine(overUnder.line)}</p>
                                        <p className={`text-base font-bold ${valueIndicator === 'over' ? 'text-emerald-400' : 'text-white'}`}>
                                            {overUnder.overOdds.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                {overUnder.underOdds && (
                                    <div className={`flex-1 py-2.5 rounded-xl text-center transition-colors ${valueIndicator === 'under' ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/[0.03] border border-white/[0.04]'}`}>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">{t.under} {formatLine(overUnder.line)}</p>
                                        <p className={`text-base font-bold ${valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                            {overUnder.underOdds.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Value indicator */}
                        {valueIndicator && (
                            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium ${valueIndicator === 'over'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                : 'bg-red-500/10 text-red-400 border border-red-500/15'
                                }`}>
                                <PremiumIcon name={valueIndicator === 'over' ? 'trending' : 'trending-down'} size="xs" />
                                {valueIndicator === 'over' ? t.valueOver : t.valueUnder}
                            </div>
                        )}
                    </div>
                ) : (
                    /* No O/U line — just show xG total */
                    totalExpected > 0 && (
                        <div className="flex items-center justify-center pt-2 pb-1">
                            <div className="px-5 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-2">{t.expectedGoals}</span>
                                <span className="text-sm font-bold text-white">{totalExpectedDisplay}</span>
                                <span className="text-[10px] text-zinc-600 ml-1">{t.goals}</span>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
