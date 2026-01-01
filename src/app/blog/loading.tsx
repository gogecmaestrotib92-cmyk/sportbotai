/**
 * Loading state for /blog page
 * Shows skeleton grid while posts load
 */

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 relative">
      {/* Glass morphism overlay with newspaper texture */}
      <div 
        className="absolute inset-0 bg-white/40 backdrop-blur-3xl"
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.15'/%3E%3C/svg%3E"),
            radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 3px 3px'
        }}
      />
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="h-10 w-32 bg-slate-800 rounded animate-pulse mx-auto mb-4" />
          <div className="h-6 w-64 bg-slate-800 rounded animate-pulse mx-auto" />
        </div>

        {/* Categories skeleton */}
        <div className="flex gap-3 justify-center mb-8 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-28 bg-slate-800 rounded-full animate-pulse" />
          ))}
        </div>

        {/* Posts grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((card) => (
            <div
              key={card}
              className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700"
            >
              {/* Image skeleton */}
              <div className="aspect-video bg-slate-700 animate-pulse" />
              {/* Content skeleton */}
              <div className="p-4 space-y-3">
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
                <div className="h-6 w-full bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
