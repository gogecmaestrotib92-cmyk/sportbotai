/**
 * Game Outlook Display Component
 * 
 * Sport-aware display:
 * - Soccer/Hockey: Shows predicted score (2-1, 3-2)
 * - NBA/NFL: Shows O/U line and spread (no exact score)
 */

'use client';

import PremiumIcon from '@/components/ui/PremiumIcon';

// Format O/U line to 1 decimal place (e.g., 226.6153846 → 226.5)
const formatLine = (line: number): string => {
    // Round to nearest 0.5 for cleaner display (common in betting)
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
        // Soccer/Hockey
        predictedScore: 'Predicted Score',
        basedOnModel: 'Based on statistical model',

        // NBA/NFL
        gameOutlook: 'Game Outlook',
        bettingInsight: 'Betting insights',
        totalPoints: 'Total Points',
        spread: 'Spread',
        favored: 'Favored',
        favoredBy: 'by',

        // Common
        expectedTotal: 'Our Model',
        marketLine: 'Market Line',
        over: 'Over',
        under: 'Under',
        valueOver: 'Value on OVER',
        valueUnder: 'Value on UNDER',
        noData: 'No line available',
    },
    sr: {
        // Soccer/Hockey
        predictedScore: 'Predviđen Rezultat',
        basedOnModel: 'Bazirano na statističkom modelu',

        // NBA/NFL
        gameOutlook: 'Pregled Utakmice',
        bettingInsight: 'Kladioničarski uvid',
        totalPoints: 'Ukupno Poena',
        spread: 'Hendikep',
        favored: 'Favorit',
        favoredBy: 'za',

        // Common
        expectedTotal: 'Naš Model',
        marketLine: 'Linija',
        over: 'Više',
        under: 'Manje',
        valueOver: 'Vrednost na VIŠE',
        valueUnder: 'Vrednost na MANJE',
        noData: 'Linija nije dostupna',
    },
};

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

    // Calculate values from expectedScores
    const totalExpected = (expectedScores?.home || 0) + (expectedScores?.away || 0);
    const totalExpectedDisplay = totalExpected.toFixed(1);

    // Determine value edge for O/U
    let valueIndicator: 'over' | 'under' | null = null;
    if (overUnder?.line && totalExpected > 0) {
        const diff = totalExpected - overUnder.line;
        if (diff >= 0.3) valueIndicator = 'over';
        else if (diff <= -0.3) valueIndicator = 'under';
    }

    // Determine favorite from odds or spread
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

                {/* O/U Line Display */}
                <div className="px-5 pb-5">
                    {overUnder?.line ? (
                        <div className="space-y-3">
                            {/* Model vs Market */}
                            <div className="flex items-stretch gap-3">
                                <div className="flex-1 text-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.expectedTotal}</p>
                                    <p className={`text-2xl font-bold ${valueIndicator === 'over' ? 'text-emerald-400' : valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                        {totalExpectedDisplay}
                                    </p>
                                </div>

                                <div className="flex items-center">
                                    <span className="text-[10px] text-zinc-600 uppercase font-medium">vs</span>
                                </div>

                                <div className="flex-1 text-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.marketLine}</p>
                                    <p className="text-2xl font-bold text-zinc-300">{formatLine(overUnder.line)}</p>
                                </div>
                            </div>

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
                        <p className="text-center text-sm text-zinc-500">{t.noData}</p>
                    )}
                </div>
            </div>
        );
    }

    // ===== LOW-SCORING SPORTS (Soccer/Hockey) =====
    const homeGoals = expectedScores?.home ? Math.round(expectedScores.home) : 0;
    const awayGoals = expectedScores?.away ? Math.round(expectedScores.away) : 0;
    const hasValidScore = homeGoals > 0 || awayGoals > 0;

    return (
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <PremiumIcon name="target" size="md" className="text-violet-400" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">{hasValidScore ? t.predictedScore : t.gameOutlook}</h3>
                    <p className="text-[10px] text-zinc-500">{hasValidScore ? t.basedOnModel : t.bettingInsight}</p>
                </div>
            </div>

            {/* Score Display - Only show when we have valid predicted scores */}
            {hasValidScore && (
                <div className="flex items-center justify-center gap-8 py-6 px-5">
                    {/* Home Team */}
                    <div className="text-center flex-1">
                        <p className="text-xs text-zinc-500 mb-2 truncate">{homeTeam}</p>
                        <span className="text-5xl font-bold text-white tracking-tight">{homeGoals}</span>
                    </div>

                    {/* Separator */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-px h-4 bg-zinc-800" />
                        <span className="text-sm text-zinc-600 font-medium">:</span>
                        <div className="w-px h-4 bg-zinc-800" />
                    </div>

                    {/* Away Team */}
                    <div className="text-center flex-1">
                        <p className="text-xs text-zinc-500 mb-2 truncate">{awayTeam}</p>
                        <span className="text-5xl font-bold text-white tracking-tight">{awayGoals}</span>
                    </div>
                </div>
            )}

            {/* O/U Section */}
            <div className="px-5 pb-5 border-t border-white/[0.04]">
                {overUnder?.line ? (
                    <div className="space-y-3 pt-4">
                        {/* Model vs Market */}
                        <div className="flex items-stretch gap-3">
                            <div className="flex-1 text-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.expectedTotal}</p>
                                <p className={`text-2xl font-bold ${valueIndicator === 'over' ? 'text-emerald-400' : valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                    {totalExpectedDisplay}
                                </p>
                            </div>

                            <div className="flex items-center">
                                <span className="text-[10px] text-zinc-600 uppercase font-medium">vs</span>
                            </div>

                            <div className="flex-1 text-center py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{t.marketLine}</p>
                                <p className="text-2xl font-bold text-zinc-300">{formatLine(overUnder.line)}</p>
                            </div>
                        </div>

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
                    <div className="text-center pt-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.expectedTotal}</p>
                        <p className="text-lg font-semibold text-zinc-200">
                            {totalExpectedDisplay} <span className="text-xs text-zinc-500">goals</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
