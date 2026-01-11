/**
 * Extract contact emails from sportsbettingtools.io tools that have content but no email
 * Run: npx tsx scripts/extract-emails-now.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { findContactEmail } from '../src/lib/backlink-scout';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding tools that need email extraction...\n');
  
  const needEmail = await prisma.toolReview.findMany({
    where: {
      sourceUrl: { contains: 'sportsbettingtools' },
      contentWords: { gt: 100 },
      blogPostId: null,
      contactEmail: null
    },
    select: { id: true, toolName: true, toolUrl: true }
  });
  
  console.log(`Found ${needEmail.length} tools needing email extraction\n`);
  
  let found = 0;
  let notFound = 0;
  
  for (const tool of needEmail) {
    console.log(`📧 ${tool.toolName} (${tool.toolUrl})`);
    
    try {
      const result = await findContactEmail(tool.toolUrl);
      
      if (result.email) {
        await prisma.toolReview.update({
          where: { id: tool.id },
          data: { 
            contactEmail: result.email,
            emailSource: result.source
          }
        });
        console.log(`   ✅ Found: ${result.email} (${result.source})`);
        found++;
      } else {
        console.log(`   ❌ No email found`);
        notFound++;
      }
    } catch (e) {
      console.log(`   ❌ Error: ${e instanceof Error ? e.message : e}`);
      notFound++;
    }
    
    // Delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Emails found: ${found}`);
  console.log(`❌ Not found: ${notFound}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
