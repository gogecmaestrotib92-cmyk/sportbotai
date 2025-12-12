/**
 * Terms & Conditions Page (/terms)
 * 
 * Legal terms of use for the SportBot AI platform.
 */

import { Metadata } from 'next';
import { META } from '@/lib/seo';

export const metadata: Metadata = {
  title: META.terms.title,
  description: META.terms.description,
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="bg-bg min-h-screen">
      {/* Header */}
      <section className="bg-bg-card border-b border-divider text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold">Terms & Conditions</h1>
          <p className="text-gray-400 mt-2">Last updated: December 2024</p>
        </div>
      </section>

      {/* Content */}
      <section className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              By using the SportBot AI platform ("Service"), you accept these Terms of Use in full. 
              If you do not agree with any part of these terms, you may not use our Service.
            </p>
            <p className="text-text-secondary leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the Service 
              after modifications constitutes acceptance of the new terms.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">2. Service Description</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              SportBot AI is an <strong className="text-white">analytical and educational tool</strong> that uses artificial 
              intelligence algorithms to analyze sports events. The Service provides:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-4">
              <li>Estimated probabilities for sports event outcomes</li>
              <li>Analytical comments and risk assessment</li>
              <li>Educational information about responsible gambling</li>
            </ul>
            <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-lg">
              <p className="text-warning font-semibold">
                IMPORTANT: SportBot AI is NOT a tipster service, does NOT provide guaranteed tips, 
                insider information or financial advice. All analyses are for informational purposes only.
              </p>
            </div>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">3. Disclaimer</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              The user expressly understands and accepts the following:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Sports betting carries an inherent risk of losing money</li>
              <li>No analysis can guarantee winnings</li>
              <li>Estimates are based on available data and have a margin of error</li>
              <li>The user is solely responsible for their betting decisions</li>
              <li>SportBot AI is not liable for any financial losses</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">4. Terms of Use</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Be located in a jurisdiction where online betting is legal</li>
              <li>Not use the Service for illegal activities</li>
              <li>Not attempt to manipulate or abuse the system</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">5. Subscriptions and Payment</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              For paid plans (Pro, Premium):
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Payment is processed through the Stripe payment system</li>
              <li>Subscriptions automatically renew monthly</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are not available for partially used periods</li>
              <li>Prices are in EUR and may change with prior notice</li>
            </ul>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">6. Intellectual Property</h2>
            <p className="text-text-secondary leading-relaxed">
              All content on the SportBot AI platform, including texts, graphics, logos, 
              algorithms and software, is the property of SportBot AI or our licensors. 
              Copying, distribution or modification without written permission is not allowed.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-text-secondary leading-relaxed">
              To the maximum extent permitted by law, SportBot AI and its owners, employees 
              and partners shall not be liable for any direct, indirect, incidental, 
              special or consequential damages arising from the use or inability to use 
              the Service.
            </p>
          </div>

          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">8. Governing Law</h2>
            <p className="text-text-secondary leading-relaxed">
              These Terms of Use are governed by and construed in accordance with the laws of the jurisdiction 
              in which SportBot AI is registered. Any disputes will be resolved before 
              the competent courts of that jurisdiction.
            </p>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">9. Contact</h2>
            <p className="text-text-secondary leading-relaxed">
              For any questions regarding these Terms of Use, contact us at:
              <br />
              <strong className="text-white">Email:</strong> contact@sportbotai.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
