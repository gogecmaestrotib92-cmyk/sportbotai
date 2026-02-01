/**
 * Scrape emails from tool websites
 * 
 * This script visits each tool's website and tries to find contact emails
 * by checking common pages like /contact, /about, footer, etc.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common pages to check for contact info
const PAGES_TO_CHECK = [
  '',           // homepage
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/support',
  '/help',
  '/team',
];

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Emails to ignore (generic/spam traps)
const IGNORE_EMAILS = [
  'example.com',
  'test.com',
  'email.com',
  'yourdomain',
  'domain.com',
  'company.com',
  'sentry.io',
  'wixpress.com',
  'schema.org',
  'w3.org',
  'googleapis.com',
  'googletagmanager.com',
  'facebook.com',
  'twitter.com',
  'instagram.com',
  '.png',
  '.jpg',
  '.gif',
  '.svg',
  'support@apple.com',
  'android.com',
];

// Priority patterns (prefer these emails)
const PRIORITY_PATTERNS = [
  /^(hello|hi|contact|info|support|team|press|media|partnerships|business)@/i,
];

async function fetchPageContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) return null;
    
    const text = await response.text();
    return text;
  } catch (error) {
    return null;
  }
}

function extractEmails(html: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  
  // Filter out ignored emails
  const filtered = matches.filter(email => {
    const lower = email.toLowerCase();
    return !IGNORE_EMAILS.some(ignore => lower.includes(ignore));
  });
  
  // Remove duplicates
  const unique = [...new Set(filtered)];
  
  // Sort by priority (preferred emails first)
  return unique.sort((a, b) => {
    const aIsPriority = PRIORITY_PATTERNS.some(p => p.test(a));
    const bIsPriority = PRIORITY_PATTERNS.some(p => p.test(b));
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return 0;
  });
}

function normalizeUrl(url: string): string {
  // Remove trailing slash
  let normalized = url.replace(/\/$/, '');
  // Ensure https
  if (!normalized.startsWith('http')) {
    normalized = 'https://' + normalized;
  }
  return normalized;
}

async function findEmailForTool(toolName: string, toolUrl: string): Promise<string | null> {
  const baseUrl = normalizeUrl(toolUrl);
  console.log(`  Checking ${toolName} (${baseUrl})...`);
  
  const allEmails: string[] = [];
  
  for (const page of PAGES_TO_CHECK) {
    const url = page ? `${baseUrl}${page}` : baseUrl;
    const content = await fetchPageContent(url);
    
    if (content) {
      const emails = extractEmails(content);
      if (emails.length > 0) {
        console.log(`    Found ${emails.length} email(s) on ${page || '/'}: ${emails.slice(0, 3).join(', ')}`);
        allEmails.push(...emails);
      }
    }
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Get unique emails sorted by priority
  const uniqueEmails = [...new Set(allEmails)].sort((a, b) => {
    const aIsPriority = PRIORITY_PATTERNS.some(p => p.test(a));
    const bIsPriority = PRIORITY_PATTERNS.some(p => p.test(b));
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    return 0;
  });
  
  if (uniqueEmails.length > 0) {
    console.log(`  ✅ Best email: ${uniqueEmails[0]}`);
    return uniqueEmails[0];
  }
  
  console.log(`  ❌ No email found`);
  return null;
}

async function main() {
  console.log('🔍 Scraping emails for tools without contact info...\n');
  
  // Get all PUBLISHED tools without email
  const tools = await prisma.toolReview.findMany({
    where: { 
      outreachStatus: 'NO_EMAIL',
      reviewStatus: 'PUBLISHED'
    },
    select: { id: true, toolName: true, toolUrl: true },
    orderBy: { toolName: 'asc' }
  });
  
  console.log(`Found ${tools.length} PUBLISHED tools without email\n`);
  
  let found = 0;
  let notFound = 0;
  
  for (const tool of tools) {
    const email = await findEmailForTool(tool.toolName, tool.toolUrl);
    
    if (email) {
      // Update the tool with found email
      await prisma.toolReview.update({
        where: { id: tool.id },
        data: { 
          contactEmail: email,
          emailSource: 'scraped_website',
          outreachStatus: 'NOT_SENT'  // Ready for outreach now
        }
      });
      found++;
    } else {
      notFound++;
    }
    
    console.log('');
  }
  
  console.log('='.repeat(50));
  console.log(`\n📊 Results:`);
  console.log(`  ✅ Found emails: ${found}`);
  console.log(`  ❌ No email found: ${notFound}`);
  console.log(`  📧 Ready for outreach: ${found}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
