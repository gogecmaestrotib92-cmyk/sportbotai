/**
 * Form Trend Chart Component
 * 
 * Visualizes a team's form over recent matches with a simple chart.
 * Part of Phase 5: Team Intelligence Profiles.
 */

'use client';

interface FormTrendChartProps {
  form: ('W' | 'D' | 'L')[];
  className?: string;
}

export default function FormTrendChart({ form, className = '' }: FormTrendChartProps) {
  if (!form || form.length === 0) {
    return null;
  }

  // Convert form to points: W=3, D=1, L=0
  const points: number[] = form.map(result => {
    if (result === 'W') return 3;
    if (result === 'D') return 1;
    return 0;
  });

  // Calculate running averages for trend line
  const runningAvg = points.map((_, i) => {
    const slice = points.slice(0, i + 1);
    return slice.reduce((a: number, b: number) => a + b, 0) / slice.length;
  });

  // Calculate chart dimensions
  const width = 100;
  const height = 40;
  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Create SVG path for trend line
  const createPath = (values: number[], maxVal: number) => {
    const xStep = chartWidth / (values.length - 1 || 1);
    
    return values.map((val, i) => {
      const x = padding + i * xStep;
      const y = padding + chartHeight - (val / maxVal) * chartHeight;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
  };

  const linePath = createPath(runningAvg, 3);

  // Calculate total points and form rating
  const totalPoints = points.reduce((a, b) => a + b, 0);
  const maxPossible = form.length * 3;
  const formRating = Math.round((totalPoints / maxPossible) * 100);

  // Determine form quality
  const getFormQuality = () => {
    if (formRating >= 70) return { label: 'Excellent', color: 'text-green-400' };
    if (formRating >= 50) return { label: 'Good', color: 'text-accent' };
    if (formRating >= 35) return { label: 'Average', color: 'text-yellow-400' };
    return { label: 'Poor', color: 'text-red-400' };
  };

  const quality = getFormQuality();

  return (
    <div className={`bg-bg rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted uppercase tracking-wide">Form Trend</span>
        <span className={`text-sm font-medium ${quality.color}`}>{quality.label}</span>
      </div>

      {/* Form Results Display */}
      <div className="flex gap-1 mb-3">
        {form.map((result, i) => (
          <div
            key={i}
            className={`
              w-6 h-6 rounded flex items-center justify-center text-xs font-bold
              ${result === 'W' ? 'bg-green-500/20 text-green-400' : ''}
              ${result === 'D' ? 'bg-yellow-500/20 text-yellow-400' : ''}
              ${result === 'L' ? 'bg-red-500/20 text-red-400' : ''}
            `}
          >
            {result}
          </div>
        ))}
      </div>

      {/* SVG Trend Chart */}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-10"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <line 
          x1={padding} y1={padding} 
          x2={width - padding} y2={padding} 
          stroke="currentColor" 
          strokeOpacity={0.1}
          className="text-white"
        />
        <line 
          x1={padding} y1={height / 2} 
          x2={width - padding} y2={height / 2} 
          stroke="currentColor" 
          strokeOpacity={0.1}
          className="text-white"
        />
        <line 
          x1={padding} y1={height - padding} 
          x2={width - padding} y2={height - padding} 
          stroke="currentColor" 
          strokeOpacity={0.1}
          className="text-white"
        />

        {/* Trend line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Data points */}
        {runningAvg.map((val, i) => {
          const xStep = chartWidth / (runningAvg.length - 1 || 1);
          const x = padding + i * xStep;
          const y = padding + chartHeight - (val / 3) * chartHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={2}
              className={`
                ${form[i] === 'W' ? 'fill-green-400' : ''}
                ${form[i] === 'D' ? 'fill-yellow-400' : ''}
                ${form[i] === 'L' ? 'fill-red-400' : ''}
              `}
            />
          );
        })}
      </svg>

      {/* Stats Row */}
      <div className="flex justify-between text-xs mt-2">
        <span className="text-text-muted">
          {points.filter(p => p === 3).length}W {points.filter(p => p === 1).length}D {points.filter(p => p === 0).length}L
        </span>
        <span className="text-text-secondary">
          {totalPoints}/{maxPossible} pts ({formRating}%)
        </span>
      </div>
    </div>
  );
}
