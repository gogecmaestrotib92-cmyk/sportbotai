'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';

// Badge embed code for copy-to-clipboard
const BADGE_EMBED_CODE = `<a href="https://www.sportbotai.com/stats/us-sports-betting-statistics" title="US Sports Betting Statistics by SportBot AI" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, #059669 0%, #2563eb 100%); border-radius: 8px; text-decoration: none; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: white; font-weight: 500;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
  Data by SportBot AI
</a>`;

// Last updated date - change this when updating data
const LAST_UPDATED = 'February 8, 2026';
const DATA_THROUGH = 'November 2025';

// Author info for E-E-A-T
const AUTHOR = {
  name: 'Stefan Mitrovic',
  url: 'https://www.sportbotai.com/about',
  jobTitle: 'Sports Analyst & Editor',
  photo: '/images/stefan-mitrovic.png',
  sameAs: [
    'https://www.upwork.com/freelancers/~017b8c67c94029389f',
    'https://www.linkedin.com/company/automateed/',
  ],
};

// =============================================================================
// DATA SOURCES:
// - LegalSportsReport (LSR): https://www.legalsportsreport.com/sports-betting/revenue/
// - Sportshandle: https://sportshandle.com/betting-revenue/
// - AGA Commercial Gaming Revenue Tracker
// - USAFacts, Census Bureau, NCSL for tax data
// =============================================================================

interface StateData {
  state: string;
  abbr: string;
  legalSince: string;
  totalHandle: number; // in billions
  totalRevenue: number; // in billions
  holdRate: number; // percentage
  taxRate: string; // can be range or single value
  taxRevenue: number; // in millions
  nov2025Handle?: number; // in millions
  nov2025Revenue?: number; // in millions
}

// All-time cumulative data by state (as of Nov 2025)
const stateData: StateData[] = [
  { state: 'New York', abbr: 'NY', legalSince: 'Jan 2022', totalHandle: 84.88, totalRevenue: 7.71, holdRate: 9.1, taxRate: '51%', taxRevenue: 3930, nov2025Handle: 2100, nov2025Revenue: 210 },
  { state: 'New Jersey', abbr: 'NJ', legalSince: 'Jun 2018', totalHandle: 58.42, totalRevenue: 4.21, holdRate: 7.2, taxRate: '13%', taxRevenue: 547, nov2025Handle: 1450, nov2025Revenue: 105 },
  { state: 'Illinois', abbr: 'IL', legalSince: 'Mar 2020', totalHandle: 42.15, totalRevenue: 3.85, holdRate: 9.1, taxRate: '20-40%', taxRevenue: 924, nov2025Handle: 1200, nov2025Revenue: 125 },
  { state: 'Pennsylvania', abbr: 'PA', legalSince: 'Nov 2018', totalHandle: 32.67, totalRevenue: 2.89, holdRate: 8.8, taxRate: '36%', taxRevenue: 1040, nov2025Handle: 890, nov2025Revenue: 85 },
  { state: 'Nevada', abbr: 'NV', legalSince: '1949', totalHandle: 45.21, totalRevenue: 2.45, holdRate: 5.4, taxRate: '6.75%', taxRevenue: 165, nov2025Handle: 750, nov2025Revenue: 42 },
  { state: 'Ohio', abbr: 'OH', legalSince: 'Jan 2023', totalHandle: 24.56, totalRevenue: 2.12, holdRate: 8.6, taxRate: '20%', taxRevenue: 424, nov2025Handle: 920, nov2025Revenue: 82 },
  { state: 'Massachusetts', abbr: 'MA', legalSince: 'Mar 2023', totalHandle: 12.34, totalRevenue: 1.15, holdRate: 9.3, taxRate: '20%', taxRevenue: 230, nov2025Handle: 520, nov2025Revenue: 52 },
  { state: 'Michigan', abbr: 'MI', legalSince: 'Jan 2021', totalHandle: 22.18, totalRevenue: 1.98, holdRate: 8.9, taxRate: '8.4%', taxRevenue: 166, nov2025Handle: 680, nov2025Revenue: 65 },
  { state: 'Arizona', abbr: 'AZ', legalSince: 'Sep 2021', totalHandle: 21.45, totalRevenue: 1.76, holdRate: 8.2, taxRate: '10%', taxRevenue: 176, nov2025Handle: 720, nov2025Revenue: 62 },
  { state: 'Colorado', abbr: 'CO', legalSince: 'May 2020', totalHandle: 28.92, totalRevenue: 1.65, holdRate: 5.7, taxRate: '10%', taxRevenue: 165, nov2025Handle: 780, nov2025Revenue: 48 },
  { state: 'Virginia', abbr: 'VA', legalSince: 'Jan 2021', totalHandle: 18.76, totalRevenue: 1.52, holdRate: 8.1, taxRate: '15%', taxRevenue: 228, nov2025Handle: 620, nov2025Revenue: 55 },
  { state: 'Tennessee', abbr: 'TN', legalSince: 'Nov 2020', totalHandle: 16.89, totalRevenue: 1.42, holdRate: 8.4, taxRate: '20%', taxRevenue: 284, nov2025Handle: 580, nov2025Revenue: 52 },
  { state: 'Indiana', abbr: 'IN', legalSince: 'Sep 2019', totalHandle: 19.34, totalRevenue: 1.38, holdRate: 7.1, taxRate: '9.5%', taxRevenue: 131, nov2025Handle: 540, nov2025Revenue: 42 },
  { state: 'Maryland', abbr: 'MD', legalSince: 'Nov 2022', totalHandle: 11.23, totalRevenue: 1.05, holdRate: 9.4, taxRate: '15%', taxRevenue: 158, nov2025Handle: 480, nov2025Revenue: 48 },
  { state: 'Louisiana', abbr: 'LA', legalSince: 'Jan 2022', totalHandle: 8.45, totalRevenue: 0.78, holdRate: 9.2, taxRate: '15%', taxRevenue: 117, nov2025Handle: 320, nov2025Revenue: 32 },
  { state: 'Kansas', abbr: 'KS', legalSince: 'Sep 2022', totalHandle: 5.67, totalRevenue: 0.52, holdRate: 9.2, taxRate: '10%', taxRevenue: 52, nov2025Handle: 220, nov2025Revenue: 22 },
  { state: 'Kentucky', abbr: 'KY', legalSince: 'Sep 2023', totalHandle: 4.12, totalRevenue: 0.38, holdRate: 9.2, taxRate: '9.75%', taxRevenue: 37, nov2025Handle: 185, nov2025Revenue: 18 },
  { state: 'North Carolina', abbr: 'NC', legalSince: 'Mar 2024', totalHandle: 6.78, totalRevenue: 0.62, holdRate: 9.1, taxRate: '18%', taxRevenue: 112, nov2025Handle: 380, nov2025Revenue: 38 },
  { state: 'Vermont', abbr: 'VT', legalSince: 'Jan 2024', totalHandle: 0.34, totalRevenue: 0.03, holdRate: 8.8, taxRate: '20%', taxRevenue: 6, nov2025Handle: 18, nov2025Revenue: 1.8 },
  { state: 'Iowa', abbr: 'IA', legalSince: 'Aug 2019', totalHandle: 10.23, totalRevenue: 0.72, holdRate: 7.0, taxRate: '6.75%', taxRevenue: 49, nov2025Handle: 280, nov2025Revenue: 21 },
  { state: 'West Virginia', abbr: 'WV', legalSince: 'Aug 2018', totalHandle: 3.45, totalRevenue: 0.28, holdRate: 8.1, taxRate: '10%', taxRevenue: 28, nov2025Handle: 95, nov2025Revenue: 8 },
  { state: 'Wyoming', abbr: 'WY', legalSince: 'Sep 2021', totalHandle: 1.12, totalRevenue: 0.09, holdRate: 8.0, taxRate: '10%', taxRevenue: 9, nov2025Handle: 32, nov2025Revenue: 2.8 },
  { state: 'Connecticut', abbr: 'CT', legalSince: 'Oct 2021', totalHandle: 4.56, totalRevenue: 0.41, holdRate: 9.0, taxRate: '13.75%', taxRevenue: 56, nov2025Handle: 145, nov2025Revenue: 14 },
  { state: 'New Hampshire', abbr: 'NH', legalSince: 'Dec 2019', totalHandle: 2.89, totalRevenue: 0.26, holdRate: 9.0, taxRate: '51%', taxRevenue: 133, nov2025Handle: 85, nov2025Revenue: 8 },
  { state: 'Rhode Island', abbr: 'RI', legalSince: 'Nov 2018', totalHandle: 1.78, totalRevenue: 0.16, holdRate: 9.0, taxRate: '51%', taxRevenue: 82, nov2025Handle: 52, nov2025Revenue: 5 },
  { state: 'Oregon', abbr: 'OR', legalSince: 'Aug 2019', totalHandle: 2.34, totalRevenue: 0.19, holdRate: 8.1, taxRate: 'State-run', taxRevenue: 45, nov2025Handle: 68, nov2025Revenue: 5.5 },
  { state: 'Arkansas', abbr: 'AR', legalSince: 'Mar 2022', totalHandle: 1.23, totalRevenue: 0.11, holdRate: 8.9, taxRate: '13%', taxRevenue: 14, nov2025Handle: 42, nov2025Revenue: 4 },
  { state: 'Maine', abbr: 'ME', legalSince: 'Nov 2023', totalHandle: 0.89, totalRevenue: 0.08, holdRate: 9.0, taxRate: '10%', taxRevenue: 8, nov2025Handle: 45, nov2025Revenue: 4.2 },
  { state: 'South Dakota', abbr: 'SD', legalSince: 'Sep 2021', totalHandle: 0.15, totalRevenue: 0.012, holdRate: 8.0, taxRate: '9%', taxRevenue: 0.118, nov2025Handle: 4, nov2025Revenue: 0.35 },
];

// National monthly data (2024-2025)
const monthlyNationalData = [
  { month: 'Nov 2025', handle: 16.83, revenue: 1.92, holdRate: 11.4 },
  { month: 'Oct 2025', handle: 15.21, revenue: 1.68, holdRate: 11.0 },
  { month: 'Sep 2025', handle: 12.45, revenue: 1.32, holdRate: 10.6 },
  { month: 'Aug 2025', handle: 8.92, revenue: 0.89, holdRate: 10.0 },
  { month: 'Jul 2025', handle: 7.34, revenue: 0.72, holdRate: 9.8 },
  { month: 'Jun 2025', handle: 7.12, revenue: 0.68, holdRate: 9.6 },
  { month: 'May 2025', handle: 8.45, revenue: 0.82, holdRate: 9.7 },
  { month: 'Apr 2025', handle: 9.23, revenue: 0.91, holdRate: 9.9 },
  { month: 'Mar 2025', handle: 11.67, revenue: 1.18, holdRate: 10.1 },
  { month: 'Feb 2025', handle: 13.89, revenue: 1.52, holdRate: 10.9 },
  { month: 'Jan 2025', handle: 12.34, revenue: 1.28, holdRate: 10.4 },
  { month: 'Dec 2024', handle: 14.56, revenue: 1.45, holdRate: 10.0 },
  { month: 'Nov 2024', handle: 15.42, revenue: 1.78, holdRate: 11.5 },
  { month: 'Oct 2024', handle: 13.89, revenue: 1.52, holdRate: 10.9 },
  { month: 'Sep 2024', handle: 11.23, revenue: 1.15, holdRate: 10.2 },
];

// Annual records
const annualData = [
  { year: 2024, handle: 149.8, revenue: 13.71, holdRate: 9.3, taxRevenue: 2.99 },
  { year: 2023, handle: 119.4, revenue: 10.92, holdRate: 9.1, taxRevenue: 2.45 },
  { year: 2022, handle: 93.2, revenue: 7.56, holdRate: 8.1, taxRevenue: 1.89 },
  { year: 2021, handle: 57.3, revenue: 4.29, holdRate: 7.5, taxRevenue: 1.12 },
  { year: 2020, handle: 21.5, revenue: 1.55, holdRate: 7.2, taxRevenue: 0.42 },
  { year: 2019, handle: 13.0, revenue: 0.91, holdRate: 7.0, taxRevenue: 0.24 },
];

// Chart data for popular sports betting
const popularSportsData = [
  { sport: 'NFL', percentage: 40, color: '#2AF6A0' },
  { sport: 'NBA', percentage: 18, color: '#3b82f6' },
  { sport: 'College FB', percentage: 12, color: '#f59e0b' },
  { sport: 'MLB', percentage: 10, color: '#ef4444' },
  { sport: 'NHL', percentage: 6, color: '#8b5cf6' },
  { sport: 'Soccer', percentage: 5, color: '#06b6d4' },
  { sport: 'Other', percentage: 9, color: '#6b7280' },
];

// Chart data for mobile vs retail
const mobileVsRetailData = [
  { name: 'Mobile', value: 87, color: '#2AF6A0' },
  { name: 'Retail', value: 13, color: '#6b7280' },
];

// Top states chart data
const topStatesChartData = [
  { state: 'NY', handle: 84.88, revenue: 7.71 },
  { state: 'NJ', handle: 58.42, revenue: 4.21 },
  { state: 'NV', handle: 45.21, revenue: 2.45 },
  { state: 'IL', handle: 42.15, revenue: 3.85 },
  { state: 'PA', handle: 32.67, revenue: 2.89 },
  { state: 'CO', handle: 28.92, revenue: 1.65 },
  { state: 'OH', handle: 24.56, revenue: 2.12 },
  { state: 'MI', handle: 22.18, revenue: 1.98 },
];

type SortKey = 'state' | 'totalHandle' | 'totalRevenue' | 'holdRate' | 'taxRate' | 'taxRevenue';
type SortDirection = 'asc' | 'desc';

export default function USBettingStatisticsPage() {
  const [sortKey, setSortKey] = useState<SortKey>('totalHandle');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState<'handle' | 'revenue' | 'tax'>('handle');
  const [badgeCopied, setBadgeCopied] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  // Calculate totals
  const totalHandle = stateData.reduce((sum, s) => sum + s.totalHandle, 0);
  const totalRevenue = stateData.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalTaxRevenue = stateData.reduce((sum, s) => sum + s.taxRevenue, 0);
  const avgHoldRate = totalRevenue / totalHandle * 100;

  // Sort data
  const sortedData = [...stateData].sort((a, b) => {
    let aVal: number | string = a[sortKey];
    let bVal: number | string = b[sortKey];
    
    if (sortKey === 'taxRate') {
      // Extract first number from tax rate string
      aVal = parseFloat(a.taxRate) || 0;
      bVal = parseFloat(b.taxRate) || 0;
    }
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }
    
    return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <span className="text-gray-500 ml-1">↕</span>;
    return <span className="text-emerald-400 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Generate CSV
  const downloadCSV = () => {
    const headers = ['State', 'Abbreviation', 'Legal Since', 'Total Handle ($B)', 'Total Revenue ($B)', 'Hold Rate (%)', 'Tax Rate', 'Tax Revenue ($M)'];
    const rows = stateData.map(s => [
      s.state, s.abbr, s.legalSince, s.totalHandle.toFixed(2), s.totalRevenue.toFixed(2), s.holdRate.toFixed(1), s.taxRate, s.taxRevenue.toFixed(1)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `us-sports-betting-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      
      {/* Hero Section with Background */}
      <section className="relative overflow-hidden">
        {/* Background gradient & pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 px-5 py-2.5 rounded-full text-sm font-medium mb-6 border border-emerald-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Updated Monthly • Data through {DATA_THROUGH}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent leading-tight">
              US Sports Betting Statistics 2026
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-4 leading-relaxed">
              The definitive revenue tracker with comprehensive data on handle, gaming revenue, tax revenue, and market trends across all legal US states.
            </p>
            
            <p className="text-sm text-gray-500 mb-10">
              Last updated: {LAST_UPDATED} • Sources: <a href="https://www.legalsportsreport.com/sports-betting/revenue/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">LSR</a>, <a href="https://www.americangaming.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">AGA</a>, <a href="https://sportshandle.com/betting-revenue/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Sportshandle</a>
            </p>

            {/* Key Stats Cards - Redesigned */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
              <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 md:p-8 border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">${totalHandle.toFixed(0)}B<span className="text-emerald-400">+</span></div>
                <div className="text-gray-400 text-sm">All-Time Handle</div>
              </div>
              <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 md:p-8 border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">${totalRevenue.toFixed(0)}B<span className="text-emerald-400">+</span></div>
                <div className="text-gray-400 text-sm">All-Time Revenue</div>
              </div>
              <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 md:p-8 border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{avgHoldRate.toFixed(1)}<span className="text-emerald-400">%</span></div>
                <div className="text-gray-400 text-sm">Avg Hold Rate</div>
              </div>
              <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 md:p-8 border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">${(totalTaxRevenue/1000).toFixed(1)}B</div>
                <div className="text-gray-400 text-sm">Total Tax Revenue</div>
              </div>
            </div>

            {/* Download CSV Button */}
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Full Dataset (CSV)
            </button>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 py-16">

        {/* Quick Citation Box - Redesigned */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-emerald-900/20 rounded-2xl p-8 border border-gray-800 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="relative">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-xl">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              Quick Citation for Journalists
            </h2>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 font-mono text-sm text-gray-300 leading-relaxed border border-gray-700/50">
              In November 2025, US sports betting handle was <span className="text-emerald-400 font-semibold">$16.83B</span> and revenue was <span className="text-emerald-400 font-semibold">$1.92B</span>, with an average hold rate of <span className="text-emerald-400 font-semibold">11.4%</span> (AGA). The industry has generated over <span className="text-emerald-400 font-semibold">$50B</span> in total revenue on nearly <span className="text-emerald-400 font-semibold">$580B</span> in handle since legalization began in 2018.
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Source: <a href="https://www.americangaming.org/research/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">American Gaming Association</a>, <a href="https://www.legalsportsreport.com/sports-betting/revenue/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">LegalSportsReport</a>
            </p>
          </div>
        </div>

        {/* Executive Summary Section - Improved */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-xl">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Executive Summary: US Sports Betting Market 2026</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <p className="text-gray-300 leading-relaxed">
                The US sports betting market continues its explosive growth in 2026, following the landmark 2018 Supreme Court decision that struck down the Professional and Amateur Sports Protection Act (PASPA). Since that legalization of sports betting, two thirds of states have legalized sports betting in some form, transforming what was once a Nevada-only industry into a nationwide legal market worth over $150 billion in annual wager volume.
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
              <p className="text-gray-300 leading-relaxed">
                This comprehensive sports betting revenue tracker provides the most up-to-date statistics on the US sports betting industry. Whether you&apos;re a bettor looking to understand market trends, a journalist researching the legal sports betting landscape, or a regulator tracking state gaming performance, this page offers authoritative data on handle, gaming revenue, tax revenue, and sports betting market size across all US states where sports betting is now legal.
              </p>
            </div>
          </div>
        </div>

        {/* How Big Is the US Sports Betting Market Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">How Big Is the US Sports Betting Market in 2026?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              The sports betting market size in the United States has grown exponentially since legalization began. In 2019, Americans wagered just $13 billion through legal sportsbooks. By 2024, that figure had grown to nearly $150 billion in total sports betting handle, with gaming revenue (the amount retained by sportsbooks after paying out winning bets) reaching $13.71 billion.
            </p>
            <p className="text-gray-300 leading-relaxed">
              The first full year after widespread online sports betting adoption saw dramatic increases in betting activity. Mobile sportsbook apps now account for approximately 85-90% of all wagers placed, a trend that continues in 2026. This shift to online betting platforms has been the primary driver of market growth, making it easier than ever for Americans to bet on sporting events from their smartphones.
            </p>
            <p className="text-gray-300 leading-relaxed">
              For 2026, analysts project the broader market to generate between $120-140 billion in annual handle, with sports betting revenue approaching $10-12 billion. These figures position the US as the largest market for legal sports wagering globally, surpassing even established European betting markets.
            </p>
          </div>
          
          {/* Market Growth Chart - embedded in section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">Annual Market Growth (2019-2024)</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...annualData].reverse()} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}B`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`$${value}B`, name === 'handle' ? 'Handle' : 'Revenue']}
                  />
                  <Bar dataKey="handle" fill="#2AF6A0" radius={[4, 4, 0, 0]} name="Handle" />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-sm text-gray-400">Handle ($B)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-gray-400">Revenue ($B)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Which States Lead Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">Which US States Lead in Sports Betting Revenue?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Not all state sports betting markets are created equal. A handful of large states dominate the US market, generating the majority of total sports gambling revenue. New York, despite launching online betting just in January 2022, has emerged as the single largest sports betting market in the country, with over $84 billion in cumulative handle and $7.7 billion in gross gaming revenue.
            </p>
            <p className="text-gray-300 leading-relaxed">
              New Jersey pioneered the modern legal sports betting era after winning the Supreme Court case and remains a top performer with nearly every sportsbook operator competing for market share. Nevada, with its decades of legalized sports betting history dating back to 1949, continues as a major player, particularly for retail sportsbooks serving tourists in Las Vegas.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Pennsylvania, Illinois, Michigan, and Ohio round out the top betting in states rankings. Illinois has seen particularly strong growth driven by Chicago&apos;s large population and passionate sports fans who bet heavily on NFL and college football seasons. States have passed increasingly competitive legislation to attract betting operators and capture tax revenue generated from this new form of gambling.
            </p>
          </div>
          
          {/* Top States Chart - embedded in section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">Top States by All-Time Handle</h3>
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStatesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}B`} />
                  <YAxis type="category" dataKey="state" stroke="#9ca3af" fontSize={12} width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => [`$${value}B`, 'Total Handle']}
                  />
                  <Bar dataKey="handle" fill="#2AF6A0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Mobile vs Retail Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">How Does Mobile Betting Compare to Retail Sportsbooks?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              The shift from retail to online sportsbooks has fundamentally changed how Americans gamble on sports. In states with legal mobile betting, online platforms capture 85-90% of all handle, with retail sportsbooks accounting for the remaining 10-15%. This mirrors the broader market trend across nearly every state that has approved mobile wagering.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Sports betting apps from major operators like FanDuel and DraftKings have invested billions in user experience, live betting features, and promotional offers to attract bettors. The convenience of placing a bet from anywhere has driven increased betting activity, particularly among younger demographics who prefer mobile-first experiences. Online gambling through these platforms now represents the primary way Americans interact with legal sportsbooks.
            </p>
            <p className="text-gray-300 leading-relaxed">
              However, retail locations maintain importance for high-roller bettors, integrated casino-resort experiences, and states like Nevada where the culture of in-person sports betting remains strong. Major sports leagues have also partnered with sportsbook operators to create in-venue betting offers that combine the excitement of live sporting events with convenient wagering options.
            </p>
          </div>
          
          {/* Mobile vs Retail Chart - embedded in section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">Mobile vs Retail Handle Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mobileVsRetailData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {mobileVsRetailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {mobileVsRetailData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-400">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Sports Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">What Are the Most Popular Sports to Bet On in America?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              The NFL dominates the US sports betting landscape, accounting for approximately 40% of all sports bets during football season. American sports fans&apos; passion for professional football translates directly into betting activity, with Super Bowl Sunday representing the single largest betting day of the year. College football also drives significant handle, particularly during rivalry games and bowl season.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Basketball ranks second among popular sports for betting, with the NBA generating substantial wager volume throughout its long regular season and playoffs. College basketball players and March Madness tournaments create a surge of betting activity that rivals NFL playoffs. Baseball, while traditionally less bet-heavy, benefits from the sheer volume of MLB games offering daily betting options.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Like sports betting on traditional American sports, soccer has seen rapid growth driven by increased MLS interest and European league coverage. Large sports betting events like the World Cup generate exceptional handle. Prop bets and same-game parlays have emerged as increasingly popular bet types, particularly among casual bettors who enjoy combining multiple outcomes in a single wager.
            </p>
          </div>
          
          {/* Popular Sports Chart - embedded in section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">Betting Handle by Sport</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularSportsData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="sport" tick={{ fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => [`${value}%`, 'Share']}
                  />
                  <Bar dataKey="percentage" fill="#2AF6A0" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tax Revenue Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">How Much Tax Revenue Does Sports Betting Generate?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Tax revenue from legal sports betting has become a significant contributor to state budgets across the country. Since 2018, states have collected over $8 billion in state taxes from sports betting operators. New York alone has generated nearly $4 billion in state tax revenue thanks to its industry-high 51% tax on gross gaming revenue.
            </p>
            <p className="text-gray-300 leading-relaxed">
              The tax on gross gaming revenue varies dramatically by state, from as low as 6.75% in Nevada and Iowa to the maximum 51% rate in New York, New Hampshire, and Rhode Island. Higher tax rates generate more revenue potential per dollar of handle but can affect operator profitability and reduce promotional spending. States have adopted different approaches based on their priorities for revenue generated versus market competitiveness.
            </p>
            <p className="text-gray-300 leading-relaxed">
              According to the American Gaming Association, total tax revenue generated from legal sports betting could exceed $3 billion in state tax collections for 2026 alone. This revenue supports state budget priorities including education, infrastructure, and responsible gaming programs. The revenue potential has motivated states and the District of Columbia to accelerate legalization efforts.
            </p>
          </div>
        </div>

        {/* 2026 Trends Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">What Are the Key Sports Betting Market Trends for 2026?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Several important trends 2026 are shaping the sports betting industry. Consolidation among betting operators continues as the market matures, with larger sports betting companies acquiring smaller competitors to achieve scale. The period last year saw multiple mergers and acquisitions as operators sought to improve profitability after years of promotional spending.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Live betting (in-play wagering) represents one of the fastest-growing segments, now accounting for over 30% of online handle compared to just 20% percent in 2022. Sports betting platforms continue investing in faster data feeds and improved live betting interfaces. Same-game parlays remain popular among recreational bettors despite their higher hold rates for sportsbooks.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Responsible gaming technology has become increasingly sophisticated, with AI-powered systems detecting problem gambling patterns and intervening before issues escalate. State gaming regulators now require robust responsible gaming features as a condition of licensure. Sports betting would not have achieved its current growth trajectory without these consumer protections building public trust in the legal market.
            </p>
          </div>
          
          {/* Monthly Trends Chart - embedded in section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">National Monthly Handle Trends (2024-2025)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyNationalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `$${value}B`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => [`$${value}B`, 'Handle']}
                  />
                  <Area type="monotone" dataKey="handle" stroke="#2AF6A0" fill="#2AF6A0" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Legalization Status Section */}
        <div className="mb-16 bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">Where Is Sports Betting Legal in 2026?</h2>
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Sports betting is now legal in {stateData.length} states plus Washington D.C. as of 2026. States have legalized sports betting at varying paces since the Amateur Sports Protection Act was struck down. Some launched quickly with mobile-first approaches, while others initially allowed only retail sportsbooks before expanding to online betting.
            </p>
            <p className="text-gray-300 leading-relaxed">
              The remaining states without legal sports betting face ongoing legislative debates. California remains the largest US market without legalized sports betting, despite multiple ballot initiatives. Texas, Florida (with ongoing legal challenges), and Georgia represent significant revenue potential if they join the legal sports betting ecosystem. Industry analysts estimate sports betting across these holdout states could add billions in additional handle to the US market.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Year to date, 2026 has seen continued progress on interstate compacts and expanded forms of gambling. Sports betting has become normalized in American culture, with pro sports teams and sports leagues actively partnering with sportsbook operators. The betting scandal concerns that initially made professional sports leagues hesitant have largely given way to acceptance and integration.
            </p>
          </div>
        </div>

        {/* State Data Section Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">State-by-State Betting Data</h2>
          <p className="text-gray-400">Click column headers to sort • All data as of {DATA_THROUGH}</p>
        </div>

        {/* Tab Navigation - Redesigned */}
        <div className="flex flex-wrap gap-3 mb-8">
          {[
            { id: 'handle', icon: 'chart', label: 'Handle & Revenue' },
            { id: 'revenue', icon: 'money', label: 'Tax Revenue' },
            { id: 'tax', icon: 'trend', label: 'Tax Rates' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'handle' | 'revenue' | 'tax')}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border border-gray-700'
              }`}
            >
              {tab.icon === 'chart' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              )}
              {tab.icon === 'money' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {tab.icon === 'trend' && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Data Table - Redesigned */}
        <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden mb-16">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                {activeTab === 'handle' && (
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('state')}
                    >
                      State <SortIcon column="state" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Legal Since</th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('totalHandle')}
                    >
                      Total Handle <SortIcon column="totalHandle" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('totalRevenue')}
                    >
                      Total Revenue <SortIcon column="totalRevenue" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('holdRate')}
                    >
                      Hold Rate <SortIcon column="holdRate" />
                    </th>
                  </tr>
                )}
                {activeTab === 'revenue' && (
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('state')}
                    >
                      State <SortIcon column="state" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('totalRevenue')}
                    >
                      Total GGR <SortIcon column="totalRevenue" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRate')}
                    >
                      Tax Rate <SortIcon column="taxRate" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRevenue')}
                    >
                      Tax Revenue <SortIcon column="taxRevenue" />
                    </th>
                  </tr>
                )}
                {activeTab === 'tax' && (
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('state')}
                    >
                      State <SortIcon column="state" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRate')}
                    >
                      Tax Rate <SortIcon column="taxRate" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tax Tier</th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRevenue')}
                    >
                      Total Tax Collected <SortIcon column="taxRevenue" />
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedData.map((state, idx) => {
                  const taxRateNum = parseFloat(state.taxRate) || 0;
                  const taxTier = taxRateNum >= 40 ? 'High (40%+)' : taxRateNum >= 10 ? 'Medium (10-39%)' : 'Low (<10%)';
                  const taxTierColor = taxRateNum >= 40 ? 'text-red-400' : taxRateNum >= 10 ? 'text-yellow-400' : 'text-emerald-400';
                  
                  return (
                    <tr key={state.abbr} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}>
                      <td className="px-4 py-3 font-medium">
                        <span className="text-gray-400 mr-2">{state.abbr}</span>
                        {state.state}
                      </td>
                      {activeTab === 'handle' && (
                        <>
                          <td className="px-4 py-3 text-gray-400">{state.legalSince}</td>
                          <td className="px-4 py-3 text-right font-mono">${state.totalHandle.toFixed(2)}B</td>
                          <td className="px-4 py-3 text-right font-mono">${state.totalRevenue.toFixed(2)}B</td>
                          <td className="px-4 py-3 text-right font-mono">{state.holdRate.toFixed(1)}%</td>
                        </>
                      )}
                      {activeTab === 'revenue' && (
                        <>
                          <td className="px-4 py-3 text-right font-mono">${state.totalRevenue.toFixed(2)}B</td>
                          <td className="px-4 py-3 text-right font-mono">{state.taxRate}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {state.taxRevenue >= 1000 
                              ? `$${(state.taxRevenue/1000).toFixed(2)}B`
                              : `$${state.taxRevenue.toFixed(0)}M`
                            }
                          </td>
                        </>
                      )}
                      {activeTab === 'tax' && (
                        <>
                          <td className="px-4 py-3 text-right font-mono">{state.taxRate}</td>
                          <td className={`px-4 py-3 text-left font-medium ${taxTierColor}`}>{taxTier}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {state.taxRevenue >= 1000 
                              ? `$${(state.taxRevenue/1000).toFixed(2)}B`
                              : `$${state.taxRevenue.toFixed(0)}M`
                            }
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-800 font-semibold">
                <tr>
                  <td className="px-4 py-3">TOTAL ({stateData.length} states)</td>
                  {activeTab === 'handle' && (
                    <>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-mono">${totalHandle.toFixed(2)}B</td>
                      <td className="px-4 py-3 text-right font-mono">${totalRevenue.toFixed(2)}B</td>
                      <td className="px-4 py-3 text-right font-mono">{avgHoldRate.toFixed(1)}%</td>
                    </>
                  )}
                  {activeTab === 'revenue' && (
                    <>
                      <td className="px-4 py-3 text-right font-mono">${totalRevenue.toFixed(2)}B</td>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right font-mono">${(totalTaxRevenue/1000).toFixed(2)}B</td>
                    </>
                  )}
                  {activeTab === 'tax' && (
                    <>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-mono">${(totalTaxRevenue/1000).toFixed(2)}B</td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Record Book Section - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-500/20 rounded-xl">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v2a5 5 0 01-5 5h-.09a6 6 0 01-5.82 5H10a6 6 0 01-5.82-5H4a5 5 0 01-5-5V5a2 2 0 012-2h4zm0 2H4a3 3 0 003 3V5H5zm14 0h-2v3a3 3 0 003-3zM12 17a4 4 0 004-4H8a4 4 0 004 4zm-1 2h2v2h-2v-2z" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">US Sports Betting Record Book</h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Biggest Year (Revenue)
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">2024: <span className="text-emerald-400">$13.71B</span></div>
              <div className="text-sm text-gray-500">~$150B handle, 9.3% hold</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Biggest Quarter
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">Q4 2024: <span className="text-emerald-400">$3.66B</span></div>
              <div className="text-sm text-gray-500">NFL + NBA season overlap</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Biggest Month
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">Nov 2025: <span className="text-emerald-400">$1.92B</span></div>
              <div className="text-sm text-gray-500">$16.83B handle, 11.4% hold</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Biggest State (All-Time)
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">NY: <span className="text-emerald-400">$84.88B</span></div>
              <div className="text-sm text-gray-500">$7.71B revenue since Jan 2022</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Highest State Tax Revenue
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">NY: <span className="text-emerald-400">$3.93B+</span></div>
              <div className="text-sm text-gray-500">51% tax rate on GGR</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-900 to-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Highest Hold Rate (Monthly)
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">Nov 2024: <span className="text-emerald-400">11.5%</span></div>
              <div className="text-sm text-gray-500">Favorable NFL outcomes for books</div>
            </div>
          </div>
        </div>

        {/* Annual Trends - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-xl">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Annual Industry Growth</h2>
          </div>
          
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Year</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Handle</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Revenue</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Hold Rate</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Tax Revenue</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">YoY Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {annualData.map((year, idx) => {
                  const prevYear = annualData[idx + 1];
                  const yoyGrowth = prevYear 
                    ? ((year.revenue - prevYear.revenue) / prevYear.revenue * 100).toFixed(0)
                    : null;
                  
                  return (
                    <tr key={year.year} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold">{year.year}</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-300">${year.handle.toFixed(1)}B</td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-400 font-semibold">${year.revenue.toFixed(2)}B</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-300">{year.holdRate.toFixed(1)}%</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-300">${year.taxRevenue.toFixed(2)}B</td>
                      <td className="px-6 py-4 text-right font-mono">
                        {yoyGrowth ? (
                          <span className="text-emerald-400">+{yoyGrowth}%</span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">Source: <a href="https://www.americangaming.org/research/commercial-gaming-revenue-tracker/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">AGA Commercial Gaming Revenue Tracker</a>, <a href="https://www.espn.com/chalk/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">ESPN</a></p>
        </div>

        {/* Tax Rate Breakdown - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">State Tax Rates on Sports Betting</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-900/20 to-gray-900/50 rounded-2xl p-6 border border-red-800/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <h3 className="text-lg font-semibold text-red-400">High Tax (40%+)</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">New York</span>
                  <span className="font-mono bg-red-500/20 px-2 py-1 rounded text-red-400">51%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">New Hampshire</span>
                  <span className="font-mono bg-red-500/20 px-2 py-1 rounded text-red-400">51%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Rhode Island</span>
                  <span className="font-mono bg-red-500/20 px-2 py-1 rounded text-red-400">51%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Illinois (top tier)</span>
                  <span className="font-mono bg-red-500/20 px-2 py-1 rounded text-red-400">40%</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900/50 rounded-2xl p-6 border border-yellow-800/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-400">Medium Tax (10-20%)</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Ohio, Tennessee, Vermont</span>
                  <span className="font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">20%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">North Carolina</span>
                  <span className="font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">18%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Virginia, Louisiana, Maryland</span>
                  <span className="font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">15%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">New Jersey</span>
                  <span className="font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">13%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Arizona, Colorado, Kansas</span>
                  <span className="font-mono bg-yellow-500/20 px-2 py-1 rounded text-yellow-400">10%</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-900/20 to-gray-900/50 rounded-2xl p-6 border border-emerald-800/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <h3 className="text-lg font-semibold text-emerald-400">Low Tax (&lt;10%)</h3>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Kentucky</span>
                  <span className="font-mono bg-emerald-500/20 px-2 py-1 rounded text-emerald-400">9.75%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Indiana</span>
                  <span className="font-mono bg-emerald-500/20 px-2 py-1 rounded text-emerald-400">9.5%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">South Dakota</span>
                  <span className="font-mono bg-emerald-500/20 px-2 py-1 rounded text-emerald-400">9%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Michigan</span>
                  <span className="font-mono bg-emerald-500/20 px-2 py-1 rounded text-emerald-400">8.4%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Iowa, Nevada</span>
                  <span className="font-mono bg-emerald-500/20 px-2 py-1 rounded text-emerald-400">6.75%</span>
                </li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Source: <a href="https://www.ncsl.org/financial-services/seven-years-of-sports-betting-did-states-get-it-right" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">NCSL "Seven Years of Sports Betting: Did States Get It Right?"</a>, state gaming commission reports</p>
        </div>

        {/* Monthly Data Table - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-xl">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Monthly National Totals (2024-2025)</h2>
          </div>
          
          <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Month</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Handle</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Revenue</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Hold Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {monthlyNationalData.map((month, idx) => (
                    <tr key={month.month} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{month.month}</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-300">${month.handle.toFixed(2)}B</td>
                      <td className="px-6 py-4 text-right font-mono text-emerald-400 font-semibold">${month.revenue.toFixed(2)}B</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-300">{month.holdRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Source: <a href="https://www.americangaming.org/research/commercial-gaming-revenue-tracker/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">AGA Commercial Gaming Revenue Tracker</a></p>
        </div>

        {/* Illegal Market Size Section - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-red-500/20 rounded-xl">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Illegal Sports Betting Market</h2>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/20 to-gray-900/50 rounded-2xl p-8 border border-red-800/30">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-gray-400 mb-2">Estimated Illegal Market Size</div>
                <div className="text-3xl md:text-4xl font-bold text-red-400 mb-3">$150-200B <span className="text-lg text-gray-400">annually</span></div>
                <p className="text-gray-400 leading-relaxed">
                  According to the American Gaming Association, illegal and unregulated sports betting 
                  represents a significant portion of total US wagering activity. This includes offshore 
                  sportsbooks, local bookies, and unregulated online operators.
                </p>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Lost Tax Revenue (Estimated)</div>
                <div className="text-3xl font-bold text-red-400 mb-2">$13-17B annually</div>
                <p className="text-gray-400 text-sm">
                  Based on average state tax rates and estimated illegal handle, states are missing out 
                  on billions in potential tax revenue from unregulated gambling activity.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Source: <a href="https://www.americangaming.org/resources/sizing-the-illegal-and-unregulated-gaming-markets-in-the-u-s/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">AGA Sizing the Illegal Gaming Market Report</a></p>
          </div>
        </div>

        {/* Methodology Section - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-500/20 rounded-xl">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Methodology & Sources</h2>
          </div>
          
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800">
            <p className="text-gray-300 leading-relaxed mb-6">
              This page aggregates sports betting data from official state gaming commission reports 
              and industry trackers. Our primary sources include:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <div>
                  <span className="font-semibold text-white">LegalSportsReport (LSR)</span>
                  <span className="text-gray-400"> — Monthly state-by-state handle and revenue tracking</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <div>
                  <span className="font-semibold text-white">American Gaming Association</span>
                  <span className="text-gray-400"> — Commercial Gaming Revenue Tracker</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <div>
                  <span className="font-semibold text-white">Sportshandle</span>
                  <span className="text-gray-400"> — Comprehensive database since 2018</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <div>
                  <span className="font-semibold text-white">State Gaming Commissions</span>
                  <span className="text-gray-400"> — Official monthly reports</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <div>
                  <span className="font-semibold text-white">USAFacts & Census Bureau</span>
                  <span className="text-gray-400"> — Tax revenue data</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2" />
                <div>
                  <span className="font-semibold text-white">NCSL</span>
                  <span className="text-gray-400"> — Tax rate analysis and policy comparisons</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
              <p className="text-gray-300 text-sm">
                <span className="font-semibold text-white">Handle</span> = total amount wagered • 
                <span className="font-semibold text-white ml-2">Revenue</span> = handle minus payouts to bettors • 
                <span className="font-semibold text-white ml-2">Hold rate</span> = revenue ÷ handle (sportsbook margin)
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Data is updated monthly, typically within 2-3 weeks after state gaming commissions release official figures.
            </p>
          </div>
        </div>

        {/* FAQ Section - Redesigned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-colors">
              <h3 className="font-semibold text-lg mb-3 text-white">What is the size of the US sports betting market in 2026?</h3>
              <p className="text-gray-400 leading-relaxed">
                The US sports betting market size for 2026 is estimated at $120-140 billion in annual handle (total wagers), with gross gaming revenue between $9-12 billion. This makes the US the largest legal sports betting market globally. The sports betting market continues to grow as more states legalize sports betting and mobile sportsbook adoption increases.
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-colors">
              <h3 className="font-semibold text-lg mb-3 text-white">Which states generate the most sports betting revenue?</h3>
              <p className="text-gray-400 leading-relaxed">
                New York leads all US states with over $84 billion in cumulative handle and $7.7 billion in sports betting revenue since launching in January 2022. New Jersey, Nevada, Pennsylvania, Illinois, and Michigan consistently rank among the top states for betting market volume and revenue generated from legal sports wagering.
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-colors">
              <h3 className="font-semibold text-lg mb-3 text-white">How much tax revenue does sports betting generate for states?</h3>
              <p className="text-gray-400 leading-relaxed">
                Legal sports betting has generated over $8 billion in state tax revenue since 2018. New York alone accounts for nearly $4 billion in state budget contributions thanks to its 51% tax rate on gross gaming revenue. The tax revenue potential motivates states to legalize sports betting and join the legal market.
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-colors">
              <h3 className="font-semibold text-lg mb-3 text-white">What percentage of bets are placed online vs. retail?</h3>
              <p className="text-gray-400 leading-relaxed">
                Approximately 85-90% of all sports bets are placed through online sportsbooks and mobile betting apps. Retail sportsbook locations account for only 10-15% of total handle. This dominance of online betting platforms reflects bettor preferences for convenience and the widespread availability of sports betting apps from operators like FanDuel and DraftKings.
              </p>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 hover:border-purple-500/30 transition-colors">
              <h3 className="font-semibold text-lg mb-3 text-white">What sports do Americans bet on most?</h3>
              <p className="text-gray-400 leading-relaxed">
                NFL football dominates the US betting market, accounting for roughly 40% of handle during football season. The NBA ranks second among major sports, followed by MLB and college sports. Soccer has shown strong market growth, while props and same-game parlays have become increasingly popular bet types across all sports.
              </p>
            </div>
          </div>
        </div>

        {/* Key Takeaways Section - Redesigned */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-emerald-900/30 via-gray-900 to-gray-900 rounded-2xl p-8 border border-emerald-800/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-xl">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Key Takeaways</h2>
              </div>
              
              <ul className="space-y-4">
                {[
                  'The US sports betting market has grown from $13B in handle (2019) to over $150B annually, making it the world\'s largest legal market',
                  'Two thirds of US states have legalized sports betting since the 2018 PASPA ruling, with more legislation pending',
                  'New York generates the highest sports betting revenue despite launching only in 2022, followed by NJ, NV, PA, and IL',
                  'Mobile sportsbook apps account for 85-90% of all wagers, with online betting driving market growth',
                  'State tax revenue from legal sports betting has exceeded $8B total, with potential for much more as holdout states legalize',
                  'NFL betting dominates handle volume, but live betting and same-game parlays are the fastest-growing bet types',
                  'The illegal betting market still exceeds $150B annually, representing significant untapped tax revenue potential',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-300">
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cite This Page Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-xl">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Cite This Page</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gray-900/50 rounded-2xl p-4 md:p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">APA 7th</span>
                </h3>
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(`Mitrovic, S. (${new Date().getFullYear()}). US sports betting statistics ${new Date().getFullYear()}. SportBot AI. https://www.sportbotai.com/stats/us-sports-betting-statistics`);
                    setCopiedCitation('apa');
                    setTimeout(() => setCopiedCitation(null), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 w-fit ${
                    copiedCitation === 'apa' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedCitation === 'apa' ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy</>
                  )}
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm text-gray-300 break-words overflow-hidden">
                <p className="break-all">Mitrovic, S. ({new Date().getFullYear()}). <em>US sports betting statistics {new Date().getFullYear()}</em>. SportBot AI. https://www.sportbotai.com/stats/us-sports-betting-statistics</p>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-4 md:p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">MLA 9th</span>
                </h3>
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(`Mitrovic, Stefan. "US Sports Betting Statistics ${new Date().getFullYear()}." SportBot AI, ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}, www.sportbotai.com/stats/us-sports-betting-statistics.`);
                    setCopiedCitation('mla');
                    setTimeout(() => setCopiedCitation(null), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 w-fit ${
                    copiedCitation === 'mla' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedCitation === 'mla' ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy</>
                  )}
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm text-gray-300 break-words overflow-hidden">
                <p className="break-all">Mitrovic, Stefan. &quot;US Sports Betting Statistics {new Date().getFullYear()}.&quot; <em>SportBot AI</em>, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}, www.sportbotai.com/stats/us-sports-betting-statistics.</p>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-4 md:p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">Chicago</span>
                </h3>
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(`Mitrovic, Stefan. "US Sports Betting Statistics ${new Date().getFullYear()}." SportBot AI. Last modified ${LAST_UPDATED}. https://www.sportbotai.com/stats/us-sports-betting-statistics.`);
                    setCopiedCitation('chicago');
                    setTimeout(() => setCopiedCitation(null), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 w-fit ${
                    copiedCitation === 'chicago' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedCitation === 'chicago' ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy</>
                  )}
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 font-mono text-xs md:text-sm text-gray-300 break-words overflow-hidden">
                <p className="break-all">Mitrovic, Stefan. &quot;US Sports Betting Statistics {new Date().getFullYear()}.&quot; SportBot AI. Last modified {LAST_UPDATED}. https://www.sportbotai.com/stats/us-sports-betting-statistics.</p>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-2xl p-4 md:p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                  <span className="text-xs bg-purple-500/20 px-2 py-1 rounded">BibTeX</span>
                </h3>
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(`@online{sportbotai${new Date().getFullYear()},\n  author = {Mitrovic, Stefan},\n  title = {US Sports Betting Statistics ${new Date().getFullYear()}},\n  year = {${new Date().getFullYear()}},\n  url = {https://www.sportbotai.com/stats/us-sports-betting-statistics},\n  urldate = {${new Date().toISOString().split('T')[0]}}\n}`);
                    setCopiedCitation('bibtex');
                    setTimeout(() => setCopiedCitation(null), 2000);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 w-fit ${
                    copiedCitation === 'bibtex' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedCitation === 'bibtex' ? (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Copy</>
                  )}
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                <pre className="whitespace-pre-wrap break-all">{`@online{sportbotai${new Date().getFullYear()},
  author = {Mitrovic, Stefan},
  title = {US Sports Betting Statistics ${new Date().getFullYear()}},
  year = {${new Date().getFullYear()}},
  url = {https://www.sportbotai.com/stats/us-sports-betting-statistics},
  urldate = {${new Date().toISOString().split('T')[0]}}
}`}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Use Our Data Badge */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-xl">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Use Our Data</h2>
          </div>
          
          <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-gray-400 mb-4">Using our statistics? Link back with this badge:</p>
            
            {/* Badge Preview */}
            <div className="mb-4 p-4 bg-gray-800/50 rounded-xl inline-block">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Data by SportBot AI
              </span>
            </div>
            
            {/* Copy Button */}
            <div>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(BADGE_EMBED_CODE);
                    setBadgeCopied(true);
                    setTimeout(() => setBadgeCopied(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy:', err);
                  }
                }}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  badgeCopied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600'
                }`}
              >
                {badgeCopied ? '✓ Copied!' : 'Copy Badge Code'}
              </button>
            </div>
            
            <p className="text-gray-500 text-sm mt-6">Paste this HTML on your website to display the badge with a link back to this page.</p>
            <p className="text-gray-500 text-sm mt-2">Contact us at <a href="mailto:contact@sportbotai.com" className="text-emerald-400 hover:underline">contact@sportbotai.com</a> for collaboration opportunities.</p>
          </div>
        </div>

        {/* Author Box - E-E-A-T signal */}
        <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 mb-16">
          <div className="flex items-start gap-6">
            <Link href="/about" className="flex-shrink-0">
              <Image
                src={AUTHOR.photo}
                alt={AUTHOR.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-500/30"
              />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-gray-500">Written by</span>
              </div>
              <Link href="/about" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                {AUTHOR.name}
              </Link>
              <p className="text-emerald-400 text-sm mb-3">{AUTHOR.jobTitle}</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Sports analyst with expertise in data-driven sports betting analysis and market trends.
                Combining AI technology with deep sports knowledge to deliver comprehensive statistics and insights.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href={AUTHOR.sameAs[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.895 18.158c-.263.095-.545.158-.84.158H6.945c-.295 0-.577-.063-.84-.158a2.953 2.953 0 01-1.105-.74V12.5h2v3.75h10V12.5h2v4.918a2.953 2.953 0 01-1.105.74zM12 6.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5zm0 5.5a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5z"/></svg>
                  Upwork
                </a>
                <a
                  href={AUTHOR.sameAs[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Redesigned */}
        <div className="bg-gradient-to-br from-emerald-900/40 via-blue-900/30 to-gray-900 rounded-2xl p-10 border border-emerald-700/30 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Want AI-Powered Betting Analysis?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              SportBot AI uses machine learning to analyze matches across NFL, NBA, NHL, soccer and more. 
              Get probability estimates, value detection, and edge-finding tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/matches"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5"
              >
                Explore Matches
              </Link>
              <Link 
                href="/pricing"
                className="bg-gray-800/80 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 border border-gray-700 hover:border-gray-600"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Schema.org structured data - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'US Sports Betting Statistics 2026: Complete State-by-State Data',
            description: 'Comprehensive data on US sports betting handle, revenue, hold rates, and tax revenue across all legal states. Updated monthly.',
            url: 'https://www.sportbotai.com/stats/us-sports-betting-statistics',
            datePublished: '2026-01-15',
            dateModified: LAST_UPDATED.replace(/[^0-9]/g, '-').replace(/-+/g, '-').replace(/-$/, ''),
            author: {
              '@type': 'Person',
              name: AUTHOR.name,
              url: AUTHOR.url,
              jobTitle: AUTHOR.jobTitle,
              image: AUTHOR.photo,
              sameAs: AUTHOR.sameAs,
            },
            publisher: {
              '@type': 'Organization',
              name: 'SportBot AI',
              url: 'https://www.sportbotai.com',
              logo: {
                '@type': 'ImageObject',
                url: 'https://www.sportbotai.com/logo.png',
              },
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://www.sportbotai.com/stats/us-sports-betting-statistics',
            },
            image: 'https://www.sportbotai.com/og-stats-us-betting.png',
            articleSection: 'Sports Betting Statistics',
            keywords: 'sports betting handle, sports betting revenue, sports betting by state, US sports betting statistics, legal sports betting data',
          }),
        }}
      />
      
      {/* Schema.org structured data - Dataset */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Dataset',
            name: 'US Sports Betting Statistics 2026',
            description: 'Comprehensive data on US sports betting handle, revenue, hold rates, and tax revenue by state.',
            url: 'https://www.sportbotai.com/stats/us-sports-betting-statistics',
            creator: {
              '@type': 'Organization',
              name: 'SportBot AI',
              url: 'https://www.sportbotai.com',
            },
            dateModified: new Date().toISOString().split('T')[0],
            temporalCoverage: '2018/..',
            spatialCoverage: 'United States',
            keywords: [
              'sports betting handle',
              'sports betting revenue',
              'sports betting by state',
              'sports betting tax revenue',
              'US sports betting statistics',
              'legal sports betting data',
            ],
            distribution: {
              '@type': 'DataDownload',
              encodingFormat: 'text/csv',
              contentUrl: 'https://www.sportbotai.com/stats/us-sports-betting-statistics',
            },
          }),
        }}
      />
    </div>
  );
}
