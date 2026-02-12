/**
 * Privacy Policy Page (/privacy)
 * 
 * Privacy policy for the SportBot AI platform.
 */

import { Metadata } from 'next';
import { META } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.privacy.title,
  description: META.privacy.description,
  openGraph: {
    title: META.privacy.title,
    description: META.privacy.description,
    url: '/privacy',
    type: 'website',
  },
  alternates: {
    canonical: '/privacy',
    languages: {
      'en': '/privacy',
      'sr': '/sr/privacy',
      'x-default': '/privacy',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-gray-400 mt-2">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              SportBot AI (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) respects the privacy of its users. 
              This Privacy Policy explains how we collect, use, store 
              and protect your data when you use our platform.
            </p>
            <p className="text-text-secondary leading-relaxed">
              By using SportBot AI, you consent to the collection and use of information 
              in accordance with this policy.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Data We Collect</h2>
            
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.1 Data you provide directly:</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Email address (upon registration)</li>
              <li>Payment data (processed by Stripe, we do not store card data)</li>
              <li>Data you enter in the analyzer (sports, teams, odds)</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">2.2 Automatically collected data:</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>IP address</li>
              <li>Browser and operating system type</li>
              <li>Pages you visit and time spent on them</li>
              <li>Cookies for site functionality</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Data</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We use your data to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Provide and maintain the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service notifications (changes, maintenance)</li>
              <li>Improve user experience and performance</li>
              <li>Usage analytics (anonymized)</li>
              <li>Abuse prevention and security purposes</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Data Sharing</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              <strong className="text-white">We do not sell your personal data to third parties.</strong>
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              We only share data with:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li><strong className="text-white">Stripe:</strong> for payment processing (see Stripe&apos;s privacy policy)</li>
              <li><strong className="text-white">Hosting providers:</strong> Vercel for application hosting</li>
              <li><strong className="text-white">AI providers:</strong> OpenAI/Anthropic for processing analyses (data is anonymized)</li>
              <li><strong className="text-white">Legal requirements:</strong> when legally required</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Cookies</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We use the following types of cookies:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li><strong className="text-white">Necessary:</strong> for site functionality and authentication</li>
              <li><strong className="text-white">Analytical:</strong> to understand how you use the site</li>
              <li><strong className="text-white">Functional:</strong> to remember your preferences</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              You can control cookies through your browser settings.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Data Security</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We implement industry standards for data protection:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>HTTPS encryption for all communications</li>
              <li>Password hashing (we never store plain-text)</li>
              <li>Regular security patch updates</li>
              <li>Limited data access to authorized personnel only</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Your Rights</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Request a copy of your data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for marketing communications</li>
              <li>Transfer your data to another service</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              To exercise these rights, contact us at contact@sportbotai.com
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Data Retention</h2>
            <p className="text-text-secondary leading-relaxed">
              We retain your data for as long as you have an active account. After account deletion, 
              data will be removed within 30 days, except for data we are legally 
              required to keep (e.g., transaction data for tax purposes).
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">9. Minors</h2>
            <p className="text-text-secondary leading-relaxed">
              SportBot AI is not intended for persons under 18 years of age. We do not knowingly 
              collect data from minors. If you learn that a minor has used 
              our service, please contact us.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">10. Policy Changes</h2>
            <p className="text-text-secondary leading-relaxed">
              We may occasionally update this Privacy Policy. We will notify you of significant changes 
              via email or notification on the platform. Continued 
              use of the Service after changes constitutes acceptance of the new policy.
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">11. Contact</h2>
            <p className="text-text-secondary leading-relaxed">
              For any questions regarding privacy, contact us at:
              <br />
              <strong className="text-white">Email:</strong> contact@sportbotai.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
