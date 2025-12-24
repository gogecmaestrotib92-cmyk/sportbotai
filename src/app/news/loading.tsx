/**
 * Loading state for /news page
 * Shows skeleton grid while news articles load
 */

export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header skeleton */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-32 bg-slate-800 rounded animate-pulse" />
            <div className="h-6 w-12 bg-red-500/20 rounded-full animate-pulse" />
          </div>
          <div className="h-6 w-80 bg-slate-800 rounded animate-pulse mx-auto" />
        </div>

        {/* Sport filters skeleton */}
        <div className="flex gap-3 justify-center mb-8 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-24 bg-slate-800 rounded-full animate-pulse" />
          ))}
        </div>

        {/* News grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((card) => (
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
                <div className="h-6 w-4/5 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
