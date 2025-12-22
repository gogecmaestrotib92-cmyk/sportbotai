# SportBot AI

AI-powered sports analytics platform. Understand any match in 60 seconds.

<!-- Last updated: December 2025 -->

> ⚠️ **Disclaimer**: SportBot AI is NOT a tipster service. We do not provide guaranteed tips or financial advice. Sports betting carries the risk of losing money. Bet responsibly. 18+ only.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sportbot-ai.git
   cd sportbot-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local and add your keys (see Configuration section below)
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables (.env.local)

Create a `.env.local` file in the root directory:

```env
# The Odds API (REQUIRED for live sports data)
# Get free API key at: https://the-odds-api.com/#get-access
ODDS_API_KEY=your_odds_api_key_here

# Stripe Configuration (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# AI API Keys (OPTIONAL - for future AI implementation)
# OPENAI_API_KEY=sk-your_openai_key
# ANTHROPIC_API_KEY=sk-ant-your_anthropic_key
```

### The Odds API Setup

1. Sign up for free at [The Odds API](https://the-odds-api.com/#get-access)
2. Get your API key from the dashboard
3. Add `ODDS_API_KEY=your_key` to `.env.local`

**Free Tier Limits:**
- 500 requests per month
- `/api/sports` and `/api/events/{sport}` are FREE (no quota)
- `/api/odds/{sport}` uses 1 credit per region per market

### Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Go to Dashboard → Developers → API keys
3. Copy your **Secret key** (starts with `sk_test_` for testing)
4. Create products in Dashboard → Products:
   - **SportBot AI Pro**: $9.99/month (recurring)
   - **SportBot AI Annual**: $79/year (recurring)
5. Copy the **Price IDs** (start with `price_`)
6. Update `src/components/PricingCards.tsx` with your Price IDs:
   ```typescript
   // Line ~25-26: Replace placeholder Price IDs
   priceId: 'price_YOUR_PRO_PRICE_ID',      // Pro plan
   priceId: 'price_YOUR_PREMIUM_PRICE_ID',  // Premium plan
   ```

### Stripe Webhooks (for production)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook secret from CLI output to .env.local
```

## 📁 Project Structure

```
sportbot-ai/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout (header + footer)
│   │   ├── page.tsx             # Home page (/)
│   │   ├── analyzer/page.tsx    # Match analyzer (/analyzer)
│   │   ├── pricing/page.tsx     # Pricing page (/pricing)
│   │   ├── terms/page.tsx       # Terms & Conditions (/terms)
│   │   ├── privacy/page.tsx     # Privacy Policy (/privacy)
│   │   ├── responsible-gambling/page.tsx
│   │   ├── globals.css          # Global styles + Tailwind
│   │   └── api/
│   │       ├── analyze/route.ts     # AI analysis endpoint
│   │       ├── sports/route.ts      # List sports (FREE)
│   │       ├── events/[sport]/route.ts  # List events (FREE)
│   │       ├── odds/[sport]/route.ts    # Get odds (uses quota)
│   │       └── stripe/
│   │           ├── create-checkout-session/route.ts
│   │           └── webhook/route.ts
│   │
│   ├── components/              # React components
│   │   ├── Header.tsx          # Navigation
│   │   ├── Footer.tsx          # Footer with disclaimer
│   │   ├── Hero.tsx            # Landing hero section
│   │   ├── AnalyzerForm.tsx    # Match input form (manual)
│   │   ├── AnalyzerFormLive.tsx # Match input with live API
│   │   ├── ResultCard.tsx      # Analysis results
│   │   └── PricingCards.tsx    # Stripe checkout cards
│   │
│   ├── lib/
│   │   └── odds-api.ts         # The Odds API client
│   │
│   └── types/
│       └── index.ts            # TypeScript interfaces
│
├── .env.example                 # Example environment variables
├── .env.local                   # Local env (git ignored)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding AI Analysis

The current `/api/analyze` endpoint returns mock data. To add real AI:

1. Install OpenAI SDK:
   ```bash
   npm install openai
   ```

2. Edit `src/app/api/analyze/route.ts`:
   ```typescript
   import OpenAI from 'openai';
   
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });
   
   // Replace generateMockAnalysis() with actual API call
   const completion = await openai.chat.completions.create({
     model: "gpt-4",
     messages: [{ role: "user", content: yourPrompt }],
   });
   ```

3. Add `OPENAI_API_KEY` to `.env.local`

## 🌐 Deployment to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel Dashboard:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel URL)
4. Deploy!

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXT_PUBLIC_BASE_URL

# Deploy to production
vercel --prod
```

### Post-Deployment Checklist

- [ ] Update Stripe webhook URL to production domain
- [ ] Switch Stripe keys from `sk_test_` to `sk_live_` for production
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your production URL
- [ ] Test checkout flow with Stripe test cards

## 🧪 Testing

### Stripe Test Cards

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined card |
| 4000 0000 0000 3220 | 3D Secure required |

Use any future expiry date and any 3-digit CVC.

## 📄 Pages Overview

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, pricing teaser |
| `/analyzer` | Match analysis form and results |
| `/pricing` | Subscription plans with Stripe checkout |
| `/terms` | Terms & Conditions |
| `/privacy` | Privacy Policy |
| `/responsible-gambling` | Responsible gambling information |

## 🔒 Important Notes

1. **Disclaimers are mandatory** - Every analysis includes responsible gambling notes
2. **No guaranteed tips** - We provide analysis, not predictions
3. **18+ only** - Age restriction is enforced in UI copy
4. **GDPR compliance** - Privacy policy and data handling documented

## 📞 Support

For questions or issues, please open a GitHub issue.

## 📝 License

This project is for educational purposes. See LICENSE for details.

---

**Remember:** SportBot AI is an analytical tool. Gambling involves risk. Never bet more than you can afford to lose.
