'use client';

/**
 * Chat Match Analysis Component
 * 
 * Full match analysis display for chat responses.
 * Shows the same rich data as match pages in a chat-friendly format.
 */

import Link from 'next/link';
import { Calendar, MapPin, ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Zap, Activity } from 'lucide-react';
import type { MatchAnalysisData } from './types';

interface ChatMatchAnalysisProps {
    data: MatchAnalysisData;
}

// Confidence badge styles
const confidenceStyles = {
    strong: 'bg-green-500/20 text-green-400 border-green-500/30',
    moderate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    slight: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// Risk level styles
const riskStyles = {
    LOW: 'bg-green-500/20 text-green-400',
    MEDIUM: 'bg-yellow-500/20 text-yellow-400',
    HIGH: 'bg-red-500/20 text-red-400',
};

// Format kickoff time
function formatKickoff(kickoff: string): string {
    const date = new Date(kickoff);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    if (isToday) return `Today @ ${time}`;
    if (isTomorrow) return `Tomorrow @ ${time}`;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` @ ${time}`;
}

// Signal indicator component
function SignalBadge({ label, value, trend }: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }) {
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg text-xs">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
            {trend === 'neutral' && <Minus className="w-3 h-3 text-gray-400" />}
            <span className="text-text-muted">{label}:</span>
            <span className="text-white font-medium">{value}</span>
        </div>
    );
}

// Edge display component
function EdgeBadge({ label, edge, odds }: { label: string; edge?: number; odds?: number }) {
    if (edge === undefined || edge === null) return null;
    const isPositive = edge > 0;
    const isValue = Math.abs(edge) > 3;
    
    return (
        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${isValue && isPositive ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'}`}>
            <div>
                <span className="text-sm text-white">{label}</span>
                {odds && <span className="text-xs text-text-muted ml-2">@ {odds.toFixed(2)}</span>}
            </div>
            <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{edge.toFixed(1)}%
            </span>
        </div>
    );
}

export default function ChatMatchAnalysis({ data }: ChatMatchAnalysisProps) {
    const { 
        matchInfo, story, universalSignals, expectedScores, matchUrl,
        probabilities, oddsComparison, briefing, momentumAndForm,
        injuryContext, riskAnalysis, tacticalAnalysis, preMatchInsights, upsetPotential
    } = data;

    // Determine favored team name
    const favoredTeam = story.favored === 'home'
        ? matchInfo.homeTeam
        : story.favored === 'away'
            ? matchInfo.awayTeam
            : 'Draw';

    // Check if we have extended analysis data
    const hasExtendedData = probabilities || oddsComparison || briefing || momentumAndForm;

    return (
        <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl border border-white/10 overflow-hidden">
            {/* Header - Teams and League */}
            <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                    <span className="font-medium text-accent">{matchInfo.league}</span>
                    <span>•</span>
                    <span>{matchInfo.sport}</span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${story.favored === 'home' ? 'text-accent' : 'text-white'}`}>
                            {matchInfo.homeTeam}
                        </span>
                        <span className="text-text-muted text-sm">vs</span>
                        <span className={`text-lg font-bold ${story.favored === 'away' ? 'text-accent' : 'text-white'}`}>
                            {matchInfo.awayTeam}
                        </span>
                    </div>
                </div>

                {/* Time & Venue */}
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatKickoff(matchInfo.kickoff)}
                    </span>
                    {matchInfo.venue && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {matchInfo.venue}
                        </span>
                    )}
                </div>
            </div>

            {/* AI Briefing (if available) */}
            {briefing?.headline && (
                <div className="p-4 border-b border-white/10 bg-accent/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-accent" />
                        <span className="text-xs font-medium text-accent">AI ANALYSIS</span>
                        {briefing.confidenceRating && (
                            <span className="text-xs text-text-muted">• {briefing.confidenceRating}/5 confidence</span>
                        )}
                    </div>
                    <h3 className="text-white font-bold mb-1">{briefing.headline}</h3>
                    {briefing.verdict && (
                        <p className="text-sm text-text-secondary">{briefing.verdict}</p>
                    )}
                </div>
            )}

            {/* Prediction + Probabilities */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="text-xs text-text-muted mb-1">SportBot Prediction</div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-lg">{favoredTeam}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${confidenceStyles[story.confidence]}`}>
                                {story.confidence}
                            </span>
                        </div>
                    </div>

                    {/* Expected Score */}
                    {expectedScores && (
                        <div className="text-right">
                            <div className="text-xs text-text-muted mb-1">Predicted Score</div>
                            <div className="text-white font-bold text-lg">
                                {Math.round(expectedScores.home)} - {Math.round(expectedScores.away)}
                            </div>
                        </div>
                    )}
                </div>

                {/* Probabilities */}
                {probabilities && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                            <div className="text-lg font-bold text-white">
                                {Math.round(probabilities.homeWin > 1 ? probabilities.homeWin : (probabilities.homeWin || 0) * 100)}%
                            </div>
                            <div className="text-xs text-text-muted">{matchInfo.homeTeam.split(' ').pop()}</div>
                        </div>
                        {probabilities.draw !== undefined && probabilities.draw !== null && (
                            <div className="text-center p-2 bg-white/5 rounded-lg">
                                <div className="text-lg font-bold text-white">
                                    {Math.round(probabilities.draw > 1 ? probabilities.draw : (probabilities.draw || 0) * 100)}%
                                </div>
                                <div className="text-xs text-text-muted">Draw</div>
                            </div>
                        )}
                        <div className="text-center p-2 bg-white/5 rounded-lg">
                            <div className="text-lg font-bold text-white">
                                {Math.round(probabilities.awayWin > 1 ? probabilities.awayWin : (probabilities.awayWin || 0) * 100)}%
                            </div>
                            <div className="text-xs text-text-muted">{matchInfo.awayTeam.split(' ').pop()}</div>
                        </div>
                    </div>
                )}

                {/* Narrative */}
                {story.narrative && (
                    <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                        {story.narrative}
                    </p>
                )}
            </div>

            {/* VALUE EDGE - The Key Differentiator */}
            {oddsComparison && (oddsComparison.homeEdge || oddsComparison.drawEdge || oddsComparison.awayEdge) && (
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-medium text-yellow-400">VALUE EDGE (AI vs Market)</span>
                    </div>
                    <div className="space-y-2">
                        <EdgeBadge label={matchInfo.homeTeam} edge={oddsComparison.homeEdge} odds={oddsComparison.homeOdds} />
                        {oddsComparison.drawEdge !== undefined && (
                            <EdgeBadge label="Draw" edge={oddsComparison.drawEdge} odds={oddsComparison.drawOdds} />
                        )}
                        <EdgeBadge label={matchInfo.awayTeam} edge={oddsComparison.awayEdge} odds={oddsComparison.awayOdds} />
                    </div>
                </div>
            )}

            {/* Form & Momentum */}
            {momentumAndForm && (momentumAndForm.homeForm?.length || momentumAndForm.awayForm?.length) && (
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-blue-400">RECENT FORM</span>
                    </div>
                    <div className="space-y-2">
                        {momentumAndForm.homeForm && momentumAndForm.homeForm.length > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white">{matchInfo.homeTeam}</span>
                                <div className="flex items-center gap-1">
                                    {momentumAndForm.homeForm.slice(0, 5).map((m, i) => (
                                        <span 
                                            key={i} 
                                            className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold
                                                ${m.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                                                  m.result === 'L' ? 'bg-red-500/20 text-red-400' : 
                                                  'bg-gray-500/20 text-gray-400'}`}
                                        >
                                            {m.result}
                                        </span>
                                    ))}
                                    {momentumAndForm.homeFormScore && (
                                        <span className="text-xs text-text-muted ml-2">{momentumAndForm.homeFormScore}/10</span>
                                    )}
                                </div>
                            </div>
                        )}
                        {momentumAndForm.awayForm && momentumAndForm.awayForm.length > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-white">{matchInfo.awayTeam}</span>
                                <div className="flex items-center gap-1">
                                    {momentumAndForm.awayForm.slice(0, 5).map((m, i) => (
                                        <span 
                                            key={i} 
                                            className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold
                                                ${m.result === 'W' ? 'bg-green-500/20 text-green-400' : 
                                                  m.result === 'L' ? 'bg-red-500/20 text-red-400' : 
                                                  'bg-gray-500/20 text-gray-400'}`}
                                        >
                                            {m.result}
                                        </span>
                                    ))}
                                    {momentumAndForm.awayFormScore && (
                                        <span className="text-xs text-text-muted ml-2">{momentumAndForm.awayFormScore}/10</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {momentumAndForm.momentumShift && (
                        <p className="text-xs text-text-muted mt-2">{momentumAndForm.momentumShift}</p>
                    )}
                </div>
            )}

            {/* Injuries */}
            {injuryContext && (injuryContext.homeTeamInjuries?.length || injuryContext.awayTeamInjuries?.length) && (
                <div className="p-4 border-b border-white/10">
                    <div className="text-xs font-medium text-red-400 mb-2">🏥 INJURIES</div>
                    <div className="space-y-2 text-sm">
                        {injuryContext.homeTeamInjuries && injuryContext.homeTeamInjuries.length > 0 && (
                            <div>
                                <span className="text-text-muted">{matchInfo.homeTeam}:</span>
                                <span className="text-white ml-1">
                                    {injuryContext.homeTeamInjuries.slice(0, 3).map(p => `${p.player} (${p.status})`).join(', ')}
                                </span>
                            </div>
                        )}
                        {injuryContext.awayTeamInjuries && injuryContext.awayTeamInjuries.length > 0 && (
                            <div>
                                <span className="text-text-muted">{matchInfo.awayTeam}:</span>
                                <span className="text-white ml-1">
                                    {injuryContext.awayTeamInjuries.slice(0, 3).map(p => `${p.player} (${p.status})`).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Upset Alert */}
            {upsetPotential && (upsetPotential.upsetLikely || (upsetPotential.probability && upsetPotential.probability > 0.25)) && (
                <div className="p-4 border-b border-white/10 bg-orange-500/5">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium text-orange-400">UPSET ALERT</span>
                        {upsetPotential.probability && (
                            <span className="text-white font-bold">{Math.round(upsetPotential.probability * 100)}%</span>
                        )}
                    </div>
                    {upsetPotential.reason && (
                        <p className="text-sm text-text-secondary mt-1">{upsetPotential.reason}</p>
                    )}
                </div>
            )}

            {/* Risk Level */}
            {riskAnalysis?.riskLevel && (
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">Risk Level:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskStyles[riskAnalysis.riskLevel]}`}>
                            {riskAnalysis.riskLevel}
                        </span>
                        {riskAnalysis.trapMatchWarning && (
                            <span className="text-xs text-red-400 font-medium">⚠️ TRAP MATCH</span>
                        )}
                    </div>
                    {riskAnalysis.factors && riskAnalysis.factors.length > 0 && (
                        <p className="text-xs text-text-muted mt-1">{riskAnalysis.factors.slice(0, 2).join(' • ')}</p>
                    )}
                </div>
            )}

            {/* Key Points / Signals Summary (fallback for basic data) */}
            {!hasExtendedData && universalSignals?.display && (
                <div className="p-4 border-b border-white/10">
                    <div className="text-xs text-text-muted mb-2">Key Signals</div>
                    <div className="flex flex-wrap gap-2">
                        {universalSignals.display.form && (
                            <SignalBadge
                                label="Form"
                                value={universalSignals.display.form.label}
                                trend={universalSignals.display.form.home === 'strong' ? 'up' : universalSignals.display.form.away === 'strong' ? 'down' : 'neutral'}
                            />
                        )}
                        {universalSignals.display.edge && (
                            <SignalBadge
                                label="Edge"
                                value={universalSignals.display.edge.label}
                                trend={universalSignals.display.edge.direction === 'home' ? 'up' : universalSignals.display.edge.direction === 'away' ? 'down' : 'neutral'}
                            />
                        )}
                        {universalSignals.display.tempo && (
                            <SignalBadge
                                label="Tempo"
                                value={universalSignals.display.tempo.label}
                            />
                        )}
                        {universalSignals.display.availability && (
                            <SignalBadge
                                label="Injuries"
                                value={universalSignals.display.availability.label}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Key Points from briefing */}
            {briefing?.keyPoints && briefing.keyPoints.length > 0 && (
                <div className="p-4 border-b border-white/10">
                    <div className="text-xs text-text-muted mb-2">Key Insights</div>
                    <ul className="space-y-1.5">
                        {briefing.keyPoints.slice(0, 4).map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                <span className="text-accent mt-0.5">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Viral Stats */}
            {preMatchInsights?.viralStats && preMatchInsights.viralStats.length > 0 && (
                <div className="p-4 border-b border-white/10">
                    <div className="text-xs text-text-muted mb-2">🔥 Interesting Stats</div>
                    <ul className="space-y-1.5">
                        {preMatchInsights.viralStats.slice(0, 3).map((stat, i) => (
                            <li key={i} className="text-sm text-text-secondary">{stat}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Expert Verdict */}
            {tacticalAnalysis?.expertConclusionOneLiner && (
                <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                    <div className="text-xs text-text-muted mb-1">💡 Expert Verdict</div>
                    <p className="text-sm text-white font-medium">{tacticalAnalysis.expertConclusionOneLiner}</p>
                </div>
            )}

            {/* Snapshot Points (fallback) */}
            {!briefing?.keyPoints?.length && story.snapshot && story.snapshot.length > 0 && (
                <div className="p-4 border-b border-white/10">
                    <div className="text-xs text-text-muted mb-2">Quick Facts</div>
                    <ul className="space-y-1.5">
                        {story.snapshot.slice(0, 3).map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                <span className="text-accent mt-0.5">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Disclaimer */}
            <div className="px-4 py-2 bg-white/[0.02] border-b border-white/10">
                <p className="text-xs text-text-muted">
                    ⚠️ Educational analysis only, not betting advice. Gamble responsibly. 18+
                </p>
            </div>

            {/* CTA - View Full Analysis */}
            <Link
                href={matchUrl}
                className="flex items-center justify-between p-4 bg-accent/10 hover:bg-accent/20 transition-colors group"
            >
                <span className="text-sm font-medium text-accent">View Full Analysis on Match Page</span>
                <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
}
