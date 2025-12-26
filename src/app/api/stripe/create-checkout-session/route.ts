/**
 * API Route: /api/stripe/create-checkout-session
 * 
 * Creates Stripe Checkout session for Pro or Premium subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering (uses headers/session)
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Get price IDs at request time (not module load time)
function getPriceIds(): Record<string, string> {
  return {
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
    'pro-yearly': process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    premium: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    'premium-yearly': process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
  };
}

/**
 * POST /api/stripe/create-checkout-session
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set');
      return NextResponse.json(
        { error: 'Stripe is not configured. Contact support.' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to subscribe' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { priceId: planKey, planName } = body;

    // Get price IDs at request time
    const PRICE_IDS = getPriceIds();
    
    // Log raw env vars for debugging
    console.log(`[Stripe] RAW ENV VARS:`);
    console.log(`  STRIPE_PRO_PRICE_ID: ${process.env.STRIPE_PRO_PRICE_ID ? 'SET' : 'NOT SET'}`);
    console.log(`  STRIPE_PRO_YEARLY_PRICE_ID: ${process.env.STRIPE_PRO_YEARLY_PRICE_ID ? 'SET (' + process.env.STRIPE_PRO_YEARLY_PRICE_ID + ')' : 'NOT SET'}`);
    console.log(`  STRIPE_PREMIUM_PRICE_ID: ${process.env.STRIPE_PREMIUM_PRICE_ID ? 'SET' : 'NOT SET'}`);
    console.log(`  STRIPE_PREMIUM_YEARLY_PRICE_ID: ${process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID ? 'SET' : 'NOT SET'}`);
    
    // Resolve actual Price ID from plan key
    const actualPriceId = PRICE_IDS[planKey?.toLowerCase()] || planKey;
    
    console.log(`[Stripe] Plan key: ${planKey}, Resolved price ID: ${actualPriceId}`);
    console.log(`[Stripe] Available PRICE_IDS:`, JSON.stringify(PRICE_IDS));
    
    if (!actualPriceId || !actualPriceId.startsWith('price_')) {
      console.error('Invalid price ID:', planKey, '->', actualPriceId);
      console.error('PRICE_IDS map:', PRICE_IDS);
      return NextResponse.json(
        { error: `Invalid plan selected. Please contact support. (Plan: ${planKey})` },
        { status: 400 }
      );
    }

    console.log(`[Stripe] Creating checkout for ${session.user.email} - ${planName} (${actualPriceId})`);

    // Create Checkout Session with user info
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: session.user.email,
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      success_url: `${getBaseUrl()}/pricing/success?plan=${planName}`,
      cancel_url: `${getBaseUrl()}/pricing/cancelled`,
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
        planName: planName,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          userEmail: session.user.email,
          planName: planName,
        },
      },
      billing_address_collection: 'auto',
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
