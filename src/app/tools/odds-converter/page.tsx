'use client';

import { useState, useCallback } from 'react';

/**
 * Odds Converter Tool
 * 
 * Converts between American, Decimal, and Fractional odds formats.
 * SEO target: "odds converter", "betting odds calculator", "decimal to american odds"
 */

type OddsFormat = 'american' | 'decimal' | 'fractional';

interface ConvertedOdds {
    american: string;
    decimal: string;
    fractional: string;
    impliedProbability: string;
}

// Convert American odds to probability
function americanToProb(american: number): number {
    if (american > 0) {
        return 100 / (american + 100);
    } else {
        return Math.abs(american) / (Math.abs(american) + 100);
    }
}

// Convert probability to American
function probToAmerican(prob: number): number {
    if (prob >= 0.5) {
        return -Math.round((prob / (1 - prob)) * 100);
    } else {
        return Math.round(((1 - prob) / prob) * 100);
    }
}

// Convert probability to Decimal
function probToDecimal(prob: number): number {
    return 1 / prob;
}

// Convert decimal to probability
function decimalToProb(decimal: number): number {
    return 1 / decimal;
}

// Convert probability to fractional string
function probToFractional(prob: number): string {
    const decimal = 1 / prob;
    const numerator = decimal - 1;

    // Common fractions
    const commonDenoms = [1, 2, 4, 5, 8, 10, 20, 25, 50, 100];

    for (const denom of commonDenoms) {
        const num = numerator * denom;
        if (Math.abs(num - Math.round(num)) < 0.01) {
            return `${Math.round(num)}/${denom}`;
        }
    }

    // Fallback: use closest approximation
    return `${Math.round(numerator * 100)}/100`;
}

// Parse fractional string to probability
function fractionalToProb(fractional: string): number | null {
    const parts = fractional.split('/');
    if (parts.length !== 2) return null;

    const num = parseFloat(parts[0]);
    const denom = parseFloat(parts[1]);

    if (isNaN(num) || isNaN(denom) || denom === 0) return null;

    const decimal = (num / denom) + 1;
    return 1 / decimal;
}

export default function OddsConverterPage() {
    const [inputValue, setInputValue] = useState('');
    const [inputFormat, setInputFormat] = useState<OddsFormat>('american');
    const [result, setResult] = useState<ConvertedOdds | null>(null);
    const [error, setError] = useState<string | null>(null);

    const convertOdds = useCallback(() => {
        setError(null);
        setResult(null);

        if (!inputValue.trim()) {
            setError('Please enter odds value');
            return;
        }

        let probability: number | null = null;

        try {
            if (inputFormat === 'american') {
                const american = parseFloat(inputValue);
                if (isNaN(american) || american === 0 || (american > -100 && american < 100)) {
                    setError('American odds must be +100 or higher, or -100 or lower');
                    return;
                }
                probability = americanToProb(american);
            } else if (inputFormat === 'decimal') {
                const decimal = parseFloat(inputValue);
                if (isNaN(decimal) || decimal < 1) {
                    setError('Decimal odds must be 1.00 or higher');
                    return;
                }
                probability = decimalToProb(decimal);
            } else if (inputFormat === 'fractional') {
                probability = fractionalToProb(inputValue);
                if (probability === null) {
                    setError('Enter fractional odds like "3/1" or "1/2"');
                    return;
                }
            }

            if (probability && probability > 0 && probability < 1) {
                const american = probToAmerican(probability);
                const decimal = probToDecimal(probability);
                const fractional = probToFractional(probability);
                const impliedPct = (probability * 100).toFixed(1);

                setResult({
                    american: american > 0 ? `+${american}` : `${american}`,
                    decimal: decimal.toFixed(2),
                    fractional,
                    impliedProbability: `${impliedPct}%`,
                });
            }
        } catch {
            setError('Invalid odds format');
        }
    }, [inputValue, inputFormat]);

    const formatOptions: { value: OddsFormat; label: string; placeholder: string }[] = [
        { value: 'american', label: 'American', placeholder: 'e.g. -110 or +150' },
        { value: 'decimal', label: 'Decimal', placeholder: 'e.g. 1.91 or 2.50' },
        { value: 'fractional', label: 'Fractional', placeholder: 'e.g. 3/1 or 1/2' },
    ];

    const selectedFormat = formatOptions.find(f => f.value === inputFormat);

    return (
        <main className="min-h-screen bg-bg-primary">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-violet/10 rounded-full blur-[80px]" />
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
                            <span className="text-lg">🧮</span>
                            Free Betting Tool
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                            Odds Converter
                            <span className="block text-gradient-accent">Calculator</span>
                        </h1>

                        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                            Convert between American, Decimal, and Fractional odds instantly.
                            See implied probability for any betting line.
                        </p>
                    </div>

                    {/* Converter Card */}
                    <div className="card-glass p-6 sm:p-8 max-w-xl mx-auto">
                        {/* Format Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-3">
                                Input Format
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {formatOptions.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => {
                                            setInputFormat(format.value);
                                            setInputValue('');
                                            setResult(null);
                                            setError(null);
                                        }}
                                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${inputFormat === format.value
                                            ? 'bg-accent text-primary-900 shadow-glow-accent'
                                            : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                                            }`}
                                    >
                                        {format.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input Field */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Enter {selectedFormat?.label} Odds
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && convertOdds()}
                                    placeholder={selectedFormat?.placeholder}
                                    className="input-field flex-1 text-lg"
                                />
                                <button
                                    onClick={convertOdds}
                                    className="btn-primary px-6 whitespace-nowrap"
                                >
                                    Convert
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 text-sm text-danger">{error}</p>
                            )}
                        </div>

                        {/* Results */}
                        {result && (
                            <div className="animate-fadeInUp">
                                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">
                                    Converted Odds
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">American</div>
                                        <div className="text-2xl font-bold text-white">{result.american}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Decimal</div>
                                        <div className="text-2xl font-bold text-white">{result.decimal}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fractional</div>
                                        <div className="text-2xl font-bold text-white">{result.fractional}</div>
                                    </div>
                                    <div className="bg-accent/10 rounded-xl p-4 border border-accent/30">
                                        <div className="text-xs text-accent uppercase tracking-wider mb-1">Implied Probability</div>
                                        <div className="text-2xl font-bold text-accent">{result.impliedProbability}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Examples */}
                    <div className="mt-10 text-center">
                        <p className="text-sm text-gray-500 mb-3">Try these examples:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                { label: '-110', format: 'american' as OddsFormat },
                                { label: '+200', format: 'american' as OddsFormat },
                                { label: '1.91', format: 'decimal' as OddsFormat },
                                { label: '3/1', format: 'fractional' as OddsFormat },
                            ].map((example) => (
                                <button
                                    key={example.label}
                                    onClick={() => {
                                        setInputFormat(example.format);
                                        setInputValue(example.label);
                                        setError(null);
                                        // Auto-convert after setting
                                        setTimeout(() => {
                                            const btn = document.querySelector('[data-convert]') as HTMLButtonElement;
                                            btn?.click();
                                        }, 50);
                                    }}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-lg border border-white/10 transition-colors"
                                >
                                    {example.label}
                                </button>
                            ))}
                        </div>
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
                                How do I convert American odds to decimal?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                For positive American odds: Decimal = (American / 100) + 1. For example, +200 becomes (200/100) + 1 = 3.00.
                                For negative American odds: Decimal = (100 / |American|) + 1. For example, -150 becomes (100/150) + 1 = 1.67.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                What does implied probability mean?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Implied probability is the likelihood of an outcome as suggested by the betting odds. It tells you what chance the market believes an event has of happening. For example, -200 odds imply a 66.7% probability, while +200 odds imply a 33.3% probability.
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                Which odds format is best for calculating payouts?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Decimal odds are the easiest for calculating payouts. Simply multiply your stake by the decimal odds to get your total return. For example, a $50 bet at 2.40 odds returns $50 × 2.40 = $120 total ($70 profit + $50 stake).
                            </div>
                        </details>

                        <details className="group bg-white/[0.02] border border-white/10 rounded-xl">
                            <summary className="flex items-center justify-between cursor-pointer p-5 text-white font-medium">
                                Why do American odds use positive and negative numbers?
                                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                                Negative odds (-) indicate the favorite and show how much you must bet to win $100. Positive odds (+) indicate the underdog and show how much you win from a $100 bet. This format quickly tells you which side is favored and the relative payout.
                            </div>
                        </details>
                    </div>
                </div>
            </section>
        </main>
    );
}
