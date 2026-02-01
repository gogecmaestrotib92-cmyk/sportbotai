import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendRegistrationWelcomeEmail } from '@/lib/email';

// Whitelisted IPs (no account limit) - add your IP here
const WHITELISTED_IPS: string[] = [
  // Add your home/office IPs here
  // '123.456.789.0',
];

// Maximum accounts per IP address
const MAX_ACCOUNTS_PER_IP = 3;

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  // Vercel/Cloudflare headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is the client
    return forwardedFor.split(',')[0].trim();
  }
  
  // Vercel specific
  const vercelIp = request.headers.get('x-real-ip');
  if (vercelIp) return vercelIp;
  
  // Cloudflare specific
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, referralSource, referralMedium, referralCampaign } = body;
    
    // Get client IP
    const clientIp = getClientIp(request);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // IP-based account limit check (skip for whitelisted IPs)
    if (clientIp !== 'unknown' && !WHITELISTED_IPS.includes(clientIp)) {
      const accountsFromIp = await prisma.user.count({
        where: { registrationIp: clientIp },
      });
      
      if (accountsFromIp >= MAX_ACCOUNTS_PER_IP) {
        console.log(`[Register] IP ${clientIp} blocked - already has ${accountsFromIp} accounts`);
        return NextResponse.json(
          { error: 'Maximum number of accounts reached for this network. Please contact support if you need assistance.' },
          { status: 429 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with free plan
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        plan: 'FREE',
        analysisCount: 0,
        referralSource: referralSource || null,
        referralMedium: referralMedium || null,
        referralCampaign: referralCampaign || null,
        registrationIp: clientIp !== 'unknown' ? clientIp : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Send welcome email (non-blocking)
    sendRegistrationWelcomeEmail(email, name).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
