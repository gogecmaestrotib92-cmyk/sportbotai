/**
 * Resend premium outreach emails to 4 tools
 * Uses the NEW premium template with P.S. badge section
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendToolReviewOutreach } from '../src/lib/email';

const TOOLS = [
  {
    name: 'XCLSV Media',
    email: 'zaire@xclsvmedia.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/xclsv-media-review'
  },
  {
    name: 'PickDawgz',
    email: 'Help@PickDawgz.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/pickdawgz-review'
  },
  {
    name: 'Bookies Bonuses',
    email: 'info@bookiesbonuses.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/bookies-bonuses-review'
  },
  {
    name: 'BetBlazers',
    email: 'info@betblazers.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/betblazers-review'
  },
];

async function main() {
  console.log('📧 Resending premium outreach emails to 4 tools...\n');
  
  for (const tool of TOOLS) {
    console.log(`Sending to ${tool.name} (${tool.email})...`);
    console.log(`   Review URL: ${tool.reviewUrl}`);
    
    const success = await sendToolReviewOutreach(tool.email, tool.name, tool.reviewUrl);
    
    if (success) {
      console.log(`   ✅ Sent!\n`);
    } else {
      console.log(`   ❌ Failed!\n`);
    }
    
    // Small delay between emails
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Done!');
}

main().catch(console.error);
