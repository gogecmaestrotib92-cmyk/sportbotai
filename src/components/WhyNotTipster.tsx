/**
 * Why BetSense AI section
 * 
 * Cleaner, more subtle positioning of BetSense AI
 * as an educational tool, not a tipster service.
 */

export default function WhyNotTipster() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Analysis',
      description: 'Advanced algorithms process odds, form, and statistics to generate probability estimates.',
      color: 'primary',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Value & Risk Transparency',
      description: 'Clear visualization of value opportunities and risk levels—no hidden information.',
      color: 'accent',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Responsible Approach',
      description: 'Every analysis includes risk warnings and promotes responsible decision-making.',
      color: 'warning',
    },
  ];

  return (
    <section className="bg-bg-primary text-white section-container">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Why SportBot AI</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Analysis, not tips
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We provide data-driven insights to help you understand the numbers. 
            No guarantees, no &quot;sure things&quot;—just transparent analysis.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="bg-bg-card border border-divider rounded-card p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className={`w-12 h-12 bg-${feature.color}/10 rounded-xl flex items-center justify-center mb-4 text-${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* What We Are / Are Not - Compact Version */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-success/5 border border-success/20 rounded-card p-5">
            <h4 className="text-success font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              What we are
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full" />
                AI-based analytical tool
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full" />
                Educational resource for understanding odds
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full" />
                Transparent about limitations
              </li>
            </ul>
          </div>

          <div className="bg-danger/5 border border-danger/20 rounded-card p-5">
            <h4 className="text-danger font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              What we are not
            </h4>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                Tipster service with &quot;sure tips&quot;
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                Source of insider information
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-danger rounded-full" />
                Guarantee of winnings
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
