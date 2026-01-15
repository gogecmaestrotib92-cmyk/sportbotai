'use client';

import { useState, useCallback } from 'react';

/**
 * Hedge Calculator Tool
 * 
 * Calculates optimal hedge bet to guarantee profit or minimize loss.
 * SEO target: "hedge calculator", "hedge bet calculator", "hedging calculator"
 */

interface HedgeResult {
    hedgeBet: string;
    originalProfit: string;
    hedgeProfit: string;
    guaranteedProfit: string;
    profitIfOriginalWins: string;
    profitIfHedgeWins: string;
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

export default function HedgeCalculatorPage() {
    const [originalStake, setOriginalStake] = useState('');
    const [originalOdds, setOriginalOdds] = useState('');
    const [hedgeOdds, setHedgeOdds] = useState('');
    const [oddsFormat, setOddsFormat] = useState<'american' | 'decimal'>('american');
    const [result, setResult] = useState<HedgeResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const calculateHedge = useCallback(() => {
        setError(null);
        setResult(null);

        const stake = parseFloat(originalStake);
        if (isNaN(stake) || stake <= 0) {
            setError('Please enter a valid stake amount');
            return;
        }

        const origDecimal = toDecimal(originalOdds, oddsFormat);
        const hedgeDecimal = toDecimal(hedgeOdds, oddsFormat);

        if (!origDecimal) {
            setError('Please enter valid original odds');
            return;
        }

        if (!hedgeDecimal) {
            setError('Please enter valid hedge odds');
            return;
        }

        // Calculate hedge bet for equal profit
        const totalPayout = stake * origDecimal;
        const hedgeBet = totalPayout / hedgeDecimal;

        // Calculate profits
        const profitIfOriginalWins = totalPayout - stake - hedgeBet;
        const profitIfHedgeWins = (hedgeBet * hedgeDecimal) - stake - hedgeBet;

        // Guaranteed profit (minimum of both scenarios)
        const guaranteedProfit = Math.min(profitIfOriginalWins, profitIfHedgeWins);

        setResult({
            hedgeBet: hedgeBet.toFixed(2),
            originalProfit: (totalPayout - stake).toFixed(2),
            hedgeProfit: ((hedgeBet * hedgeDecimal) - hedgeBet).toFixed(2),
            guaranteedProfit: guaranteedProfit.toFixed(2),
            profitIfOriginalWins: profitIfOriginalWins.toFixed(2),
            profitIfHedgeWins: profitIfHedgeWins.toFixed(2),
        });
    }, [originalStake, originalOdds, hedgeOdds, oddsFormat]);

    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet/10 rounded-full blur-[100px]" />
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
                            <span className="text-lg">🛡️</span>
                            Free Betting Tool
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Hedge Bet
                            <span className="block text-gradient-accent">Calculator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Calculate the optimal hedge bet to lock in guaranteed profit
                            or minimize potential losses on your open bets.
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
                                            setOriginalOdds('');
                                            setHedgeOdds('');
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

                        {/* Input Fields */}
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Original Stake ($)
                                </label>
                                <input
                                    type="number"
                                    value={originalStake}
                                    onChange={(e) => setOriginalStake(e.target.value)}
                                    placeholder="e.g. 100"
                                    className="input-field text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Original Bet Odds ({oddsFormat === 'american' ? 'e.g. +200' : 'e.g. 3.00'})
                                </label>
                                <input
                                    type="text"
                                    value={originalOdds}
                                    onChange={(e) => setOriginalOdds(e.target.value)}
                                    placeholder={oddsFormat === 'american' ? '+200 or -150' : '3.00'}
                                    className="input-field text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Hedge Bet Odds ({oddsFormat === 'american' ? 'e.g. -110' : 'e.g. 1.91'})
                                </label>
                                <input
                                    type="text"
                                    value={hedgeOdds}
                                    onChange={(e) => setHedgeOdds(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && calculateHedge()}
                                    placeholder={oddsFormat === 'american' ? '-110' : '1.91'}
                                    className="input-field text-lg"
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculateHedge}
                            className="btn-primary w-full py-4 text-lg"
                        >
                            Calculate Hedge
                        </button>

                        {error && (
                            <p className="mt-4 text-sm text-danger text-center">{error}</p>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="animate-fadeInUp mt-6">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Hedge Results
                                </h3>

                                {/* Main Result */}
                                <div className="bg-accent/10 rounded-xl p-5 border border-accent/30 mb-4">
                                    <div className="text-xs text-accent uppercase tracking-wider mb-1">Bet This Amount to Hedge</div>
                                    <div className="text-3xl font-bold text-accent">${result.hedgeBet}</div>
                                </div>

                                {/* Profit Scenarios */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">If Original Wins</div>
                                        <div className={`text-xl font-bold ${parseFloat(result.profitIfOriginalWins) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${result.profitIfOriginalWins}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">If Hedge Wins</div>
                                        <div className={`text-xl font-bold ${parseFloat(result.profitIfHedgeWins) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            ${result.profitIfHedgeWins}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Guaranteed Minimum</div>
                                    <div className={`text-lg font-semibold ${parseFloat(result.guaranteedProfit) >= 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        ${result.guaranteedProfit} {parseFloat(result.guaranteedProfit) >= 0 ? 'profit' : 'loss'} no matter what
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
                                What is hedge betting?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Hedge betting is placing a bet on the opposite outcome of an existing bet to reduce risk or lock in profit. For example, if you have a futures bet on a team to win a championship, you can hedge by betting on their opponent in the final to guarantee profit regardless of the outcome.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                When should I hedge a bet?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Consider hedging when: (1) Your original bet has significant value and you want to lock in guaranteed profit, (2) The potential loss would be financially significant, or (3) Circumstances have changed and you want to reduce exposure. Many bettors hedge futures bets when their team reaches the final.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                How is the hedge amount calculated?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                The formula for equal profit hedging is: Hedge Bet = (Original Stake × Original Decimal Odds) / Hedge Decimal Odds. This calculates the exact amount to bet on the opposite side so that you win the same amount regardless of which bet wins.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                Is hedging always profitable?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Not always. If the combined odds (original + hedge) create too much vig, you might lock in a small loss instead of profit. However, hedging is still valuable for risk management—accepting a small guaranteed loss is often better than risking a large loss.
                            </div>
                        </details>
                    </div>
                </div>
            </section>
        </main>
    );
}
