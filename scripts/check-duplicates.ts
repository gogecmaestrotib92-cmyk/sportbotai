/**
 * Check for duplicate tools and reviews in the backlink scout database
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
    console.log('🔍 Checking for duplicates in backlink scout database...\n');

    // Get all reviews with tools
    const reviews = await prisma.toolReview.findMany({
        include: { tool: true }
    });

    // Check for reviews with same toolId
    const toolReviewCounts: Record<string, { name: string; count: number }> = {};
    reviews.forEach(r => {
        const toolId = r.tool.id;
        if (!toolReviewCounts[toolId]) {
            toolReviewCounts[toolId] = { name: r.tool.name, count: 0 };
        }
        toolReviewCounts[toolId].count += 1;
    });

    const reviewDupes = Object.entries(toolReviewCounts).filter(([id, data]) => data.count > 1);
    if (reviewDupes.length > 0) {
        console.log('❌ DUPLICATE REVIEWS FOUND:');
        reviewDupes.forEach(([id, data]) => {
            console.log(`  - ${data.name}: ${data.count} reviews`);
        });
    } else {
        console.log('✅ No duplicate reviews found');
    }

    // Get all tools and check for name duplicates
    const tools = await prisma.competitorTool.findMany();
    const nameCounts: Record<string, number> = {};
    tools.forEach(t => {
        const name = t.name;
        nameCounts[name] = (nameCounts[name] || 0) + 1;
    });

    const nameDupes = Object.entries(nameCounts).filter(([n, c]) => c > 1);
    if (nameDupes.length > 0) {
        console.log('\n❌ DUPLICATE TOOLS BY NAME:');
        nameDupes.forEach(([name, count]) => {
            console.log(`  - ${name}: ${count} entries`);
        });
    } else {
        console.log('\n✅ No duplicate tools by name');
    }

    // Check for URL duplicates
    const urlCounts: Record<string, number> = {};
    tools.forEach(t => {
        const url = t.url?.toLowerCase() || 'no-url';
        urlCounts[url] = (urlCounts[url] || 0) + 1;
    });

    const urlDupes = Object.entries(urlCounts).filter(([u, c]) => c > 1 && u !== 'no-url');
    if (urlDupes.length > 0) {
        console.log('\n❌ DUPLICATE TOOLS BY URL:');
        urlDupes.forEach(([url, count]) => {
            console.log(`  - ${url}: ${count} entries`);
        });
    } else {
        console.log('\n✅ No duplicate tools by URL');
    }

    // Get outreach count
    const outreachCount = await prisma.backlinkOutreach.count();

    // Summary
    console.log(`\n📊 Summary: ${tools.length} tools, ${reviews.length} reviews, ${outreachCount} outreach emails sent`);

    await prisma.$disconnect();
}

checkDuplicates().catch(console.error);
