/**
 * Loading state for /matches page
 * Shows skeleton while MatchBrowser loads
 */

export default function MatchesLoading() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-bg-card rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-72 bg-bg-card rounded animate-pulse" />
        </div>

        {/* Sport tabs skeleton */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-bg-card rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>

        {/* League sections skeleton */}
        {[1, 2].map((section) => (
          <div key={section} className="mb-8">
            <div className="h-6 w-40 bg-bg-card rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <div
                  key={card}
                  className="h-32 bg-bg-card rounded-xl border border-divider animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
