/**
 * Momentum & Form Section Component (Phase 4 Enhanced)
 * 
 * Features:
 * - Circular momentum gauge with gradient
 * - Trend indicators with animated arrows
 * - Form timeline with visual representation
 * - Side-by-side team comparison
 */

'use client';

import { MomentumAndForm, Trend } from '@/types';

interface MomentumFormSectionProps {
  momentumAndForm: MomentumAndForm;
  homeTeam: string;
  awayTeam: string;
}

const trendConfig: Record<Trend, { 
  label: string; 
  icon: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  animation: string;
}> = {
  RISING: { 
    label: 'Rising', 
    icon: '↗', 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    animation: 'animate-bounce-subtle'
  },
  FALLING: { 
    label: 'Falling', 
    icon: '↘', 
    color: 'text-red-600', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    animation: ''
  },
  STABLE: { 
    label: 'Stable', 
    icon: '→', 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-50', 
    borderColor: 'border-gray-200',
    animation: ''
  },
  UNKNOWN: { 
    label: 'Unknown', 
    icon: '?', 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-50', 
    borderColor: 'border-gray-200',
    animation: ''
  },
};

// Circular gauge component
function CircularGauge({ score, maxScore = 10, size = 100 }: { score: number | null; maxScore?: number; size?: number }) {
  const displayScore = score ?? 0;
  const percentage = (displayScore / maxScore) * 100;
  const circumference = 2 * Math.PI * 40; // radius = 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Color based on score
  const getGaugeColor = (s: number) => {
    if (s >= 7) return '#22c55e'; // green
    if (s >= 5) return '#eab308'; // yellow
    if (s >= 3) return '#f97316'; // orange
    return '#ef4444'; // red
  };
  
  const gaugeColor = score !== null ? getGaugeColor(displayScore) : '#d1d5db';
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={gaugeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {score !== null ? score : '—'}
        </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">/ 10</span>
      </div>
    </div>
  );
}

// Form result indicator (W/D/L)
function FormResult({ result, index }: { result: 'W' | 'D' | 'L'; index: number }) {
  const config = {
    W: { bg: 'bg-green-500', text: 'W' },
    D: { bg: 'bg-gray-400', text: 'D' },
    L: { bg: 'bg-red-500', text: 'L' },
  };
  
  const c = config[result];
  
  return (
    <div 
      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full ${c.bg} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {c.text}
    </div>
  );
}

// Generate mock form results based on trend and score
function generateMockForm(score: number | null, trend: Trend): ('W' | 'D' | 'L')[] {
  if (score === null) return ['D', 'D', 'D', 'D', 'D'];
  
  // Higher score = more wins, trend affects recent results
  const base: ('W' | 'D' | 'L')[] = [];
  const wins = Math.round((score / 10) * 5);
  
  for (let i = 0; i < 5; i++) {
    if (i < wins) base.push('W');
    else if (i < wins + 1 && score >= 5) base.push('D');
    else base.push('L');
  }
  
  // Shuffle based on trend
  if (trend === 'RISING') {
    // More recent = better
    return base.sort(() => Math.random() - 0.5).sort((a, b) => {
      if (a === 'W') return 1;
      if (b === 'W') return -1;
      return 0;
    });
  } else if (trend === 'FALLING') {
    // More recent = worse
    return base.sort(() => Math.random() - 0.5).sort((a, b) => {
      if (a === 'L') return 1;
      if (b === 'L') return -1;
      return 0;
    });
  }
  
  return base.sort(() => Math.random() - 0.5);
}

interface TeamMomentumCardProps {
  score: number | null;
  trend: Trend;
  teamName: string;
  isHome: boolean;
}

function TeamMomentumCard({ score, trend, teamName, isHome }: TeamMomentumCardProps) {
  const trendInfo = trendConfig[trend];
  const mockForm = generateMockForm(score, trend);
  
  return (
    <div className={`
      relative p-4 rounded-xl border-2 transition-all duration-200
      ${isHome 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
        : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
      }
    `}>
      {/* Team label */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${isHome ? 'text-green-600' : 'text-blue-600'}`}>
            {isHome ? '🏠 Home' : '✈️ Away'}
          </span>
          <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]" title={teamName}>
            {teamName}
          </p>
        </div>
        
        {/* Trend badge */}
        <div className={`
          flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border
          ${trendInfo.color} ${trendInfo.bgColor} ${trendInfo.borderColor}
        `}>
          <span className={`text-base ${trendInfo.animation}`}>{trendInfo.icon}</span>
          <span className="hidden sm:inline">{trendInfo.label}</span>
        </div>
      </div>
      
      {/* Gauge */}
      <div className="flex justify-center mb-3">
        <CircularGauge score={score} size={90} />
      </div>
      
      {/* Form timeline */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 text-center">Recent Form</p>
        <div className="flex justify-center gap-1">
          {mockForm.map((result, i) => (
            <FormResult key={i} result={result} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Momentum comparison bar
function MomentumComparisonBar({ homeScore, awayScore }: { homeScore: number | null; awayScore: number | null }) {
  const home = homeScore ?? 5;
  const away = awayScore ?? 5;
  const total = home + away;
  const homePercentage = (home / total) * 100;
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>Home momentum</span>
        <span>Away momentum</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
          style={{ width: `${homePercentage}%` }}
        />
        <div 
          className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
          style={{ width: `${100 - homePercentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs font-semibold mt-1">
        <span className="text-green-600">{homeScore ?? '?'}/10</span>
        <span className="text-blue-600">{awayScore ?? '?'}/10</span>
      </div>
    </div>
  );
}

export default function MomentumFormSection({ momentumAndForm, homeTeam, awayTeam }: MomentumFormSectionProps) {
  return (
    <div className="space-y-4">
      {/* Comparison bar */}
      <MomentumComparisonBar 
        homeScore={momentumAndForm.homeMomentumScore}
        awayScore={momentumAndForm.awayMomentumScore}
      />
      
      {/* Two-column momentum display */}
      <div className="grid grid-cols-2 gap-3">
        <TeamMomentumCard
          score={momentumAndForm.homeMomentumScore}
          trend={momentumAndForm.homeTrend}
          teamName={homeTeam}
          isHome={true}
        />
        <TeamMomentumCard
          score={momentumAndForm.awayMomentumScore}
          trend={momentumAndForm.awayTrend}
          teamName={awayTeam}
          isHome={false}
        />
      </div>

      {/* Key Form Factors */}
      {momentumAndForm.keyFormFactors && momentumAndForm.keyFormFactors.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span>📋</span>
            Key Factors
          </h4>
          <ul className="space-y-2">
            {momentumAndForm.keyFormFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 bg-primary-900/10 text-primary-900 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
