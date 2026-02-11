/**
 * Generate premium tech card backgrounds via Replicate FLUX model
 * Run: npx tsx scripts/generate-card-backgrounds.ts
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images');

async function downloadFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    const protocol = url.startsWith('https') ? https : http;
    
    const makeRequest = (targetUrl: string) => {
      const proto = targetUrl.startsWith('https') ? https : http;
      proto.get(targetUrl, (response) => {
        // Handle redirects
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          makeRequest(response.headers.location);
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    };
    
    makeRequest(url);
  });
}

async function generateImage(prompt: string, filename: string): Promise<string> {
  console.log(`\n🎨 Generating: ${filename}`);
  console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

  const output = await replicate.run(
    "black-forest-labs/flux-schnell",
    {
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "16:9",
        output_format: "webp",
        output_quality: 90,
        go_fast: true,
      }
    }
  );

  const outputPath = path.join(OUTPUT_DIR, filename);
  
  // Output can be: array of URLs, array of ReadableStreams, or FileOutput objects
  const results = output as any[];
  const result = results[0];
  
  console.log(`   Result type: ${typeof result}, constructor: ${result?.constructor?.name}`);
  
  if (typeof result === 'string') {
    // Direct URL string
    console.log(`   📥 Downloading from URL...`);
    await downloadFile(result, outputPath);
  } else if (result && typeof result.url === 'function') {
    // FileOutput object with .url() method
    const url = String(result.url());
    console.log(`   📥 Downloading from FileOutput URL: ${url.substring(0, 80)}...`);
    await downloadFile(url, outputPath);
  } else if (result && typeof result.url === 'string') {
    // Object with url property
    console.log(`   📥 Downloading from object URL...`);
    await downloadFile(result.url, outputPath);
  } else if (result && typeof result[Symbol.asyncIterator] === 'function') {
    // AsyncIterable (ReadableStream)
    console.log(`   📥 Reading from stream...`);
    const chunks: Buffer[] = [];
    for await (const chunk of result) {
      chunks.push(Buffer.from(chunk));
    }
    fs.writeFileSync(outputPath, Buffer.concat(chunks));
  } else if (result && result.getReader) {
    // Web ReadableStream
    console.log(`   📥 Reading from ReadableStream...`);
    const chunks: Buffer[] = [];
    const reader = result.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    fs.writeFileSync(outputPath, Buffer.concat(chunks));
  } else {
    // Try to convert to string
    const url = String(result);
    if (url.startsWith('http')) {
      console.log(`   📥 Downloading from stringified URL...`);
      await downloadFile(url, outputPath);
    } else {
      throw new Error(`Unknown output type: ${typeof result} - ${JSON.stringify(result).substring(0, 200)}`);
    }
  }
  
  console.log(`   ✅ Saved to: ${outputPath}`);
  return outputPath;
}

async function main() {
  console.log('🚀 Generating premium card backgrounds via Replicate FLUX...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Image 1: "The Old Way" card — dark, chaotic, red-toned tech texture
  const redPrompt = `Abstract dark technology background texture, deep black and dark crimson red color scheme, scattered holographic data fragments, glowing red circuit board traces fading into darkness, subtle grid pattern dissolving into chaos, floating translucent clock fragments and scattered paper icons, digital noise and static effect, moody dystopian tech aesthetic, ultra dark with minimal red accent glows, 4K quality, no text, no people, dark premium wallpaper style`;

  // Image 2: "With SportBot" card — dark, clean, green/mint-toned tech texture
  const greenPrompt = `Abstract dark technology background texture, deep black and emerald mint green color scheme, clean neural network nodes connected by glowing green lines, sleek AI data visualization, smooth flowing energy streams, subtle hexagonal grid pattern, holographic HUD elements, futuristic clean tech aesthetic, ultra dark with minimal mint green accent glows, speed and precision feel, 4K quality, no text, no people, dark premium wallpaper style`;

  try {
    await generateImage(redPrompt, 'pain-card-bg.webp');
    await generateImage(greenPrompt, 'solution-card-bg.webp');

    console.log('\n✅ All backgrounds generated successfully!');
    console.log('   Files saved in: public/images/');
  } catch (error) {
    console.error('\n❌ Error generating images:', error);
    process.exit(1);
  }
}

main();
