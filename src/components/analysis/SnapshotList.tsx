/**
 * Snapshot List Component - Interactive Match Insights
 * 
 * Displays the 4 key match insights (THE EDGE, MARKET MISS, THE PATTERN, THE RISK)
 * with colored bullets and expandable explanations.
 */

'use client';

import { useState } from 'react';
import PremiumIcon from '@/components/ui/PremiumIcon';

interface SnapshotListProps {
  snapshot: string[];
  maxItems?: number;
  compact?: boolean;
}

export default function SnapshotList({ snapshot, maxItems = 4, compact = false }: SnapshotListProps) {
  return (
    <ul className={compact ? 'space-y-2' : 'space-y-3'}>
      {snapshot.slice(0, maxItems).map((insight, index) => (
        <SnapshotInsight key={index} insight={insight} index={index} compact={compact} />
      ))}
    </ul>
  );
}

/**
 * Individual Snapshot Insight - Expandable with colored bullet and explanation
 */
function SnapshotInsight({ insight, index, compact }: { insight: string; index: number; compact: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  // Determine bullet type and color based on content
  const getBulletConfig = (text: string, idx: number) => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('the edge:') || idx === 0) {
      return { 
        color: 'bg-emerald-500', 
        textColor: 'text-emerald-400',
        label: 'THE EDGE',
        explanation: 'This is our primary pick based on statistical analysis. The percentage shown is the computed edge between our model probability and the market odds.'
      };
    }
    if (lowerText.includes('market miss:') || idx === 1) {
      return { 
        color: 'bg-blue-500', 
        textColor: 'text-blue-400',
        label: 'MARKET MISS',
        explanation: 'This identifies what the bookmaker odds are potentially undervaluing. We compare home/away form splits, recent performance, and market implied probabilities.'
      };
    }
    if (lowerText.includes('the pattern:') || idx === 2) {
      return { 
        color: 'bg-violet-500', 
        textColor: 'text-violet-400',
        label: 'THE PATTERN',
        explanation: 'Historical patterns from head-to-head meetings and streaks. While past performance doesn\'t guarantee future results, recurring patterns can indicate underlying dynamics.'
      };
    }
    if (lowerText.includes('the risk:') || idx === 3) {
      return { 
        color: 'bg-amber-500', 
        textColor: 'text-amber-400',
        label: 'THE RISK',
        explanation: 'Key factors that could invalidate this analysis. Always consider these before making decisions. Injuries, fatigue, and form changes can significantly impact outcomes.'
      };
    }
    return { 
      color: 'bg-zinc-500', 
      textColor: 'text-zinc-400',
      label: 'INSIGHT',
      explanation: 'Additional context from our analysis.'
    };
  };
  
  const config = getBulletConfig(insight, index);
  
  // Extract the text after the label (e.g., "THE EDGE: Arsenal because...")
  const displayText = insight.replace(/^(THE EDGE|MARKET MISS|THE PATTERN|THE RISK):\s*/i, '');
  
  return (
    <li className="group">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-left flex items-start gap-3 ${compact ? 'p-2 -m-2' : 'p-3 -m-3'} rounded-xl hover:bg-white/[0.02] transition-colors`}
      >
        {/* Colored bullet with ring */}
        <span className={`${compact ? 'w-2 h-2 mt-1.5' : 'w-2.5 h-2.5 mt-1.5'} rounded-full ${config.color} flex-shrink-0 ring-2 ring-offset-1 ring-offset-[#0a0a0b] ${config.color.replace('bg-', 'ring-')}/30`} />
        
        <div className="flex-1 min-w-0">
          {/* Label badge - only show if not compact */}
          {!compact && (
            <span className={`inline-block font-matrix text-[10px] font-normal uppercase tracking-[0.15em] mb-1 ${config.textColor}`}>
              {config.label}
            </span>
          )}
          
          {/* Main insight text */}
          <p className={`${compact ? 'text-sm' : 'text-base'} text-stone-200 leading-relaxed`}>
            {compact ? insight : displayText}
          </p>
          
          {/* Expandable explanation - only for non-compact mode */}
          {!compact && expanded && (
            <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-sm text-stone-400 leading-relaxed flex items-start gap-2">
                <PremiumIcon name="lightbulb" size="sm" className="text-stone-500 mt-0.5 flex-shrink-0" />
                <span><strong className="text-stone-300">Why this matters:</strong> {config.explanation}</span>
              </p>
            </div>
          )}
        </div>
        
        {/* Expand indicator - only for non-compact */}
        {!compact && (
          <span className={`text-stone-500 text-xs transition-transform ${expanded ? 'rotate-180' : ''} opacity-0 group-hover:opacity-100`}>
            ▼
          </span>
        )}
      </button>
    </li>
  );
}

export { SnapshotInsight };
