/**
 * Loading state for /my-teams page
 * Shows skeleton while favorites load
 */

export default function MyTeamsLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-40 bg-bg-card rounded animate-pulse mb-2" />
            <div className="h-5 w-32 bg-bg-card rounded animate-pulse" />
          </div>
          <div className="h-16 w-32 bg-bg-card rounded-xl animate-pulse" />
        </div>

        {/* Saved teams skeleton */}
        <div className="bg-bg-card rounded-2xl border border-divider mb-8">
          <div className="p-4 border-b border-divider">
            <div className="h-5 w-28 bg-bg rounded animate-pulse" />
          </div>
          <div className="divide-y divide-divider">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 bg-bg rounded-lg animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 w-40 bg-bg rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-bg rounded animate-pulse" />
                </div>
                <div className="w-8 h-8 bg-bg rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming matches skeleton */}
        <div className="bg-bg-card rounded-2xl border border-divider">
          <div className="p-4 border-b border-divider">
            <div className="h-5 w-40 bg-bg rounded animate-pulse" />
          </div>
          <div className="divide-y divide-divider">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-bg rounded animate-pulse" />
                  <span className="text-text-muted text-xs">vs</span>
                  <div className="w-8 h-8 bg-bg rounded animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="h-5 w-48 bg-bg rounded animate-pulse mb-1" />
                  <div className="h-4 w-32 bg-bg rounded animate-pulse" />
                </div>
                <div className="h-7 w-20 bg-accent/10 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
