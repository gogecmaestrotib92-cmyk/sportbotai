/**
 * Market Alerts Layout
 * 
 * Provides static metadata for the client-side Market Alerts page.
 * Client components cannot export metadata, so we use a layout wrapper.
 */

import { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

const pageTitle = 'Market Alerts | Real-Time Odds & Steam Moves | SportBot AI';
const pageDescription = 'Track real-time odds movements, detect sharp money steam moves, and find value edges with AI-powered market alerts. Premium feature for serious bettors.';
const pageUrl = `${SITE_CONFIG.url}/market-alerts`;

export const metadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    alternates: {
        canonical: pageUrl,
    },
    openGraph: {
        title: pageTitle,
        description: pageDescription,
        url: pageUrl,
        siteName: 'SportBot AI',
        type: 'website',
        locale: 'en_US',
        images: [{
            url: `${SITE_CONFIG.url}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'SportBot AI Market Alerts',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: [`${SITE_CONFIG.url}/og-image.png`],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function MarketAlertsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
