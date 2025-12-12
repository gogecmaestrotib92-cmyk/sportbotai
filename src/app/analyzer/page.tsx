/**
 * Analyzer Page - Redirects to /matches
 * 
 * The /analyzer route is deprecated. All analysis is now done
 * through the /matches → /match/[matchId] flow.
 */

import { redirect } from 'next/navigation';

export default function AnalyzerPage() {
  redirect('/matches');
}
