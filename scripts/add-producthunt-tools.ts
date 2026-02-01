/**
 * Add Product Hunt Tools to Database
 * 
 * Manually curated list of quality sports betting tools from Product Hunt.
 * These are indie projects likely to engage with backlink exchange.
 */

import { prisma } from '../src/lib/prisma';
import { extractWebsiteContent, findContactEmail } from '../src/lib/backlink-scout';

const productHuntTools = [
  {
    name: 'Alloy Sports',
    url: 'https://www.alloysports.com',
    description: 'Create winning sports betting systems in seconds. Data-driven tool with 10+ years historical data.',
    sourceUrl: 'https://www.producthunt.com/products/alloy-sports',
    knownEmail: 'brad@alloysports.com',
  },
  {
    name: 'Cappers',
    url: 'https://cappers.ai',
    description: 'AI for Sports Bettors. Data, systems, and AI analysis/simulations to beat the sportsbook.',
    sourceUrl: 'https://www.producthunt.com/products/cappers',
  },
  {
    name: 'Sharp App',
    url: 'https://sharp.app',
    description: 'Sports Betting platform with data backed tools & content. Built by industry veterans.',
    sourceUrl: 'https://www.producthunt.com/products/sharp-app-sports-betting',
  },
  {
    name: 'NeuroBet',
    url: 'https://neurobet.co',
    description: 'AI-powered sports betting predictions across multiple sports with betting calculators.',
    sourceUrl: 'https://www.producthunt.com/products/neurobet',
  },
  {
    name: 'Crowdcate',
    url: 'https://crowdcate.com',
    description: 'Bringing the Wisdom of the Crowd to sports betting.',
    sourceUrl: 'https://www.producthunt.com/products/crowdcate',
  },
  {
    name: 'MyBetPage',
    url: 'https://mybetpage.com',
    description: 'Manage your sports betting for your community.',
    sourceUrl: 'https://www.producthunt.com/products/mybetpage',
  },
];

async function addTools() {
  console.log('Adding Product Hunt tools to database...\n');
  
  let added = 0;
  let skipped = 0;
  
  for (const tool of productHuntTools) {
    // Check if exists
    const normalizedUrl = tool.url.replace('https://', '').replace('www.', '');
    const existing = await prisma.toolReview.findFirst({
      where: { 
        OR: [
          { toolUrl: { contains: normalizedUrl } },
          { toolName: tool.name },
        ]
      },
    });
    
    if (existing) {
      console.log(`⏭️  ${tool.name} already exists, skipping`);
      skipped++;
      continue;
    }
    
    console.log(`\n📥 Processing: ${tool.name}`);
    console.log(`   URL: ${tool.url}`);
    
    // Extract content
    let content = '';
    let wordCount = 0;
    try {
      const extracted = await extractWebsiteContent(tool.url);
      content = extracted.content;
      wordCount = extracted.wordCount;
      console.log(`   Content: ${wordCount} words`);
    } catch (e) {
      console.log(`   Content: extraction failed`);
    }
    
    // Find email
    let email = tool.knownEmail || null;
    let emailSource = tool.knownEmail ? 'product_hunt' : 'not_found';
    
    if (!email) {
      try {
        const found = await findContactEmail(tool.url);
        email = found.email;
        emailSource = found.source;
        console.log(`   Email: ${email || 'not found'} (${emailSource})`);
      } catch (e) {
        console.log(`   Email: search failed`);
      }
    } else {
      console.log(`   Email: ${email} (from Product Hunt)`);
    }
    
    // Save to database
    await prisma.toolReview.create({
      data: {
        toolName: tool.name,
        toolUrl: tool.url,
        toolDescription: tool.description,
        sourceUrl: tool.sourceUrl,
        scrapedFrom: 'producthunt',
        contentExtracted: content,
        contentWords: wordCount,
        contactEmail: email,
        emailSource: emailSource,
        reviewStatus: 'PENDING',
        outreachStatus: email ? 'NOT_SENT' : 'NO_EMAIL',
      },
    });
    
    console.log(`   ✅ Saved!`);
    added++;
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Done!`);
  console.log(`   Added: ${added}`);
  console.log(`   Skipped: ${skipped}`);
  
  await prisma.$disconnect();
}

addTools().catch(console.error);
