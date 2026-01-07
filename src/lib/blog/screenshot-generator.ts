/**
 * Screenshot Generator for Tool Reviews
 * 
 * Uses Screenshotone API to capture clean screenshots of websites
 * with automatic cookie banner and popup blocking.
 */

import { put } from '@vercel/blob';

interface ScreenshotResult {
  url: string;
  width: number;
  height: number;
}

/**
 * Capture a screenshot using Screenshotone API
 * Automatically blocks cookie banners, popups, ads, and chat widgets
 */
export async function captureWebsiteScreenshot(
  websiteUrl: string,
  toolName: string
): Promise<ScreenshotResult> {
  const apiKey = process.env.SCREENSHOTONE_API_KEY;
  
  if (!apiKey) {
    throw new Error('SCREENSHOTONE_API_KEY is not configured');
  }
  
  console.log(`[Screenshot] Capturing ${websiteUrl} via Screenshotone...`);
  
  // Build Screenshotone API URL
  // Common selectors for cookie/consent popups to hide
  const hideSelectors = [
    '[class*="cookie"]',
    '[class*="consent"]',
    '[class*="gdpr"]',
    '[class*="privacy"]',
    '[id*="cookie"]',
    '[id*="consent"]',
    '[id*="gdpr"]',
    '[class*="onetrust"]',
    '[class*="CookieConsent"]',
    '[class*="cc-window"]',
    '[class*="cc-banner"]',
    '[class*="cookie-banner"]',
    '[class*="cookie-notice"]',
    '[class*="cookie-policy"]',
    '[class*="accept-cookies"]',
    '[aria-label*="cookie"]',
    '[aria-label*="consent"]',
    '[data-testid*="cookie"]',
    '.osano-cm-dialog',
    '.qc-cmp2-container',
    '#truste-consent-track',
    '.evidon-banner',
  ].join(',');

  // CSS to inject that hides ALL fixed/sticky positioned elements at bottom of page
  // This catches cookie banners that use non-standard class names
  const customCSS = `
    /* Hide all fixed/sticky elements at bottom */
    [style*="position: fixed"][style*="bottom"],
    [style*="position:fixed"][style*="bottom"],
    div[class*="banner"]:not(header *):not(nav *),
    div[class*="popup"]:not(header *):not(nav *),
    div[class*="modal"]:not(header *):not(nav *),
    div[class*="overlay"]:not(header *):not(nav *),
    div[class*="notice"]:not(header *):not(nav *),
    div[role="dialog"],
    div[role="alertdialog"],
    div[aria-modal="true"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;

  const params = new URLSearchParams({
    access_key: apiKey,
    url: websiteUrl,
    format: 'png',
    viewport_width: '1920',
    viewport_height: '1080',
    block_cookie_banners: 'true',
    block_banners_by_heuristics: 'true',
    block_ads: 'true',
    block_chats: 'true',
    block_trackers: 'true',
    hide_selectors: hideSelectors,
    styles: customCSS,
    delay: '3', // Wait 3 seconds for page to settle and popups to appear
    timeout: '30',
  });
  
  const apiUrl = `https://api.screenshotone.com/take?${params.toString()}`;
  
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Screenshotone API error: ${response.status} - ${errorText}`);
  }
  
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  
  // Generate a clean filename
  const cleanName = toolName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const filename = `tool-screenshots/${cleanName}-${Date.now()}.png`;
  
  // Upload to Vercel Blob
  console.log('[Screenshot] Uploading to Vercel Blob...');
  const blob = await put(filename, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
  });
  
  console.log(`[Screenshot] ✅ Captured and uploaded: ${blob.url}`);
  
  return {
    url: blob.url,
    width: 1920,
    height: 1080,
  };
}

/**
 * Capture screenshot with fallback to generated image
 */
export async function captureScreenshotWithFallback(
  websiteUrl: string,
  toolName: string,
  fallbackImage = '/sports/football.jpg'
): Promise<string> {
  try {
    const result = await captureWebsiteScreenshot(websiteUrl, toolName);
    return result.url;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Screenshot] captureScreenshotWithFallback FAILED for ${toolName}: ${errorMsg}`);
    console.error(`[Screenshot] Full error:`, error);
    return fallbackImage;
  }
}
