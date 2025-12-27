/**
 * Features section
 * 
 * Premium features grid with sports analytics theme.
 * Includes scroll reveal animations.
 */

'use client';

import ScrollReveal from '@/components/ui/ScrollReveal';

export default function Features() {
  const features = [
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
      title: 'AI Sports Desk',
      description: 'Chat with our AI assistant about any match, team, or player. Get instant insights.',
      icon: '💬',
      badge: 'Chat',
    },
    {
      title: 'Market Alerts',
      description: 'Get notified when odds shift significantly or value edges appear.',
      icon: '🔔',
      badge: 'Premium',
    },
    {
      title: 'Analysis History',
      description: 'Access your past analyses anytime. Track your research and decisions.',
      icon: '📁',
      badge: 'Pro',
    },
  ];

  return (
    <section className="bg-bg-card section-container">
      <ScrollReveal animation="fade-up">
        <div className="text-center mb-14">
          <p className="text-blue-400 font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything you need for smarter analysis
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Professional-grade analytics tools designed for informed decision-making.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <ScrollReveal key={feature.title} animation="fade-up" delay={index * 80}>
            <div 
              className="bg-bg-elevated rounded-card p-6 border border-divider hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300 group h-full"
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
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
