/**
 * How It Works section
 * 
 * Clean 4-step process with modern icons.
 */

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Choose Sport & Match',
      description: 'Select from 17+ sports including Soccer, NBA, NFL, Tennis, and more.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Fetch Live Odds',
      description: 'We pull real-time odds from major bookmakers automatically.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'AI Computes Analysis',
      description: 'Our AI calculates probabilities, detects value, and assesses risk.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      number: '04',
      title: 'Review Insights',
      description: 'Get detailed analysis with risk breakdown—no betting tips, just data.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="bg-bg-primary section-container">
      <div className="text-center mb-14">
        <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Four simple steps to smarter analysis
        </h2>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          From match selection to AI-powered insights in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={step.number} className="relative group">
            {/* Connector Line (desktop) */}
            {index < steps.length - 1 && (
              <div className="hidden lg:block absolute top-10 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-[2px] bg-gradient-to-r from-primary/50 to-accent/50" />
            )}
            
            <div className="relative bg-bg-card rounded-card p-6 border border-divider hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300 h-full">
              {/* Step Number */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:text-bg-primary transition-colors">
                  {step.icon}
                </div>
                <span className="text-4xl font-bold text-bg-elevated group-hover:text-primary/20 transition-colors">
                  {step.number}
                </span>
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
