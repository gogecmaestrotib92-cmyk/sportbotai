'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/HeaderI18n';
import Footer from '@/components/FooterI18n';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';

// Badge embed code for copy-to-clipboard
const BADGE_EMBED_CODE = `<a href="https://www.sportbotai.com/stats/us-sports-betting-statistics" title="US Sports Betting Statistics by SportBot AI" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: linear-gradient(135deg, #059669 0%, #2563eb 100%); border-radius: 8px; text-decoration: none; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; color: white; font-weight: 500;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
  Data by SportBot AI
</a>`;

// Last updated date - change this when updating data
const LAST_UPDATED = '8. februar 2026.';
const DATA_THROUGH = 'novembar 2025';

// Author info for E-E-A-T
const AUTHOR = {
  name: 'Stefan Mitrovic',
  url: 'https://www.sportbotai.com/about',
  jobTitle: 'Sportski analitičar i urednik',
  photo: 'https://www.upwork.com/profile-portraits/c1QVpOOlRVMXCujp1syLSScOWIl0cbOsxFl4HtH9scBn6y1CaZPeWLI5v_eg78VPCd',
  sameAs: [
    'https://www.upwork.com/freelancers/~017b8c67c94029389f',
    'https://www.linkedin.com/company/automateed/',
  ],
};

interface StateData {
  state: string;
  stateSr: string;
  abbr: string;
  legalSince: string;
  totalHandle: number;
  totalRevenue: number;
  holdRate: number;
  taxRate: string;
  taxRevenue: number;
}

// All-time cumulative data by state (as of Nov 2025)
const stateData: StateData[] = [
  { state: 'New York', stateSr: 'Njujork', abbr: 'NY', legalSince: 'jan 2022', totalHandle: 84.88, totalRevenue: 7.71, holdRate: 9.1, taxRate: '51%', taxRevenue: 3930 },
  { state: 'New Jersey', stateSr: 'Nju Džersi', abbr: 'NJ', legalSince: 'jun 2018', totalHandle: 58.42, totalRevenue: 4.21, holdRate: 7.2, taxRate: '13%', taxRevenue: 547 },
  { state: 'Illinois', stateSr: 'Ilinois', abbr: 'IL', legalSince: 'mar 2020', totalHandle: 42.15, totalRevenue: 3.85, holdRate: 9.1, taxRate: '20-40%', taxRevenue: 924 },
  { state: 'Pennsylvania', stateSr: 'Pensilvanija', abbr: 'PA', legalSince: 'nov 2018', totalHandle: 32.67, totalRevenue: 2.89, holdRate: 8.8, taxRate: '36%', taxRevenue: 1040 },
  { state: 'Nevada', stateSr: 'Nevada', abbr: 'NV', legalSince: '1949', totalHandle: 45.21, totalRevenue: 2.45, holdRate: 5.4, taxRate: '6,75%', taxRevenue: 165 },
  { state: 'Ohio', stateSr: 'Ohajo', abbr: 'OH', legalSince: 'jan 2023', totalHandle: 24.56, totalRevenue: 2.12, holdRate: 8.6, taxRate: '20%', taxRevenue: 424 },
  { state: 'Massachusetts', stateSr: 'Masačusets', abbr: 'MA', legalSince: 'mar 2023', totalHandle: 12.34, totalRevenue: 1.15, holdRate: 9.3, taxRate: '20%', taxRevenue: 230 },
  { state: 'Michigan', stateSr: 'Mičigen', abbr: 'MI', legalSince: 'jan 2021', totalHandle: 22.18, totalRevenue: 1.98, holdRate: 8.9, taxRate: '8,4%', taxRevenue: 166 },
  { state: 'Arizona', stateSr: 'Arizona', abbr: 'AZ', legalSince: 'sep 2021', totalHandle: 21.45, totalRevenue: 1.76, holdRate: 8.2, taxRate: '10%', taxRevenue: 176 },
  { state: 'Colorado', stateSr: 'Kolorado', abbr: 'CO', legalSince: 'maj 2020', totalHandle: 28.92, totalRevenue: 1.65, holdRate: 5.7, taxRate: '10%', taxRevenue: 165 },
  { state: 'Virginia', stateSr: 'Virdžinija', abbr: 'VA', legalSince: 'jan 2021', totalHandle: 18.76, totalRevenue: 1.52, holdRate: 8.1, taxRate: '15%', taxRevenue: 228 },
  { state: 'Tennessee', stateSr: 'Tenesi', abbr: 'TN', legalSince: 'nov 2020', totalHandle: 16.89, totalRevenue: 1.42, holdRate: 8.4, taxRate: '20%', taxRevenue: 284 },
  { state: 'Indiana', stateSr: 'Indijana', abbr: 'IN', legalSince: 'sep 2019', totalHandle: 19.34, totalRevenue: 1.38, holdRate: 7.1, taxRate: '9,5%', taxRevenue: 131 },
  { state: 'Maryland', stateSr: 'Merilend', abbr: 'MD', legalSince: 'nov 2022', totalHandle: 11.23, totalRevenue: 1.05, holdRate: 9.4, taxRate: '15%', taxRevenue: 158 },
  { state: 'Louisiana', stateSr: 'Luizijana', abbr: 'LA', legalSince: 'jan 2022', totalHandle: 8.45, totalRevenue: 0.78, holdRate: 9.2, taxRate: '15%', taxRevenue: 117 },
  { state: 'Kansas', stateSr: 'Kansas', abbr: 'KS', legalSince: 'sep 2022', totalHandle: 5.67, totalRevenue: 0.52, holdRate: 9.2, taxRate: '10%', taxRevenue: 52 },
  { state: 'Kentucky', stateSr: 'Kentaki', abbr: 'KY', legalSince: 'sep 2023', totalHandle: 4.12, totalRevenue: 0.38, holdRate: 9.2, taxRate: '9,75%', taxRevenue: 37 },
  { state: 'North Carolina', stateSr: 'Severna Karolina', abbr: 'NC', legalSince: 'mar 2024', totalHandle: 6.78, totalRevenue: 0.62, holdRate: 9.1, taxRate: '18%', taxRevenue: 112 },
  { state: 'Iowa', stateSr: 'Ajova', abbr: 'IA', legalSince: 'avg 2019', totalHandle: 10.23, totalRevenue: 0.72, holdRate: 7.0, taxRate: '6,75%', taxRevenue: 49 },
  { state: 'West Virginia', stateSr: 'Zapadna Virdžinija', abbr: 'WV', legalSince: 'avg 2018', totalHandle: 3.45, totalRevenue: 0.28, holdRate: 8.1, taxRate: '10%', taxRevenue: 28 },
  { state: 'Connecticut', stateSr: 'Konektikat', abbr: 'CT', legalSince: 'okt 2021', totalHandle: 4.56, totalRevenue: 0.41, holdRate: 9.0, taxRate: '13,75%', taxRevenue: 56 },
  { state: 'New Hampshire', stateSr: 'Nju Hempšir', abbr: 'NH', legalSince: 'dec 2019', totalHandle: 2.89, totalRevenue: 0.26, holdRate: 9.0, taxRate: '51%', taxRevenue: 133 },
  { state: 'Rhode Island', stateSr: 'Rod Ajlend', abbr: 'RI', legalSince: 'nov 2018', totalHandle: 1.78, totalRevenue: 0.16, holdRate: 9.0, taxRate: '51%', taxRevenue: 82 },
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
  { sport: 'NFL', percentage: 40, color: '#10b981' },
  { sport: 'NBA', percentage: 18, color: '#3b82f6' },
  { sport: 'Koledž FB', percentage: 12, color: '#f59e0b' },
  { sport: 'MLB', percentage: 10, color: '#ef4444' },
  { sport: 'NHL', percentage: 6, color: '#8b5cf6' },
  { sport: 'Fudbal', percentage: 5, color: '#06b6d4' },
  { sport: 'Ostalo', percentage: 9, color: '#6b7280' },
];

// Chart data for mobile vs retail
const mobileVsRetailData = [
  { name: 'Mobilno', value: 87, color: '#10b981' },
  { name: 'Fizičke kladionice', value: 13, color: '#6b7280' },
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

// Monthly national data
const monthlyNationalData = [
  { month: 'Nov 2025', handle: 16.83, revenue: 1.92 },
  { month: 'Okt 2025', handle: 15.21, revenue: 1.68 },
  { month: 'Sep 2025', handle: 12.45, revenue: 1.32 },
  { month: 'Avg 2025', handle: 8.92, revenue: 0.89 },
  { month: 'Jul 2025', handle: 7.34, revenue: 0.72 },
  { month: 'Jun 2025', handle: 7.12, revenue: 0.68 },
  { month: 'Maj 2025', handle: 8.45, revenue: 0.82 },
  { month: 'Apr 2025', handle: 9.23, revenue: 0.91 },
  { month: 'Mar 2025', handle: 11.67, revenue: 1.18 },
  { month: 'Feb 2025', handle: 13.89, revenue: 1.52 },
  { month: 'Jan 2025', handle: 12.34, revenue: 1.28 },
  { month: 'Dec 2024', handle: 14.56, revenue: 1.45 },
];

type SortKey = 'state' | 'totalHandle' | 'totalRevenue' | 'holdRate' | 'taxRate' | 'taxRevenue';
type SortDirection = 'asc' | 'desc';

export default function USBettingStatisticsPageSr() {
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
    
    if (sortKey === 'state') {
      aVal = a.stateSr;
      bVal = b.stateSr;
    }
    
    if (sortKey === 'taxRate') {
      aVal = parseFloat(a.taxRate.replace(',', '.')) || 0;
      bVal = parseFloat(b.taxRate.replace(',', '.')) || 0;
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
    const headers = ['Država', 'Skraćenica', 'Legalno od', 'Ukupni promet (mlrd $)', 'Ukupni prihod (mlrd $)', 'Hold stopa (%)', 'Porezna stopa', 'Porezni prihod (mil $)'];
    const rows = stateData.map(s => [
      s.stateSr, s.abbr, s.legalSince, s.totalHandle.toFixed(2), s.totalRevenue.toFixed(2), s.holdRate.toFixed(1), s.taxRate, s.taxRevenue.toFixed(1)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `us-sportsko-kladjenje-statistika-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Ažurirano mesečno • Podaci do {DATA_THROUGH}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Statistika sportskog klađenja u SAD 2026
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
            Sveobuhvatni podaci o prometu, prihodima, hold stopama i poreznim prihodima na svim legalnim tržištima sportskog klađenja u SAD.
          </p>
          
          <p className="text-sm text-gray-500 mb-8">
            Poslednje ažuriranje: {LAST_UPDATED} • Izvori: <a href="https://www.legalsportsreport.com/sports-betting/revenue/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">LSR</a>, <a href="https://www.americangaming.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">AGA</a>, <a href="https://sportshandle.com/betting-revenue/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Sportshandle</a>
          </p>

          {/* Key Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">${totalHandle.toFixed(0)} mlrd+</div>
              <div className="text-gray-400 text-sm mt-1">Ukupni promet</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">${totalRevenue.toFixed(0)} mlrd+</div>
              <div className="text-gray-400 text-sm mt-1">Ukupni prihod</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">{avgHoldRate.toFixed(1)}%</div>
              <div className="text-gray-400 text-sm mt-1">Prosečna hold stopa</div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-3xl md:text-4xl font-bold text-emerald-400">${(totalTaxRevenue/1000).toFixed(1)} mlrd</div>
              <div className="text-gray-400 text-sm mt-1">Ukupni porezni prihod</div>
            </div>
          </div>

          {/* Download CSV Button */}
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Preuzmi CSV podatke
          </button>
        </div>

        {/* Quick Citation Box */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-12">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Brzi citat
          </h2>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300">
            U novembru 2025, promet sportskog klađenja u SAD iznosio je <span className="text-emerald-400">$16,83 mlrd</span>, a prihod <span className="text-emerald-400">$1,92 mlrd</span>, sa prosečnom hold stopom od <span className="text-emerald-400">11,4%</span> (AGA). Industrija je generisala preko <span className="text-emerald-400">$50 mlrd</span> ukupnog prihoda na više od <span className="text-emerald-400">$600 mlrd</span> prometa od legalizacije 2018.
          </div>
          <p className="text-xs text-gray-500 mt-2">Izvor: <a href="https://www.americangaming.org/research/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">American Gaming Association</a>, <a href="https://www.legalsportsreport.com/sports-betting/revenue/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">LegalSportsReport</a></p>
        </div>

        {/* CHARTS SECTION */}
        
        {/* Annual Market Growth Chart */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Rast tržišta sportskog klađenja u SAD</h2>
          <div className="bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-800">
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...annualData].reverse()} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="year" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}B`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`$${value}B`, name === 'handle' ? 'Promet' : 'Prihod']}
                  />
                  <Bar dataKey="handle" fill="#10b981" radius={[4, 4, 0, 0]} name="Promet" />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Prihod" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500" />
                <span className="text-sm text-gray-400">Promet ($B)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-gray-400">Prihod ($B)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top States Chart */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Vodeće države po prometu</h2>
          <div className="bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-800">
            <div className="h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStatesChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}B`} />
                  <YAxis type="category" dataKey="state" stroke="#9ca3af" fontSize={12} width={40} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => [`$${value}B`, 'Ukupni promet']}
                  />
                  <Bar dataKey="handle" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Mobile vs Retail + Popular Sports Charts */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Mobile vs Retail */}
          <div className="bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-800">
            <h3 className="text-lg font-bold mb-2">Mobilno vs fizičke kladionice</h3>
            <p className="text-gray-400 text-sm mb-4">Udeo ukupnog prometa po kanalu</p>
            <div className="h-56">
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
                    formatter={(value) => [`${value}%`, 'Udeo']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Sports */}
          <div className="bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-800">
            <h3 className="text-lg font-bold mb-2">Najpopularniji sportovi za klađenje</h3>
            <p className="text-gray-400 text-sm mb-4">Udeo prometa po sportu</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularSportsData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="sport" stroke="#9ca3af" fontSize={10} width={60} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => [`${value}%`, 'Udeo prometa']}
                  />
                  <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                    {popularSportsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Mesečni trendovi prihoda</h2>
          <div className="bg-gray-900/50 rounded-xl p-4 md:p-6 border border-gray-800">
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...monthlyNationalData].reverse()} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorHandleSr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRevenueSr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={9} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}B`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`$${value}B`, name === 'handle' ? 'Promet' : 'Prihod']}
                  />
                  <Area type="monotone" dataKey="handle" stroke="#10b981" fillOpacity={1} fill="url(#colorHandleSr)" strokeWidth={2} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenueSr)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded bg-emerald-500" />
                <span className="text-sm text-gray-400">Promet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded bg-purple-500" />
                <span className="text-sm text-gray-400">Prihod</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'handle', icon: 'chart', label: 'Promet i prihod' },
            { id: 'revenue', icon: 'money', label: 'Porezni prihod' },
            { id: 'tax', icon: 'trend', label: 'Porezne stope' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'handle' | 'revenue' | 'tax')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.icon === 'chart' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              )}
              {tab.icon === 'money' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              {tab.icon === 'trend' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Data Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                {activeTab === 'handle' && (
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('state')}
                    >
                      Država <SortIcon column="state" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Legalno od</th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('totalHandle')}
                    >
                      Ukupni promet <SortIcon column="totalHandle" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('totalRevenue')}
                    >
                      Ukupni prihod <SortIcon column="totalRevenue" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('holdRate')}
                    >
                      Hold stopa <SortIcon column="holdRate" />
                    </th>
                  </tr>
                )}
                {activeTab === 'revenue' && (
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('state')}
                    >
                      Država <SortIcon column="state" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('totalRevenue')}
                    >
                      Ukupni GGR <SortIcon column="totalRevenue" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRate')}
                    >
                      Porezna stopa <SortIcon column="taxRate" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRevenue')}
                    >
                      Porezni prihod <SortIcon column="taxRevenue" />
                    </th>
                  </tr>
                )}
                {activeTab === 'tax' && (
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('state')}
                    >
                      Država <SortIcon column="state" />
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRate')}
                    >
                      Porezna stopa <SortIcon column="taxRate" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Porezni nivo</th>
                    <th 
                      className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('taxRevenue')}
                    >
                      Ukupno naplaćen porez <SortIcon column="taxRevenue" />
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sortedData.map((state, idx) => {
                  const taxRateNum = parseFloat(state.taxRate.replace(',', '.')) || 0;
                  const taxTier = taxRateNum >= 40 ? 'Visok (40%+)' : taxRateNum >= 10 ? 'Srednji (10-39%)' : 'Nizak (<10%)';
                  const taxTierColor = taxRateNum >= 40 ? 'text-red-400' : taxRateNum >= 10 ? 'text-yellow-400' : 'text-emerald-400';
                  
                  return (
                    <tr key={state.abbr} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}>
                      <td className="px-4 py-3 font-medium">
                        <span className="text-gray-400 mr-2">{state.abbr}</span>
                        {state.stateSr}
                      </td>
                      {activeTab === 'handle' && (
                        <>
                          <td className="px-4 py-3 text-gray-400">{state.legalSince}</td>
                          <td className="px-4 py-3 text-right font-mono">${state.totalHandle.toFixed(2)} mlrd</td>
                          <td className="px-4 py-3 text-right font-mono">${state.totalRevenue.toFixed(2)} mlrd</td>
                          <td className="px-4 py-3 text-right font-mono">{state.holdRate.toFixed(1)}%</td>
                        </>
                      )}
                      {activeTab === 'revenue' && (
                        <>
                          <td className="px-4 py-3 text-right font-mono">${state.totalRevenue.toFixed(2)} mlrd</td>
                          <td className="px-4 py-3 text-right font-mono">{state.taxRate}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            {state.taxRevenue >= 1000 
                              ? `$${(state.taxRevenue/1000).toFixed(2)} mlrd`
                              : `$${state.taxRevenue.toFixed(0)} mil`
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
                              ? `$${(state.taxRevenue/1000).toFixed(2)} mlrd`
                              : `$${state.taxRevenue.toFixed(0)} mil`
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
                  <td className="px-4 py-3">UKUPNO ({stateData.length} država)</td>
                  {activeTab === 'handle' && (
                    <>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-mono">${totalHandle.toFixed(2)} mlrd</td>
                      <td className="px-4 py-3 text-right font-mono">${totalRevenue.toFixed(2)} mlrd</td>
                      <td className="px-4 py-3 text-right font-mono">{avgHoldRate.toFixed(1)}%</td>
                    </>
                  )}
                  {activeTab === 'revenue' && (
                    <>
                      <td className="px-4 py-3 text-right font-mono">${totalRevenue.toFixed(2)} mlrd</td>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3 text-right font-mono">${(totalTaxRevenue/1000).toFixed(2)} mlrd</td>
                    </>
                  )}
                  {activeTab === 'tax' && (
                    <>
                      <td className="px-4 py-3 text-right">—</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-mono">${(totalTaxRevenue/1000).toFixed(2)} mlrd</td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Record Book Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 012 2v2a5 5 0 01-5 5h-.09a6 6 0 01-5.82 5H10a6 6 0 01-5.82-5H4a5 5 0 01-5-5V5a2 2 0 012-2h4zm0 2H4a3 3 0 003 3V5H5zm14 0h-2v3a3 3 0 003-3zM12 17a4 4 0 004-4H8a4 4 0 004 4zm-1 2h2v2h-2v-2z" /></svg>
            Knjiga rekorda sportskog klađenja u SAD
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Najveća godina (prihod)</div>
              <div className="text-2xl font-bold text-emerald-400">2024: $13,71 mlrd</div>
              <div className="text-sm text-gray-500 mt-1">~$150 mlrd prometa, 9,3% hold</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Najveći kvartal</div>
              <div className="text-2xl font-bold text-emerald-400">Q4 2024: $3,66 mlrd</div>
              <div className="text-sm text-gray-500 mt-1">NFL + NBA sezona</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Najveći mesec</div>
              <div className="text-2xl font-bold text-emerald-400">Nov 2025: $1,92 mlrd</div>
              <div className="text-sm text-gray-500 mt-1">$16,83 mlrd prometa, 11,4% hold</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Najveća država (ukupno)</div>
              <div className="text-2xl font-bold text-emerald-400">NY: $84,88 mlrd prometa</div>
              <div className="text-sm text-gray-500 mt-1">$7,71 mlrd prihoda od jan 2022</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Najviši porezni prihod</div>
              <div className="text-2xl font-bold text-emerald-400">NY: $3,93 mlrd+</div>
              <div className="text-sm text-gray-500 mt-1">51% porezna stopa na GGR</div>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Najviša hold stopa (mesečno)</div>
              <div className="text-2xl font-bold text-emerald-400">Nov 2024: 11,5%</div>
              <div className="text-sm text-gray-500 mt-1">Povoljni NFL ishodi za kladionice</div>
            </div>
          </div>
        </div>

        {/* Annual Trends */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Godišnji rast industrije
          </h2>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Godina</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Promet</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Prihod</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Hold stopa</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Porezni prihod</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">YoY rast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {annualData.map((year, idx) => {
                  const prevYear = annualData[idx + 1];
                  const yoyGrowth = prevYear 
                    ? ((year.revenue - prevYear.revenue) / prevYear.revenue * 100).toFixed(0)
                    : null;
                  
                  return (
                    <tr key={year.year} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}>
                      <td className="px-4 py-3 font-semibold">{year.year}</td>
                      <td className="px-4 py-3 text-right font-mono">${year.handle.toFixed(1)} mlrd</td>
                      <td className="px-4 py-3 text-right font-mono">${year.revenue.toFixed(2)} mlrd</td>
                      <td className="px-4 py-3 text-right font-mono">{year.holdRate.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-mono">${year.taxRevenue.toFixed(2)} mlrd</td>
                      <td className="px-4 py-3 text-right font-mono">
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
          <p className="text-xs text-gray-500 mt-2">Izvor: <a href="https://www.americangaming.org/research/commercial-gaming-revenue-tracker/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">AGA Commercial Gaming Revenue Tracker</a>, <a href="https://www.espn.com/chalk/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">ESPN</a></p>
        </div>

        {/* Tax Rate Breakdown */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Porezne stope po državama
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-red-400 mb-3">Visok porez (40%+)</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Njujork</span><span className="font-mono">51%</span></li>
                <li className="flex justify-between"><span>Nju Hempšir</span><span className="font-mono">51%</span></li>
                <li className="flex justify-between"><span>Rod Ajlend</span><span className="font-mono">51%</span></li>
                <li className="flex justify-between"><span>Ilinois (max)</span><span className="font-mono">40%</span></li>
              </ul>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">Srednji porez (10-20%)</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Ohajo, Tenesi</span><span className="font-mono">20%</span></li>
                <li className="flex justify-between"><span>Severna Karolina</span><span className="font-mono">18%</span></li>
                <li className="flex justify-between"><span>Virdžinija, Merilend</span><span className="font-mono">15%</span></li>
                <li className="flex justify-between"><span>Nju Džersi</span><span className="font-mono">13%</span></li>
                <li className="flex justify-between"><span>Arizona, Kolorado</span><span className="font-mono">10%</span></li>
              </ul>
            </div>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-emerald-400 mb-3">Nizak porez (&lt;10%)</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>Kentaki</span><span className="font-mono">9,75%</span></li>
                <li className="flex justify-between"><span>Indijana</span><span className="font-mono">9,5%</span></li>
                <li className="flex justify-between"><span>Mičigen</span><span className="font-mono">8,4%</span></li>
                <li className="flex justify-between"><span>Ajova, Nevada</span><span className="font-mono">6,75%</span></li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Izvor: <a href="https://www.ncsl.org/financial-services/seven-years-of-sports-betting-did-states-get-it-right" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 underline">NCSL</a>, izveštaji državnih komisija za igre na sreću</p>
        </div>

        {/* Cite This Page Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Citiraj ovu stranicu
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h3 className="font-semibold text-purple-400 text-sm">APA format</h3>
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(`Mitrovic, S. (${new Date().getFullYear()}). Statistika sportskog klađenja u SAD ${new Date().getFullYear()}. SportBot AI. https://www.sportbotai.com/sr/stats/us-sports-betting-statistics`);
                    setCopiedCitation('apa');
                    setTimeout(() => setCopiedCitation(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 w-fit ${
                    copiedCitation === 'apa' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedCitation === 'apa' ? (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Kopirano!</>
                  ) : (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Kopiraj</>
                  )}
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-xs text-gray-300 break-words overflow-hidden">
                <p className="break-all">Mitrovic, S. ({new Date().getFullYear()}). <em>Statistika sportskog klađenja u SAD {new Date().getFullYear()}</em>. SportBot AI. https://www.sportbotai.com/sr/stats/us-sports-betting-statistics</p>
              </div>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h3 className="font-semibold text-purple-400 text-sm">MLA format</h3>
                <button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(`Mitrovic, Stefan. "Statistika sportskog klađenja u SAD ${new Date().getFullYear()}." SportBot AI, www.sportbotai.com/sr/stats/us-sports-betting-statistics.`);
                    setCopiedCitation('mla');
                    setTimeout(() => setCopiedCitation(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 w-fit ${
                    copiedCitation === 'mla' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-700 hover:bg-purple-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {copiedCitation === 'mla' ? (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Kopirano!</>
                  ) : (
                    <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>Kopiraj</>
                  )}
                </button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-xs text-gray-300 break-words overflow-hidden">
                <p className="break-all">Mitrovic, Stefan. &quot;Statistika sportskog klađenja u SAD {new Date().getFullYear()}.&quot; <em>SportBot AI</em>, www.sportbotai.com/sr/stats/us-sports-betting-statistics.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Use Our Data Badge */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Koristi naše podatke
          </h2>
          
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 text-center">
            <p className="text-gray-400 text-sm mb-4">Koristite naše podatke? Linkujte nazad ovim badge-om:</p>
            
            {/* Badge Preview */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg inline-block">
              <p className="text-xs text-gray-500 mb-2">Pregled:</p>
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
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  badgeCopied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600'
                }`}
              >
                {badgeCopied ? '✓ Kopirano!' : 'Kopiraj kod badge-a'}
              </button>
            </div>
            
            <p className="text-gray-500 text-xs mt-4">Zalepite ovaj HTML na svoju web stranicu da prikažete badge sa linkom nazad.</p>
            <p className="text-gray-500 text-xs mt-1">Kontaktirajte nas na <a href="mailto:contact@sportbotai.com" className="text-emerald-400 hover:underline">contact@sportbotai.com</a> za saradnju.</p>
          </div>
        </div>

        {/* Author Box - E-E-A-T signal */}
        <div className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800 mb-12">
          <div className="flex items-start gap-6">
            <Link href="/sr/about" className="flex-shrink-0">
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
                <span className="text-xs uppercase tracking-wider text-gray-500">Napisao</span>
              </div>
              <Link href="/sr/about" className="text-xl font-bold text-white hover:text-emerald-400 transition-colors">
                {AUTHOR.name}
              </Link>
              <p className="text-emerald-400 text-sm mb-3">{AUTHOR.jobTitle}</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Sportski analitičar sa ekspertizom u analizi klađenja zasnovanoj na podacima i tržišnim trendovima.
                Kombinuje AI tehnologiju sa dubokim poznavanjem sporta za pružanje sveobuhvatne statistike i uvida.
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

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-blue-900/50 rounded-2xl p-8 border border-emerald-800/50 text-center">
          <h2 className="text-2xl font-bold mb-3">Želite AI analizu klađenja?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            SportBot AI koristi mašinsko učenje za analizu mečeva u NFL-u, NBA-u, NHL-u, fudbalu i drugim sportovima. 
            Dobijte procene verovatnoća, detekciju vrednosti i alate za pronalaženje prednosti.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/sr/matches"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Pregledaj mečeve
            </Link>
            <Link 
              href="/sr/pricing"
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Pogledaj cene
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* Schema.org structured data - Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Statistika sportskog klađenja u SAD 2026: Kompletni podaci po državama',
            description: 'Sveobuhvatni podaci o prometu, prihodima, hold stopama i poreznim prihodima sportskog klađenja po američkim državama. Ažurira se mesečno.',
            url: 'https://www.sportbotai.com/sr/stats/us-sports-betting-statistics',
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
              '@id': 'https://www.sportbotai.com/sr/stats/us-sports-betting-statistics',
            },
            image: 'https://www.sportbotai.com/og-stats-us-betting.png',
            articleSection: 'Sports Betting Statistics',
            inLanguage: 'sr',
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
            name: 'Statistika sportskog klađenja u SAD 2026',
            description: 'Sveobuhvatni podaci o prometu, prihodima, hold stopama i poreznim prihodima sportskog klađenja po američkim državama.',
            url: 'https://www.sportbotai.com/sr/stats/us-sports-betting-statistics',
            creator: {
              '@type': 'Organization',
              name: 'SportBot AI',
              url: 'https://www.sportbotai.com',
            },
            dateModified: new Date().toISOString().split('T')[0],
            temporalCoverage: '2018/..',
            spatialCoverage: 'United States',
            inLanguage: 'sr',
          }),
        }}
      />
    </div>
  );
}
