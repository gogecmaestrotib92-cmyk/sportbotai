/**
 * Loading state for /history page
 * Shows skeleton while prediction history loads
 */

export default function HistoryLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-bg-card rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-bg-card rounded animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-bg-card rounded-xl border border-divider p-4">
              <div className="h-4 w-20 bg-bg rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-bg rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Filter tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-bg-card rounded-full animate-pulse" />
          ))}
        </div>

        {/* Predictions list skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-bg-card rounded-xl border border-divider p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg rounded animate-pulse" />
                  <div>
                    <div className="h-5 w-40 bg-bg rounded animate-pulse mb-1" />
                    <div className="h-4 w-24 bg-bg rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-16 bg-bg rounded-lg animate-pulse" />
              </div>
              <div className="h-4 w-3/4 bg-bg rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
