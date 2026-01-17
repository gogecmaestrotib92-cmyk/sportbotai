/**
 * Game Outlook Display Component
 * 
 * Sport-aware display:
 * - Soccer/Hockey: Shows predicted score (2-1, 3-2)
 * - NBA/NFL: Shows O/U line and spread (no exact score)
 */

'use client';

// Helper to detect high-scoring sports where exact score prediction doesn't make sense
const isHighScoringSport = (sport: string): boolean => {
    const lowerSport = sport.toLowerCase();
    return lowerSport.includes('basketball') ||
        lowerSport.includes('nba') ||
        lowerSport.includes('nfl') ||
        lowerSport.includes('american') ||
        lowerSport.includes('football') && !lowerSport.includes('soccer');
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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🏀</span>
                    <div>
                        <h3 className="text-sm font-semibold text-white">{t.gameOutlook}</h3>
                        <p className="text-[10px] text-zinc-500">{t.bettingInsight}</p>
                    </div>
                </div>

                {/* Favorite Display */}
                {favorite && (
                    <div className="text-center py-3 mb-4 rounded-xl bg-white/5">
                        <p className="text-xs text-zinc-400 uppercase tracking-wider">{t.favored}</p>
                        <p className="text-xl font-bold text-white">{favorite.team}</p>
                        {spread?.line && (
                            <p className="text-sm text-orange-400">
                                {t.favoredBy} {Math.abs(spread.line).toFixed(1)} pts
                            </p>
                        )}
                    </div>
                )}

                {/* O/U Line Display */}
                <div className="space-y-3">
                    {overUnder?.line ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.expectedTotal}</p>
                                    <p className={`text-lg font-bold ${valueIndicator === 'over' ? 'text-green-400' : valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                        {totalExpectedDisplay}
                                    </p>
                                </div>

                                <span className="text-zinc-600 text-sm px-2">vs</span>

                                <div className="text-center flex-1">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.marketLine}</p>
                                    <p className="text-lg font-semibold text-zinc-300">{overUnder.line}</p>
                                </div>
                            </div>

                            {/* O/U Odds */}
                            {(overUnder.overOdds || overUnder.underOdds) && (
                                <div className="flex gap-2">
                                    {overUnder.overOdds && (
                                        <div className={`flex-1 p-2 rounded-lg text-center ${valueIndicator === 'over' ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'}`}>
                                            <p className="text-[10px] text-zinc-400 uppercase">{t.over} {overUnder.line}</p>
                                            <p className={`text-base font-bold ${valueIndicator === 'over' ? 'text-green-400' : 'text-white'}`}>
                                                {overUnder.overOdds.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                    {overUnder.underOdds && (
                                        <div className={`flex-1 p-2 rounded-lg text-center ${valueIndicator === 'under' ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5'}`}>
                                            <p className="text-[10px] text-zinc-400 uppercase">{t.under} {overUnder.line}</p>
                                            <p className={`text-base font-bold ${valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                                {overUnder.underOdds.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Value Indicator */}
                            {valueIndicator && (
                                <div className={`text-center py-1.5 px-3 rounded-lg text-xs font-medium ${valueIndicator === 'over'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {valueIndicator === 'over' ? `📈 ${t.valueOver}` : `📉 ${t.valueUnder}`}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-sm text-zinc-500">{t.noData}</p>
                    )}
                </div>
            </div>
        );
    }

    // ===== LOW-SCORING SPORTS (Soccer/Hockey) =====
    const homeGoals = expectedScores?.home ? Math.round(expectedScores.home) : 1;
    const awayGoals = expectedScores?.away ? Math.round(expectedScores.away) : 1;

    return (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🎯</span>
                <div>
                    <h3 className="text-sm font-semibold text-white">{t.predictedScore}</h3>
                    <p className="text-[10px] text-zinc-500">{t.basedOnModel}</p>
                </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-center gap-6 py-4">
                {/* Home Team */}
                <div className="text-center">
                    <p className="text-xs text-zinc-400 mb-1 truncate max-w-[80px]">{homeTeam}</p>
                    <span className="text-4xl font-bold text-white">{homeGoals}</span>
                </div>

                {/* Separator */}
                <span className="text-2xl text-zinc-600">-</span>

                {/* Away Team */}
                <div className="text-center">
                    <p className="text-xs text-zinc-400 mb-1 truncate max-w-[80px]">{awayTeam}</p>
                    <span className="text-4xl font-bold text-white">{awayGoals}</span>
                </div>
            </div>

            {/* O/U Section */}
            <div className="pt-3 border-t border-white/5">
                {overUnder?.line ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="text-center flex-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.expectedTotal}</p>
                                <p className={`text-lg font-bold ${valueIndicator === 'over' ? 'text-green-400' : valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                    {totalExpectedDisplay}
                                </p>
                            </div>

                            <span className="text-zinc-600 text-sm px-2">vs</span>

                            <div className="text-center flex-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.marketLine}</p>
                                <p className="text-lg font-semibold text-zinc-300">{overUnder.line}</p>
                            </div>
                        </div>

                        {/* O/U Odds */}
                        {(overUnder.overOdds || overUnder.underOdds) && (
                            <div className="flex gap-2">
                                {overUnder.overOdds && (
                                    <div className={`flex-1 p-2 rounded-lg text-center ${valueIndicator === 'over' ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5'}`}>
                                        <p className="text-[10px] text-zinc-400 uppercase">{t.over} {overUnder.line}</p>
                                        <p className={`text-base font-bold ${valueIndicator === 'over' ? 'text-green-400' : 'text-white'}`}>
                                            {overUnder.overOdds.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                {overUnder.underOdds && (
                                    <div className={`flex-1 p-2 rounded-lg text-center ${valueIndicator === 'under' ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5'}`}>
                                        <p className="text-[10px] text-zinc-400 uppercase">{t.under} {overUnder.line}</p>
                                        <p className={`text-base font-bold ${valueIndicator === 'under' ? 'text-red-400' : 'text-white'}`}>
                                            {overUnder.underOdds.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Value Indicator */}
                        {valueIndicator && (
                            <div className={`text-center py-1.5 px-3 rounded-lg text-xs font-medium ${valueIndicator === 'over'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {valueIndicator === 'over' ? `📈 ${t.valueOver}` : `📉 ${t.valueUnder}`}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
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
