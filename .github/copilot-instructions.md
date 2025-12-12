# SportBot AI - Copilot Instructions

## Project Overview

SportBot AI is an AI-powered sports analytics platform built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**. It provides match analysis with probability estimates, value detection, and risk assessment. **Important**: This is an educational/analytical tool, NOT a tipster service.

## Mission

"Understand any match in 60 seconds" - We sell understanding, not winning.

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── analyze/       # POST /api/analyze - AI match analysis
│   │   ├── sports/        # GET /api/sports - List available sports
│   │   ├── events/[sport] # GET /api/events/{sport} - List events
│   │   ├── odds/[sport]   # GET /api/odds/{sport} - Get odds (uses quota)
│   │   └── stripe/        # Stripe checkout & webhooks
│   ├── analyzer/          # /analyzer - Main analysis tool
│   ├── pricing/           # /pricing - Subscription plans
│   ├── terms/             # /terms - Legal pages
│   ├── privacy/           # /privacy
│   └── responsible-gambling/
├── components/            # React components
│   ├── Header.tsx         # Global navigation
│   ├── Footer.tsx         # Footer with disclaimer
│   ├── AnalyzerForm.tsx   # Match input form (manual mode)
│   ├── AnalyzerFormLive.tsx # Match input with live API data
│   ├── ResultCard.tsx     # Analysis results display
│   └── PricingCards.tsx   # Stripe checkout integration
├── lib/                   # Utility libraries
│   └── odds-api.ts        # The Odds API client and helpers
└── types/                 # TypeScript interfaces (AnalyzeRequest, AnalyzeResponse)
```

## Key Patterns

- **App Router**: Uses `page.tsx` files for routing, `layout.tsx` for shared layouts
- **Server/Client Components**: API routes are server-side; interactive components use `'use client'`
- **API Response Types**: All API responses follow `AnalyzeResponse` interface in `src/types/index.ts`
- **Styling**: Use Tailwind utility classes + custom `.btn-primary`, `.card`, `.input-field` from `globals.css`

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
```

## External Integrations

### The Odds API (Sports Data)
- Service: `src/lib/odds-api.ts` - centralized API client
- Endpoints:
  - `/api/sports` - Lists available sports (FREE, no quota)
  - `/api/events/{sport}` - Lists upcoming events (FREE, no quota)
  - `/api/odds/{sport}` - Gets odds from bookmakers (USES QUOTA: 1 per region/market)
- Config: Set `ODDS_API_KEY` in `.env.local`
- Free tier: 500 requests/month
- Docs: https://the-odds-api.com/liveapi/guides/v4/

### Stripe (Payments)
- Checkout: `src/app/api/stripe/create-checkout-session/route.ts`
- Webhook: `src/app/api/stripe/webhook/route.ts`
- Config: Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in `.env.local`

### AI Analysis (TODO)
- Currently uses mock data in `/api/analyze`
- Replace `generateMockAnalysis()` with OpenAI/Claude API call
- Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `.env.local`

## Critical Rules

1. **Disclaimers are mandatory** - Every analysis must include `responsibleGamblingNote`
2. **Never guarantee outcomes** - Use words like "estimate", "probability", "analysis"
3. **18+ only** - Enforce age restrictions in UI/copy
4. **Stripe Price IDs** - Must be real IDs from Stripe Dashboard (replace placeholders in `PricingCards.tsx`)
5. **API Quota Management** - Only `/api/odds/{sport}` uses quota; sports/events are free
