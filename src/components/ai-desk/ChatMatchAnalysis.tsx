'use client';

/**
 * Chat Match Analysis Component
 * 
 * Compact match analysis display for chat responses.
 * Shows the same data as match pages in a chat-friendly format.
 */

import Link from 'next/link';
import { Calendar, MapPin, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

export default function ChatMatchAnalysis({ data }: ChatMatchAnalysisProps) {
    const { matchInfo, story, universalSignals, expectedScores, matchUrl } = data;

    // Determine favored team name
    const favoredTeam = story.favored === 'home'
        ? matchInfo.homeTeam
        : story.favored === 'away'
            ? matchInfo.awayTeam
            : 'Draw';

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

            {/* Prediction */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between">
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

                {/* Narrative */}
                {story.narrative && (
                    <p className="mt-3 text-sm text-text-secondary leading-relaxed">
                        {story.narrative}
                    </p>
                )}
            </div>

            {/* Signals Summary */}
            {universalSignals?.display && (
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

            {/* Snapshot Points */}
            {story.snapshot && story.snapshot.length > 0 && (
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

            {/* CTA - View Full Analysis */}
            <Link
                href={matchUrl}
                className="flex items-center justify-between p-4 bg-accent/10 hover:bg-accent/20 transition-colors group"
            >
                <span className="text-sm font-medium text-accent">View Full Analysis</span>
                <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
}
