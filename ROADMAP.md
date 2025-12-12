# SportBot AI - Product Roadmap

> **Mission:** "Understand any match in 60 seconds"
> 
> **Positioning:** AI Match Research Assistant - Not tips, not predictions, just clarity.

---

## 🎯 Core Value Proposition

| What We Sell | What We Deliver |
|--------------|-----------------|
| Time savings | AI summary instead of 30 min research |
| Confidence | "I understand this match now" feeling |
| Entertainment | Sports fans love data, even without betting |
| Education | Learn WHY odds move, HOW form matters |

---

## 💰 Monetization Model

**$9.99/month** or **$79/year** (6 weeks free)

| Tier | Features |
|------|----------|
| **Free** | 3 analyses/day, basic insights |
| **Pro** | Unlimited analyses, history, favorites, share cards, AI briefings |

---

## 🗓️ 12-Week Execution Plan

### Phase 1: Core Experience (Week 1-2) 🔨
*Goal: Make the single analysis AMAZING*

- [x] **60-Second AI Briefing** - One-tap summary button on any match ✅
- [x] **Audio Briefing** - Listen to analysis (TTS) ✅
- [x] **Rebrand to SportBot AI** - Update all references ✅
- [x] **Home Page Improvements** - Show trending matches, not empty state ✅

### Phase 2: Personalization (Week 3-4) 👤
*Goal: Give users reasons to return*

- [x] **My Teams** - Follow up to 10 teams ✅
- [x] **Favorites Dashboard** - Personalized feed of followed teams ✅
- [ ] **Quick Analysis Queue** - Batch analyze multiple matches

### Phase 3: Viral Growth (Week 5-6) 📢
*Goal: Users spread the app for us*

- [x] **Share Cards** - Beautiful, branded insight cards ✅
- [x] **Social Preview Images** - Auto-generated OG images per match (@vercel/og) ✅
- [x] **Copy Insights** - One-click copy formatted analysis ✅

### Phase 4: Monetization (Week 7-8) 💳
*Goal: Convert free users to paid*

- [x] **Payment Wall** - Limit free tier to 3/day ✅
- [x] **Pro Badge** - Visual indicator for subscribers ✅
- [x] **History Unlock** - Free users see last 24h only ✅
- [x] **Usage Limit Banner** - Shows when running low ✅

### Phase 5: Retention (Week 9-12) 📊
*Goal: Keep users subscribed*

- [ ] ~~Weekly Digest Email~~ (Skipped - legal/spam risks)
- [x] **Team Intelligence Profiles** - Deep dive per team ✅
- [x] **Team Search API** - Find teams by name ✅
- [x] **Form Trend Charts** - Visual form over time ✅
- [ ] **Trend Tracking** - Form over time graphs (extended)

---

## 🚫 NOT Building (Yet)

| Feature | Reason |
|---------|--------|
| Push Notifications | Easy to annoy users, legal risk |
| Multi-match comparison | Only 2% would use it |
| Historical accuracy dashboard | Don't have track record yet |
| Market movement alerts | Legal gray zone |
| Betting integrations | Stay educational |

---

## 📋 Current Status

### ✅ Already Built
- Match analyzer with AI insights
- Multi-sport support (Soccer, NBA, NFL, NHL, UFC)
- User authentication
- Stripe payments infrastructure
- Analysis history
- Responsive UI
- **60-Second AI Briefing** (Phase 1)
- **Trending Matches Homepage** (Phase 1)
- **Audio Briefings via TTS** (Phase 1)
- **My Teams Favorites System** (Phase 2)
- **Favorites Dashboard at /my-teams** (Phase 2)
- **FavoriteButton component** (Phase 2)
- **ShareCard with social sharing** (Phase 3)
- **OG Image API at /api/og** (Phase 3)
- **CopyInsightsButton** (Phase 3)
- **ProBadge component** (Phase 4)
- **UsageLimitBanner component** (Phase 4)
- **HistoryAccessBanner component** (Phase 4)
- **History 24h restriction for free users** (Phase 4)
- **Team Profile API /api/team/[teamId]** (Phase 5 - NEW)
- **Team Search API /api/team/search** (Phase 5 - NEW)
- **Team Profile Page /team/[teamId]** (Phase 5 - NEW)
- **FormTrendChart component** (Phase 5 - NEW)

### 🔧 Needs Work
- Quick analysis queue for batch processing
- Remove debug logging in production

---

## 🎯 Success Metrics

| Week | Target |
|------|--------|
| Week 4 | 100 daily active users |
| Week 8 | 50 paying subscribers |
| Week 12 | $500 MRR |

---

## 📝 Notes

- Focus on **presentation**, not algorithms
- Sell **understanding**, not winning
- Every feature should answer: "Will this make someone pay $9.99/month?"

---

*Last Updated: December 13, 2025*
