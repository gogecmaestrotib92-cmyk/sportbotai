/**
 * Contact Page - SportBot AI
 * 
 * Contact form with email submission
 */

import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with SportBot AI. Questions, feedback, or partnership inquiries - we\'d love to hear from you.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-bg py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Contact Us
          </h1>
          <p className="text-text-secondary text-lg">
            Have a question, feedback, or business inquiry? We&apos;d love to hear from you.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Email Card */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-text-primary font-semibold mb-2">Email Us</h3>
            <a 
              href={`mailto:${SITE_CONFIG.email}`}
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {SITE_CONFIG.email}
            </a>
          </div>

          {/* Response Time Card */}
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-text-primary font-semibold mb-2">Response Time</h3>
            <p className="text-text-secondary text-sm">
              We typically respond within 24-48 hours
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-6">
            Send us a message
          </h2>
          <ContactForm />
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-8">
          <p className="text-text-muted text-sm">
            Looking for quick answers? Check our{' '}
            <a href="/terms" className="text-accent hover:text-accent-hover transition-colors">
              Terms of Service
            </a>
            {' '}or{' '}
            <a href="/privacy" className="text-accent hover:text-accent-hover transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
