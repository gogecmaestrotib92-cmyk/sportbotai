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
  const greeting = userName ? `Hey ${userName.split(' ')[0]}` : 'Hey';
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const subject = `🎯 Weekend Top Picks - ${today}`;
  
  // Build match cards HTML
  // Sort by confidence DESC, take only 2 matches, show lowest confidence unlocked
  const sortedMatches = [...matches].sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  
  // Common styles as short variables to reduce HTML size
  const S = { // Styles
    card: 'background:#1e293b;border-radius:8px;padding:14px;margin-bottom:10px',
    title: 'font-size:16px;font-weight:600;color:#f8fafc;margin-bottom:8px',
    sub: 'font-size:11px;color:#64748b;margin-bottom:6px',
    txt: 'font-size:13px;color:#94a3b8',
    g: '#10B981', // green
    p: '#6366f1', // purple
  };
  
  const matchCardsHtml = sortedMatches.map((match, i) => {
    const isLastMatch = i === sortedMatches.length - 1;
    
    if (isLastMatch) {
      // UNLOCKED - lowest confidence pick (but still good!)
      return `<div style="${S.card};border-left:3px solid ${S.g}"><div style="${S.sub}">✅ FREE PICK · ${match.league}</div><div style="${S.title}">${match.homeTeam} vs ${match.awayTeam}</div><div style="margin-bottom:8px"><span style="background:${S.g};color:#0f172a;padding:4px 10px;border-radius:4px;font-size:13px;font-weight:700">${match.confidence}%</span> <span style="color:${S.g};font-weight:700;font-size:14px">${match.prediction}</span>${match.edge ? ` <span style="color:#fbbf24;font-size:13px">⚡${match.edge}</span>` : ''}</div><p style="margin:0;${S.txt};line-height:1.4">${match.headline}</p><p style="margin:8px 0 0;font-size:11px;color:#64748b">🕐 Kickoff: ${match.kickoff}</p></div>`;
    } else {
      // LOCKED - the premium pick they're missing
      const edge = ((match.confidence - 50) * 0.1).toFixed(1);
      return `<div style="${S.card};border-left:3px solid ${S.p};background:linear-gradient(135deg,#1e293b,#312e81)"><div style="font-size:11px;color:#a5b4fc;margin-bottom:6px">🔒 PRO PICK · ${match.league}</div><div style="${S.title}">${match.homeTeam} vs ${match.awayTeam}</div><div style="background:rgba(99,102,241,.2);border-radius:6px;padding:12px;text-align:center"><p style="margin:0 0 4px;color:#e0e7ff;font-size:14px;font-weight:600">🎯 ${match.confidence}% confidence pick</p><p style="margin:0;color:#a5b4fc;font-size:12px">Our AI found <b>+${edge}% edge</b> on this match</p></div><p style="margin:10px 0 0;font-size:11px;color:#64748b;text-align:center"><a href="https://sportbotai.com/pricing" style="color:${S.g};font-weight:600">Unlock this pick →</a></p></div>`;
    }
  }).join('');
  
  const html = `<!DOCTYPE html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif"><div style="max-width:600px;margin:0 auto;padding:20px 16px;background:#0f172a;color:#e2e8f0"><div style="text-align:center;margin-bottom:20px"><img src=https://sportbotai.com/logo-icon.png width=40 height=40 alt="SportBot AI"><h1 style="color:#f8fafc;margin:8px 0 4px;font-size:20px">Today's Top Picks</h1><p style="color:#64748b;margin:0;font-size:13px">${today}</p></div><p style="font-size:15px;margin:0 0 6px;line-height:1.5">${greeting}!</p><p style="font-size:14px;margin:0 0 16px;color:#94a3b8;line-height:1.5">Our AI analyzed 50+ matches today. Here's what stood out:</p>${matchCardsHtml}<div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;text-align:center"><p style="margin:0 0 4px;font-size:14px;color:#f8fafc">Want all daily picks + full analysis?</p><p style="margin:0 0 12px;font-size:12px;color:#64748b">Pro members get 10 analyses/day, AI chat, and edge detection.</p><a href=https://sportbotai.com/pricing style="display:inline-block;background:#10B981;color:#0f172a;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px">Try Pro · $0.66/day →</a></div><p style="font-size:14px;margin:16px 0 0;color:#94a3b8">Good luck today! 🍀</p><p style="font-size:13px;margin:4px 0 0;color:#64748b">— Stefan, SportBot AI</p><div style="margin-top:20px;padding-top:12px;border-top:1px solid #334155;font-size:10px;color:#64748b;text-align:center">© 2026 SportBot AI · <a href=https://sportbotai.com style="color:#10B981">Website</a> · 18+ only<br><a href="https://sportbotai.com/unsubscribe?email=${encodeURIComponent(email)}" style="color:#64748b">Unsubscribe</a></div></div></body></html>`;

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