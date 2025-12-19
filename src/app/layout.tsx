/**
 * Root Layout for SportBot AI application
 * 
 * Main layout with comprehensive SEO metadata
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { AuthProvider } from '@/components/auth';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { ToastProvider } from '@/components/ui';
import { KeyboardShortcutsProvider } from '@/components/CommandPalette';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
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
  
  // Favicon & Icons
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
  
  // PWA Manifest
  manifest: '/manifest.json',
  
  // PWA / Mobile App specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SportBot AI',
  },
  // Modern mobile-web-app-capable (non-Apple)
  other: {
    'mobile-web-app-capable': 'yes',
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
