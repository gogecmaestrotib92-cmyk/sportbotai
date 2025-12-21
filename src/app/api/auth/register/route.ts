import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendRegistrationWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, referralSource, referralMedium, referralCampaign } = body;

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
