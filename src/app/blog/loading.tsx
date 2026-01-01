/**
 * Loading state for /blog page
 * Shows skeleton grid while posts load
 */

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <div className="container mx-auto px-4 py-12">
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
