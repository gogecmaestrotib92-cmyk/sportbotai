/**
 * Editorial Picks Content - Client Component
 * 
 * Article-style layout with full writeups for each pick.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

// Types
interface Analysis {
  story?: string;
  headlines?: string[];
  viralStats?: string[];
  form?: {
    homeForm?: string;
    awayForm?: string;
    homeTrend?: string;
    awayTrend?: string;
    h2hSummary?: string;
    keyFactors?: string[];
  };
  injuries?: {
    home?: Array<{ player: string; status: string; impact: string }>;
    away?: Array<{ player: string; status: string; impact: string }>;
  };
  contextFactors?: string[];
  signals?: Array<{ label: string; value: string; sentiment: string }>;
  marketIntel?: {
    lineMovement?: string;
    publicMoney?: string;
    sharpAction?: string;
  };
}

interface Pick {
  rank: number;
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  kickoff: string;
  confidence: number;
  edgeValue: number;
  edgeBucket: string | null;
  selection: string | null;
  odds: number | null;
  probabilities: { home: number; draw: number | null; away: number } | null;
  predictedScore: string | null;
  headline: string | null;
  locked: boolean;
  analysis: Analysis | null;
}

interface PicksResponse {
  success: boolean;
  date: string;
  picks: Pick[];
  isPro: boolean;
}

const sportEmojis: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  americanfootball: '🏈',
  icehockey: '🏒',
};

// Helper to safely extract string from potential object
function safeString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if ('text' in value) return String((value as { text?: unknown }).text || '');
    if ('narrative' in value) return String((value as { narrative?: unknown }).narrative || '');
    // For arrays of match results, format as W/L sequence
    if (Array.isArray(value)) {
      return value
        .slice(0, 5)
        .map((m: { result?: string }) => m?.result || '?')
        .join(' ');
    }
    // For H2H object
    if ('homeWins' in value || 'awayWins' in value) {
      const data = value as { homeWins?: number; awayWins?: number; draws?: number };
      const parts = [];
      if (data.homeWins) parts.push(`${data.homeWins} home wins`);
      if (data.awayWins) parts.push(`${data.awayWins} away wins`);
      if (data.draws) parts.push(`${data.draws} draws`);
      return parts.join(', ');
    }
  }
  return '';
}

function formatKickoff(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatLeague(league: string): string {
  return league
    .replace(/_/g, ' ')
    .replace(/soccer |basketball |americanfootball |icehockey /gi, '')
    .toUpperCase();
}

// Editorial article for one pick
function PickArticle({ pick, isPro }: { pick: Pick; isPro: boolean }) {
  const sportKey = pick.sport.split('_')[0];
  const emoji = sportEmojis[sportKey] || '🎯';
  const analysis = pick.analysis;

  return (
    <article className="mb-12 pb-12 border-b border-white/10 last:border-0">
      {/* Pick Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <span className="bg-accent/20 text-accent px-2 py-0.5 rounded font-bold">
            PICK #{pick.rank}
          </span>
          <span>•</span>
          <span>{formatLeague(pick.league)}</span>
          <span>•</span>
          <span>Confidence: {pick.confidence?.toFixed(0)}%</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {emoji} {pick.homeTeam} vs {pick.awayTeam}
        </h2>
        
        <p className="text-gray-400">
          {formatKickoff(pick.kickoff)}
        </p>
      </div>

      {/* Locked State for Free Users */}
      {pick.locked && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <p className="text-gray-300 mb-4 text-lg italic">
            {typeof pick.headline === 'string' 
              ? pick.headline 
              : (pick.headline && typeof pick.headline === 'object' && 'text' in pick.headline)
                ? String((pick.headline as { text?: unknown }).text || '')
                : 'Our AI model has identified a high-confidence opportunity in this match.'}
          </p>
          
          <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-white font-medium">Unlock full analysis</p>
              <p className="text-sm text-gray-400">Selection, odds, form breakdown, and reasoning</p>
            </div>
            <Link
              href="/pricing"
              className="bg-accent hover:bg-accent/90 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Go Pro
            </Link>
          </div>
        </div>
      )}

      {/* Full Analysis for Pro Users */}
      {!pick.locked && analysis && (
        <>
          {/* Selection Box */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-5 mb-6">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Our Pick</p>
                <p className="text-xl font-bold text-white">{pick.selection}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Edge</p>
                <p className="text-xl font-bold text-green-400">+{pick.edgeValue?.toFixed(1)}%</p>
              </div>
              {pick.odds && (
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Odds</p>
                  <p className="text-xl font-bold text-white">{pick.odds.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Headline Quote */}
          {analysis.headlines && analysis.headlines[0] && (
            <blockquote className="border-l-4 border-accent pl-4 mb-6 text-lg text-gray-300 italic">
              "{typeof analysis.headlines[0] === 'string' 
                ? analysis.headlines[0] 
                : (analysis.headlines[0] as { text?: string })?.text || ''}"
            </blockquote>
          )}

          {/* Main Story */}
          {analysis.story && (
            <div className="prose prose-invert prose-lg max-w-none mb-6">
              <h3 className="text-xl font-semibold text-white mb-3">The Case for {pick.selection?.split(' ')[0]}</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {safeString(analysis.story)}
              </p>
            </div>
          )}

          {/* Form Analysis */}
          {analysis.form && (analysis.form.homeForm || analysis.form.awayForm) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Recent Form</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {analysis.form.homeForm && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">{pick.homeTeam}</p>
                    <p className="text-xl font-mono text-white tracking-wider">{safeString(analysis.form.homeForm)}</p>
                    {analysis.form.homeTrend && (
                      <p className="text-sm text-gray-400 mt-2">{safeString(analysis.form.homeTrend)}</p>
                    )}
                  </div>
                )}
                {analysis.form.awayForm && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">{pick.awayTeam}</p>
                    <p className="text-xl font-mono text-white tracking-wider">{safeString(analysis.form.awayForm)}</p>
                    {analysis.form.awayTrend && (
                      <p className="text-sm text-gray-400 mt-2">{safeString(analysis.form.awayTrend)}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* H2H Summary */}
          {analysis.form?.h2hSummary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Head-to-Head</h3>
              <p className="text-gray-300">{safeString(analysis.form.h2hSummary)}</p>
            </div>
          )}

          {/* Key Factors */}
          {analysis.form?.keyFactors && analysis.form.keyFactors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Key Factors</h3>
              <ul className="space-y-2">
                {analysis.form.keyFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-accent mt-1">•</span>
                    <span>{safeString(factor)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Viral Stats */}
          {analysis.viralStats && analysis.viralStats.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">📊 Viral Stats</h3>
              <div className="space-y-2">
                {analysis.viralStats.slice(0, 3).map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-lg px-4 py-3 text-gray-300">
                    {safeString(stat)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Injuries */}
          {analysis.injuries && (analysis.injuries.home?.length || analysis.injuries.away?.length) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">🏥 Injury Report</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {analysis.injuries.home && analysis.injuries.home.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{pick.homeTeam}</p>
                    {analysis.injuries.home.slice(0, 3).map((injury, i) => (
                      <p key={i} className="text-gray-300 text-sm">
                        <span className="text-red-400">{injury.player}</span> - {injury.status}
                      </p>
                    ))}
                  </div>
                )}
                {analysis.injuries.away && analysis.injuries.away.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">{pick.awayTeam}</p>
                    {analysis.injuries.away.slice(0, 3).map((injury, i) => (
                      <p key={i} className="text-gray-300 text-sm">
                        <span className="text-red-400">{injury.player}</span> - {injury.status}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context Factors */}
          {analysis.contextFactors && analysis.contextFactors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">⚠️ Risk Factors</h3>
              <ul className="space-y-2">
                {analysis.contextFactors.slice(0, 4).map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-300">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{safeString(factor)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Probabilities */}
          {pick.probabilities && (
            <div className="bg-white/5 rounded-xl p-5 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">AI Probabilities</h3>
              <div className="flex flex-wrap gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-400">{pick.homeTeam}</p>
                  <p className="text-2xl font-bold text-white">{pick.probabilities.home?.toFixed(0)}%</p>
                </div>
                {pick.probabilities.draw !== null && (
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Draw</p>
                    <p className="text-2xl font-bold text-white">{pick.probabilities.draw?.toFixed(0)}%</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm text-gray-400">{pick.awayTeam}</p>
                  <p className="text-2xl font-bold text-white">{pick.probabilities.away?.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <Link
            href={`/match/${pick.matchId}`}
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
          >
            View full match analysis →
          </Link>
        </>
      )}
    </article>
  );
}

interface Props {
  locale: 'en' | 'sr';
}

export default function EditorialPicksContent({ locale }: Props) {
  const { data: session } = useSession();
  const [data, setData] = useState<PicksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPro = session?.user?.plan === 'PRO' || session?.user?.plan === 'PREMIUM';

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const res = await fetch('/api/editorial-picks');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to fetch editorial picks:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPicks();
  }, []);

  const t = {
    en: {
      title: "Today's AI Picks",
      subtitle: 'Our AI model\'s highest-confidence selections for today',
      methodology: 'Methodology',
      methodologyText: 'These picks are selected by ranking all upcoming matches by our model\'s confidence score. We prioritize matches where the model has high certainty AND a positive edge over market prices. Each writeup includes form analysis, H2H history, injury context, and key factors.',
      disclaimer: 'Disclaimer',
      disclaimerText: 'These predictions are for educational and entertainment purposes only. Past performance does not guarantee future results. Always gamble responsibly.',
      noPicks: 'No picks available today',
      checkBack: 'Check back when matches are closer to kickoff time',
    },
    sr: {
      title: 'Današnji AI Pikovi',
      subtitle: 'Selekcije našeg AI modela sa najvišim poverenjem za danas',
      methodology: 'Metodologija',
      methodologyText: 'Ovi pikovi su izabrani rangiranjem svih predstojećih mečeva po confidence score-u našeg modela. Prioritet imaju mečevi gde model ima visoku sigurnost I pozitivan edge u odnosu na tržišne kvote.',
      disclaimer: 'Napomena',
      disclaimerText: 'Ove predikcije su samo u edukativne i zabavne svrhe. Prošli rezultati ne garantuju buduće. Uvek se kladite odgovorno.',
      noPicks: 'Nema pikova za danas',
      checkBack: 'Proveri ponovo kada mečevi budu bliže početku',
    },
  }[locale];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 pt-24">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-64 bg-white/10 rounded" />
          <div className="h-6 w-96 bg-white/10 rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 pt-24 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">{t.noPicks}</h1>
        <p className="text-gray-400">{t.checkBack}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          🎯 {t.title}
        </h1>
        <p className="text-xl text-gray-400 mb-2">{t.subtitle}</p>
        <p className="text-sm text-gray-500">{data.date}</p>
      </header>

      {/* Intro paragraph for SEO */}
      <div className="prose prose-invert prose-lg max-w-none mb-12">
        <p className="text-gray-300 leading-relaxed">
          Welcome to our daily AI picks column. Our machine learning model analyzes thousands of data points 
          including recent form, head-to-head records, injury reports, market movements, and contextual 
          factors to identify the highest-confidence opportunities across today's sporting calendar.
        </p>
      </div>

      {/* Picks */}
      {data.picks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">{t.noPicks}</p>
          <p className="text-gray-500">{t.checkBack}</p>
        </div>
      ) : (
        <div>
          {data.picks.map((pick) => (
            <PickArticle key={pick.id} pick={pick} isPro={data.isPro} />
          ))}
        </div>
      )}

      {/* Methodology section for SEO */}
      <section className="mt-12 pt-8 border-t border-white/10">
        <h2 className="text-xl font-semibold text-white mb-4">{t.methodology}</h2>
        <p className="text-gray-400 leading-relaxed mb-6">
          {t.methodologyText}
        </p>

        <h2 className="text-xl font-semibold text-white mb-4">{t.disclaimer}</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          {t.disclaimerText}
        </p>
      </section>

      {/* Pro CTA at bottom */}
      {!isPro && data.picks.length > 0 && (
        <div className="mt-12 bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            {locale === 'sr' ? 'Otključaj punu analizu' : 'Unlock Full Analysis'}
          </h3>
          <p className="text-gray-400 mb-4">
            {locale === 'sr' 
              ? 'Dobij selekcije, odds, formu, H2H i detaljan reasoning za svaki pick'
              : 'Get selections, odds, form breakdown, H2H, and detailed reasoning for every pick'
            }
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            {locale === 'sr' ? 'Nadogradi na Pro' : 'Upgrade to Pro'}
          </Link>
        </div>
      )}
    </div>
  );
}
