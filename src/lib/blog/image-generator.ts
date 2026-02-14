// Replicate API client for AI image generation
// Uses Flux or SDXL for blog featured images
// Uses GPT-4.1 nano for high-quality image prompts

import Replicate from 'replicate';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { ImageGenerationResult } from './types';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate an optimized image prompt using GPT-4.1 nano
async function generateImagePrompt(
  title: string,
  keyword: string,
  category: string,
  imageDescription?: string
): Promise<string> {
  const context = imageDescription || `blog header for article about ${keyword}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [{
      role: 'system',
      content: `You are an expert at creating prompts for AI image generation. Create visually striking, modern prompts for Flux image model.

STYLE REQUIREMENTS:
- Modern, sleek, professional aesthetic
- Tech/data visualization theme with sports elements
- Blue (#1e40af), green (#10B981), dark backgrounds
- Abstract, conceptual - NOT realistic photos
- No text, no logos, no people faces
- Cinematic lighting, high production value
- 4K, detailed, visually impressive`
    }, {
      role: 'user',
      content: `Create an image generation prompt for: ${context}

Article title: "${title}"
Keyword: "${keyword}"  
Category: "${category}"

Return ONLY the prompt text, nothing else. Keep it under 200 words.`
    }],
    temperature: 0.8,
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || createFallbackPrompt(keyword, category);
}

// Fallback prompt if GPT fails
function createFallbackPrompt(keyword: string, category: string): string {
  const baseStyle = "modern, clean, professional digital illustration, minimalist design, tech aesthetic, blue and green color scheme, dark background";

  const categoryPrompts: Record<string, string> = {
    "Betting Fundamentals": "abstract data visualization, flowing charts and graphs, mathematical symbols, probability waves",
    "Sports Analysis": "dynamic sports stadium silhouette, data streams overlaying athletic motion, holographic dashboard",
    "Statistics & Data": "big data visualization, glowing numbers flowing through space, statistical charts, neon infographic",
    "Risk Management": "abstract balance visualization, risk meter with glowing indicators, shield with data patterns",
    "Market Insights": "futuristic trading display, odds flowing like stock tickers, trend visualization",
    "Educational Guides": "glowing book with data emanating, knowledge visualization, step pathway with data points",
  };

  const categoryContext = categoryPrompts[category] || categoryPrompts["Educational Guides"];
  return `${baseStyle}, ${categoryContext}, representing "${keyword}", no text, no logos, no faces, 4k quality`;
}

// Generate a featured image for a blog post
export async function generateFeaturedImage(
  title: string,
  keyword: string,
  category: string
): Promise<ImageGenerationResult> {
  console.log('[Image Generator] Generating smart prompt with GPT-4.1 nano...');
  const prompt = await generateImagePrompt(title, keyword, category);

  console.log('[Image Generator] Starting image generation for:', keyword);
  console.log('[Image Generator] Prompt:', prompt.substring(0, 150) + '...');

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "text, watermark, logo, blurry, low quality, distorted",
          width: 1344,
          height: 768,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          refine: "expert_ensemble_refiner",
          high_noise_frac: 0.8,
        }
      }
    );

    const imageUrl = await extractImageUrl(output);
    if (!imageUrl) {
      throw new Error('No image URL returned from Replicate');
    }

    console.log('[Image Generator] Image URL:', imageUrl);
    const blobUrl = await uploadToBlob(imageUrl, keyword);

    return {
      url: blobUrl,
      alt: `${title} - SportBot AI`,
      prompt: prompt,
    };

  } catch (error) {
    console.error('[Image Generator] Replicate error, using SVG fallback:', error);

    // FALLBACK: Generate professional SVG-based image (like match previews)
    return await generateSVGFeaturedImage(title, keyword, category);
  }
}

// SVG-based fallback image generator (no external API required)
async function generateSVGFeaturedImage(
  title: string,
  keyword: string,
  category: string
): Promise<ImageGenerationResult> {
  console.log('[Image Generator] Generating SVG fallback for:', keyword);

  // Escape special characters for SVG
  const escapeXml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Truncate title for display
  const displayTitle = title.length > 50
    ? title.substring(0, 47) + '...'
    : title;

  // Word wrap for subtitle (max 2 lines)
  const words = keyword.split(' ');
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    if (line1.length + word.length < 40) {
      line1 += (line1 ? ' ' : '') + word;
    } else if (line2.length + word.length < 40) {
      line2 += (line2 ? ' ' : '') + word;
    }
  }

  // Category-specific styling
  const categoryStyles: Record<string, { icon: string; accent1: string; accent2: string }> = {
    "Betting Fundamentals": { icon: "📊", accent1: "#10b981", accent2: "#059669" },
    "Sports Analysis": { icon: "⚽", accent1: "#3b82f6", accent2: "#1d4ed8" },
    "Statistics & Data": { icon: "📈", accent1: "#8b5cf6", accent2: "#6d28d9" },
    "Risk Management": { icon: "🛡️", accent1: "#f59e0b", accent2: "#d97706" },
    "Market Insights": { icon: "💰", accent1: "#10b981", accent2: "#059669" },
    "Educational Guides": { icon: "📚", accent1: "#06b6d4", accent2: "#0891b2" },
  };

  const style = categoryStyles[category] || categoryStyles["Educational Guides"];

  // Abstract futuristic data visualization SVG (matching AI-generated aesthetic)
  const svgContent = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gradient backgrounds -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="50%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${style.accent1}"/>
      <stop offset="100%" style="stop-color:${style.accent2}"/>
    </linearGradient>
    <linearGradient id="orbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${style.accent1};stop-opacity:0.8"/>
      <stop offset="100%" style="stop-color:${style.accent2};stop-opacity:0.2"/>
    </linearGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${style.accent1};stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:${style.accent1};stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${style.accent2};stop-opacity:0.5"/>
      <stop offset="100%" style="stop-color:${style.accent2};stop-opacity:0"/>
    </radialGradient>
    <!-- Filters -->
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="30"/>
    </filter>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  
  <!-- Deep space background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Abstract flowing shapes -->
  <ellipse cx="900" cy="200" rx="400" ry="300" fill="url(#glow1)" filter="url(#blur)"/>
  <ellipse cx="200" cy="450" rx="350" ry="250" fill="url(#glow2)" filter="url(#blur)"/>
  
  <!-- Data visualization lines (circuit pattern) -->
  <g stroke="${style.accent1}" stroke-width="1" opacity="0.3">
    <path d="M0,315 Q300,280 600,315 T1200,315" fill="none"/>
    <path d="M0,350 Q400,300 800,350 T1200,350" fill="none"/>
    <path d="M0,280 Q500,320 1000,280" fill="none"/>
  </g>
  
  <!-- Glowing orbs (data points) -->
  <circle cx="200" cy="300" r="8" fill="${style.accent1}" filter="url(#softGlow)"/>
  <circle cx="350" cy="320" r="5" fill="${style.accent1}" opacity="0.7"/>
  <circle cx="500" cy="290" r="10" fill="url(#orbGrad)" filter="url(#softGlow)"/>
  <circle cx="700" cy="340" r="6" fill="${style.accent2}" filter="url(#softGlow)"/>
  <circle cx="850" cy="300" r="12" fill="url(#orbGrad)" filter="url(#softGlow)"/>
  <circle cx="1000" cy="330" r="7" fill="${style.accent1}" opacity="0.8"/>
  
  <!-- Connecting lines between orbs -->
  <g stroke="${style.accent1}" stroke-width="1" opacity="0.4">
    <line x1="200" y1="300" x2="350" y2="320"/>
    <line x1="350" y1="320" x2="500" y2="290"/>
    <line x1="500" y1="290" x2="700" y2="340"/>
    <line x1="700" y1="340" x2="850" y2="300"/>
    <line x1="850" y1="300" x2="1000" y2="330"/>
  </g>
  
  <!-- Large central icon with glow -->
  <circle cx="600" cy="250" r="80" fill="${style.accent1}" opacity="0.15" filter="url(#blur)"/>
  <circle cx="600" cy="250" r="50" fill="#0f172a" stroke="${style.accent1}" stroke-width="2"/>
  <text x="600" y="270" text-anchor="middle" font-size="50">${style.icon}</text>
  
  <!-- Title area with glass effect -->
  <rect x="100" y="360" width="1000" height="140" rx="20" fill="#0f172a" fill-opacity="0.6"/>
  <rect x="100" y="360" width="1000" height="3" rx="1" fill="url(#accent)"/>
  
  <!-- Category badge -->
  <rect x="100" y="370" width="200" height="30" rx="15" fill="${style.accent1}" opacity="0.2"/>
  <text x="200" y="392" text-anchor="middle" fill="${style.accent1}" font-family="Arial, sans-serif" font-size="14" font-weight="600">${escapeXml(category.toUpperCase())}</text>
  
  <!-- Title text -->
  <text x="120" y="440" fill="#fff" font-family="Arial, sans-serif" font-size="28" font-weight="700">${escapeXml(displayTitle)}</text>
  
  <!-- Subtitle -->
  <text x="120" y="480" fill="#94a3b8" font-family="Arial, sans-serif" font-size="18">${escapeXml(line1)}${line2 ? ' ' + escapeXml(line2) : ''}</text>
  
  <!-- Bottom accent bar -->
  <rect x="0" y="610" width="1200" height="20" fill="url(#accent)"/>
  
  <!-- Branding -->
  <text x="120" y="580" fill="${style.accent1}" font-family="Arial, sans-serif" font-size="18" font-weight="700">SportBot AI</text>
  <text x="280" y="580" fill="#64748b" font-family="Arial, sans-serif" font-size="14">AI-Powered Sports Intelligence</text>
</svg>`;

  try {
    // Upload SVG to Vercel Blob
    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const blob = await put(
      `blog/${slug}-${Date.now()}.svg`,
      svgContent,
      {
        access: 'public',
        contentType: 'image/svg+xml',
      }
    );

    console.log('[Image Generator] SVG fallback uploaded:', blob.url);

    return {
      url: blob.url,
      alt: `${title} - SportBot AI`,
      prompt: 'SVG fallback (Replicate unavailable)',
    };
  } catch (uploadError) {
    console.error('[Image Generator] SVG upload failed:', uploadError);
    // Final fallback to placeholder
    return {
      url: getPlaceholderImage(keyword),
      alt: `${title} - SportBot AI`,
      prompt: 'placeholder fallback',
    };
  }
}

// Generate an inline content image
export async function generateContentImage(
  imageDescription: string,
  keyword: string,
  category: string,
  index: number
): Promise<ImageGenerationResult> {
  console.log(`[Image Generator] Generating content image ${index + 1}: ${imageDescription.substring(0, 50)}...`);

  const prompt = await generateImagePrompt(
    imageDescription,
    keyword,
    category,
    imageDescription
  );

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: "text, watermark, logo, blurry, low quality, distorted",
          width: 1344,
          height: 768,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 25,
          guidance_scale: 7.5,
        }
      }
    );

    const imageUrl = await extractImageUrl(output);
    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    const blobUrl = await uploadToBlob(imageUrl, `${keyword}-inline-${index}`);

    return {
      url: blobUrl,
      alt: imageDescription,
      prompt: prompt,
    };
  } catch (error) {
    console.error(`[Image Generator] Content image ${index + 1} failed:`, error);
    throw error;
  }
}

// Extract URL from various Replicate output formats
async function extractImageUrl(output: unknown): Promise<string | null> {
  if (Array.isArray(output) && output.length > 0) {
    const firstItem = output[0];
    if (typeof firstItem === 'string') {
      return firstItem;
    } else if (firstItem && typeof firstItem === 'object') {
      if ('url' in firstItem && typeof firstItem.url === 'function') {
        return await firstItem.url();
      } else if ('url' in firstItem && typeof firstItem.url === 'string') {
        return firstItem.url;
      } else if (firstItem.toString && firstItem.toString() !== '[object Object]') {
        return firstItem.toString();
      }
    }
  } else if (typeof output === 'string') {
    return output;
  } else if (output && typeof output === 'object' && 'url' in output) {
    const obj = output as { url: string | (() => Promise<string>) };
    return typeof obj.url === 'function' ? await obj.url() : obj.url;
  }
  return null;
}

// Upload image from URL to Vercel Blob
async function uploadToBlob(imageUrl: string, keyword: string): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // Check if token exists and is not a placeholder
  if (!blobToken || blobToken.includes('your_blob_token') || blobToken.length < 50) {
    console.error('[Image Generator] BLOB_READ_WRITE_TOKEN not properly configured!');
    console.error('[Image Generator] Please add a valid Vercel Blob token to environment variables.');
    console.error('[Image Generator] Returning original Replicate URL (will expire!)');
    return imageUrl;
  }

  try {
    console.log('[Image Generator] Downloading image from Replicate...');

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    console.log(`[Image Generator] Downloaded ${imageBuffer.byteLength} bytes`);

    // Create a slug-friendly filename
    const slug = keyword
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const filename = `blog/${slug}-${Date.now()}.webp`;
    console.log(`[Image Generator] Uploading to Vercel Blob: ${filename}`);

    // Upload to Vercel Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });

    console.log(`[Image Generator] ✅ Uploaded to Blob: ${blob.url}`);
    return blob.url;

  } catch (error) {
    console.error('[Image Generator] Blob upload error:', error);
    // Return original URL as fallback (will expire)
    return imageUrl;
  }
}

// Generate a placeholder image URL (fallback)
export function getPlaceholderImage(keyword: string): string {
  const encoded = encodeURIComponent(keyword);
  return `https://placehold.co/1200x630/1a365d/ffffff?text=${encoded}`;
}
