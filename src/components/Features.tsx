/**
 * Features section
 * 
 * Premium features grid with sports analytics theme.
 */

export default function Features() {
  const features = [
    {
      title: '60-Second Briefings',
      description: 'Get the complete picture in under a minute. Listen to audio summaries while commuting.',
      icon: '🎙️',
      badge: 'Core Feature',
    },
    {
      title: 'Multi-Sport Coverage',
      description: 'Soccer, NBA, NFL, NHL, MMA/UFC—all in one platform with real-time data.',
      icon: '🌍',
      badge: '7 Sports',
    },
    {
      title: 'Team Intelligence',
      description: 'Deep team profiles with form trends, injury reports, and historical performance.',
      icon: '📊',
      badge: 'Pro',
    },
    {
      title: 'Value Detection',
      description: 'Compare AI probabilities with bookmaker odds to spot potential discrepancies.',
      icon: '⚡',
      badge: 'AI Powered',
    },
    {
      title: 'My Teams',
      description: 'Save your favorite teams and get instant updates when they play.',
      icon: '⭐',
      badge: 'Pro',
    },
    {
      title: 'Share Cards',
      description: 'Generate beautiful share cards for social media or copy insights with one click.',
      icon: '📤',
      badge: 'New',
    },
  ];

  return (
    <section className="bg-bg-card section-container">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Everything you need for smarter analysis
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Professional-grade analytics tools designed for informed decision-making.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <div 
            key={feature.title} 
            className="bg-bg-elevated rounded-card p-6 border border-divider hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{feature.icon}</span>
              <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                {feature.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-accent transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
