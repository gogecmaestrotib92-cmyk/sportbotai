/**
 * Fix Tool Review Slugs and Create ToolReview Entries
 * Run: npx tsx scripts/fix-tool-slugs.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const toolEmails: Record<string, string> = {
    'betbrain': 'support@betbrain.com',
    'dimers': 'contact@dimers.com',
    'vsin': 'subscribe@vsin.com',
    'oddsportal': 'info@livesport.eu',
    'sportsgrid': 'info@sportsgrid.com',
    'ftn-betting': 'info@ftnnetwork.com',
    'betradar': 'support@betradar.com',
    'wager-talk': 'support@wagertalk.com',
    'betslayer': 'team@betslayer.com',
    'sharp-sports': 'auth@sharpsports.io',
    'bet-calculator': 'info@betcalculator.com',
    'genius-sports': 'compliance@geniussports.com',
    'parlay-science': '',
    'ballpark-pal': '',
    'prop-professor': '',
    'the-lines': '',
};

async function main() {
    console.log('🔧 Fixing tool review slugs and creating ToolReview entries...\n');

    // Step 1: Fix slugs with tools/ prefix
    const postsToFix = await prisma.blogPost.findMany({
        where: { slug: { startsWith: 'tools/' } }
    });

    console.log(`Found ${postsToFix.length} posts with tools/ prefix\n`);

    for (const post of postsToFix) {
        const newSlug = post.slug.replace('tools/', '');
        await prisma.blogPost.update({
            where: { id: post.id },
            data: { slug: newSlug }
        });
        console.log(`✅ Fixed: ${post.slug} → ${newSlug}`);
    }

    // Step 2: Create ToolReview entries for published tool reviews
    console.log('\n📦 Creating ToolReview entries...\n');

    const toolReviews = await prisma.blogPost.findMany({
        where: {
            status: 'PUBLISHED',
            category: 'Tools & Resources',
            slug: { endsWith: '-review' }
        }
    });

    for (const post of toolReviews) {
        // Extract tool name key from slug
        const toolKey = post.slug.replace('-review', '');
        const email = toolEmails[toolKey] || null;

        // Check if ToolReview already exists
        const existing = await prisma.toolReview.findFirst({
            where: { blogPostId: post.id }
        });

        if (existing) {
            console.log(`⏭️ Skip: ${post.title.substring(0, 40)} (already linked)`);
            continue;
        }

        // Extract URL from title
        const toolName = post.title.replace(/ Review.*$/i, '').trim();
        const toolUrl = `https://${toolKey.replace(/-/g, '')}.com`;

        await prisma.toolReview.create({
            data: {
                toolName,
                toolUrl,
                contactEmail: email,
                scrapedFrom: 'manual-import',
                blogPostId: post.id,
                blogSlug: post.slug,
                reviewStatus: 'PUBLISHED',
                reviewContent: post.content,
                outreachStatus: email ? 'NOT_SENT' : 'NO_EMAIL'
            }
        });

        console.log(`✅ Created: ${toolName} ${email ? '→ ' + email : '(no email)'}`);
    }

    await prisma.$disconnect();
    console.log('\n🎉 Done! Now run: npx tsx scripts/test-backlink-scout.ts --outreach --live --limit=15');
}

main().catch(console.error);
