/**
 * How It Works section
 * 
 * Clean 4-step process with modern icons.
 */

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Choose Your Match',
      description: 'Pick from trending matches or search any fixture across 7 major sports.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'AI Analyzes Everything',
      description: 'Live odds, team form, injuries, and head-to-head stats—processed in seconds.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Get Your 60s Briefing',
      description: 'Quick summary at the top—read or listen to understand the match instantly.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
        </svg>
      ),
    },
    {
      number: '04',
      title: 'Share or Save',
      description: 'Generate share cards for social, copy insights, or save teams to track.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
