import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  sendWelcomeEmail,
  sendRenewalEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
  sendTrialEndingEmail,
  sendRegistrationWelcomeEmail,
  sendToolReviewOutreach,
} from '@/lib/email';
import { SITE_CONFIG } from '@/lib/seo';

// Admin access list
const ADMIN_EMAILS = [
  'gogecmaestrotib92@gmail.com',
  'aiinstamarketing@gmail.com',
  'stefan@automateed.com',
];

// Generate preview HTML without sending
function generatePreviewHtml(templateId: string, params: Record<string, any>): string {
  // Import the email wrapper and styles
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

  const emailWrapper = (content: string): string => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">      <!-- Make all links open in new tab (for iframe preview) -->
      <base target="_blank">    </head>
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

  // Generate content based on template
  switch (templateId) {
    case 'welcome': {
      const plan = (params.planName || 'Pro').toUpperCase();
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

      return emailWrapper(`
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
          If you have any questions, just reply to this email or contact us at ${SITE_CONFIG.email}
        </p>
      `);
    }

    case 'renewal':
      return emailWrapper(`
        <h2 style="color: #10B981; margin-bottom: 20px;">Subscription Renewed! ✅</h2>
        
        <p>Great news! Your ${params.planName} subscription has been successfully renewed.</p>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong style="color: #f8fafc;">Plan:</strong> SportBot AI ${params.planName}</p>
          <p style="margin: 10px 0 0 0;"><strong style="color: #f8fafc;">Next billing date:</strong> ${params.nextBillingDate}</p>
        </div>
        
        <p>Thank you for continuing to trust SportBot AI for your match analysis needs.</p>
        
        <div style="text-align: center;">
          <a href="https://${SITE_CONFIG.domain}/match" style="${buttonStyle}">
            Continue Analyzing →
          </a>
        </div>
      `);

    case 'payment-failed':
      return emailWrapper(`
        <h2 style="color: #f59e0b; margin-bottom: 20px;">⚠️ Payment Failed</h2>
        
        <p>We couldn't process your payment for SportBot AI ${params.planName}.</p>
        
        <p>This usually happens when:</p>
        <ul style="color: #cbd5e1; line-height: 1.8;">
          <li>Your card has expired</li>
          <li>There are insufficient funds</li>
          <li>Your bank blocked the transaction</li>
        </ul>
        
        <p>Please update your payment method to continue using ${params.planName} features:</p>
        
        <div style="text-align: center;">
          <a href="${params.updateUrl}" style="${buttonStyle}">
            Update Payment Method →
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          If you believe this is an error, please contact us at ${SITE_CONFIG.email}
        </p>
      `);

    case 'cancellation':
      return emailWrapper(`
        <h2 style="color: #f8fafc; margin-bottom: 20px;">Subscription Cancelled</h2>
        
        <p>We're sorry to see you go! Your ${params.planName} subscription has been cancelled.</p>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong style="color: #f8fafc;">Access until:</strong> ${params.endDate}</p>
          <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 14px;">
            You'll continue to have ${params.planName} access until this date.
          </p>
        </div>
        
        <p>If you change your mind, you can always resubscribe from your account page.</p>
        
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          We'd love to hear your feedback on how we can improve. Just reply to this email!
        </p>
      `);

    case 'trial-ending':
      return emailWrapper(`
        <h2 style="color: #f59e0b; margin-bottom: 20px;">⏰ Your Trial Ends in ${params.daysLeft} Days</h2>
        
        <p>Just a heads up - your SportBot AI trial is ending soon!</p>
        
        <p>To continue accessing all features, upgrade to Pro or Premium:</p>
        
        <div style="text-align: center;">
          <a href="https://${SITE_CONFIG.domain}/pricing" style="${buttonStyle}">
            View Plans →
          </a>
        </div>
        
        <h3 style="color: #f8fafc; margin-top: 30px;">What you'll lose without a subscription:</h3>
        <ul style="color: #cbd5e1; line-height: 1.8;">
          <li>❌ AI-powered match analysis</li>
          <li>❌ Value detection</li>
          <li>❌ Probability estimates</li>
          <li>❌ Form & momentum insights</li>
        </ul>
        
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          Questions? Reply to this email and we'll help you out!
        </p>
      `);

    case 'registration-welcome':
      return emailWrapper(`
        <h2 style="color: #10B981; margin-bottom: 20px;">Welcome to SportBot AI! 👋</h2>
        
        <p>Hey ${params.name || 'there'},</p>
        
        <p>Thanks for signing up! You now have access to our free match analysis features.</p>
        
        <h3 style="color: #f8fafc; margin-top: 30px;">What you can do now:</h3>
        <ul style="color: #cbd5e1; line-height: 1.8;">
          <li>✅ View match previews and AI analysis</li>
          <li>✅ Check upcoming fixtures across sports</li>
          <li>✅ Access our free tools and resources</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="https://${SITE_CONFIG.domain}/match" style="${buttonStyle}">
            Explore Matches →
          </a>
        </div>
        
        <h3 style="color: #f8fafc; margin-top: 30px;">Want more?</h3>
        <p>Upgrade to <strong>Pro</strong> for full access to exact probabilities, value detection, and unlimited analyses.</p>
        
        <p style="color: #94a3b8; font-size: 14px; margin-top: 30px;">
          Questions? Just reply to this email!
        </p>
      `);

    case 'tool-review-outreach': {
      const logoUrl = 'https://www.sportbotai.com/logo-icon.png';
      const badgePageUrl = `${params.reviewUrl}#badge`;
      
      return emailWrapper(`
        <h2 style="color: #10B981;">We featured ${params.toolName}! 🎉</h2>
        
        <p>Hey there!</p>
        
        <p>Hope you're doing well. I'm Stefan from SportBot AI - we help sports fans find value using AI-powered analysis.</p>
        
        <p>I wanted to let you know that we just published a detailed review of <strong>${params.toolName}</strong> on our site. We genuinely think it's a great tool and wanted to share it with our audience.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${params.reviewUrl}" style="${buttonStyle}">
            View Your Review →
          </a>
        </div>
        
        <h3 style="color: #f8fafc; margin-top: 30px;">Quick note about the link</h3>
        
        <p>Currently, the link to your site is <strong>nofollow</strong> (standard for reviews). But here's the thing - if you'd like us to make it a <strong>dofollow</strong> link, we're happy to do that!</p>
        
        <p>All we ask is that you add our small "Featured on SportBot AI" badge somewhere on your site. It's a win-win: you get SEO juice from a dofollow link, and we get a little visibility. 🤝</p>
        
        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #fbbf24;"><strong>How it works:</strong></p>
          <ol style="color: #cbd5e1; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Click the button below to get the badge code</li>
            <li>Add it anywhere on your site (footer, about page, anywhere works!)</li>
            <li>Reply to this email to let us know</li>
            <li>We'll update your link to dofollow within 24 hours ✓</li>
          </ol>
        </div>
        
        <h3 style="color: #f8fafc;">Your badge:</h3>
        
        <!-- Badge Preview -->
        <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 12px 0;">Preview of how it looks:</p>
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 8px; border: 1px solid #475569;">
            <img src="${logoUrl}" alt="SportBot AI" width="24" height="24" style="border-radius: 4px;">
            <span style="color: white; font-family: system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 500;">Featured on SportBot AI</span>
          </div>
        </div>
        
        <!-- Get Code Button -->
        <div style="text-align: center; margin: 25px 0;">
          <a href="${badgePageUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Get Badge Code →
          </a>
        </div>
        
        <p style="color: #94a3b8; font-size: 14px;">
          No pressure at all - the review stays up either way! Just wanted to offer the option. 😊
        </p>
        
        <p style="margin-top: 30px;">
          Cheers,<br>
          <strong>Stefan</strong><br>
          <span style="color: #94a3b8;">SportBot AI</span>
        </p>
      `);
    }

    default:
      return emailWrapper(`
        <h2 style="color: #f8fafc;">Unknown Template</h2>
        <p>Template "${templateId}" not found.</p>
      `);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId, params, sendTo } = await request.json();

    // Generate preview HTML
    const html = generatePreviewHtml(templateId, params);

    // If sendTo is provided, actually send the test email
    if (sendTo) {
      let sent = false;
      
      switch (templateId) {
        case 'welcome':
          sent = await sendWelcomeEmail(sendTo, params.planName);
          break;
        case 'renewal':
          sent = await sendRenewalEmail(sendTo, params.planName, params.nextBillingDate);
          break;
        case 'payment-failed':
          sent = await sendPaymentFailedEmail(sendTo, params.planName);
          break;
        case 'cancellation':
          sent = await sendCancellationEmail(sendTo, params.planName, new Date(params.endDate));
          break;
        case 'trial-ending':
          sent = await sendTrialEndingEmail(sendTo, params.daysLeft);
          break;
        case 'registration-welcome':
          sent = await sendRegistrationWelcomeEmail(sendTo, params.name);
          break;
        case 'tool-review-outreach':
          sent = await sendToolReviewOutreach(sendTo, params.toolName, params.reviewUrl);
          break;
        default:
          return NextResponse.json({ error: 'Unknown template' }, { status: 400 });
      }

      return NextResponse.json({ sent, html });
    }

    // Just return preview
    return NextResponse.json({ html });
  } catch (error) {
    console.error('[Email Preview] Error:', error);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
