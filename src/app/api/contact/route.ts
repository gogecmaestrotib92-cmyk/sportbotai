/**
 * Contact Form API Route
 * 
 * Handles contact form submissions
 * Supports both Resend (recommended) and basic email logging
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limiting - simple in-memory store
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3; // Max 3 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  support: 'Technical Support',
  feedback: 'Feedback & Suggestions',
  business: 'Business / Partnership',
  billing: 'Billing Question',
  other: 'Other',
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json() as ContactFormData;
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Message must be between 10 and 5000 characters' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitize = (str: string) => str.replace(/[<>]/g, '');
    const sanitizedData = {
      name: sanitize(name.trim()),
      email: email.trim().toLowerCase(),
      subject: subjectLabels[subject] || 'General Inquiry',
      message: sanitize(message.trim()),
    };

    // Try to send via Resend if API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'SportBot AI <noreply@sportbotai.com>',
            to: ['contact@sportbotai.com', 'stefanmitrovic93@gmail.com'],
            reply_to: sanitizedData.email,
            subject: `[SportBot AI] ${sanitizedData.subject} from ${sanitizedData.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10B981;">New Contact Form Submission</h2>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <p><strong>From:</strong> ${sanitizedData.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
                <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
                
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <h3 style="color: #374151;">Message:</h3>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; white-space: pre-wrap;">
                  ${sanitizedData.message}
                </div>
                
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
                
                <p style="color: #9ca3af; font-size: 12px;">
                  Sent from SportBot AI contact form<br/>
                  IP: ${ip}<br/>
                  Time: ${new Date().toISOString()}
                </p>
              </div>
            `,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error('[Contact] Resend error:', errorData);
          throw new Error('Failed to send email');
        }

        console.log('[Contact] Email sent via Resend:', {
          from: sanitizedData.email,
          subject: sanitizedData.subject,
        });

        return NextResponse.json({
          success: true,
          message: 'Your message has been sent successfully!',
        });
      } catch (resendError) {
        console.error('[Contact] Resend failed:', resendError);
        // Fall through to logging
      }
    }

    // Fallback: Log the message (for development or if Resend not configured)
    console.log('[Contact] New contact form submission:', {
      timestamp: new Date().toISOString(),
      ip,
      ...sanitizedData,
    });

    // In production without email service, you could:
    // 1. Store in database
    // 2. Send to Slack/Discord webhook
    // 3. Use another email service

    return NextResponse.json({
      success: true,
      message: 'Your message has been received!',
    });

  } catch (error) {
    console.error('[Contact] Error processing form:', error);
    return NextResponse.json(
      { error: 'Failed to process your message. Please try again.' },
      { status: 500 }
    );
  }
}
