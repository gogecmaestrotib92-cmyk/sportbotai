/**
 * Risk Analysis Card Component (Phase 3 Enhanced)
 * 
 * Features:
 * - Visual risk meter with gradient
 * - Cognitive bias gallery with detection
 * - Emotion awareness section
 * - Dynamic bankroll impact visualization
 */

'use client';

import { useState } from 'react';
import { RiskAnalysis, RiskLevel } from '@/types';

interface RiskAnalysisCardProps {
  riskAnalysis: RiskAnalysis;
}

// Common cognitive biases in sports betting
const COGNITIVE_BIASES = [
  {
    id: 'recency',
    name: 'Recency Bias',
    icon: '🔄',
    description: 'Overweighting recent results while ignoring longer-term patterns.',
    mitigation: 'Look at 10+ game samples, not just the last 2-3 matches.',
  },
  {
    id: 'favorite-longshot',
    name: 'Favorite-Longshot Bias',
    icon: '🎯',
    description: 'Overvaluing longshots and undervaluing heavy favorites.',
    mitigation: 'Compare implied probabilities to historical win rates.',
  },
  {
    id: 'confirmation',
    name: 'Confirmation Bias',
    icon: '✅',
    description: 'Seeking information that supports your existing beliefs.',
    mitigation: 'Actively look for reasons your pick might lose.',
  },
  {
    id: 'gambler-fallacy',
    name: "Gambler's Fallacy",
    icon: '🎲',
    description: 'Believing past events affect future independent outcomes.',
    mitigation: 'Each match is independent - streaks don\'t "need" to end.',
  },
  {
    id: 'sunk-cost',
    name: 'Sunk Cost Fallacy',
    icon: '💸',
    description: 'Chasing losses to recover previous bets.',
    mitigation: 'Each bet should stand on its own merit.',
  },
  {
    id: 'overconfidence',
    name: 'Overconfidence',
    icon: '🦚',
    description: 'Believing your analysis is better than it actually is.',
    mitigation: 'Track your actual hit rate over 100+ predictions.',
  },
  {
    id: 'anchoring',
    name: 'Anchoring Bias',
    icon: '⚓',
    description: 'Being anchored to initial odds or first impressions.',
    mitigation: 'Re-evaluate with fresh eyes before placing bets.',
  },
  {
    id: 'availability',
    name: 'Availability Heuristic',
    icon: '📺',
    description: 'Overweighting memorable or recent news/events.',
    mitigation: 'Consider base rates, not just headline stories.',
  },
];

const riskLevelConfig: Record<RiskLevel, { 
  label: string; 
  color: string;
  bgColor: string;
  percentage: number;
  gradient: string;
}> = {
  LOW: { 
    label: 'Low', 
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    percentage: 25,
    gradient: 'from-green-400 to-green-500',
  },
  MEDIUM: { 
    label: 'Medium', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    percentage: 55,
    gradient: 'from-amber-400 to-amber-500',
  },
  HIGH: { 
    label: 'High', 
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    percentage: 85,
    gradient: 'from-red-400 to-red-500',
  },
};

// Risk meter component
function RiskMeter({ level }: { level: RiskLevel }) {
  const config = riskLevelConfig[level];
  
  return (
    <div className="relative">
      {/* Background track */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        {/* Gradient fill */}
        <div 
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-green-400 via-amber-400 to-red-500"
          style={{ width: `${config.percentage}%` }}
        />
      </div>
      
      {/* Markers */}
      <div className="absolute top-0 left-0 right-0 h-3 flex items-center">
        <div className="absolute left-[25%] w-0.5 h-2 bg-white/50 rounded"></div>
        <div className="absolute left-[50%] w-0.5 h-2 bg-white/50 rounded"></div>
        <div className="absolute left-[75%] w-0.5 h-2 bg-white/50 rounded"></div>
      </div>
      
      {/* Label track */}
      <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 font-medium">
        <span>Safe</span>
        <span>Moderate</span>
        <span>Risky</span>
      </div>
    </div>
  );
}

// Detected bias card
function DetectedBiasCard({ bias, isActive }: { bias: typeof COGNITIVE_BIASES[0]; isActive: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className={`
        p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${isActive 
          ? 'bg-amber-50 border-amber-300 shadow-sm' 
          : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
        }
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{bias.icon}</span>
        <span className={`text-sm font-semibold ${isActive ? 'text-amber-900' : 'text-gray-600'}`}>
          {bias.name}
        </span>
        {isActive && (
          <span className="ml-auto px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full">
            DETECTED
          </span>
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200 animate-fadeIn">
          <p className="text-xs text-gray-600 mb-2">{bias.description}</p>
          <div className="flex items-start gap-1.5 text-[10px]">
            <span className="text-green-600 font-bold">💡</span>
            <span className="text-gray-700">{bias.mitigation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Emotion awareness component
function EmotionAwareness() {
  const emotions = [
    { emoji: '😌', label: 'Calm', tip: 'Good state for analysis' },
    { emoji: '😤', label: 'Frustrated', tip: 'Take a break, avoid chasing' },
    { emoji: '🤑', label: 'Greedy', tip: 'Stick to your bankroll plan' },
    { emoji: '😰', label: 'Anxious', tip: 'Consider smaller stakes' },
  ];
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🧘</span>
        <span className="text-sm font-semibold text-purple-900">Emotional Check-In</span>
      </div>
      <p className="text-xs text-purple-700 mb-3">
        Before betting, ask yourself: How am I feeling right now?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {emotions.map((e) => (
          <div key={e.label} className="text-center group cursor-help">
            <div className="text-xl mb-0.5 group-hover:scale-125 transition-transform">{e.emoji}</div>
            <p className="text-[10px] text-purple-600 font-medium">{e.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RiskAnalysisCard({ riskAnalysis }: RiskAnalysisCardProps) {
  const [showAllBiases, setShowAllBiases] = useState(false);
  const config = riskLevelConfig[riskAnalysis.overallRiskLevel];
  
  // Detect which bias is mentioned (simple keyword matching)
  const detectedBiasId = COGNITIVE_BIASES.find(b => 
    riskAnalysis.psychologyBias.name.toLowerCase().includes(b.name.toLowerCase().split(' ')[0])
  )?.id || null;
  
  // Show detected bias first, then others
  const sortedBiases = [...COGNITIVE_BIASES].sort((a, b) => {
    if (a.id === detectedBiasId) return -1;
    if (b.id === detectedBiasId) return 1;
    return 0;
  });
  
  const displayedBiases = showAllBiases ? sortedBiases : sortedBiases.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Risk Level Header with Meter */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.bgColor}`}></div>
            <h4 className="text-sm font-semibold text-gray-900">Risk Level</h4>
          </div>
          <span className={`text-lg font-bold ${config.color}`}>
            {config.label}
          </span>
        </div>
        
        <RiskMeter level={riskAnalysis.overallRiskLevel} />
        
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          {riskAnalysis.riskExplanation}
        </p>
      </div>

      {/* Bankroll Impact */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">💼</span>
          <h4 className="text-sm font-semibold text-gray-900">Bankroll Consideration</h4>
        </div>
        <p className="text-sm text-gray-600">
          {riskAnalysis.bankrollImpact}
        </p>
      </div>

      {/* Detected Psychology Bias */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🧠</span>
            <h4 className="text-sm font-semibold text-amber-900">Psychology Alert</h4>
          </div>
          <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full uppercase">
            Watch Out
          </span>
        </div>
        <p className="text-sm font-medium text-amber-900 mb-1">
          {riskAnalysis.psychologyBias.name}
        </p>
        <p className="text-sm text-amber-800">
          {riskAnalysis.psychologyBias.description}
        </p>
      </div>

      {/* Cognitive Bias Gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Common Betting Biases
          </h4>
          <button
            onClick={() => setShowAllBiases(!showAllBiases)}
            className="text-xs text-primary-900 hover:underline font-medium"
          >
            {showAllBiases ? 'Show less' : 'Show all'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {displayedBiases.map((bias) => (
            <DetectedBiasCard 
              key={bias.id}
              bias={bias}
              isActive={bias.id === detectedBiasId}
            />
          ))}
        </div>
      </div>

      {/* Emotion Awareness */}
      <EmotionAwareness />
    </div>
  );
}
