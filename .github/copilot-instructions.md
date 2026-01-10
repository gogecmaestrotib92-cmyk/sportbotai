# SportBot AI - Copilot Instructions

## Project Overview

SportBot AI is an AI-powered sports analytics platform built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**. It provides match analysis with probability estimates, value detection, and risk assessment. **Important**: This is an educational/analytical tool, NOT a tipster service.

## Mission

"Find where the market is wrong" - We sell edge-finding, not winning.

## 🚨 CRITICAL: Serbian Language Sync

**ALWAYS update Serbian (`/sr`) when updating English:**

1. **Pages**: If you edit `src/app/xyz/page.tsx`, also edit `src/app/sr/xyz/page.tsx`
2. **Components**: If you edit `ComponentX.tsx`, also edit `ComponentXI18n.tsx` if it exists
3. **Translations**: Update `src/lib/i18n/translations.ts` for any new/changed text
4. **Structure**: If page structure changes (add/remove sections), mirror in Serbian

**Key i18n files:**
- `src/lib/i18n/translations.ts` - Main translation strings
- `src/components/*I18n.tsx` - Localized component versions
- `src/app/sr/` - Serbian page routes

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

### Perplexity (Real-Time Sports Intelligence)
- Service: `src/lib/perplexity.ts` - Real-time web search for live sports data
- Used by: SportBot Agent (`/api/agent`) for live match research
- Features:
  - Injury news, lineup updates, breaking news
  - Manager quotes and press conference insights
  - Form analysis and recent results
  - Odds movements and market trends
- Config: Set `PERPLEXITY_API_KEY` in `.env.local`
- Models: `sonar` (fast), `sonar-pro` (quality)
- Falls back gracefully if not configured
- Docs: https://docs.perplexity.ai/

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

## 🚨 CRITICAL: Chat Response Data Standards

**When formatting match analysis for chat (`formatLiveAnalysisForChat` or similar), ALWAYS include ALL available data from `AnalyzeResponse`:**

### Required Data (if available in response):
- ✅ `briefing.headline` + `briefing.verdict` + `briefing.confidenceRating`
- ✅ `briefing.keyPoints` - ALL of them, not just 2-3
- ✅ `probabilities` - homeWin, draw, awayWin percentages
- ✅ `oddsComparison` - homeEdge, drawEdge, awayEdge (THIS IS OUR KEY VALUE PROP!)
- ✅ `momentumAndForm` - recent W/L/D form for both teams
- ✅ `injuryContext` - key injuries affecting the match
- ✅ `preMatchInsights.viralStats` - interesting/viral stats
- ✅ `upsetPotential` - upset alerts with reasons
- ✅ `marketStability` - line movement warnings
- ✅ `riskAnalysis` - risk level + trap match warnings
- ✅ `tacticalAnalysis.keyBattles` - tactical matchups
- ✅ `tacticalAnalysis.expertConclusionOneLiner` - expert verdict
- ✅ `responsibleGambling.disclaimer` - ALWAYS include

### NEVER do this:
- ❌ Return just probabilities - that's useless
- ❌ Skip edge/value data - that's literally our product
- ❌ Ignore form/injuries - users need context
- ❌ Forget the disclaimer - legal requirement

### Key Files:
- `src/app/api/ai-chat/stream/route.ts` - `formatLiveAnalysisForChat()` function
- `src/lib/verified-match-prediction.ts` - `formatMatchPredictionContext()` function
- `src/types/index.ts` - `AnalyzeResponse` interface (source of truth for available fields)

## 🚨 CRITICAL: Query Intelligence Standards

**The Query Intelligence system (`src/lib/query-intelligence.ts`) MUST be smart enough to understand user intent from minimal/short queries:**

### Smart Features (ALWAYS maintain these):
1. **Short query detection** - "Roma Sassuolo" → MATCH_PREDICTION
2. **Implicit match detection** - Two teams mentioned = match prediction
3. **Context inference** - Infer intent from entity types (player → stats, teams → match)
4. **Typo tolerance** - Common abbreviations work (Man U, Juve, etc.)

### Query Examples That MUST Work:
- ✅ `"Roma Sassuolo"` → MATCH_PREDICTION (no verbs needed)
- ✅ `"Lakers Celtics prediction"` → MATCH_PREDICTION
- ✅ `"罗马对阵萨索洛"` (Chinese) → Translate → MATCH_PREDICTION
- ✅ `"Luka stats"` → PLAYER_STATS
- ✅ `"how is Arsenal doing"` → FORM_CHECK
- ✅ `"who won Chelsea game"` → MATCH_RESULT

### NEVER require:
- ❌ Complete sentences ("Who will win the match between...")
- ❌ Specific keywords ("prediction", "analysis", "who will win")
- ❌ Perfect grammar or spelling

### Key Functions:
- `isShortMatchQuery()` - Detects "Team1 Team2" pattern
- `inferIntentFromContext()` - Infers intent from entity types
- `classifyIntentByPatterns()` - Regex pattern matching
- `classifyWithLLM()` - LLM fallback for ambiguous queries

