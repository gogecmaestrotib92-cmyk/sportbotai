/**
 * Email Service for SportBot AI
 * 
 * Handles transactional emails using Brevo (formerly Sendinblue)
 * - Subscription confirmations
 * - Payment failures
 * - Cancellation notices
 * - Welcome emails
 */

import { SITE_CONFIG } from './seo';

// Read API key lazily to support scripts that load dotenv
const getBrevoApiKey = () => process.env.BREVO_API_KEY;
const FROM_EMAIL = 'contact@sportbotai.com';
const FROM_NAME = 'Stefan';
const SUPPORT_EMAIL = SITE_CONFIG.email;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Send an email using Brevo API
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<boolean> {
  const BREVO_API_KEY = getBrevoApiKey();
  if (!BREVO_API_KEY) {
    console.log('[Email] BREVO_API_KEY not configured, skipping email');
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: FROM_NAME,
          email: FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        replyTo: { email: replyTo || SUPPORT_EMAIL },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Failed to send:', error);
      return false;
    }

    const result = await response.json();
    console.log(`[Email] Sent to ${to}: ${subject} (ID: ${result.messageId})`);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

// ============================================
// EMAIL TEMPLATES
// ============================================

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  background: #0f172a;
  color: #e2e8f0;
`;

const buttonStyle = `
  display: inline-block;
  background: #10B981;
  color: #0f172a;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin: 20px 0;
`;

const footerStyle = `
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #334155;
  font-size: 12px;
  color: #94a3b8;
`;

function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #020617;">
      <div style="${baseStyles}">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f8fafc; margin: 0;">
            SportBot<span style="color: #10B981;">AI</span>
          </h1>
        </div>
        
        ${content}
        
        <!-- Footer -->
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} SportBot AI. All rights reserved.</p>
          <p>
            <a href="https://${SITE_CONFIG.domain}" style="color: #10B981;">Visit Website</a> |
            <a href="https://${SITE_CONFIG.domain}/contact" style="color: #10B981;">Contact Support</a>
          </p>
          <p style="font-size: 11px; color: #64748b;">
            SportBot AI provides analytical insights for educational purposes only.
            We do not offer betting tips or guarantees. 18+ only.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// SUBSCRIPTION EMAILS
// ============================================

/**
 * Welcome email after successful subscription
 */
export async function sendWelcomeEmail(
  email: string,
  planName: string
): Promise<boolean> {
  // Normalize plan name for comparison
  const plan = planName.toUpperCase();
  const displayName = plan === 'PREMIUM' ? 'Premium' : 'Pro';

  const proFeatures = `
    <li>✅ 10 AI analyses per day</li>
    <li>✅ 50 AI chat messages per day</li>
    <li>✅ All sports covered</li>
    <li>✅ Advanced AI analysis</li>
    <li>✅ Pre-match insights & streaks</li>
    <li>✅ Analysis history (30 days)</li>
    <li>✅ My Teams favorites</li>
    <li>✅ Priority support</li>
  `;

  const premiumFeatures = `
    <li>✅ Unlimited AI analyses</li>
    <li>✅ Unlimited AI chat messages</li>
    <li>✅ All sports covered</li>
    <li>✅ Edge Alerts (value detection)</li>
    <li>✅ Advanced statistics & trends</li>
    <li>✅ Unlimited analysis history</li>
    <li>✅ My Teams favorites</li>
    <li>✅ Priority support 24/7</li>
  `;

  const html = emailWrapper(`
    <h2 style="color: #10B981; margin-bottom: 20px;">Welcome to SportBot AI ${displayName}! 🎉</h2>
    
    <p>Thank you for subscribing! Your account has been upgraded and you now have access to all ${displayName} features.</p>
    
    <h3 style="color: #f8fafc; margin-top: 30px;">What's included:</h3>
    <ul style="color: #cbd5e1; line-height: 1.8;">
      ${plan === 'PREMIUM' ? premiumFeatures : proFeatures}
    </ul>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/analyzer" style="${buttonStyle}">
        Start Analyzing →
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      If you have any questions, just reply to this email or contact us at ${SUPPORT_EMAIL}
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Welcome to SportBot AI ${planName}! 🎉`,
    html,
  });
}

/**
 * Subscription renewed successfully
 */
export async function sendRenewalEmail(
  email: string,
  planName: string,
  nextBillingDate: Date
): Promise<boolean> {
  const formattedDate = nextBillingDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = emailWrapper(`
    <h2 style="color: #10B981;">Subscription Renewed ✓</h2>
    
    <p>Your SportBot AI ${planName} subscription has been renewed successfully.</p>
    
    <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Plan:</strong> ${planName}</p>
      <p style="margin: 10px 0 0 0;"><strong>Next billing date:</strong> ${formattedDate}</p>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px;">
      Thank you for continuing to use SportBot AI!
    </p>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/analyzer" style="${buttonStyle}">
        Continue Analyzing
      </a>
    </div>
  `);

  return sendEmail({
    to: email,
    subject: `Your SportBot AI subscription has been renewed`,
    html,
  });
}

/**
 * Payment failed notification
 */
export async function sendPaymentFailedEmail(
  email: string,
  planName: string
): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="color: #ef4444;">Payment Failed ⚠️</h2>
    
    <p>We were unable to process your payment for SportBot AI ${planName}.</p>
    
    <p>Please update your payment method to continue using ${planName} features.</p>
    
    <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #fbbf24;">
        <strong>What happens next:</strong>
      </p>
      <ul style="color: #cbd5e1; margin-top: 10px;">
        <li>We'll retry the payment in a few days</li>
        <li>If payment continues to fail, your subscription will be paused</li>
        <li>Update your payment method to avoid interruption</li>
      </ul>
    </div>
    
    <div style="text-align: center;">
      <a href="https://billing.stripe.com/p/login/test" style="${buttonStyle}">
        Update Payment Method
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px;">
      Need help? Contact us at ${SUPPORT_EMAIL}
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `⚠️ Action required: Payment failed for SportBot AI`,
    html,
  });
}

/**
 * Subscription cancelled confirmation
 */
export async function sendCancellationEmail(
  email: string,
  planName: string,
  endDate: Date
): Promise<boolean> {
  const formattedDate = endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = emailWrapper(`
    <h2 style="color: #f8fafc;">Subscription Cancelled</h2>
    
    <p>Your SportBot AI ${planName} subscription has been cancelled.</p>
    
    <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;">
        <strong>Access until:</strong> ${formattedDate}
      </p>
      <p style="margin: 10px 0 0 0; color: #94a3b8;">
        You'll continue to have ${planName} access until this date.
      </p>
    </div>
    
    <p>After this date, you'll be moved to the Free plan with limited features.</p>
    
    <h3 style="color: #f8fafc; margin-top: 30px;">Changed your mind?</h3>
    <p>You can resubscribe anytime to get your ${planName} features back instantly.</p>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/pricing" style="${buttonStyle}">
        View Plans
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      We'd love to know why you cancelled. Reply to this email with your feedback—it helps us improve!
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Your SportBot AI subscription has been cancelled`,
    html,
  });
}

/**
 * Trial ending soon reminder (if you add trials)
 */
export async function sendTrialEndingEmail(
  email: string,
  daysLeft: number
): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="color: #fbbf24;">Your trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'} ⏰</h2>
    
    <p>Hope you've been enjoying SportBot AI! Your free trial is coming to an end.</p>
    
    <p>To continue using AI-powered sports analysis, choose a plan that works for you:</p>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/pricing" style="${buttonStyle}">
        Choose Your Plan
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      Questions? Just reply to this email!
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `⏰ Your SportBot AI trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html,
  });
}

/**
 * Welcome email for new user registration
 */
export async function sendRegistrationWelcomeEmail(
  email: string,
  name?: string
): Promise<boolean> {
  const displayName = name || 'there';

  const html = emailWrapper(`
    <h2 style="color: #10B981;">Welcome to SportBot AI! 🎉</h2>
    
    <p>Hey ${displayName},</p>
    
    <p>Thanks for creating your account! You're now part of a community of sports enthusiasts who use AI to understand matches better.</p>
    
    <h3 style="color: #f8fafc; margin-top: 30px;">What you can do now:</h3>
    <ul style="color: #cbd5e1; line-height: 1.8;">
      <li>✅ Get your first AI match analysis for free</li>
      <li>✅ Chat with our AI about any upcoming match</li>
      <li>✅ Browse pre-match insights and team stats</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/matches" style="${buttonStyle}">
        Explore Matches →
      </a>
    </div>
    
    <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="margin: 0; color: #fbbf24;"><strong>💡 Pro tip:</strong></p>
      <p style="margin: 10px 0 0 0; color: #cbd5e1;">
        Upgrade to Pro or Premium to unlock unlimited analyses, AI chat, and advanced insights. 
        <a href="https://${SITE_CONFIG.domain}/pricing" style="color: #10B981;">See plans →</a>
      </p>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px;">
      Questions? Just reply to this email - we're happy to help!
    </p>
  `);

  return sendEmail({
    to: email,
    subject: `Welcome to SportBot AI! 🎉`,
    html,
  });
}

// ============================================
// ADMIN NOTIFICATION EMAILS
// ============================================

// Admin emails to notify on purchases
const ADMIN_NOTIFICATION_EMAILS = [
  'stefanmitrovic93@gmail.com',
  'gogecmaestrotib92@gmail.com',
];

/**
 * Notify admins when a new purchase is made
 */
export async function sendAdminPurchaseNotification(
  customerEmail: string,
  planName: string,
  amount?: string
): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="color: #10B981;">🎉 New Purchase!</h2>
    
    <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Customer:</strong> ${customerEmail}</p>
      <p style="margin: 10px 0 0 0;"><strong>Plan:</strong> ${planName}</p>
      ${amount ? `<p style="margin: 10px 0 0 0;"><strong>Amount:</strong> ${amount}</p>` : ''}
      <p style="margin: 10px 0 0 0;"><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Belgrade' })}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/admin" style="${buttonStyle}">
        View Admin Dashboard →
      </a>
    </div>
  `);

  // Send to all admin emails
  const results = await Promise.all(
    ADMIN_NOTIFICATION_EMAILS.map((adminEmail) =>
      sendEmail({
        to: adminEmail,
        subject: `💰 New ${planName} Subscription - ${customerEmail}`,
        html,
      })
    )
  );

  return results.every((r) => r);
}

// ============================================
// TOOL REVIEW OUTREACH EMAILS
// ============================================
// ⚠️  THIS IS THE STANDARD OUTREACH TEMPLATE
// ============================================
// ALL tool review outreach MUST use this function.
// DO NOT create alternative email templates elsewhere!
// 
// Why this template works:
// - Casual, human tone ("Hey!" not "Dear Sir/Madam")
// - Gets to the point fast (review link upfront)
// - Simple ask (badge for dofollow, no pressure)
// - Signed by "Stefan" (consistent brand voice)
// - No salesy language or emoji spam
// ============================================

/**
 * Send friendly outreach email when a tool review is published
 * 
 * @param email - Contact email address
 * @param toolName - Name of the tool (e.g. "Metabet")
 * @param reviewUrl - Full URL to the review (e.g. "https://www.sportbotai.com/blog/tools/metabet-review")
 */
export async function sendToolReviewOutreach(
  email: string,
  toolName: string,
  reviewUrl: string
): Promise<boolean> {
  // Use PNG for email compatibility (SVG doesn't work in most email clients)
  const logoUrl = 'https://www.sportbotai.com/logo-icon.png';

  // Clean URL for the badge page (review URL + #badge anchor or dedicated page)
  const badgePageUrl = `${reviewUrl}#badge`;

  // More human, less corporate email
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>Hey!</p>
  
  <p>I just wanted to give you a heads up – we wrote a review of <strong>${toolName}</strong> and published it on our site.</p>
  
  <p style="margin: 25px 0;">
    <a href="${reviewUrl}" style="display: inline-block; background: #10B981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Check out the review →</a>
  </p>
  
  <p>We run <a href="https://sportbotai.com" style="color: #10B981;">SportBot AI</a> (sports analytics) and thought ${toolName} was worth featuring. Hope you like what we wrote!</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  
  <p><strong>Quick thing:</strong> Right now the link to your site is nofollow (standard for reviews). But if you'd like it changed to <strong>dofollow</strong>, I'm happy to do that.</p>
  
  <p>Just add our small badge somewhere on your site and let me know. Takes like 2 minutes:</p>
  
  <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: #1e293b; border-radius: 8px;">
      <img src="${logoUrl}" alt="SportBot AI" width="20" height="20" style="border-radius: 4px;">
      <span style="color: white; font-size: 13px;">Featured on SportBot AI</span>
    </div>
    <p style="margin: 15px 0 0 0;">
      <a href="${badgePageUrl}" style="color: #10B981; font-size: 14px;">Get the code →</a>
    </p>
  </div>
  
  <p style="color: #666; font-size: 14px;">No pressure though – the review stays up either way. Just thought I'd offer.</p>
  
  <p style="margin-top: 30px;">
    Cheers,<br>
    Stefan<br>
    <span style="color: #888; font-size: 14px;">SportBot AI</span>
  </p>
</body>
</html>
  `.trim();

  return sendEmail({
    to: email,
    subject: `Wrote a review of ${toolName}`,
    html,
  });
}

