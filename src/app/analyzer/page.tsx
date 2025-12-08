/**
 * Analyzer Page (/analyzer)
 * 
 * Main page for AI-powered multi-sport match analysis.
 * Modern sports analytics dashboard design.
 */

'use client';

import { useState, useCallback } from 'react';
import MultiSportAnalyzerForm from '@/components/MultiSportAnalyzerForm';
import { AnalysisResults } from '@/components/analyzer';
import { AnalyzeResponse } from '@/types';

type ViewState = 'form' | 'loading' | 'results' | 'error';

export default function AnalyzerPage() {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [viewState, setViewState] = useState<ViewState>('form');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleResult = useCallback((analysisResult: AnalyzeResponse) => {
    setResult(analysisResult);
    if (analysisResult.success) {
      setViewState('results');
      setErrorMessage(null);
    } else {
      setViewState('error');
      setErrorMessage(analysisResult.error || 'Unknown error occurred');
    }
  }, []);

  const handleLoading = useCallback((isLoading: boolean) => {
    if (isLoading) {
      setViewState('loading');
      setErrorMessage(null);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setViewState('form');
    setErrorMessage(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-primary-900 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Match Analyzer</h1>
              <p className="text-gray-400">
                Select a sport and match, then let AI break down probabilities, value, and risk.
              </p>
            </div>
            
            {/* Sport Pills */}
            <div className="flex flex-wrap gap-2">
              {['⚽ Soccer', '🏀 NBA', '🏈 NFL', '🎾 Tennis', '🏒 NHL', '🥊 UFC'].map((sport) => (
                <span key={sport} className="px-3 py-1.5 bg-white/10 text-gray-300 text-sm rounded-full border border-white/10">
                  {sport}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form View / Loading View */}
        {(viewState === 'form' || viewState === 'loading') && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left side - Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Select Sport &amp; Match
                </h2>
                <MultiSportAnalyzerForm onResult={handleResult} onLoading={handleLoading} />
              </div>
            </div>

            {/* Right side - Preview / Loading */}
            <div className="lg:col-span-2">
              {viewState === 'loading' ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    {/* Loading Animation */}
                    <div className="relative mb-6">
                      <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-accent-cyan rounded-full animate-spin border-t-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-accent-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      AI Analysis in Progress
                    </h3>
                    <p className="text-gray-500 text-center text-sm max-w-xs mb-4">
                      Calculating probabilities, detecting value, and assessing risk...
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse" />
                      Usually takes 5-15 seconds
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Analysis Results
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mb-6">
                      Select a match and click &quot;Analyze&quot; to get AI-powered insights.
                    </p>
                    
                    {/* What you'll get */}
                    <div className="text-left w-full bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">
                        Your analysis includes:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full" />
                          Win/Draw probability estimates
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-accent-lime rounded-full" />
                          Value detection
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-accent-gold rounded-full" />
                          Risk assessment
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-accent-green rounded-full" />
                          Momentum & form analysis
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error View */}
        {viewState === 'error' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-red-200 p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  {errorMessage || 'An unexpected error occurred while analyzing the match.'}
                </p>
                <button onClick={handleReset} className="btn-primary">
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {viewState === 'results' && result && (
          <div>
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Analyze Another Match
              </button>
            </div>

            {/* Analysis Results (includes disclaimer in ExtrasSection) */}
            <AnalysisResults result={result} />
          </div>
        )}
      </section>
    </div>
  );
}
