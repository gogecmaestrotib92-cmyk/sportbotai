/**
 * Predicted Score Display Component
 * 
 * Shows the expected score based on Poisson/Elo model calculations.
 * Includes O/U odds and value indicator when available.
 */

'use client';

// i18n translations
const translations = {
    en: {
        predictedScore: 'Predicted Score',
        basedOnModel: 'Based on statistical model',
        expectedTotal: 'Our Model',
        marketLine: 'Market Line',
        over: 'Over',
        under: 'Under',
        units: 'goals',
        pointsUnit: 'points',
        valueOver: 'Value on OVER',
        valueUnder: 'Value on UNDER',
        noValue: 'Fair price',
    },
    sr: {
        predictedScore: 'Predviđen Rezultat',
        basedOnModel: 'Bazirano na statističkom modelu',
        expectedTotal: 'Naš Model',
        marketLine: 'Linija',
        over: 'Više',
        under: 'Manje',
        units: 'golova',
        pointsUnit: 'poena',
        valueOver: 'Vrednost na VIŠE',
        valueUnder: 'Vrednost na MANJE',
        noValue: 'Fer cena',
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
    sport?: string;
    locale?: 'en' | 'sr';
}

export default function PredictedScoreDisplay({
    homeTeam,
    awayTeam,
    expectedScores,
    overUnder,
    sport = 'soccer',
    locale = 'en',
}: PredictedScoreDisplayProps) {
    const t = translations[locale];

    // Debug: Log what we received
    console.log('[PredictedScoreDisplay] Props:', { expectedScores, overUnder, homeTeam, awayTeam });

    // Defensive: Handle undefined or NaN values
    const homeGoals = expectedScores?.home ? Math.round(expectedScores.home) : 1;
    const awayGoals = expectedScores?.away ? Math.round(expectedScores.away) : 1;
    const totalExpected = (expectedScores?.home || 1.3) + (expectedScores?.away || 1.3);
    const totalExpectedDisplay = totalExpected.toFixed(1);

    // Get unit based on sport
    const unit = sport.includes('basketball') || sport.includes('nfl') || sport.includes('american')
        ? t.pointsUnit
        : t.units;

    // Determine value (if we have O/U line)
    let valueIndicator: 'over' | 'under' | null = null;
    let valueDiff = 0;
    if (overUnder?.line) {
        valueDiff = totalExpected - overUnder.line;
        if (valueDiff >= 0.3) {
            valueIndicator = 'over';
        } else if (valueDiff <= -0.3) {
            valueIndicator = 'under';
        }
    }

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
                        {/* Model vs Market comparison */}
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
                                <p className="text-lg font-semibold text-zinc-300">
                                    {overUnder.line}
                                </p>
                            </div>
                        </div>

                        {/* O/U Odds display */}
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

                        {/* Value indicator */}
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
                    // No O/U data - just show expected total
                    <div className="text-center">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.expectedTotal}</p>
                        <p className="text-lg font-semibold text-zinc-200">
                            {totalExpectedDisplay} <span className="text-xs text-zinc-500">{unit}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
