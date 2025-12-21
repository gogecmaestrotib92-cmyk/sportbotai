/**
 * Root Layout for SportBot AI application
 * 
 * Main layout with comprehensive SEO metadata
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { AuthProvider } from '@/components/auth';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { ToastProvider } from '@/components/ui';
import { KeyboardShortcutsProvider } from '@/components/CommandPalette';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import UTMTracker from '@/components/UTMTracker';
import ReferralSync from '@/components/ReferralSync';
import ActivityTracker from '@/components/ActivityTracker';
import { SITE_CONFIG, META, OG_DEFAULTS, getOrganizationSchema, getWebsiteSchema } from '@/lib/seo';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import CookieConsent from '@/components/CookieConsent';

// Inter font with display swap for better performance
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

// Viewport configuration
export const viewport: Viewport = {
  themeColor: SITE_CONFIG.themeColor,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
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
  alternates: {
    canonical: '/',
  },
  
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured data for SEO
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <GoogleAnalytics />
        
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
      <body className={inter.className}>
        <AuthProvider>
          <FavoritesProvider>
            <ToastProvider>
              <KeyboardShortcutsProvider>
                {/* Skip to content link for accessibility */}
                <a href="#main-content" className="skip-link">
                  Skip to content
                </a>
                
                {/* Flex container for sticky footer */}
                <div className="min-h-screen flex flex-col pb-16 md:pb-0">
                  <Header />
                  
                  {/* Main content */}
                  <main id="main-content" className="flex-grow" role="main">
                    {children}
                  </main>
                  
                  <Footer />
                </div>
                
                {/* Mobile Bottom Navigation */}
                <MobileBottomNav />
                
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
              </KeyboardShortcutsProvider>
            </ToastProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
