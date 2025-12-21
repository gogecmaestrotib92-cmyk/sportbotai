/**
 * API Route: /api/stripe/webhook
 * 
 * Stripe Webhook handler - updates user plans in database
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { 
  sendWelcomeEmail, 
  sendPaymentFailedEmail, 
  sendCancellationEmail,
  sendRenewalEmail,
  sendAdminPurchaseNotification 
} from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Map Price IDs to plan names (monthly and yearly)
function getPlanFromPriceId(priceId: string): 'FREE' | 'PRO' | 'PREMIUM' {
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return 'PREMIUM';
  if (priceId === process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID) return 'PREMIUM';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'PRO';
  if (priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) return 'PRO';
  return 'FREE';
}

/**
 * POST /api/stripe/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Checkout completed - upgrade user's plan
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Checkout completed:', session.id);
  
  const customerEmail = session.customer_email || session.metadata?.userEmail;
  const planName = session.metadata?.planName?.toUpperCase() || 'PRO';
  
  if (!customerEmail) {
    console.error('[Stripe Webhook] No customer email found');
    return;
  }

  try {
    // Update user's plan in database
    await prisma.user.update({
      where: { email: customerEmail },
      data: {
        plan: planName as 'FREE' | 'PRO' | 'PREMIUM',
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        analysisCount: 0, // Reset count on upgrade
      },
    });
    
    console.log(`[Stripe Webhook] User ${customerEmail} upgraded to ${planName}`);
    
    // Send welcome email to customer
    await sendWelcomeEmail(customerEmail, planName);
    
    // Notify admins about the new purchase
    const amount = session.amount_total 
      ? `$${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() || 'USD'}`
      : undefined;
    await sendAdminPurchaseNotification(customerEmail, planName, amount);
  } catch (error) {
    console.error('[Stripe Webhook] Error updating user:', error);
  }
}

/**
 * Subscription updated (renewal, plan change)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Subscription updated:', subscription.id);
  
  const priceId = subscription.items.data[0]?.price?.id || '';
  const plan = getPlanFromPriceId(priceId);
  const status = subscription.status;
  
  // Get customer email
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!('email' in customer) || !customer.email) return;
  
  try {
    // Update user's plan based on subscription status
    if (status === 'active') {
      await prisma.user.update({
        where: { email: customer.email },
        data: { plan },
      });
      
      const nextBillingDate = new Date(subscription.current_period_end * 1000);
      await sendRenewalEmail(customer.email, plan, nextBillingDate);
      console.log(`[Stripe Webhook] User ${customer.email} subscription renewed - ${plan}`);
    } else if (status === 'past_due' || status === 'unpaid') {
      // Keep plan but note the issue
      console.log(`[Stripe Webhook] User ${customer.email} subscription ${status}`);
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error updating subscription:', error);
  }
}

/**
 * Subscription cancelled - downgrade to free
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Subscription deleted:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!('email' in customer) || !customer.email) return;
  
  const priceId = subscription.items.data[0]?.price?.id || '';
  const planName = getPlanFromPriceId(priceId);
  const endDate = new Date(subscription.current_period_end * 1000);
  
  try {
    // Downgrade user to free plan
    await prisma.user.update({
      where: { email: customer.email },
      data: {
        plan: 'FREE',
        stripeSubscriptionId: null,
      },
    });
    
    await sendCancellationEmail(customer.email, planName, endDate);
    console.log(`[Stripe Webhook] User ${customer.email} downgraded to FREE`);
  } catch (error) {
    console.error('[Stripe Webhook] Error handling cancellation:', error);
  }
}

/**
 * Payment failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('[Stripe Webhook] Payment failed:', invoice.id);
  
  const customerEmail = invoice.customer_email;
  if (!customerEmail) return;
  
  let planName = 'Pro';
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const priceId = subscription.items.data[0]?.price?.id || '';
    planName = getPlanFromPriceId(priceId);
  }
  
  await sendPaymentFailedEmail(customerEmail, planName);
  console.log(`[Stripe Webhook] Payment failed email sent to ${customerEmail}`);
}
