/**
 * Landing Page - Home (/)
 * 
 * Main page of the SportBot AI application.
 * Contains all sections for presenting the platform.
 */

import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import WhyNotTipster from '@/components/WhyNotTipster';
import Features from '@/components/Features';
import PricingTeaser from '@/components/PricingTeaser';
import ResponsibleGamblingBlock from '@/components/ResponsibleGamblingBlock';

export default function HomePage() {
  return (
    <>
      {/* Hero section - main visual component */}
      <Hero />

      {/* How it works - 3 steps */}
      <HowItWorks />

      {/* Why we're not a tipster - IMPORTANT positioning section */}
      <WhyNotTipster />

      {/* Main features */}
      <Features />

      {/* Pricing teaser */}
      <PricingTeaser />

      {/* Responsible gambling - MANDATORY */}
      <ResponsibleGamblingBlock />
    </>
  );
}
