'use client';

import { useState, useCallback } from 'react';

/**
 * Parlay Calculator Tool
 * 
 * Calculates total odds and potential payout for multi-leg parlays.
 * SEO target: "parlay calculator", "parlay odds calculator", "accumulator calculator"
 */

interface ParlayLeg {
    id: number;
    odds: string;
}

interface ParlayResult {
    totalDecimalOdds: string;
    totalAmericanOdds: string;
    impliedProbability: string;
    potentialPayout: string;
    potentialProfit: string;
}

// Convert any odds format to decimal
function toDecimal(odds: string, format: 'american' | 'decimal'): number | null {
    const num = parseFloat(odds);
    if (isNaN(num)) return null;

    if (format === 'decimal') {
        return num >= 1 ? num : null;
    } else {
        // American to decimal
        if (num > 0) {
            return (num / 100) + 1;
        } else if (num < -99) {
            return (100 / Math.abs(num)) + 1;
        }
        return null;
    }
}

// Convert decimal to American
function decimalToAmerican(decimal: number): string {
    if (decimal >= 2) {
        return `+${Math.round((decimal - 1) * 100)}`;
    } else {
        return `${Math.round(-100 / (decimal - 1))}`;
    }
}

export default function ParlayCalculatorPage() {
    const [stake, setStake] = useState('100');
    const [oddsFormat, setOddsFormat] = useState<'american' | 'decimal'>('american');
    const [legs, setLegs] = useState<ParlayLeg[]>([
        { id: 1, odds: '' },
        { id: 2, odds: '' },
    ]);
    const [result, setResult] = useState<ParlayResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addLeg = () => {
        if (legs.length < 15) {
            setLegs([...legs, { id: Date.now(), odds: '' }]);
            setResult(null);
        }
    };

    const removeLeg = (id: number) => {
        if (legs.length > 2) {
            setLegs(legs.filter(leg => leg.id !== id));
            setResult(null);
        }
    };

    const updateLeg = (id: number, odds: string) => {
        setLegs(legs.map(leg => leg.id === id ? { ...leg, odds } : leg));
        setResult(null);
    };

    const calculateParlay = useCallback(() => {
        setError(null);
        setResult(null);

        const stakeNum = parseFloat(stake);
        if (isNaN(stakeNum) || stakeNum <= 0) {
            setError('Please enter a valid stake amount');
            return;
        }

        // Convert all legs to decimal odds
        const decimalOdds: number[] = [];
        for (let i = 0; i < legs.length; i++) {
            if (!legs[i].odds.trim()) {
                setError(`Please enter odds for Leg ${i + 1}`);
                return;
            }
            const decimal = toDecimal(legs[i].odds, oddsFormat);
            if (!decimal) {
                setError(`Invalid odds for Leg ${i + 1}`);
                return;
            }
            decimalOdds.push(decimal);
        }

        // Calculate total parlay odds (multiply all legs)
        const totalDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);

        // Calculate implied probability
        const impliedProb = (1 / totalDecimal) * 100;

        // Calculate payouts
        const potentialPayout = stakeNum * totalDecimal;
        const potentialProfit = potentialPayout - stakeNum;

        setResult({
            totalDecimalOdds: totalDecimal.toFixed(2),
            totalAmericanOdds: decimalToAmerican(totalDecimal),
            impliedProbability: `${impliedProb.toFixed(2)}%`,
            potentialPayout: potentialPayout.toFixed(2),
            potentialProfit: potentialProfit.toFixed(2),
        });
    }, [stake, legs, oddsFormat]);

    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]" />
                </div>

                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                    {/* Back Link */}
                    <a
                        href="/tools"
                        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        All Tools
                    </a>

                    {/* Page Header */}
                    <div className="text-center mb-10 sm:mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full text-xs sm:text-sm font-medium text-gray-300 border border-white/10 mb-6">
                            <span className="text-lg">📊</span>
                            Free Betting Tool
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Parlay
                            <span className="block text-gradient-accent">Calculator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Calculate potential payouts for multi-leg parlays.
                            Add up to 15 legs and see your total odds instantly.
                        </p>
                    </div>

                    {/* Calculator Card */}
                    <div className="card-glass p-6 sm:p-8 max-w-xl mx-auto">
                        {/* Odds Format Toggle */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-3">
                                Odds Format
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['american', 'decimal'] as const).map((format) => (
                                    <button
                                        key={format}
                                        onClick={() => {
                                            setOddsFormat(format);
                                            setLegs(legs.map(leg => ({ ...leg, odds: '' })));
                                            setResult(null);
                                            setError(null);
                                        }}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 capitalize ${oddsFormat === format
                                                ? 'bg-accent text-primary-900 shadow-glow-accent'
                                                : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {format}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stake Input */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Stake ($)
                            </label>
                            <input
                                type="number"
                                value={stake}
                                onChange={(e) => { setStake(e.target.value); setResult(null); }}
                                placeholder="100"
                                className="input-field text-lg"
                            />
                        </div>

                        {/* Parlay Legs */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-400">
                                    Parlay Legs ({legs.length})
                                </label>
                                <button
                                    onClick={addLeg}
                                    disabled={legs.length >= 15}
                                    className="text-sm text-accent hover:text-accent-light disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    + Add Leg
                                </button>
                            </div>

                            <div className="space-y-3">
                                {legs.map((leg, index) => (
                                    <div key={leg.id} className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 w-8">{index + 1}.</span>
                                        <input
                                            type="text"
                                            value={leg.odds}
                                            onChange={(e) => updateLeg(leg.id, e.target.value)}
                                            placeholder={oddsFormat === 'american' ? '-110' : '1.91'}
                                            className="input-field flex-1"
                                        />
                                        {legs.length > 2 && (
                                            <button
                                                onClick={() => removeLeg(leg.id)}
                                                className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={calculateParlay}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            Calculate Parlay
                        </button>

                        {error && (
                            <p className="mt-4 text-sm text-danger text-center">{error}</p>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="animate-fadeInUp mt-6">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Parlay Results
                                </h3>

                                {/* Main Result */}
                                <div className="bg-accent/10 rounded-xl p-5 border border-accent/30 mb-4">
                                    <div className="text-xs text-accent uppercase tracking-wider mb-1">Potential Payout</div>
                                    <div className="text-3xl font-bold text-accent">${result.potentialPayout}</div>
                                    <div className="text-sm text-accent/70 mt-1">Profit: ${result.potentialProfit}</div>
                                </div>

                                {/* Odds Breakdown */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total American</div>
                                        <div className="text-lg font-bold text-white">{result.totalAmericanOdds}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Decimal</div>
                                        <div className="text-lg font-bold text-white">{result.totalDecimalOdds}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Win Prob</div>
                                        <div className="text-lg font-bold text-white">{result.impliedProbability}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="border-t border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-4">
                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                What is a parlay bet?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                A parlay (also called an accumulator or multi) is a single bet that combines multiple selections into one wager. All selections must win for the parlay to pay out. The odds multiply together, creating higher potential payouts but with lower probability of winning.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                How are parlay odds calculated?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Parlay odds are calculated by multiplying the decimal odds of each leg together. For example: Leg 1 (1.91) × Leg 2 (2.00) × Leg 3 (1.80) = 6.88 total decimal odds. Your stake is then multiplied by this total to get your potential payout.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                Are parlays a good betting strategy?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Parlays offer higher payouts but have lower expected value than straight bets. The more legs you add, the more the house edge compounds. Most professional bettors avoid large parlays, but 2-3 leg correlated parlays can occasionally offer value.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                What happens if one leg of my parlay pushes?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                If a leg pushes (ties), that leg is typically removed from the parlay and the odds are recalculated with the remaining legs. A 4-leg parlay becomes a 3-leg parlay. Some sportsbooks have different rules, so check your book&apos;s terms.
                            </div>
                        </details>
                    </div>
                </div>
            </section>
        </main>
    );
}
