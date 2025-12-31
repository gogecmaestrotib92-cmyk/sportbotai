/**
 * Analyzer Page - Serbian Version - Redirects to /sr/matches
 * 
 * The /sr/analyzer route is deprecated. All analysis is now done
 * through the /sr/matches → /sr/match/[matchId] flow.
 */

import { redirect } from 'next/navigation';

export default function AnalyzerPageSR() {
  redirect('/sr/matches');
}
