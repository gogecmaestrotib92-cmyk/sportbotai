/**
 * Root Layout for SportBot AI application
 * 
 * Main layout with comprehensive SEO metadata
 */

import type { Metadata, Viewport } from 'next';
import { Inter, Share_Tech_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import HeaderI18n from '@/components/HeaderI18n';
import FooterI18n from '@/components/FooterI18n';
import MobileBottomNavI18n from '@/components/MobileBottomNavI18n';
import MobileQuickActions from '@/components/MobileQuickActions';
import NavigationProgress from '@/components/NavigationProgress';
import { AuthProvider } from '@/components/auth';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { ToastProvider, ScrollToTop } from '@/components/ui';
import { KeyboardShortcutsProvider } from '@/components/CommandPalette';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import UTMTracker from '@/components/UTMTracker';
import ReferralSync from '@/components/ReferralSync';
import ActivityTracker from '@/components/ActivityTracker';
import { SITE_CONFIG, META, OG_DEFAULTS, getOrganizationSchema, getWebsiteSchema } from '@/lib/seo';
import GoogleAnalytics from '@/components/GoogleAnalytics';
// NOTE: Microsoft Clarity removed Jan 21, 2026 - redundant with GA + Semrush + Ahrefs
import CookieConsent from '@/components/CookieConsent';

// Inter font with display swap for better performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

// Share Tech Mono for Matrix-style analytical labels
const shareTechMono = Share_Tech_Mono({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-matrix',
});

// Viewport configuration
export const viewport: Viewport = {
  themeColor: SITE_CONFIG.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

// Comprehensive SEO metadata
export const metadata: Metadata = {
  // Basic Meta
  title: {
    default: META.home.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: META.home.description,
  keywords: META.home.keywords,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,

  // Favicon & Icons - comprehensive for all platforms
  // IMPORTANT: Google requires ICO/PNG (not SVG) for search result favicons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },

  // PWA Manifest
  manifest: '/manifest.json',

  // Apple iOS PWA specific - critical for native-like experience
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SportBot AI',
    startupImage: [
      // iPhone 14 Pro Max
      { url: '/splashscreens/apple-splash-1290-2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14 Pro
      { url: '/splashscreens/apple-splash-1179-2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 13/14
      { url: '/splashscreens/apple-splash-1170-2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 12 Mini
      { url: '/splashscreens/apple-splash-1080-2340.png', media: '(device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone SE
      { url: '/splashscreens/apple-splash-750-1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
  // Modern mobile-web-app-capable (non-Apple)
  other: {
    'mobile-web-app-capable': 'yes',
    // Android Chrome - prevent zoom issues
    'format-detection': 'telephone=no',
    // Improve PWA add experience
    'msapplication-TileColor': '#050607',
    'msapplication-tap-highlight': 'no',
  },

  // Canonical & Base
  metadataBase: new URL(SITE_CONFIG.url),
  // NOTE: Do NOT set alternates.canonical here - it will be inherited by all pages
  // Each page should set its own canonical URL

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: META.home.title,
    description: META.home.description,
    images: OG_DEFAULTS.images,
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: META.home.title,
    description: META.home.description,
    images: OG_DEFAULTS.images,
    // creator: '@sportbotai', // Uncomment when Twitter exists
  },

  // App specific
  applicationName: SITE_CONFIG.name,
  category: 'Sports Analytics',

  // Verification (add when ready)
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect locale from URL path
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  const locale = pathname.startsWith('/sr') ? 'sr' : 'en';

  // Structured data for SEO
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  return (
    <html lang={locale}>
      <head>
        {/* Critical inline CSS - fallback for slow networks/JS failures */}
        <style dangerouslySetInnerHTML={{
          __html: `
          html{background:#0D0D12;color:#fff;font-family:system-ui,-apple-system,sans-serif}
          body{margin:0;min-height:100vh}
          a{color:#8B5CF6}
          .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}
        `}} />

        {/* NOTE: GTM, GA, Clarity, and Ahrefs moved to body for better LCP */}
        {/* They load via next/script with afterInteractive/lazyOnload strategies */}

        {/* DNS Prefetch & Preconnect for Logo CDNs - faster image loading */}
        <link rel="dns-prefetch" href="//a.espncdn.com" />
        <link rel="dns-prefetch" href="//media.api-sports.io" />
        <link rel="dns-prefetch" href="//crests.football-data.org" />
        <link rel="dns-prefetch" href="//media-cdn.cortextech.io" />
        <link rel="dns-prefetch" href="//media-cdn.incrowdsports.com" />
        <link rel="dns-prefetch" href="//upload.wikimedia.org" />
        <link rel="dns-prefetch" href="//flagcdn.com" />
        {/* Preconnect to top 4 origins for LCP improvement */}
        <link rel="preconnect" href="https://a.espncdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://media.api-sports.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://crests.football-data.org" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://flagcdn.com" crossOrigin="anonymous" />
        {/* LCP optimization: Preconnect to ProductHunt API for footer badge */}
        <link rel="preconnect" href="https://api.producthunt.com" crossOrigin="anonymous" />

        {/* AI/LLM Discovery Links */}
        <link rel="llms" href="/llms.txt" />
        <link rel="llms-full" href="/llms-full.txt" />
        <link rel="humans" href="/humans.txt" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${inter.className} ${shareTechMono.variable}`}>
        {/* Google Tag Manager (noscript) - must be right after body opening */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NL4HRCX3"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        {/* Fallback for users with JavaScript disabled */}
        <noscript>
          <div style={{ background: '#1a1a2e', color: '#fff', padding: '20px', textAlign: 'center', borderBottom: '1px solid #333' }}>
            <strong>JavaScript Required</strong> - Please enable JavaScript for the best experience on SportBot AI.
          </div>
        </noscript>

        <AuthProvider>
          <FavoritesProvider>
            <ToastProvider>
              <KeyboardShortcutsProvider>
                {/* Navigation Progress Bar */}
                <Suspense fallback={null}>
                  <NavigationProgress />
                </Suspense>

                {/* Skip to content link for accessibility */}
                <a href="#main-content" className="skip-link">
                  Skip to content
                </a>

                {/* Flex container for sticky footer */}
                <div className="min-h-screen flex flex-col pb-16 md:pb-0 pt-16">
                  <HeaderI18n />

                  {/* Main content */}
                  <main id="main-content" className="flex-grow" role="main">
                    {children}
                  </main>

                  <FooterI18n />
                </div>

                {/* Mobile Bottom Navigation */}
                <MobileBottomNavI18n />

                {/* Mobile Quick Actions FAB */}
                <MobileQuickActions />

                {/* Scroll to Top Button */}
                <ScrollToTop />

                {/* === DEFERRED ANALYTICS SCRIPTS (Core Web Vitals Optimization) === */}
                {/* GTM - afterInteractive: loads after hydration, before user interaction */}
                <Script
                  id="gtm-script"
                  strategy="afterInteractive"
                  dangerouslySetInnerHTML={{
                    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','GTM-NL4HRCX3');`
                  }}
                />

                {/* Google Analytics - afterInteractive */}
                <GoogleAnalytics />

                {/* NOTE: Microsoft Clarity removed - redundant with GA + Semrush + Ahrefs */}

                {/* Ahrefs - lazyOnload: lowest priority, loads after everything else */}
                <Script
                  id="ahrefs-analytics"
                  src="https://analytics.ahrefs.com/analytics.js"
                  data-key="P7J/OBKDmyZ1TF6GuRYQsQ"
                  strategy="lazyOnload"
                />

                {/* Cookie Consent Banner */}
                <CookieConsent />

                {/* UTM Attribution Tracker */}
                <Suspense fallback={null}>
                  <UTMTracker />
                </Suspense>

                {/* Sync referral source for OAuth users */}
                <ReferralSync />

                {/* Activity tracking for last active */}
                <ActivityTracker />

                {/* PWA Install Prompt */}
                <PWAInstallPrompt />

                {/* Service Worker Registration */}
                <ServiceWorkerRegistration />
              </KeyboardShortcutsProvider>
            </ToastProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
