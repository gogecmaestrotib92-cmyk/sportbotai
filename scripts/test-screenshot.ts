import { captureScreenshotWithFallback } from '../src/lib/blog/screenshot-generator';

async function test() {
  console.log('Testing screenshot for EdgHouse...');
  
  try {
    const result = await captureScreenshotWithFallback(
      'https://edghouse.com/',
      'EdgHouse',
      '/sports/football.jpg'
    );
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
