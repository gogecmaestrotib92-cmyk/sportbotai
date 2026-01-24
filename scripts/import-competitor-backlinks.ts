/**
 * Import Competitor Backlinks for Outreach
 * 
 * Takes competitor backlink data (from Ahrefs, SEMrush, etc.) and:
 * 1. Adds domains to ToolReview database
 * 2. Finds contact emails
 * 3. Prepares for outreach
 * 
 * Run: npx tsx scripts/import-competitor-backlinks.ts
 * 
 * Options:
 *   --file=<path>   Import from CSV file (domain,dr columns)
 *   --live          Actually save to database (default is dry run)
 *   --find-emails   Run email finder on imported domains
 *   --outreach      Send outreach emails after import
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { findContactEmail, extractWebsiteContent } from '../src/lib/backlink-scout';
import { sendEmail } from '../src/lib/email';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ============================================
// SPLIT INTO TWO CATEGORIES
// ============================================

// TOOLS - These are products/platforms you can REVIEW
// → Use existing tool review system: scripts/test-backlink-scout.ts
// → Write review, publish, email them about the review
const TOOLS_FOR_REVIEW = [
    // NEW: Competitor AI betting tools (Jan 2026 batch - keyword overlap analysis)
    { domain: 'playerprops.ai', dr: 50, note: 'AI player props analytics - 63 keyword overlap' },
    { domain: 'aipredictions.ai', dr: 35, note: 'AI sports predictions - 10 keyword overlap' },
    { domain: 'gambly.com', dr: 45, note: 'Betting analysis platform - 18 keyword overlap' },
    { domain: 'juicereel.com', dr: 40, note: 'Sports betting tool - competitor overlap' },
    // Betting/Analytics tools (can be genuinely reviewed)
    { domain: 'fantasypros.com', dr: 70, note: 'Fantasy sports analytics' },
    { domain: 'oddsshark.com', dr: 67, note: 'Odds comparison' },
    { domain: 'sportsgrid.com', dr: 62, note: 'Sports analytics/picks' },
    { domain: 'bettoredge.com', dr: 53, note: 'Betting platform' },
    { domain: 'bettingtools.com', dr: 39, note: 'Betting calculators' },
    { domain: 'pinnacleoddsdropper.com', dr: 33, note: 'Odds tracking' },
    { domain: 'sportsbookscout.com', dr: 25, note: 'Sportsbook comparison' },
    { domain: 'vettedsports.com', dr: 25, note: 'Sports analytics' },
    { domain: 'betsmart.co', dr: 21, note: 'Betting tips' },
    { domain: 'windailysports.com', dr: 30, note: 'DFS analytics' },
    // App/Software tools
    { domain: 'toolify.ai', dr: 73, note: 'AI tools directory' },
    { domain: 'foxdata.com', dr: 42, note: 'App analytics' },
    { domain: 'justuseapp.com', dr: 43, note: 'App reviews' },
    { domain: 'dubclub.win', dr: 57, note: 'Betting community platform' },
    { domain: 'growjo.com', dr: 65, note: 'Company data platform' },
    { domain: 'openvc.app', dr: 60, note: 'VC tool' },
    { domain: 'fundz.net', dr: 54, note: 'Funding database' },
    { domain: 'sellbery.com', dr: 56, note: 'E-commerce tool' },
];

// BLOGS/NEWS - These are content sites for GUEST POST outreach
// → Use this script with --outreach
// → Offer to write article for them, get backlink in author bio
const BLOGS_FOR_GUEST_POSTS = [
    // Sports blogs/news (high priority - relevant audience)
    { domain: 'yardbarker.com', dr: 74, note: 'Sports news/blog' },
    { domain: 'justbaseball.com', dr: 42, note: 'Baseball blog' },
    { domain: 'cubsinsider.com', dr: 39, note: 'Cubs fan blog' },
    { domain: 'steelernation.com', dr: 39, note: 'Steelers fan site' },
    { domain: 'draftcountdown.com', dr: 41, note: 'NFL draft blog' },
    { domain: 'hoopheadspod.com', dr: 28, note: 'Basketball podcast/blog' },
    // Gambling/betting news
    { domain: 'yogonet.com', dr: 73, note: 'Gambling industry news' },
    { domain: 'sbcamericas.com', dr: 68, note: 'Sports betting news' },
    { domain: 'casinoreports.com', dr: 52, note: 'Casino/gambling news' },
    { domain: 'gambling911.com', dr: 47, note: 'Gambling news' },
    { domain: 'socceragency.net', dr: 52, note: 'Soccer news' },
    // Tech/startup blogs
    { domain: 'thesiliconreview.com', dr: 73, note: 'Tech business magazine' },
    { domain: 'texasceomagazine.com', dr: 47, note: 'Business magazine' },
    { domain: 'grokipedia.com', dr: 72, note: 'AI/tech blog' },
    // General / Other
    { domain: 'pressrelease.com', dr: 46, note: 'PR distribution (submit news)' },
    { domain: 'babyboomer.org', dr: 39, note: 'Lifestyle blog' },
    { domain: 'nextcoastventures.com', dr: 39, note: 'VC blog' },
    // Directories/Profiles (simpler outreach - just ask to be added)
    { domain: 'growthzoneapp.com', dr: 78, note: 'Association management' },
    { domain: 'vocus.cc', dr: 77, note: 'Blog platform' },
    { domain: 'theorg.com', dr: 75, note: 'Org charts - add company' },
    { domain: 'hoo.be', dr: 75, note: 'Link in bio tool' },
    { domain: 'kingranks.com', dr: 56, note: 'Rankings site' },
    { domain: 'rikor.com', dr: 41, note: 'Business directory' },
    { domain: 'fancybox.qa', dr: 42, note: 'QA site' },
    // Non-English / Low priority
    { domain: 'bigumigu.com', dr: 62, note: 'Turkish creative blog' },
    { domain: 'i539.tw', dr: 50, note: 'Taiwan lottery site' },
    { domain: 'secda.info', dr: 44, note: 'Education site' },
    { domain: 'nowsecure.com', dr: 71, note: 'Mobile security (not relevant)' },
    { domain: 'searls.com', dr: 70, note: 'Personal blog' },
    { domain: 'runway.team', dr: 48, note: 'Startup tool' },
];

// Generate the guest post outreach email - sounds human, not salesy
function generateGuestPostEmail(domain: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
  <p>Hey!</p>
  
  <p>I was browsing ${domain} and thought your content was solid. Quick question – do you guys accept guest posts?</p>
  
  <p>I run a sports analytics site and write about how AI and data are changing the betting space. Figured your readers might find it interesting.</p>
  
  <p>I could write something like:</p>
  <ul style="color: #555;">
    <li>How sharp bettors actually use data (vs what most people think)</li>
    <li>The math behind finding value in odds</li>
    <li>Why most bettors lose – and the ones who don't</li>
  </ul>
  
  <p>If you're open to it, just let me know what topics work for you. I'll handle the writing, you just publish – and I'd just ask for a small author bio at the end.</p>
  
  <p>No worries if it's not your thing. Either way, keep up the good work!</p>
  
  <p>
    Cheers,<br>
    Stefan<br>
    <span style="color: #888; font-size: 14px;">SportBot AI – sportbotai.com</span>
  </p>
</body>
</html>
  `.trim();
}

async function findEmail(domain: string): Promise<string | null> {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    console.log(`  🔍 Finding email for ${domain}...`);

    try {
        const { email, source } = await findContactEmail(url);
        if (email) {
            console.log(`  ✅ Found: ${email} (${source})`);
            return email;
        } else {
            console.log(`  ❌ No email found`);
            return null;
        }
    } catch (err) {
        console.log(`  ❌ Error: ${err instanceof Error ? err.message : err}`);
        return null;
    }
}

async function importFromList(domains: typeof BLOGS_FOR_GUEST_POSTS, isLive: boolean, findEmails: boolean) {
    console.log(`\n📦 Importing ${domains.length} competitor backlinks (${isLive ? 'LIVE' : 'DRY RUN'})...\n`);

    let imported = 0;
    let skipped = 0;
    let emailsFound = 0;

    for (const { domain, dr } of domains) {
        const url = `https://${domain}`;
        console.log(`[${dr}DR] ${domain}`);

        // Check if already exists
        const existing = await prisma.toolReview.findFirst({
            where: { toolUrl: { contains: domain } }
        });

        if (existing) {
            console.log(`  ⏭️ Already in database`);
            skipped++;
            continue;
        }

        let email: string | null = null;
        if (findEmails) {
            email = await findEmail(domain);
            if (email) emailsFound++;
        }

        if (isLive) {
            await prisma.toolReview.create({
                data: {
                    toolName: domain.replace(/\.(com|net|org|io|co|app|ai)$/, '').replace(/[^a-z0-9]/gi, ' ').trim(),
                    toolUrl: url,
                    toolDescription: `Competitor backlink source (DR: ${dr})`,
                    scrapedFrom: 'competitor-backlink',
                    contactEmail: email,
                    outreachStatus: 'NOT_SENT',
                }
            });
            console.log(`  ✅ Imported`);
        } else {
            console.log(`  📝 Would import (dry run)`);
        }

        imported++;

        // Rate limiting
        if (findEmails) {
            await new Promise(r => setTimeout(r, 1500));
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Imported: ${imported}`);
    console.log(`⏭️ Skipped (existing): ${skipped}`);
    if (findEmails) console.log(`📧 Emails found: ${emailsFound}`);
}

// Extract DR from description like "Competitor backlink source (DR: 78)"
function extractDR(description: string | null): number {
    const match = description?.match(/DR:\s*(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

async function sendOutreach(isLive: boolean, limit: number = 10) {
    console.log(`\n📧 Sending guest post outreach (${isLive ? 'LIVE' : 'DRY RUN'}, limit ${limit})...\n`);

    // Tools to SKIP - these need tool reviews, not guest post emails
    const TOOL_DOMAINS = ['fantasypros', 'oddsshark', 'sportsgrid', 'bettoredge', 'bettingtools',
        'pinnacleoddsdropper', 'sportsbookscout', 'vettedsports', 'windailysports',
        'toolify', 'foxdata', 'justuseapp', 'dubclub', 'growjo', 'openvc', 'fundz', 'sellbery'];

    // Get competitor backlink entries with emails but not yet contacted
    const allTargets = await prisma.toolReview.findMany({
        where: {
            scrapedFrom: 'competitor-backlink',
            contactEmail: { not: null },
            outreachStatus: 'NOT_SENT',
        },
        orderBy: { createdAt: 'desc' },
    });

    // Filter out tools - they need tool reviews, not guest posts
    const targets = allTargets.filter(t => {
        const domain = new URL(t.toolUrl).hostname.replace('www.', '');
        const isTool = TOOL_DOMAINS.some(tool => domain.includes(tool));
        if (isTool) {
            console.log(`⏭️ Skipping TOOL: ${domain} (needs tool review, not guest post)`);
        }
        return !isTool;
    }).slice(0, limit);

    console.log(`\nFound ${targets.length} BLOGS ready for guest post outreach\n`);

    let sent = 0;
    let failed = 0;

    for (const target of targets) {
        const domain = new URL(target.toolUrl).hostname.replace('www.', '');
        const dr = extractDR(target.toolDescription);
        console.log(`[${dr}DR] ${domain} → ${target.contactEmail}`);

        const subject = `Guest post for ${domain}?`;  // Simple, human subject
        const html = generateGuestPostEmail(domain);

        if (isLive) {
            try {
                const success = await sendEmail({
                    to: target.contactEmail!,
                    subject,
                    html,
                });

                if (success) {
                    await prisma.toolReview.update({
                        where: { id: target.id },
                        data: {
                            outreachStatus: 'SENT',
                            outreachSentAt: new Date(),
                        }
                    });
                    console.log(`  ✅ Sent!`);
                    sent++;
                } else {
                    console.log(`  ❌ Failed to send`);
                    failed++;
                }
            } catch (err) {
                console.log(`  ❌ Error: ${err instanceof Error ? err.message : err}`);
                failed++;
            }

            // Rate limit: 2 second delay between emails
            await new Promise(r => setTimeout(r, 2000));
        } else {
            console.log(`  📝 Would send (dry run)`);
            console.log(`  Subject: ${subject}`);
            sent++;
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Sent: ${sent}`);
    console.log(`❌ Failed: ${failed}`);
}

async function showStats() {
    const total = await prisma.toolReview.count({ where: { scrapedFrom: 'competitor-backlink' } });
    const withEmail = await prisma.toolReview.count({
        where: { scrapedFrom: 'competitor-backlink', contactEmail: { not: null } }
    });
    const sent = await prisma.toolReview.count({
        where: { scrapedFrom: 'competitor-backlink', outreachStatus: 'SENT' }
    });

    console.log('\n📊 Competitor Backlink Stats');
    console.log('='.repeat(40));
    console.log(`Total imported: ${total}`);
    console.log(`With email: ${withEmail}`);
    console.log(`Outreach sent: ${sent}`);
    console.log(`Pending outreach: ${withEmail - sent}`);
    console.log(`Need email: ${total - withEmail}`);
}

async function main() {
    const args = process.argv.slice(2);
    const isLive = args.includes('--live');
    const findEmails = args.includes('--find-emails');
    const doOutreach = args.includes('--outreach');
    const showStatsOnly = args.includes('--stats');

    if (showStatsOnly) {
        await showStats();
        await prisma.$disconnect();
        return;
    }

    if (doOutreach) {
        const limitArg = args.find(a => a.startsWith('--limit='));
        const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;
        await sendOutreach(isLive, limit);
        await prisma.$disconnect();
        return;
    }

    // Default: import BLOGS for guest post outreach
    // (Tools should be imported via test-backlink-scout.ts instead)
    // NEW: --tools flag imports the TOOLS_FOR_REVIEW list for tool review path
    const importTools = args.includes('--tools');
    if (importTools) {
        console.log('📦 Importing TOOLS for review path...\n');
        await importFromList(TOOLS_FOR_REVIEW, isLive, findEmails);
    } else {
        await importFromList(BLOGS_FOR_GUEST_POSTS, isLive, findEmails);
    }

    if (isLive) {
        await showStats();
    }

    await prisma.$disconnect();
}

console.log('🎯 Competitor Backlink Importer\n');
main().catch(console.error);
