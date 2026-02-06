/**
 * Match Preview Client Component V3 - Universal Signals Framework
 * 
 * Clean, minimal, confident analysis.
 * Universal design that works across ALL sports.
 * Zero betting advice. Pure match intelligence.
 * 
 * Uses the 5 normalized signals:
 * - Form
 * - Strength Edge
 * - Tempo
 * - Efficiency
 * - Availability
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useToast } from '@/components/ui';
import {
  PremiumMatchHeader,
  ShareCard,
  UniversalSignalsDisplay,
  MarketIntelSection,
  RegistrationBlur,
  PremiumBlur,
  AIvsMarketHero,
  ProSection,
  CollapsibleSection,
  SnapshotList,
  ViralStatsBar,
  PredictedScoreDisplay,
} from '@/components/analysis';
import { isBase64, parseMatchSlug, decodeBase64MatchId } from '@/lib/match-utils';
import StandingsTable from '@/components/StandingsTable';
import type { UniversalSignals } from '@/lib/universal-signals';
import type { MarketIntel, OddsData } from '@/lib/value-detection';

/**
 * Translate analysis text fields to Serbian
 */
async function translateAnalysisToSerbian(data: any): Promise<any> {
  try {
    // Collect all text that needs translation
    const textsToTranslate: string[] = [];
    const textMap: { field: string; index: number }[] = [];

    // Story narrative and snapshot
    if (data.story?.narrative) {
      textMap.push({ field: 'story.narrative', index: textsToTranslate.length });
      textsToTranslate.push(data.story.narrative);
    }
    if (data.story?.snapshot) {
      data.story.snapshot.forEach((text: string, i: number) => {
        textMap.push({ field: `story.snapshot.${i}`, index: textsToTranslate.length });
        textsToTranslate.push(text);
      });
    }
    if (data.story?.riskFactors) {
      data.story.riskFactors.forEach((text: string, i: number) => {
        textMap.push({ field: `story.riskFactors.${i}`, index: textsToTranslate.length });
        textsToTranslate.push(text);
      });
    }

    // Universal signals descriptions
    if (data.universalSignals) {
      ['form', 'edge', 'tempo', 'efficiency', 'availability'].forEach((signal) => {
        if (data.universalSignals[signal]?.description) {
          textMap.push({ field: `universalSignals.${signal}.description`, index: textsToTranslate.length });
          textsToTranslate.push(data.universalSignals[signal].description);
        }
      });
    }

    if (textsToTranslate.length === 0) return data;

    // Batch translate all texts
    const translations = await Promise.all(
      textsToTranslate.map(text =>
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, context: 'analysis', preserveHtml: false }),
        }).then(res => res.json()).then(r => r.translated || text)
      )
    );

    // Apply translations back to data
    const translatedData = JSON.parse(JSON.stringify(data));
    textMap.forEach(({ field, index }) => {
      const parts = field.split('.');
      let obj = translatedData;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = translations[index];
    });

    return translatedData;
  } catch (error) {
    console.error('Translation failed:', error);
    return data; // Return original on error
  }
}

/**
 * Transform demo match signals (flat format) to full UniversalSignals format
 * Demo matches have: { form: { score, label, direction }, availability: { score, label } }
 * Real API returns: { form, display: { form: {...}, availability: { level, homeInjuries, awayInjuries } } }
 */
function normalizeSignalsWithInjuries(
  signals: any,
  injuries?: { home: any[]; away: any[] }
): any {
  // Debug log - what are we receiving?
  console.log('[normalizeSignalsWithInjuries] Input:', {
    hasSignals: !!signals,
    hasDisplay: !!signals?.display,
    hasAvailability: !!signals?.display?.availability,
    signalsHomeInjuries: signals?.display?.availability?.homeInjuries?.length || 0,
    signalsAwayInjuries: signals?.display?.availability?.awayInjuries?.length || 0,
    topLevelHomeInjuries: injuries?.home?.length || 0,
    topLevelAwayInjuries: injuries?.away?.length || 0,
  });

  // If signals already has display property with proper structure, just merge injuries
  if (signals?.display?.availability) {
    // ALWAYS prefer top-level injuries if they have data (they're fresher)
    const finalHomeInjuries = (injuries?.home?.length || 0) > 0
      ? injuries!.home
      : signals.display.availability.homeInjuries || [];
    const finalAwayInjuries = (injuries?.away?.length || 0) > 0
      ? injuries!.away
      : signals.display.availability.awayInjuries || [];

    console.log('[normalizeSignalsWithInjuries] Using injuries:', {
      finalHome: finalHomeInjuries.length,
      finalAway: finalAwayInjuries.length,
    });

    return {
      ...signals,
      display: {
        ...signals.display,
        availability: {
          ...signals.display.availability,
          homeInjuries: finalHomeInjuries,
          awayInjuries: finalAwayInjuries,
        },
      },
    };
  }

  // Transform flat demo format to full format
  if (signals?.form && signals?.availability) {
    const homeInjuries = injuries?.home || [];
    const awayInjuries = injuries?.away || [];
    const totalInjuries = homeInjuries.length + awayInjuries.length;

    // Determine availability level based on injury count
    const availabilityLevel = totalInjuries >= 5 ? 'high'
      : totalInjuries >= 2 ? 'medium'
        : 'low';

    return {
      form: signals.form?.label || 'Form data',
      strength_edge: signals.edge?.label || 'Edge data',
      tempo: signals.tempo?.label || 'Tempo data',
      efficiency_edge: signals.efficiency?.label || 'Efficiency data',
      availability_impact: signals.availability?.label || 'Low',
      confidence: 'medium',
      clarity_score: signals.clarityScore || 70,
      display: {
        form: {
          home: signals.form?.direction === 'home' ? 'strong' : signals.form?.direction === 'away' ? 'weak' : 'neutral',
          away: signals.form?.direction === 'away' ? 'strong' : signals.form?.direction === 'home' ? 'weak' : 'neutral',
          label: signals.form?.label || 'Form',
        },
        edge: {
          direction: signals.edge?.direction || 'even',
          percentage: signals.edge?.score || 50,
          label: signals.edge?.label || 'Edge',
        },
        tempo: {
          level: signals.tempo?.score >= 75 ? 'high' : signals.tempo?.score <= 40 ? 'low' : 'medium',
          label: signals.tempo?.label || 'Tempo',
        },
        efficiency: {
          winner: signals.efficiency?.direction || null,
          aspect: 'overall',
          label: signals.efficiency?.label || 'Efficiency',
        },
        availability: {
          level: availabilityLevel,
          note: signals.availability?.label || null,
          label: signals.availability?.label || 'Low',
          homeInjuries: homeInjuries,
          awayInjuries: awayInjuries,
        },
      },
    };
  }

  // Return as-is if neither format matches
  return signals;
}

// League name to API-Sports ID mapping
const LEAGUE_NAME_TO_ID: Record<string, { id: number; sport: 'soccer' | 'basketball' | 'hockey' | 'nfl' }> = {
  // Soccer
  'premier league': { id: 39, sport: 'soccer' },
  'epl': { id: 39, sport: 'soccer' },
  'english premier league': { id: 39, sport: 'soccer' },
  'la liga': { id: 140, sport: 'soccer' },
  'serie a': { id: 135, sport: 'soccer' },
  'bundesliga': { id: 78, sport: 'soccer' },
  'ligue 1': { id: 61, sport: 'soccer' },
  'champions league': { id: 2, sport: 'soccer' },
  'uefa champions league': { id: 2, sport: 'soccer' },
  'europa league': { id: 3, sport: 'soccer' },
  'europa conference league': { id: 848, sport: 'soccer' },
  'mls': { id: 253, sport: 'soccer' },
  'eredivisie': { id: 88, sport: 'soccer' },
  'primeira liga': { id: 94, sport: 'soccer' },
  'scottish premiership': { id: 179, sport: 'soccer' },
  'championship': { id: 40, sport: 'soccer' },
  'fa cup': { id: 45, sport: 'soccer' },
  'carabao cup': { id: 48, sport: 'soccer' },
  'league cup': { id: 48, sport: 'soccer' },
  'copa del rey': { id: 143, sport: 'soccer' },
  'dfb pokal': { id: 81, sport: 'soccer' },
  'coppa italia': { id: 137, sport: 'soccer' },
  'coupe de france': { id: 66, sport: 'soccer' },
  // Basketball
  'nba': { id: 12, sport: 'basketball' },
  'euroleague': { id: 120, sport: 'basketball' },
  // Hockey
  'nhl': { id: 57, sport: 'hockey' },
  // American Football
  'nfl': { id: 1, sport: 'nfl' },
};

function getLeagueInfo(leagueName: string, sport: string): { id: number; sport: 'soccer' | 'basketball' | 'hockey' | 'nfl' } | null {
  // Try exact match first
  const normalized = leagueName.toLowerCase().trim();
  if (LEAGUE_NAME_TO_ID[normalized]) {
    return LEAGUE_NAME_TO_ID[normalized];
  }

  // Try partial match
  for (const [key, value] of Object.entries(LEAGUE_NAME_TO_ID)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  // Default by sport
  if (sport === 'basketball' || sport === 'nba') return { id: 12, sport: 'basketball' };
  if (sport === 'hockey' || sport === 'nhl') return { id: 57, sport: 'hockey' };
  if (sport === 'nfl' || sport === 'american_football') return { id: 1, sport: 'nfl' };

  return null;
}

// Parse matchId on client to show header immediately
// Supports both new SEO-friendly slugs and legacy base64 format
function parseMatchIdClient(matchId: string): { homeTeam: string; awayTeam: string; league: string; sport: string; kickoff: string } | null {
  // Try legacy base64 format first (for backward compatibility)
  if (isBase64(matchId)) {
    const decoded = decodeBase64MatchId(matchId);
    if (decoded) {
      return {
        homeTeam: decoded.homeTeam || 'Home Team',
        awayTeam: decoded.awayTeam || 'Away Team',
        league: decoded.league || '',
        sport: decoded.sport || 'soccer',
        kickoff: decoded.kickoff || new Date().toISOString(),
      };
    }
  }

  // Try new SEO-friendly slug format: home-team-vs-away-team-sport-date
  const parsed = parseMatchSlug(matchId);
  if (parsed) {
    // Convert slugs back to display names (capitalize words)
    const toDisplayName = (slug: string) =>
      slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    // Map sport code to proper sport key
    const sportCodeMap: Record<string, string> = {
      'nba': 'basketball_nba',
      'nhl': 'icehockey_nhl',
      'nfl': 'americanfootball_nfl',
      'epl': 'soccer_epl',
      'la-liga': 'soccer_spain_la_liga',
      'bundesliga': 'soccer_germany_bundesliga',
      'serie-a': 'soccer_italy_serie_a',
      'ligue-one': 'soccer_france_ligue_one',
      'euroleague': 'basketball_euroleague',
      'mls': 'soccer_usa_mls',
    };
    const sport = sportCodeMap[parsed.sportCode] || `soccer_${parsed.sportCode}`;

    return {
      homeTeam: toDisplayName(parsed.homeSlug),
      awayTeam: toDisplayName(parsed.awaySlug),
      league: parsed.sportCode.toUpperCase(),
      sport: sport,
      // Don't hardcode time - let it be filled from API with real kickoff time
      kickoff: undefined,
    };
  }

  // Fallback: parse underscore-separated format (old format)
  const parts = matchId.split('_');
  if (parts.length >= 3) {
    // Safely parse timestamp - only use if it's a valid number
    // Use empty string as fallback to avoid hydration mismatch (new Date() differs server/client)
    let kickoff = '';
    if (parts[3]) {
      const timestamp = parseInt(parts[3]);
      if (!isNaN(timestamp) && timestamp > 0) {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          kickoff = date.toISOString();
        }
      }
    }
    return {
      homeTeam: parts[0].replace(/-/g, ' '),
      awayTeam: parts[1].replace(/-/g, ' '),
      league: parts[2].replace(/-/g, ' '),
      sport: 'soccer',
      kickoff: kickoff || new Date().toISOString(),
    };
  }

  return null;
}

interface MatchPreviewClientProps {
  matchId: string;
  locale?: 'en' | 'sr';
  initialData?: MatchPreviewData | null;
}

interface MatchPreviewData {
  // Too far away response (>48h)
  tooFarAway?: boolean;
  daysUntilKickoff?: number;
  availableDate?: string;
  reason?: string;
  matchInfo: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    hasDraw?: boolean;
    scoringUnit?: string;
    kickoff: string;
    venue?: string;
  };
  // Data availability info
  dataAvailability?: {
    source: string;
    hasFormData: boolean;
    hasH2H: boolean;
    hasInjuries: boolean;
    hasReliableStats?: boolean; // False for US sports (NHL/NBA/NFL) when we lack real stats data
    message?: string;
  };
  story: {
    favored: 'home' | 'away' | 'draw';
    confidence: 'strong' | 'moderate' | 'slight';
    narrative?: string;
    snapshot?: string[];
    riskFactors?: string[];
    supportingStats?: Array<{
      icon: string;
      stat: string;
      context: string;
    }>;
    audioUrl?: string;
  };
  // New Universal Signals (V3)
  universalSignals?: UniversalSignals;
  // Legacy signals format (backwards compatibility)
  signals?: {
    formLabel: string;
    strengthEdgeLabel: string;
    strengthEdgeDirection: string;
    tempoLabel: string;
    efficiencyLabel: string;
    availabilityLabel: string;
  };
  viralStats?: {
    h2h: { headline: string; favors: string };
    form: { home: string; away: string };
    keyAbsence: { player: string; team: string; impact: string } | null;
    streak: { text: string; team: string } | null;
  };
  // Separate injuries data (in case universalSignals doesn't have it)
  injuries?: {
    home: Array<{ player: string; position?: string; reason?: string; details?: string }>;
    away: Array<{ player: string; position?: string; reason?: string; details?: string }>;
  };
  headlines?: Array<{
    icon: string;
    text: string;
    favors: string;
    viral?: boolean;
  }>;
  // Premium Edge Features
  marketIntel?: MarketIntel;
  odds?: OddsData;
  // Predicted scores from Poisson/Elo model
  expectedScores?: {
    home: number;
    away: number;
  };
  // Over/Under market data
  overUnder?: {
    line: number;
    overOdds?: number;
    underOdds?: number;
  };
  // Demo match indicators
  isDemo?: boolean;
  demoId?: string;
  requestedMatch?: {
    homeTeam: string;
    awayTeam: string;
    sport: string;
  };
  message?: string;
}

// Usage limit data from 429 response
interface UsageLimitData {
  usageLimitReached: boolean;
  message: string;
  usage: {
    remaining: number;
    limit: number;
    used: number;
  };
  plan: string;
  matchInfo?: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    kickoff: string;
  };
}

// Time until midnight UTC component
function TimeUntilMidnight() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    }

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return <span className="text-white font-medium">{timeLeft}</span>;
}

// i18n translations for MatchPreviewClient
const translations = {
  en: {
    allMatches: 'All Matches',
    analyzing: 'Analyzing match data...',
    gatheringStats: 'Gathering team stats...',
    processingSignals: 'Processing signals...',
    almostReady: 'Almost ready...',
    loadingLonger: 'Loading is taking longer than expected. Please refresh the page.',
    thisMayTake: 'This may take a few seconds',
    creditUsed: 'Analysis credit used. Upgrade to Pro for more!',
    somethingWrong: 'Something went wrong',
    matchAnalysis: 'Match Analysis',
    comingSoon: 'Coming Soon',
    availableIn: 'Available in',
    days: 'days',
    checkBackAt: 'Check back at',
    analysisAvailableOn: 'Analysis available on',
    weNeed48h: 'We need at least 48 hours before kickoff to gather reliable data.',
    setReminder: 'Set Reminder',
    backToMatches: 'Back to Matches',
    reachLimit: 'Precision locked',
    usedAllCredits: 'Free tier shows direction. Pro shows magnitude.',
    upgradeToPro: 'See exact edges — from $0.66/day',
    limitResetsAt: 'Next free analysis in',
    orViewAnother: 'or view another match',
    exactWinProb: 'Exact win probabilities',
    marketEdgeMagnitude: 'Edge magnitude & confidence',
    oddsThresholds: 'Execution thresholds',
    noLimits: 'No daily limits',
    proReassurance: 'Pro shows exactly when to pass — discipline builds edge.',
    proUnlocksShort: 'Pro unlocks precision & execution tools.',
    errorLoading: 'Unable to load match analysis',
    tryAgain: 'Try Again',
    goBack: 'Go Back',
    findOther: 'Find Other Matches',
    signInRequired: 'Sign in required',
    signInToView: 'Sign in to view this match analysis',
    signIn: 'Sign In',
    createAccount: 'Create Account',
    tableStandings: 'Table Standings',
    loading: 'Loading standings...',
    standingsError: 'Unable to load standings',
    notAvailable: 'Standings not available for this league',
    leagueTable: 'League Table',
    whatYouGet: 'What you get:',
    analysesPerDay: 'Unlimited analyses',
    marketIntel: 'Exact probabilities & edge %',
    earlyAccess: 'No daily limits',
    prioritySupport: 'Priority customer support',
    unlimitedAnalyses: 'Unlimited analyses',
    priorityAI: 'Priority AI processing',
    fullHistory: 'Full analysis history access',
    marketAlerts: 'Market Alerts & Steam Moves',
    upgradeToPremium: 'Upgrade to Premium',
    creditsResetDaily: 'Your credits reset daily at midnight UTC',
    matchNotFound: 'Match Not Found',
    couldntFindMatch: "We couldn't find this match. It may have already been played or the link is incorrect.",
    browseMatches: 'Browse Matches',
    whyWeWait: 'Why We Wait',
    analysisWindow: 'Analysis Window',
    hoursBeforeKickoff: 'Available 48h before kickoff',
    dataAccuracy: 'Data Accuracy',
    recentStats: 'Recent stats & confirmed lineups',
    marketSignals: 'Market Signals',
    oddsMovements: 'Track odds movements & patterns',
    matchKicksOff: 'Match kicks off',
    // Registration blur
    unlockSignals: 'Unlock Match Signals',
    createFreeDesc: 'Create a free account to see our 5 universal match signals and risk analysis.',
    createFreeAccount: 'Create Free Account',
    alreadyHaveAccount: 'Already have an account?',
    // Premium blur
    proMatchAnalysis: 'Pro Match Analysis',
    proMatchDesc: 'Get detailed match insights, game flow predictions, and value detection with Pro.',
    matchSnapshotInsights: 'Match snapshot & key insights',
    gameFlowPredictions: 'Game flow predictions',
    valueDetection: 'Value detection & odds analysis',
    upgradeToProPrice: 'Upgrade to Pro – $19.99/mo',
    // Sections
    riskFactors: 'Risk Factors',
    matchSnapshot: 'Match Snapshot',
    gameFlow: 'Game Flow',
    marketEdge: 'Market Edge',
    oddsUnavailable: 'Odds data temporarily unavailable for this match',
    whereTheyStand: 'Where They Stand',
    shareAnalysis: 'Share This Analysis',
    helpFriends: 'Help your friends prepare for the match',
    copyLink: 'Copy Link',
    disclaimer: 'SportBot AI provides match intelligence for educational purposes only. This is not betting advice. If you gamble, please do so responsibly.',
    limitedDataMessage: 'Limited historical data available for this sport. Analysis based on AI estimation.',
  },
  sr: {
    allMatches: 'Svi Mečevi',
    analyzing: 'Analiziramo meč...',
    gatheringStats: 'Prikupljamo statistiku...',
    processingSignals: 'Obrađujemo signale...',
    almostReady: 'Skoro gotovo...',
    loadingLonger: 'Učitavanje traje duže nego očekivano. Molimo osvežite stranicu.',
    thisMayTake: 'Ovo može potrajati nekoliko sekundi',
    creditUsed: 'Iskorišćen kredit za analizu. Nadogradi na Pro za više!',
    somethingWrong: 'Nešto nije u redu',
    matchAnalysis: 'Analiza Meča',
    comingSoon: 'Uskoro Dostupno',
    availableIn: 'Dostupno za',
    days: 'dana',
    checkBackAt: 'Vratite se u',
    analysisAvailableOn: 'Analiza dostupna',
    weNeed48h: 'Potrebno nam je najmanje 48 sati pre početka da prikupimo pouzdane podatke.',
    setReminder: 'Postavi Podsetnik',
    backToMatches: 'Nazad na Mečeve',
    reachLimit: 'Preciznost zaključana',
    usedAllCredits: 'Besplatan nivo pokazuje smer. Pro pokazuje magnitude.',
    upgradeToPro: 'Vidi tačne ivice — od $0.66/dan',
    limitResetsAt: 'Sledeća besplatna analiza za',
    orViewAnother: 'ili pogledaj drugi meč',
    exactWinProb: 'Tačne verovatnoće pobede',
    marketEdgeMagnitude: 'Veličina ivice i pouzdanost',
    oddsThresholds: 'Pragovi izvršenja',
    noLimits: 'Bez dnevnih limita',
    proReassurance: 'Pro pokazuje tačno kada preskočiti — disciplina gradi prednost.',
    proUnlocksShort: 'Pro otključava preciznost i alate za izvršenje.',
    errorLoading: 'Nije moguće učitati analizu meča',
    tryAgain: 'Pokušaj Ponovo',
    goBack: 'Nazad',
    findOther: 'Pronađi Druge Mečeve',
    signInRequired: 'Potrebna prijava',
    signInToView: 'Prijavite se da vidite analizu ovog meča',
    signIn: 'Prijavi se',
    createAccount: 'Napravi Nalog',
    tableStandings: 'Tabela',
    loading: 'Učitavamo tabelu...',
    standingsError: 'Nije moguće učitati tabelu',
    notAvailable: 'Tabela nije dostupna za ovu ligu',
    leagueTable: 'Tabela Lige',
    whatYouGet: 'Šta dobijate:',
    analysesPerDay: '30 analiza dnevno',
    marketIntel: 'Market Intel i Detekcija Vrednosti',
    earlyAccess: 'Rani pristup novim funkcijama',
    prioritySupport: 'Prioritetna korisnička podrška',
    unlimitedAnalyses: 'Neograničene analize',
    priorityAI: 'Prioritetna AI obrada',
    fullHistory: 'Pristup punoj istoriji analiza',
    marketAlerts: 'Market Alarmi i Steam Moves',
    upgradeToPremium: 'Nadogradi na Premium',
    creditsResetDaily: 'Vaši krediti se resetuju svaki dan u ponoć UTC',
    matchNotFound: 'Meč Nije Pronađen',
    couldntFindMatch: 'Nismo pronašli ovaj meč. Možda je već odigran ili je link neispravan.',
    browseMatches: 'Pregledaj Mečeve',
    whyWeWait: 'Zašto Čekamo',
    analysisWindow: 'Period Analize',
    hoursBeforeKickoff: 'Dostupno 48h pre početka',
    dataAccuracy: 'Tačnost Podataka',
    recentStats: 'Nedavna statistika i potvrđeni sastavi',
    marketSignals: 'Tržišni Signali',
    oddsMovements: 'Pratimo kretanje kvota i obrasce',
    matchKicksOff: 'Meč počinje',
    // Registration blur
    unlockSignals: 'Otključaj Signale Meča',
    createFreeDesc: 'Napravi besplatan nalog da vidiš naših 5 univerzalnih signala i analizu rizika.',
    createFreeAccount: 'Napravi Besplatan Nalog',
    alreadyHaveAccount: 'Već imaš nalog?',
    // Premium blur
    proMatchAnalysis: 'Pro Analiza Meča',
    proMatchDesc: 'Dobij detaljne uvide u meč, predikcije toka igre i detekciju vrednosti sa Pro.',
    matchSnapshotInsights: 'Pregled meča i ključni uvidi',
    gameFlowPredictions: 'Predikcije toka igre',
    valueDetection: 'Detekcija vrednosti i analiza kvota',
    upgradeToProPrice: 'Nadogradi na Pro – $19.99/mes',
    // Sections
    riskFactors: 'Faktori Rizika',
    matchSnapshot: 'Pregled Meča',
    gameFlow: 'Tok Igre',
    marketEdge: 'Tržišna Prednost',
    oddsUnavailable: 'Podaci o kvotama trenutno nisu dostupni za ovaj meč',
    whereTheyStand: 'Pozicija na Tabeli',
    shareAnalysis: 'Podeli Ovu Analizu',
    helpFriends: 'Pomozi prijateljima da se pripreme za meč',
    copyLink: 'Kopiraj Link',
    disclaimer: 'SportBot AI pruža informacije o mečevima samo u edukativne svrhe. Ovo nije savet za klađenje. Ako se kladite, činite to odgovorno.',
    limitedDataMessage: 'Ograničeni istorijski podaci dostupni za ovaj sport. Analiza zasnovana na AI proceni.',
  },
};

// Map league/sport names to The Odds API sportKey for back navigation
function getBackNavigationLeague(league: string, sport: string): string | null {
  const l = league.toLowerCase();
  const s = sport.toLowerCase();

  // Soccer leagues
  if (l.includes('premier league') || l === 'epl') return 'soccer_epl';
  if (l.includes('la liga')) return 'soccer_spain_la_liga';
  if (l.includes('bundesliga')) return 'soccer_germany_bundesliga';
  if (l.includes('serie a')) return 'soccer_italy_serie_a';
  if (l.includes('ligue 1')) return 'soccer_france_ligue_one';
  if (l.includes('primeira liga')) return 'soccer_portugal_primeira_liga';
  if (l.includes('eredivisie')) return 'soccer_netherlands_eredivisie';
  if (l.includes('champions league')) return 'soccer_uefa_champs_league';
  if (l.includes('europa league')) return 'soccer_uefa_europa_league';
  if (l.includes('scottish')) return 'soccer_spl';
  if (l.includes('süper lig') || l.includes('super lig')) return 'soccer_turkey_super_league';
  if (l.includes('jupiler') || l.includes('belgian')) return 'soccer_belgium_first_div';

  // Basketball
  if (l === 'nba' || s.includes('nba') || s.includes('basketball')) return 'basketball_nba';
  if (l.includes('euroleague')) return 'basketball_euroleague';

  // American Football
  if (l === 'nfl' || s.includes('nfl') || s.includes('american')) return 'americanfootball_nfl';
  if (l.includes('ncaa')) return 'americanfootball_ncaaf';

  // Hockey
  if (l === 'nhl' || s.includes('nhl') || s.includes('hockey')) return 'icehockey_nhl';

  // Default by sport category
  if (s.includes('soccer') || s.includes('football')) return 'soccer_epl';
  if (s.includes('basket')) return 'basketball_nba';
  if (s.includes('hockey') || s.includes('ice')) return 'icehockey_nhl';

  return null;
}

export default function MatchPreviewClient({ matchId, locale = 'en', initialData }: MatchPreviewClientProps) {
  const t = translations[locale];
  const localePath = locale === 'sr' ? '/sr' : '';
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [data, setData] = useState<MatchPreviewData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [loadingMessage, setLoadingMessage] = useState(initialData ? '' : t.analyzing);
  const [error, setError] = useState<string | null>(null);
  const [usageLimit, setUsageLimit] = useState<UsageLimitData | null>(null);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  // Check for forceRefresh in URL (for cache bypass)
  const forceRefresh = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('forceRefresh') === 'true'
    : false;

  // Parse matchId immediately to show header while loading
  const parsedMatch = useMemo(() => parseMatchIdClient(matchId), [matchId]);

  // Compute back URL based on match league/sport
  const backUrl = useMemo(() => {
    const league = data?.matchInfo?.league || parsedMatch?.league || '';
    const sport = data?.matchInfo?.sport || parsedMatch?.sport || '';
    const sportKey = getBackNavigationLeague(league, sport);

    if (sportKey) {
      return `${localePath}/matches?league=${sportKey}`;
    }
    return `${localePath}/matches`;
  }, [data?.matchInfo?.league, data?.matchInfo?.sport, parsedMatch?.league, parsedMatch?.sport, localePath]);


  // Check if match is too far in the future (>48 hours)
  const matchTiming = useMemo(() => {
    if (!parsedMatch?.kickoff) return null;
    const kickoffDate = new Date(parsedMatch.kickoff);
    const now = new Date();
    const hoursUntilKickoff = (kickoffDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Calculate when analysis becomes available (48h before kickoff)
    const availableDate = new Date(kickoffDate.getTime() - 48 * 60 * 60 * 1000);
    const hoursUntilAvailable = (availableDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysUntilKickoff = Math.ceil(hoursUntilAvailable / 24); // Days until AVAILABLE, not kickoff
    return {
      hoursUntilKickoff,
      daysUntilKickoff,
      isTooFarAway: hoursUntilKickoff > 48,
      kickoffDate,
    };
  }, [parsedMatch]);

  // Scroll to top on mount to prevent unwanted scroll position
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Show sticky CTA after scrolling past the hero section (400px)
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (initialData) return;

    const fetchMatchPreview = async () => {
      try {
        setLoading(true);
        setError(null);
        setUsageLimit(null);
        setLoadingMessage(t.analyzing);

        // Loading message progression
        const loadingTimer1 = setTimeout(() => setLoadingMessage(t.gatheringStats), 3000);
        const loadingTimer2 = setTimeout(() => setLoadingMessage(t.processingSignals), 6000);
        const loadingTimer3 = setTimeout(() => setLoadingMessage(t.almostReady), 10000);
        const timeoutTimer = setTimeout(() => {
          setError(t.loadingLonger);
          setLoading(false);
        }, 30000); // 30 second timeout

        // Add cache-busting timestamp to force fresh fetch (no browser cache)
        // Also pass forceRefresh if present in URL to bypass server cache
        const queryParams = new URLSearchParams();
        queryParams.set('_t', Date.now().toString());
        if (forceRefresh) {
          queryParams.set('forceRefresh', 'true');
        }
        const response = await fetch(`/api/match-preview/${matchId}?${queryParams.toString()}`, {
          credentials: 'include', // Ensure cookies are sent
          cache: 'no-store', // Don't use browser cache
        });

        // Clear timers on success
        clearTimeout(loadingTimer1);
        clearTimeout(loadingTimer2);
        clearTimeout(loadingTimer3);
        clearTimeout(timeoutTimer);

        const result = await response.json();

        // Handle 429 (usage limit reached) specifically
        if (response.status === 429 && result.usageLimitReached) {
          setUsageLimit(result as UsageLimitData);
          return;
        }

        // Handle match too far away (>48h) - API now returns this directly
        if (result.tooFarAway) {
          setData(result); // Store for rendering the "coming soon" UI
          return;
        }

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load match preview');
        }

        // DEBUG: Log what we got from API
        console.log('[MatchPreview] API Response:', {
          isDemo: result.isDemo,
          demoId: result.demoId,
          matchInfoHomeTeam: result.matchInfo?.homeTeam,
          matchInfoAwayTeam: result.matchInfo?.awayTeam,
          requestedMatch: result.requestedMatch,
          hasInjuries: !!result.injuries,
          homeInjuries: result.injuries?.home?.length || 0,
          awayInjuries: result.injuries?.away?.length || 0,
          hasUniversalSignals: !!result.universalSignals,
          signalsHasDisplay: !!result.universalSignals?.display,
          signalsHasAvailability: !!result.universalSignals?.display?.availability,
          signalsHomeInjuries: result.universalSignals?.display?.availability?.homeInjuries?.length || 0,
          signalsAwayInjuries: result.universalSignals?.display?.availability?.awayInjuries?.length || 0,
        });

        // Successful analysis - show toast for FREE users
        if (result.creditUsed) {
          showToast(t.creditUsed, 'info');
        }

        // Translate to Serbian if needed
        if (locale === 'sr' && result.story) {
          setLoadingMessage('Prevođenje na srpski...');
          const translatedResult = await translateAnalysisToSerbian(result);
          setData(translatedResult);
        } else {
          setData(result);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.somethingWrong);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchPreview();
  }, [matchId, t]);

  // Show header immediately with skeleton content while loading
  if (loading && parsedMatch) {
    return (
      <div className="min-h-screen bg-bg relative overflow-x-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
          {/* Back navigation */}
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{t.allMatches}</span>
          </Link>

          {/* Show real match header immediately */}
          <PremiumMatchHeader
            homeTeam={parsedMatch.homeTeam}
            awayTeam={parsedMatch.awayTeam}
            league={parsedMatch.league}
            sport={parsedMatch.sport}
            kickoff={parsedMatch.kickoff}
          />

          {/* Loading indicator */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-zinc-700 border-t-violet rounded-full animate-spin" />
            <span className="text-zinc-300 text-sm font-semibold">{loadingMessage}</span>
            <span className="text-zinc-600 text-xs">{t.thisMayTake}</span>
          </div>

          {/* Skeleton for signals */}
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-xl animate-pulse" />
            ))}
          </div>

          {/* Skeleton for content sections */}
          <div className="mt-6 space-y-4">
            <div className="h-32 bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl animate-pulse" />
            <div className="h-24 bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Fallback skeleton if we can't parse matchId
  if (loading) {
    return <PremiumSkeleton message={loadingMessage} locale={locale} />;
  }

  // Match is too far in the future - show friendly message
  // Check both client-side calculation AND API response
  const isTooFarAway = matchTiming?.isTooFarAway || data?.tooFarAway;
  const daysUntil = data?.daysUntilKickoff || matchTiming?.daysUntilKickoff || 0;
  const availableDateStr = data?.availableDate || (matchTiming?.kickoffDate ? new Date(matchTiming.kickoffDate.getTime() - 48 * 60 * 60 * 1000).toISOString() : null);

  if (isTooFarAway && (parsedMatch || data?.matchInfo)) {
    const matchForHeader = data?.matchInfo || parsedMatch;
    return (
      <div className="min-h-screen bg-bg relative overflow-x-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
          {/* Back navigation */}
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{t.allMatches}</span>
          </Link>

          {/* Match header */}
          {matchForHeader && (
            <PremiumMatchHeader
              homeTeam={matchForHeader.homeTeam}
              awayTeam={matchForHeader.awayTeam}
              league={matchForHeader.league}
              sport={matchForHeader.sport}
              kickoff={matchForHeader.kickoff}
            />
          )}

          {/* Too far away message - matches app card style */}
          <div className="mt-8 p-5 rounded-xl card-glass">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.comingSoon}</span>
                <h3 className="text-base font-medium text-white">
                  {t.availableIn} {daysUntil} {t.days}
                </h3>
              </div>
            </div>

            <p className="text-zinc-500 text-sm leading-relaxed mb-4">
              {locale === 'sr'
                ? <>Naša AI analiza postaje dostupna <span className="text-zinc-300">48 sati pre početka</span> kada imamo najtačnije podatke.</>
                : <>Our AI analysis becomes available <span className="text-zinc-300">48 hours before kickoff</span> when we have the most accurate data.</>}
            </p>

            {availableDateStr && (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{locale === 'sr' ? 'Dostupno' : 'Available'}: {new Date(availableDateStr).toLocaleDateString(locale === 'sr' ? 'sr-Latn' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              </div>
            )}
          </div>

          {/* Why we wait explanation */}
          <div className="mt-4 p-4 rounded-xl card-glass">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">💡</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{t.whyWeWait}</span>
            </div>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{locale === 'sr' ? 'Najnovije informacije o povredama i sastavima' : 'Latest injury & lineup updates'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{locale === 'sr' ? 'Najnovija forma iz utakmica tokom nedelje' : 'Most recent form from mid-week fixtures'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{locale === 'sr' ? 'Tačne tržišne kvote i kretanja' : 'Accurate market odds & movements'}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                <span>{locale === 'sr' ? 'Uvidi iz konferencija za novinare' : 'Manager press conference insights'}</span>
              </li>
            </ul>
          </div>

          {/* CTA to browse other matches */}
          <div className="mt-6 text-center">
            <Link
              href={backUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-sm text-zinc-300 hover:text-white transition-colors"
            >
              <span>{t.findOther}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Usage limit reached - show upgrade card with match info
  if (usageLimit) {
    const matchForHeader = usageLimit.matchInfo || parsedMatch;
    return (
      <div className="min-h-screen bg-bg relative overflow-x-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
          {/* Back navigation */}
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">{t.allMatches}</span>
          </Link>

          {/* Show match header */}
          {matchForHeader && (
            <PremiumMatchHeader
              homeTeam={matchForHeader.homeTeam}
              awayTeam={matchForHeader.awayTeam}
              league={matchForHeader.league}
              sport={matchForHeader.sport}
              kickoff={matchForHeader.kickoff}
            />
          )}

          {/* Upgrade Card - Conversion optimized */}
          <div className={`mt-6 sm:mt-8 card-glass ${usageLimit.plan === 'FREE' ? 'border-violet/30' : 'border-violet-light/30'} p-5 sm:p-8 text-center`}>
            <div className="text-3xl sm:text-4xl mb-3 opacity-80">🔒</div>

            {/* Headline - value-focused, larger */}
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              {t.reachLimit}
            </h1>

            {/* What you're missing - locked value reminder */}
            <div className="flex flex-col items-center gap-1.5 mb-4 text-sm">
              <span className="text-zinc-500 flex items-center gap-2">
                <span>🔒</span> {t.exactWinProb}
              </span>
              <span className="text-zinc-500 flex items-center gap-2">
                <span>🔒</span> {t.marketEdgeMagnitude}
              </span>
              <span className="text-zinc-500 flex items-center gap-2">
                <span>🔒</span> {t.oddsThresholds}
              </span>
            </div>

            {/* Status message */}
            <p className="text-zinc-400 mb-2">
              {t.usedAllCredits}
            </p>

            {/* Time until next free - urgency */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-4 text-xs sm:text-sm">
              <span className="text-zinc-500">⏳</span>
              <span className="text-zinc-400">{t.limitResetsAt}</span>
              <TimeUntilMidnight />
            </div>

            {/* Emotional reassurance - discipline positioning */}
            <p className="text-zinc-500 text-sm mb-6 max-w-xs mx-auto">
              {t.proReassurance}
            </p>

            {/* Pro Benefits - condensed, no duplication */}
            <p className="text-zinc-400 text-sm mb-6">
              {t.proUnlocksShort}
            </p>

            {/* CTA Button - premium feel, mobile-friendly touch target */}
            <Link
              href={`${localePath}/pricing#pro`}
              className="btn-secondary inline-block text-base sm:text-lg px-6 sm:px-8 py-3.5 font-medium"
            >
              {t.upgradeToPro}
            </Link>

            {/* Secondary action - keep user in funnel */}
            <p className="mt-4 text-zinc-600 text-sm">
              <Link
                href={backUrl}
                className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2"
              >
                {t.orViewAnother}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !data.matchInfo) {
    return (
      <div className="min-h-screen bg-bg relative overflow-x-hidden flex items-center justify-center p-4">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="text-center max-w-md relative">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">{t.matchNotFound}</h1>
          <p className="text-zinc-500 mb-6 text-sm">
            {error || t.couldntFindMatch}
          </p>
          <Link
            href={backUrl}
            className="btn-gradient-border inline-flex items-center gap-2 text-sm"
          >
            <span>←</span>
            <span>{t.browseMatches}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Map confidence from old format if needed
  const mapConfidence = (conf: string): 'high' | 'medium' | 'low' => {
    if (conf === 'strong') return 'high';
    if (conf === 'slight') return 'low';
    return 'medium';
  };

  // Build snapshot from old format if not present
  const snapshot = data.story.snapshot || (data.story.supportingStats?.map(s => `${s.stat}: ${s.context}`) || []);

  // Build game flow from narrative
  const gameFlow = data.story.narrative || '';

  // Build risk factors
  const riskFactors = data.story.riskFactors || [];

  // Check if this is a demo match being shown to anonymous user
  const isDemo = data.isDemo && !session;
  const requestedDifferentMatch = data.requestedMatch &&
    (data.requestedMatch.homeTeam !== data.matchInfo.homeTeam ||
      data.requestedMatch.awayTeam !== data.matchInfo.awayTeam);

  // 3-TIER ACCESS MODEL:
  // Guest (not logged in): canSeeAnalysis = false, canSeeExactNumbers = false
  // Registered FREE: canSeeAnalysis = true, canSeeExactNumbers = false  
  // PRO/PREMIUM: canSeeAnalysis = true, canSeeExactNumbers = true

  // canSeeAnalysis: Can see full explanations (logged in + used credit OR is PRO)
  const canSeeAnalysis = Boolean(
    session?.user?.plan === 'PRO' ||
    session?.user?.plan === 'PREMIUM' ||
    (session && !isDemo) // FREE user with valid session who got real data = used their credit
  );

  // canSeeExactNumbers: Can see exact Win Prob %, Edge %, etc (PRO/PREMIUM ONLY)
  const canSeeExactNumbers = Boolean(
    session?.user?.plan === 'PRO' ||
    session?.user?.plan === 'PREMIUM'
  );

  // Legacy alias for backwards compatibility
  const hasPremiumAccess = canSeeAnalysis;

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-white/[0.01] via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Back navigation - Minimal */}
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">{t.allMatches}</span>
        </Link>

        {/* Match Header - Clean and premium */}
        <PremiumMatchHeader
          homeTeam={data.matchInfo.homeTeam}
          awayTeam={data.matchInfo.awayTeam}
          league={data.matchInfo.league}
          sport={data.matchInfo.sport}
          kickoff={data.matchInfo.kickoff}
          venue={data.matchInfo.venue}
        />

        {/* AI vs MARKET HERO - THE HOOK - Always visible, above the fold */}
        {/* This is the conversion driver: shows market mispricing immediately */}
        {data.marketIntel && (
          <AIvsMarketHero
            marketIntel={data.marketIntel}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            hasDraw={data.matchInfo.hasDraw}
            isAuthenticated={!!session}
            canSeeExactNumbers={canSeeExactNumbers}
            locale={locale}
          />
        )}

        {/* Predicted Score Section - Shows expected score from Poisson/Elo model */}
        {/* PRO ONLY - This is premium data */}
        {data.expectedScores && data.dataAvailability?.hasReliableStats !== false && (
          <div className="mt-6">
            {canSeeExactNumbers ? (
              <PredictedScoreDisplay
                homeTeam={data.matchInfo.homeTeam}
                awayTeam={data.matchInfo.awayTeam}
                expectedScores={data.expectedScores}
                overUnder={data.overUnder}
                sport={data.matchInfo.sport}
                locale={locale}
              />
            ) : (
              /* Locked Predicted Score for FREE users */
              <div className="card-glass p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-sm font-semibold text-white">{locale === 'sr' ? 'Predviđeni Rezultat' : 'Predicted Score'}</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-violet to-violet-light text-white rounded-full">PRO</span>
                </div>
                <div className="flex items-center justify-center gap-4 py-6 blur-sm select-none pointer-events-none">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white/30">?.?</div>
                    <div className="text-xs text-zinc-500 mt-1">{data.matchInfo.homeTeam.substring(0, 10)}</div>
                  </div>
                  <div className="text-xl text-zinc-600">-</div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white/30">?.?</div>
                    <div className="text-xs text-zinc-500 mt-1">{data.matchInfo.awayTeam.substring(0, 10)}</div>
                  </div>
                </div>
                <p className="text-center text-xs text-zinc-500 mt-2">
                  {locale === 'sr' ? 'Nadogradi na Pro za AI predviđeni rezultat' : 'Upgrade to Pro for AI predicted score'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show O/U from market even when predicted score is hidden (for NHL/NBA/NFL) - PRO ONLY */}
        {data.expectedScores && data.dataAvailability?.hasReliableStats === false && data.overUnder && canSeeExactNumbers && (
          <div className="mt-6">
            <PredictedScoreDisplay
              homeTeam={data.matchInfo.homeTeam}
              awayTeam={data.matchInfo.awayTeam}
              expectedScores={{ home: 0, away: 0 }} // Don't show fake prediction
              overUnder={data.overUnder}
              sport={data.matchInfo.sport}
              locale={locale}
            />
          </div>
        )}

        {/* Data Availability Notice - Only show for truly unavailable data, not for AI analysis */}
        {data.dataAvailability && !data.dataAvailability.hasFormData && !data.dataAvailability.hasH2H && !data.dataAvailability.hasInjuries && (
          <div className="mt-4 mb-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-sm">ℹ️</span>
              <p className="text-xs text-blue-400/80">
                {data.dataAvailability.message || t.limitedDataMessage}
              </p>
            </div>
          </div>
        )}

        {/* QUICK STATS BAR - Viral shareable stats (H2H, Form, Streak, Key Absence) */}
        {data.viralStats && (
          <div className="mt-6">
            <ViralStatsBar
              homeTeam={data.matchInfo.homeTeam}
              awayTeam={data.matchInfo.awayTeam}
              hasDraw={data.matchInfo.hasDraw}
              stats={{
                h2h: data.viralStats.h2h ? {
                  headline: data.viralStats.h2h.headline || 'No H2H data',
                  favors: (data.viralStats.h2h.favors as 'home' | 'away' | 'even') || 'even',
                } : { headline: 'First meeting', favors: 'even' },
                form: data.viralStats.form ? {
                  home: data.viralStats.form.home || '-----',
                  away: data.viralStats.form.away || '-----',
                } : { home: '-----', away: '-----' },
                keyAbsence: data.viralStats.keyAbsence ? {
                  team: data.viralStats.keyAbsence.team as 'home' | 'away',
                  player: data.viralStats.keyAbsence.player,
                  impact: 'key' as const,
                } : undefined,
                streak: data.viralStats.streak ? {
                  text: data.viralStats.streak.text,
                  team: data.viralStats.streak.team as 'home' | 'away',
                } : undefined,
              }}
            />
          </div>
        )}

        {/* LAYER 1: Registration Blur - Universal Signals & Risk Factors */}
        <RegistrationBlur
          isAuthenticated={!!session}
          title={t.unlockSignals}
          description={t.createFreeDesc}
          locale={locale}
          translations={{
            createFreeAccount: t.createFreeAccount,
            alreadyHaveAccount: t.alreadyHaveAccount,
            signIn: t.signIn,
            matchSignals: locale === 'sr' ? 'Signali Meča' : 'Match Signals',
            aiInsights: locale === 'sr' ? 'AI Uvidi' : 'AI Insights',
            gameFlow: t.gameFlow,
          }}
        >
          {/* Universal Signals Display - Free with registration */}
          {data.universalSignals && (
            <div className="mt-4 sm:mt-5">
              <UniversalSignalsDisplay
                signals={normalizeSignalsWithInjuries(data.universalSignals, data.injuries)}
                homeTeam={data.matchInfo.homeTeam}
                awayTeam={data.matchInfo.awayTeam}
                homeForm={data.viralStats?.form?.home || '-----'}
                awayForm={data.viralStats?.form?.away || '-----'}
                locale={locale}
                canSeeExactNumbers={canSeeExactNumbers}
              />
            </div>
          )}

          {/* Risk Factors - Collapsible for progressive disclosure */}
          {riskFactors && riskFactors.length > 0 && (
            <CollapsibleSection
              title={t.riskFactors}
              icon="⚠️"
              defaultExpanded={true}
              badge={riskFactors.length}
              className="mt-4 sm:mt-6 !bg-gradient-to-br !from-amber-500/5 !to-transparent !border-amber-500/10"
            >
              <ul className="space-y-3">
                {riskFactors.map((risk, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-2 flex-shrink-0" />
                    <span className="text-sm text-zinc-300 leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}
        </RegistrationBlur>

        {/* LAYER 2: Premium Blur - Match Snapshot, Game Flow, Market Edge */}
        <PremiumBlur
          isPro={hasPremiumAccess}
          title={t.proMatchAnalysis}
          description={t.proMatchDesc}
          locale={locale}
          translations={{
            whatYouGet: t.whatYouGet,
            matchSnapshotInsights: t.matchSnapshotInsights,
            gameFlowPredictions: t.gameFlowPredictions,
            valueDetection: t.valueDetection,
            analysesPerDay: t.analysesPerDay,
            upgradeToProPrice: t.upgradeToProPrice,
          }}
        >
          {/* Match Snapshot - Progressive disclosure with collapsible detail */}
          {snapshot && snapshot.length > 0 && (
            <CollapsibleSection
              title={t.matchSnapshot}
              icon="📋"
              defaultExpanded={true}
              badge="PRO"
              className="mt-3 sm:mt-4"
            >
              {canSeeExactNumbers ? (
                <SnapshotList snapshot={snapshot} maxItems={4} compact={false} />
              ) : (
                <ProSection
                  isPro={canSeeExactNumbers}
                  title=""
                  teaserBullets={
                    locale === 'sr'
                      ? ['Rezime AI modela', 'Obrazloženje ivice i analiza', 'Kalibracija rizika']
                      : ['AI model summary', 'Edge reasoning & pattern analysis', 'Risk calibration']
                  }
                  locale={locale}
                  className="!bg-transparent !border-0 !p-0"
                >
                  <SnapshotList snapshot={snapshot} maxItems={4} compact={true} />
                </ProSection>
              )}
            </CollapsibleSection>
          )}

          {/* Game Flow - Progressive disclosure */}
          {gameFlow && (
            <CollapsibleSection
              title={t.gameFlow}
              icon="⚡"
              defaultExpanded={false}
              badge="PRO"
              className="mt-3 sm:mt-4"
            >
              {canSeeExactNumbers ? (
                <p className="text-sm text-stone-300 leading-relaxed">
                  {gameFlow}
                </p>
              ) : (
                <ProSection
                  isPro={canSeeExactNumbers}
                  title=""
                  teaserText={gameFlow.substring(0, 60) + '...'}
                  locale={locale}
                  className="!bg-transparent !border-0 !p-0"
                >
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {gameFlow}
                  </p>
                </ProSection>
              )}
            </CollapsibleSection>
          )}

          {/* Market Edge - Premium */}
          {data.marketIntel && data.odds ? (
            <div className="mt-5">
              <MarketIntelSection
                marketIntel={data.marketIntel}
                odds={data.odds}
                homeTeam={data.matchInfo.homeTeam}
                awayTeam={data.matchInfo.awayTeam}
                hasDraw={data.matchInfo.hasDraw}
                canSeeAnalysis={canSeeAnalysis}
                canSeeExactNumbers={canSeeExactNumbers}
                locale={locale}
              />
            </div>
          ) : (
            <div className="mt-5 p-5 rounded-2xl bg-[#0a0a0b] border border-white/[0.06]">
              <h3 className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="text-violet-400">✦</span>
                {t.marketEdge}
                <span className="ml-auto text-[9px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">PRO</span>
              </h3>
              <div className="flex items-center gap-3 text-zinc-400 text-sm">
                <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t.oddsUnavailable}</span>
              </div>
            </div>
          )}
        </PremiumBlur>

        {/* League Standings - Show where teams stand */}
        {(() => {
          const leagueInfo = getLeagueInfo(data.matchInfo.league, data.matchInfo.sport);
          if (!leagueInfo) return null;

          return (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-4 flex items-center gap-3">
                <span className="text-lg">📊</span>
                {t.whereTheyStand}
              </h3>
              <StandingsTable
                sport={leagueInfo.sport}
                leagueId={leagueInfo.id}
                highlightTeams={[data.matchInfo.homeTeam, data.matchInfo.awayTeam]}
                showAroundTeams={true}
                collapsible={true}
                defaultExpanded={false}
              />
            </div>
          );
        })()}

        {/* Headline Quote (if available) */}
        {data.headlines && data.headlines.length > 0 && (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06]">
            <p className="text-base text-white font-medium leading-relaxed">
              &ldquo;{data.headlines[0].text}&rdquo;
            </p>
            <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wider">
              — SportBot {locale === 'sr' ? 'Analiza' : 'Analysis'}
            </p>
          </div>
        )}

        {/* Share Card */}
        <div className="mt-8">
          <ShareCard
            matchId={matchId}
            homeTeam={data.matchInfo.homeTeam}
            awayTeam={data.matchInfo.awayTeam}
            verdict={data.headlines?.[0]?.text || `${data.matchInfo.homeTeam} vs ${data.matchInfo.awayTeam}`}
            kickoff={data.matchInfo.kickoff}
            league={data.matchInfo.league}
            risk={data.story.confidence === 'strong' ? 'LOW' : data.story.confidence === 'moderate' ? 'MEDIUM' : 'HIGH'}
            confidence={data.story.confidence === 'strong' ? 85 : data.story.confidence === 'moderate' ? 70 : 55}
            sport={data.matchInfo.sport}
          />
        </div>

        {/* Read Full Preview - Link to News Article (only if blog exists) */}
        {(data.matchInfo as { blogSlug?: string }).blogSlug && (
          <Link
            href={`${localePath}/news/${(data.matchInfo as { blogSlug?: string }).blogSlug}`}
            className="mt-6 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 border border-accent/20 hover:border-accent/40 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📰</span>
              <div>
                <p className="text-sm font-medium text-white">
                  {locale === 'sr' ? 'Pročitaj Ceo Pregled Meča' : 'Read Full Match Preview'}
                </p>
                <p className="text-xs text-text-muted">
                  {locale === 'sr' ? 'Detaljna analiza i AI predikcije' : 'In-depth analysis & AI predictions'}
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-accent group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[11px] text-zinc-600 max-w-sm mx-auto">
            {t.disclaimer}
          </p>
        </div>
      </div>

      {/* Sticky Upgrade CTA - Shows for free registered users after scrolling */}
      {session && !canSeeExactNumbers && showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-violet-600/95 via-violet-500/95 to-purple-600/95 backdrop-blur-xl border-t border-white/10">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">💎</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {locale === 'sr' ? 'Otključaj tačne brojeve' : 'Unlock Exact Numbers'}
                  </p>
                  <p className="text-xs text-white/70 truncate hidden sm:block">
                    {locale === 'sr' ? 'Vidi tačne % pobede i ivice' : 'See exact win % & edge magnitude'}
                  </p>
                </div>
              </div>
              <Link
                href={`${localePath}/pricing#pro`}
                className="flex-shrink-0 px-4 py-2 bg-white text-violet-700 font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors shadow-lg"
              >
                {locale === 'sr' ? 'Nadogradi' : 'Upgrade'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Premium Loading Skeleton with progress indicator
 */
function PremiumSkeleton({ message, locale = 'en' }: { message?: string; locale?: 'en' | 'sr' }) {
  const skeletonT = translations[locale];
  const displayMessage = message || skeletonT.analyzing;
  return (
    <div className="min-h-screen bg-[#050506]">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Back button skeleton */}
        <div className="h-4 w-24 bg-white/5 rounded mb-8" />

        {/* Header skeleton */}
        <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="h-5 w-32 bg-white/5 rounded" />
            <div className="h-4 w-24 bg-white/5 rounded" />
          </div>
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
            <div className="w-14 h-14 bg-white/5 rounded-full" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-24 bg-white/5 rounded" />
            </div>
          </div>
        </div>

        {/* Loading indicator - visible and informative */}
        <div className="flex flex-col items-center justify-center py-8 mb-6">
          <div className="w-10 h-10 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
          <span className="text-zinc-300 text-sm font-medium">{displayMessage}</span>
          <span className="text-zinc-600 text-xs mt-1">{skeletonT.thisMayTake}</span>
        </div>

        {/* Analysis skeleton */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-xl" />
              <div>
                <div className="h-3 w-20 bg-white/5 rounded mb-2" />
                <div className="h-5 w-32 bg-white/5 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-white/[0.02] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="h-3 w-24 bg-white/5 rounded mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-white/5 rounded animate-pulse" style={{ width: `${100 - i * 10}%` }} />
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0a0a0b] border border-white/[0.06] p-6">
            <div className="h-3 w-32 bg-white/5 rounded mb-4" />
            <div className="h-16 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
