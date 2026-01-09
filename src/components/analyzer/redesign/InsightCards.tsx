/**
 * Insight Cards Component
 * 
 * Modular insight cards in Apple-style grid.
 * Each card tells one part of the story with clear hierarchy.
 * Includes team logos for visual recognition.
 */

'use client';

import { AnalyzeResponse, FormMatch } from '@/types';
import { TeamLogo } from '@/components/ui';
import PremiumIcon, { IconName } from '@/components/ui/PremiumIcon';

interface InsightCardsProps {
  result: AnalyzeResponse;
}

interface InsightCardProps {
  title: string;
  icon: IconName;
  children: React.ReactNode;
  accentColor?: string;
}

function InsightCard({ title, icon, children, accentColor = 'from-white/10 to-white/5' }: InsightCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-[#0f0f12] border border-white/[0.06] hover:border-white/[0.1] transition-all duration-300">
      {/* Subtle gradient on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <PremiumIcon name={icon} size="lg" className="text-white/70" />
          <h3 className="text-sm font-medium text-white/70">{title}</h3>
        </div>
        
        {/* Content */}
        {children}
      </div>
    </div>
  );
}

// Form indicator component - handles FormMatch[] type with team logo
function FormIndicator({ 
  form, 
  teamName,
  sport,
  league 
}: { 
  form?: FormMatch[]; 
  teamName: string;
  sport: string;
  league: string;
}) {
  const formColors: Record<string, string> = {
    'W': 'bg-emerald-500',
    'D': 'bg-white/40',
    'L': 'bg-rose-500',
  };

  if (!form || form.length === 0) {
    return (
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <TeamLogo teamName={teamName} sport={sport} league={league} size="sm" />
          <p className="text-xs text-white/40 truncate">{teamName}</p>
        </div>
        <p className="text-xs text-white/30 pl-8">No form data available</p>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <TeamLogo teamName={teamName} sport={sport} league={league} size="sm" />
        <p className="text-xs text-white/40 truncate">{teamName}</p>
      </div>
      <div className="flex gap-1.5 pl-8">
        {form.slice(0, 5).map((match, idx) => (
          <div
            key={idx}
            className={`w-6 h-6 rounded-md ${formColors[match.result] || 'bg-white/20'} flex items-center justify-center`}
          >
            <span className="text-[10px] font-bold text-white">{match.result}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trend badge
function TrendBadge({ trend }: { trend: string }) {
  const config: Record<string, { icon: string; color: string; label: string }> = {
    'RISING': { icon: '↑', color: 'text-emerald-400', label: 'Rising' },
    'FALLING': { icon: '↓', color: 'text-rose-400', label: 'Falling' },
    'STABLE': { icon: '→', color: 'text-white/50', label: 'Stable' },
    'UNKNOWN': { icon: '?', color: 'text-white/30', label: 'Unknown' },
  };
  const t = config[trend] || config.UNKNOWN;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 text-xs ${t.color}`}>
      <span>{t.icon}</span>
      <span>{t.label}</span>
    </span>
  );
}

export default function InsightCards({ result }: InsightCardsProps) {
  const { matchInfo, momentumAndForm, tacticalAnalysis, riskAnalysis } = result;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Form & Momentum Card */}
      <InsightCard title="Recent Form" icon="trending" accentColor="from-emerald-500/5 to-transparent">
        <div className="space-y-4">
          <FormIndicator 
            form={momentumAndForm.homeForm} 
            teamName={matchInfo.homeTeam}
            sport={matchInfo.sport}
            league={matchInfo.leagueName}
          />
          <FormIndicator 
            form={momentumAndForm.awayForm} 
            teamName={matchInfo.awayTeam}
            sport={matchInfo.sport}
            league={matchInfo.leagueName}
          />
          
          {/* Trends */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Home:</span>
              <TrendBadge trend={momentumAndForm.homeTrend} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Away:</span>
              <TrendBadge trend={momentumAndForm.awayTrend} />
            </div>
          </div>
        </div>
      </InsightCard>

      {/* Key Factors Card */}
      <InsightCard title="Key Factors" icon="target" accentColor="from-blue-500/5 to-transparent">
        <ul className="space-y-2.5">
          {tacticalAnalysis.keyMatchFactors.slice(0, 4).map((factor, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span className="text-sm text-white/60 leading-relaxed">{factor}</span>
            </li>
          ))}
        </ul>
      </InsightCard>

      {/* Playing Style Card */}
      <InsightCard title="Tactical Preview" icon="shield" accentColor="from-purple-500/5 to-transparent">
        <p className="text-sm text-white/60 leading-relaxed">
          {tacticalAnalysis.stylesSummary || 'Tactical analysis pending...'}
        </p>
      </InsightCard>

      {/* Risk & Psychology Card */}
      <InsightCard title="Watch Out For" icon="warning" accentColor="from-amber-500/5 to-transparent">
        <div className="space-y-3">
          {/* Risk Explanation */}
          <p className="text-sm text-white/60 leading-relaxed">
            {riskAnalysis.riskExplanation}
          </p>
          
          {/* Psychology Bias */}
          {riskAnalysis.psychologyBias && (
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-400 font-medium">{riskAnalysis.psychologyBias.name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{riskAnalysis.psychologyBias.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </InsightCard>
    </div>
  );
}
