/**
 * Product Hunt Scraper for Sports Betting Tools
 * 
 * Scrapes Product Hunt for indie sports betting/analytics tools.
 * Much better quality than sportsbettingtools.io - actual indie devs who want backlinks.
 * 
 * Uses Puppeteer to bypass 403 blocks.
 */

import { prisma } from '@/lib/prisma';
import { extractWebsiteContent, findContactEmail } from './backlink-scout';
import puppeteer, { Browser } from 'puppeteer';

export interface ProductHuntTool {
  name: string;
  tagline: string;
  url: string;
  productHuntUrl: string;
  makerName?: string;
  makerTwitter?: string;
}

// Search queries for sports betting related products
const SEARCH_QUERIES = [
  'sports betting',
  'betting analytics', 
  'odds comparison',
  'sports analytics',
  'betting tracker',
  'sports predictions',
];

// Big brands to skip - they won't link back
const SKIP_BRANDS = [
  'draftkings', 'fanduel', 'betmgm', 'caesars', 'bet365',
  'pointsbet', 'barstool', 'espnbet', 'fanatics', 'betrivers',
  'bovada', 'betfair', 'william hill', 'unibet', 'paddy power',
];

/**
 * Fetch Product Hunt search results using Puppeteer
 */
async function fetchProductHuntSearch(query: string, browser: Browser): Promise<ProductHuntTool[]> {
  const tools: ProductHuntTool[] = [];
  const page = await browser.newPage();
  
  try {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    const searchUrl = `https://www.producthunt.com/search?q=${encodeURIComponent(query)}`;
    console.log(`[ProductHunt] Searching: ${query}`);
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for search results to load
    await page.waitForSelector('a[href^="/posts/"]', { timeout: 10000 }).catch(() => null);
    
    // Extract product data from search results
    const products = await page.evaluate(() => {
      const results: Array<{name: string; tagline: string; slug: string}> = [];
      
      // Find all product cards in search results
      const productLinks = document.querySelectorAll('a[href^="/posts/"]');
      
      productLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.includes('?') || href.includes('#')) return;
        
        const slug = href.replace('/posts/', '');
        if (slug.length < 3) return;
        
        // Try to get name from the link text or nearby elements
        const name = link.textContent?.trim() || slug.replace(/-/g, ' ');
        
        // Find tagline nearby
        const parent = link.closest('div');
        const taglineEl = parent?.querySelector('p, span:not(:first-child)');
        const tagline = taglineEl?.textContent?.trim() || '';
        
        // Avoid duplicates
        if (!results.find(r => r.slug === slug)) {
          results.push({ name, tagline, slug });
        }
      });
      
      return results.slice(0, 15);
    });
    
    console.log(`[ProductHunt] Found ${products.length} products for "${query}"`);
    
    // Visit each product page to get website URL
    for (const product of products) {
      try {
        const productUrl = `https://www.producthunt.com/posts/${product.slug}`;
        await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 20000 });
        
        // Extract website URL from the page
        const websiteUrl = await page.evaluate(() => {
          // Look for "Visit" or "Get it" button
          const visitBtn = document.querySelector('a[href*="://"][target="_blank"]');
          if (visitBtn) {
            const href = visitBtn.getAttribute('href');
            // Filter out social links
            if (href && !href.includes('twitter.com') && !href.includes('facebook.com') && 
                !href.includes('linkedin.com') && !href.includes('producthunt.com')) {
              return href;
            }
          }
          
          // Try data attributes
          const getItBtn = document.querySelector('[data-test="get-it-button"]');
          if (getItBtn) {
            return getItBtn.getAttribute('href');
          }
          
          return null;
        });
        
        if (!websiteUrl || websiteUrl.includes('producthunt.com')) {
          continue;
        }
        
        // Skip big brands
        const nameLower = product.name.toLowerCase();
        if (SKIP_BRANDS.some(brand => nameLower.includes(brand))) {
          console.log(`[ProductHunt] Skipping big brand: ${product.name}`);
          continue;
        }
        
        tools.push({
          name: product.name,
          tagline: product.tagline,
          url: websiteUrl,
          productHuntUrl: productUrl,
        });
        
        console.log(`[ProductHunt] Found: ${product.name} -> ${websiteUrl}`);
        
        await new Promise(r => setTimeout(r, 500));
        
      } catch (err) {
        // Skip individual errors
      }
    }
    
  } catch (error) {
    console.error(`[ProductHunt] Error searching "${query}":`, error);
  } finally {
    await page.close();
  }
  
  return tools;
}

/**
 * Discover and save new tools from Product Hunt
 */
export async function discoverFromProductHunt(maxNew: number = 10): Promise<{
  searched: number;
  found: number;
  new: number;
}> {
  const result = { searched: 0, found: 0, new: 0 };
  const allTools: ProductHuntTool[] = [];
  
  console.log('[ProductHunt] Starting discovery with Puppeteer...\n');
  
  // Launch browser
  let browser: Browser | null = null;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Search each query
    for (const query of SEARCH_QUERIES) {
      result.searched++;
      const tools = await fetchProductHuntSearch(query, browser);
      allTools.push(...tools);
      
      // Delay between searches
      await new Promise(r => setTimeout(r, 2000));
    }
    
  } finally {
    if (browser) await browser.close();
  }
  
  // Dedupe by URL
  const uniqueTools = new Map<string, ProductHuntTool>();
  for (const tool of allTools) {
    const normalizedUrl = tool.url.replace(/\/$/, '').toLowerCase();
    if (!uniqueTools.has(normalizedUrl)) {
      uniqueTools.set(normalizedUrl, tool);
    }
  }
  
  result.found = uniqueTools.size;
  console.log(`\n[ProductHunt] Found ${result.found} unique tools across all searches`);
  
  // Check which are already in DB
  const existingUrls = await prisma.toolReview.findMany({
    select: { toolUrl: true },
  });
  const existingSet = new Set(existingUrls.map(e => e.toolUrl.replace(/\/$/, '').toLowerCase()));
  
  const newTools = Array.from(uniqueTools.values())
    .filter(t => !existingSet.has(t.url.replace(/\/$/, '').toLowerCase()));
  
  console.log(`[ProductHunt] ${newTools.length} are new (not in DB)`);
  
  // Process up to maxNew
  const toProcess = newTools.slice(0, maxNew);
  
  for (const tool of toProcess) {
    try {
      console.log(`\n[ProductHunt] Processing: ${tool.name}`);
      console.log(`   URL: ${tool.url}`);
      
      // Extract content
      const { content, wordCount } = await extractWebsiteContent(tool.url);
      console.log(`   Content: ${wordCount} words`);
      
      // Find contact email
      const { email, source: emailSource } = await findContactEmail(tool.url);
      console.log(`   Email: ${email || 'not found'} (${emailSource})`);
      
      // Save to database
      await prisma.toolReview.create({
        data: {
          toolName: tool.name,
          toolUrl: tool.url,
          toolDescription: tool.tagline,
          sourceUrl: tool.productHuntUrl,
          scrapedFrom: 'producthunt',
          contentExtracted: content,
          contentWords: wordCount,
          contactEmail: email,
          emailSource: emailSource,
          reviewStatus: 'PENDING',
          outreachStatus: email ? 'NOT_SENT' : 'NO_EMAIL',
        },
      });
      
      result.new++;
      console.log(`   ✅ Saved!`);
      
      // Delay between processing
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.error(`[ProductHunt] Failed to process ${tool.name}:`, error);
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`[ProductHunt] Discovery complete!`);
  console.log(`   Queries searched: ${result.searched}`);
  console.log(`   Tools found:      ${result.found}`);
  console.log(`   NEW tools added:  ${result.new}`);
  
  return result;
}

/**
 * Get stats on Product Hunt sourced tools
 */
export async function getProductHuntStats(): Promise<{
  total: number;
  withEmail: number;
  withReview: number;
  outreachSent: number;
}> {
  const total = await prisma.toolReview.count({
    where: { scrapedFrom: 'producthunt' },
  });
  
  const withEmail = await prisma.toolReview.count({
    where: { scrapedFrom: 'producthunt', contactEmail: { not: null } },
  });
  
  const withReview = await prisma.toolReview.count({
    where: { scrapedFrom: 'producthunt', blogPostId: { not: null } },
  });
  
  const outreachSent = await prisma.toolReview.count({
    where: { scrapedFrom: 'producthunt', outreachStatus: 'SENT' },
  });
  
  return { total, withEmail, withReview, outreachSent };
}
