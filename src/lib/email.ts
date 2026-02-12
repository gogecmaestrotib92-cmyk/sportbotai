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
  text?: string;
  replyTo?: string;
}

/**
 * Send an email using Brevo API
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions): Promise<boolean> {
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
        ...(text && { textContent: text }),
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
// TOOL REVIEW OUTREACH EMAIL - PREMIUM VERSION
// ============================================
// Design principles:
// - Clean, minimal design (looks like personal email)
// - Plain text feel with subtle styling
// - Human, conversational tone (professional, not corporate)
// - Value-first approach (give before asking)
// - Single clear CTA button
// - Mobile-friendly table layout
// - Includes plain text fallback
// ============================================

/**
 * Send premium outreach email when a tool review is published
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
  
  // Premium, minimal HTML email - looks like a personal email, not marketing
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #374151;">
        
        <p style="margin: 0 0 20px 0;">Hi there,</p>
        
        <p style="margin: 0 0 20px 0;">
          I'm Stefan from SportBot AI. We cover sports analytics tools and platforms, 
          and I recently wrote a feature on <strong>${toolName}</strong>.
        </p>
        
        <p style="margin: 0 0 25px 0;">
          Thought you might want to take a look:
        </p>
        
        <p style="margin: 0 0 30px 0;">
          <a href="${reviewUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">Read the Review</a>
        </p>
        
        <p style="margin: 0 0 20px 0;">
          The link back to your site is currently set to nofollow. If you'd like it 
          upgraded to dofollow, just let me know – happy to do that in exchange for 
          a small mention or badge on your site.
        </p>
        
        <p style="margin: 0 0 20px 0;">
          Either way, the review stays up. No strings attached.
        </p>
        
        <p style="margin: 35px 0 0 0; color: #6b7280;">
          Best,<br>
          <strong style="color: #374151;">Stefan</strong><br>
          <span style="font-size: 13px;">Founder, <a href="https://www.sportbotai.com" style="color: #10B981; text-decoration: none;">SportBot AI</a></span>
        </p>
        
        <p style="margin: 30px 0 0 0; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #9ca3af;">
          P.S. If you want the badge, <a href="${reviewUrl}#badge" style="color: #10B981; text-decoration: none;">grab the code here</a> – takes 30 seconds.
        </p>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Plain text version for email clients that prefer it
  const text = `Hi there,

I'm Stefan from SportBot AI. We cover sports analytics tools and platforms, and I recently wrote a feature on ${toolName}.

Thought you might want to take a look:
${reviewUrl}

The link back to your site is currently set to nofollow. If you'd like it upgraded to dofollow, just let me know – happy to do that in exchange for a small mention or badge on your site.

Either way, the review stays up. No strings attached.

Best,
Stefan
Founder, SportBot AI
https://www.sportbotai.com

P.S. If you want the badge, grab the code here: ${reviewUrl}#badge`;

  return sendEmail({
    to: email,
    subject: `We featured ${toolName}`,
    html,
    text,
  });
}

// ============================================
// FREE USER NURTURE EMAILS
// ============================================

import { prisma } from './prisma';

interface TopMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string; // e.g. "15:00"
  confidence: number; // 0-100
  prediction: string; // e.g. "Home Win", "Over 2.5", "BTTS"
  edge?: string; // e.g. "+4.2% edge"
  headline: string; // Short analysis headline
}

/**
 * Daily Top Matches email for FREE users
 * 
 * Shows them top 3 high-confidence matches to demonstrate value.
 * Much better than a generic "upgrade" email!
 * 
 * Also tracks the send in EmailCampaign table.
 */
export async function sendDailyTopMatchesEmail(
  userId: string,
  email: string,
  userName: string | null,
  matches: TopMatch[]
): Promise<boolean> {
  const greeting = userName ? userName.split(' ')[0] : 'there';
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const subject = `Weekend Picks · ${today}`;
  
  // Sort by confidence DESC, take top 2
  const sortedMatches = [...matches].sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  const freePick = sortedMatches[sortedMatches.length - 1]; // lowest confidence = free
  const proPick = sortedMatches.length > 1 ? sortedMatches[0] : null; // highest = locked
  
  // --- Free pick row ---
  const freePickHtml = freePick ? `<tr>
      <td style="padding:16px 0;border-bottom:1px solid #1e293b">
        <div style="font-size:15px;font-weight:600;color:#f8fafc;letter-spacing:-0.3px">${freePick.homeTeam} v ${freePick.awayTeam}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:3px">${freePick.league} · ${freePick.kickoff}</div>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #1e293b;text-align:right;white-space:nowrap">
        <div style="font-size:14px;font-weight:600;color:#10B981">${freePick.prediction}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:3px">${freePick.confidence}%${freePick.edge ? ` · ${freePick.edge}` : ''}</div>
      </td>
    </tr>` : '';
  
  // --- Pro pick row (locked) ---
  const proPickHtml = proPick ? `<tr>
    <td style="padding:16px 0" colspan="2">
      <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:14px;color:#94a3b8;letter-spacing:-0.3px">${proPick.homeTeam} v ${proPick.awayTeam} <span style="color:#64748b">·</span> <span style="color:#475569">███ ███</span></div>
        <div style="margin-top:8px"><a href="https://www.sportbotai.com/pricing" style="font-size:13px;color:#10B981;text-decoration:none;font-weight:500">Unlock with Pro →</a></div>
      </div>
    </td>
  </tr>` : '';
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#080a0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#080a0e">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

  <!-- Header -->
  <tr><td style="padding:0 0 32px;text-align:center">
    <div style="font-size:11px;font-weight:600;color:#10B981;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">SportBot AI</div>
    <h1 style="margin:0;font-size:24px;font-weight:300;color:#f8fafc;letter-spacing:-0.5px">Weekend Picks</h1>
    <div style="width:40px;height:1px;background:#10B981;margin:16px auto 0"></div>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:0 0 28px">
    <p style="margin:0;font-size:15px;color:#f1f5f9;line-height:1.7">Hey ${greeting},</p>
    <p style="margin:12px 0 0;font-size:15px;color:#cbd5e1;line-height:1.7">Here's what stood out from today's matches.</p>
  </td></tr>

  <!-- Divider label -->
  <tr><td style="padding:0 0 12px">
    <div style="font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:1.5px">Today's picks</div>
  </td></tr>

  <!-- Picks table -->
  <tr><td style="padding:0 0 8px">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${freePickHtml}
      ${proPickHtml}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:28px 0;text-align:center">
    <a href="https://www.sportbotai.com/matches" style="display:inline-block;background:#10B981;color:#0a0a0b;padding:14px 40px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:-0.2px">View full analysis</a>
  </td></tr>

  <!-- Thin divider -->
  <tr><td style="padding:0"><div style="height:1px;background:#1e293b"></div></td></tr>

  <!-- Pro nudge -->
  <tr><td style="padding:24px 0;text-align:center">
    <p style="margin:0;font-size:13px;color:#94a3b8">Want all picks + edge detection daily? <a href="https://www.sportbotai.com/pricing" style="color:#10B981;text-decoration:none;font-weight:500">Try Pro →</a></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 0 0;border-top:1px solid #1e293b;text-align:center">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8">
      Stefan · <a href="https://www.sportbotai.com" style="color:#64748b;text-decoration:none">sportbotai.com</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#475569;line-height:1.6">
      For analytical purposes only · Not financial advice · 18+<br>
      <a href="https://www.sportbotai.com/api/unsubscribe?email=${encodeURIComponent(email)}" style="color:#475569;text-decoration:underline">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;

  const sent = await sendEmail({
    to: email,
    subject,
    html,
  });

  // Track in database
  if (sent) {
    try {
      await prisma.emailCampaign.create({
        data: {
          type: 'DAILY_PICKS',
          subject,
          userId,
          userEmail: email,
          userName,
          matchesData: JSON.parse(JSON.stringify(matches)),
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[Email] Failed to track campaign:', error);
    }
  }

  return sent;
}

// ============================================
// AFFILIATE PROGRAM EMAILS
// ============================================

/**
 * Email to admin when someone applies for affiliate program
 */
export async function sendAffiliateApplicationNotification(
  applicantName: string,
  applicantEmail: string,
  website: string | null,
  promotionPlan: string
): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="color: #10B981; margin-bottom: 20px;">New Affiliate Application 🤝</h2>
    
    <p>Someone has applied to become an affiliate partner!</p>
    
    <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${applicantName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${applicantEmail}</p>
      <p style="margin: 0 0 10px 0;"><strong>Website:</strong> ${website || 'Not provided'}</p>
      <p style="margin: 0;"><strong>Promotion Plan:</strong></p>
      <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">${promotionPlan}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="https://${SITE_CONFIG.domain}/admin/affiliates" style="${buttonStyle}">
        Review Application →
      </a>
    </div>
  `);

  // Send to all admin emails
  const adminEmails = ['gogecmaestrotib92@gmail.com', 'aiinstamarketing@gmail.com'];
  
  for (const adminEmail of adminEmails) {
    await sendEmail({
      to: adminEmail,
      subject: `🤝 New Affiliate Application: ${applicantName}`,
      html,
    });
  }

  return true;
}

// ============================================
// WEEKLY EDGE REPORT EMAIL
// ============================================

interface WeeklyPick {
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickoff: string;
  prediction: string;
  confidence: number;
  edge: string;
  insight: string;
}

interface TrackRecord {
  totalPicks: number;
  correct: number;
  hitRate: number;
  streak?: string; // e.g. "W3" or "L1"
}

interface WeeklyEdgeReportData {
  picks: WeeklyPick[];
  trackRecord: TrackRecord;
  weeklyInsight: {
    title: string;
    body: string;
  };
  proPick?: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    confidence: number;
  };
}

/**
 * Weekly Edge Report email for FREE users
 * 
 * "The Edge Report" — sent every Tuesday at 10:00 CET
 * Structure: Track Record → 3 Free Picks → Weekly Insight → Pro Preview
 */
export async function sendWeeklyEdgeReport(
  userId: string,
  email: string,
  userName: string | null,
  data: WeeklyEdgeReportData
): Promise<boolean> {
  const greeting = userName ? userName.split(' ')[0] : 'there';
  const today = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric',
  });
  
  const subject = `The Edge Report · ${today}`;
  
  // --- Pick rows (clean table) ---
  const pickRowsHtml = data.picks.map((pick) => {
    return `<tr>
      <td style="padding:16px 0;border-bottom:1px solid #1e293b">
        <div style="font-size:15px;font-weight:600;color:#f8fafc;letter-spacing:-0.3px">${pick.homeTeam} v ${pick.awayTeam}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:3px">${pick.league} · ${pick.kickoff}</div>
      </td>
      <td style="padding:16px 0;border-bottom:1px solid #1e293b;text-align:right;white-space:nowrap">
        <div style="font-size:14px;font-weight:600;color:#10B981">${pick.prediction}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:3px">${pick.confidence}% · ${pick.edge}</div>
      </td>
    </tr>`;
  }).join('');
  
  // --- Pro Preview row (blurred/locked) ---
  const proRowHtml = data.proPick ? `<tr>
    <td style="padding:16px 0" colspan="2">
      <div style="background:#111827;border:1px solid #1e293b;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:14px;color:#94a3b8;letter-spacing:-0.3px">${data.proPick.homeTeam} v ${data.proPick.awayTeam} <span style="color:#64748b">·</span> <span style="color:#475569">███ ███</span></div>
        <div style="margin-top:8px"><a href="https://www.sportbotai.com/pricing" style="font-size:13px;color:#10B981;text-decoration:none;font-weight:500">Unlock with Pro →</a></div>
      </div>
    </td>
  </tr>` : '';
  
  // --- Full Email ---
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#080a0e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#080a0e">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">

  <!-- Header -->
  <tr><td style="padding:0 0 32px;text-align:center">
    <div style="font-size:11px;font-weight:600;color:#10B981;text-transform:uppercase;letter-spacing:2px;margin-bottom:6px">SportBot AI</div>
    <h1 style="margin:0;font-size:24px;font-weight:300;color:#f8fafc;letter-spacing:-0.5px">The Edge Report</h1>
    <div style="width:40px;height:1px;background:#10B981;margin:16px auto 0"></div>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:0 0 28px">
    <p style="margin:0;font-size:15px;color:#f1f5f9;line-height:1.7">Hey ${greeting},</p>
    <p style="margin:12px 0 0;font-size:15px;color:#cbd5e1;line-height:1.7">3 picks this week. Here's where we see value.</p>
  </td></tr>

  <!-- Track Record (minimal) -->
  <tr><td style="padding:0 0 28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:8px">
      <tr>
        <td style="padding:20px;text-align:center;width:33%">
          <div style="font-size:24px;font-weight:600;color:#f8fafc">${data.trackRecord.hitRate.toFixed(0)}%</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px">Hit rate</div>
        </td>
        <td style="padding:20px;text-align:center;width:34%;border-left:1px solid #1e293b;border-right:1px solid #1e293b">
          <div style="font-size:24px;font-weight:600;color:#f8fafc">${data.trackRecord.correct}<span style="color:#64748b;font-weight:300">/${data.trackRecord.totalPicks}</span></div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px">Last 7 days</div>
        </td>
        <td style="padding:20px;text-align:center;width:33%">
          <div style="font-size:24px;font-weight:600;color:#10B981">${data.trackRecord.streak || '—'}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px">Streak</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Divider label -->
  <tr><td style="padding:0 0 12px">
    <div style="font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:1.5px">This week's picks</div>
  </td></tr>

  <!-- Picks table -->
  <tr><td style="padding:0 0 8px">
    <table width="100%" cellpadding="0" cellspacing="0">
      ${pickRowsHtml}
      ${proRowHtml}
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:28px 0;text-align:center">
    <a href="https://www.sportbotai.com/matches" style="display:inline-block;background:#10B981;color:#0a0a0b;padding:14px 40px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:-0.2px">View full analysis</a>
  </td></tr>

  <!-- Thin divider -->
  <tr><td style="padding:0"><div style="height:1px;background:#1e293b"></div></td></tr>

  <!-- Insight -->
  <tr><td style="padding:28px 0">
    <div style="font-size:11px;font-weight:500;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px">Weekly insight</div>
    <div style="font-size:16px;font-weight:600;color:#f8fafc;letter-spacing:-0.3px;line-height:1.4;margin-bottom:10px">${data.weeklyInsight.title}</div>
    <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.7">${data.weeklyInsight.body}</p>
  </td></tr>

  <!-- Thin divider -->
  <tr><td style="padding:0"><div style="height:1px;background:#1e293b"></div></td></tr>

  <!-- Pro nudge (one line, subtle) -->
  <tr><td style="padding:24px 0;text-align:center">
    <p style="margin:0;font-size:13px;color:#94a3b8">Want all picks + edge detection daily? <a href="https://www.sportbotai.com/pricing" style="color:#10B981;text-decoration:none;font-weight:500">Try Pro →</a></p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 0 0;border-top:1px solid #1e293b;text-align:center">
    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.8">
      Stefan · <a href="https://www.sportbotai.com" style="color:#64748b;text-decoration:none">sportbotai.com</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#475569;line-height:1.6">
      For analytical purposes only · Not financial advice · 18+<br>
      <a href="https://www.sportbotai.com/api/unsubscribe?email=${encodeURIComponent(email)}" style="color:#475569;text-decoration:underline">Unsubscribe</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>

</body>
</html>`;
  
  const sent = await sendEmail({
    to: email,
    subject,
    html,
  });
  
  // Track in database
  if (sent) {
    try {
      await prisma.emailCampaign.create({
        data: {
          type: 'WEEKLY_EDGE_REPORT',
          subject,
          userId,
          userEmail: email,
          userName,
          matchesData: JSON.parse(JSON.stringify(data.picks)),
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error('[Email] Failed to track Edge Report campaign:', error);
    }
  }
  
  return sent;
}

/**
 * Email to affiliate when their application is approved
 */
export async function sendAffiliateApprovalEmail(
  email: string,
  name: string,
  password: string,
  referralCode: string
): Promise<boolean> {
  const dashboardUrl = `https://${SITE_CONFIG.domain}/affiliate/dashboard`;
  const referralLink = `https://${SITE_CONFIG.domain}/?ref=${referralCode}`;

  const html = emailWrapper(`
    <h2 style="color: #10B981; margin-bottom: 20px;">Welcome to SportBot AI Affiliate Program! 🎉</h2>
    
    <p>Hi ${name},</p>
    
    <p>Great news! Your affiliate application has been approved. You can now start earning <strong>30% recurring commission</strong> on every referral!</p>
    
    <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #f8fafc; margin: 0 0 15px 0;">Your Login Details</h3>
      <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 0 0 10px 0;"><strong>Password:</strong> <code style="background: #334155; padding: 2px 8px; border-radius: 4px;">${password}</code></p>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">Please change your password after first login.</p>
    </div>
    
    <div style="background: #064e3b; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #10B981; margin: 0 0 10px 0;">Your Referral Link</h3>
      <p style="margin: 0; word-break: break-all;">
        <a href="${referralLink}" style="color: #34d399;">${referralLink}</a>
      </p>
    </div>
    
    <h3 style="color: #f8fafc; margin-top: 30px;">Commission Structure</h3>
    <ul style="color: #cbd5e1; line-height: 1.8;">
      <li>💰 <strong>30%</strong> recurring commission on all plans</li>
      <li>🍪 <strong>90-day</strong> cookie duration</li>
      <li>💵 <strong>$50</strong> minimum payout</li>
      <li>📅 Monthly payouts (Net-30)</li>
    </ul>
    
    <div style="text-align: center;">
      <a href="${dashboardUrl}" style="${buttonStyle}">
        Access Your Dashboard →
      </a>
    </div>
    
    <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
      If you have any questions, reply to this email or contact us at ${SUPPORT_EMAIL}
    </p>
  `);

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to SportBot AI Affiliate Program!',
    html,
  });
}