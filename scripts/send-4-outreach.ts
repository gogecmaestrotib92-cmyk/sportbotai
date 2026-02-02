/**
 * Send outreach emails for the 4 tool reviews we just created
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { sendToolReviewOutreach } from '../src/lib/email';

const tools = [
  {
    name: 'PickDawgz',
    email: 'Help@PickDawgz.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/pickdawgz-review'
  },
  {
    name: 'Scores and Stats',
    email: 'sales@scoresandstats.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/scoresandstats-review'
  },
  {
    name: 'XCLSV Media',
    email: 'zaire@xclsvmedia.com',
    reviewUrl: 'https://www.sportbotai.com/blog/tools/xclsv-media-review'
  }
];

async function main() {
  console.log('Sending outreach emails for 4 tool reviews...\n');
  
  for (const tool of tools) {
    console.log(`Sending to ${tool.name} (${tool.email})...`);
    try {
      const success = await sendToolReviewOutreach(tool.email, tool.name, tool.reviewUrl);
      if (success) {
        console.log(`  ✅ Email sent to ${tool.email}`);
      } else {
        console.log(`  ❌ Failed to send to ${tool.email}`);
      }
    } catch (err) {
      console.error(`  ❌ Error:`, err);
    }
  }
  
  console.log('\n📧 Note: StatsAlt has no direct email (only contact form)');
  console.log('Done!');
}

main();
