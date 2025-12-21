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
    model: 'gpt-4.1-nano',
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
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 90,
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
    console.error('[Image Generator] Error:', error);
    throw error;
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
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: prompt,
          num_outputs: 1,
          aspect_ratio: "16:9",
          output_format: "webp",
          output_quality: 85,
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
