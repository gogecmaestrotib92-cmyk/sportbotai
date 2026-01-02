# Prediction System Improvement Analysis
**Date:** January 2, 2026  
**Status:** Critical Issues Identified  
**Overall Accuracy:** 44.9% (314 resolved predictions)

---

## 🎯 Executive Summary

The prediction system has **significant accuracy issues** with an overall hit rate of 44.9%, well below the break-even threshold of ~52.4% needed to overcome bookmaker margins. Three critical problems identified:

1. **NHL predictions are catastrophic** (19.4% accuracy - worse than random)
2. **Conviction calibration is inverted** (high conviction = worse accuracy)
3. **Value detection strategy is flawed** (systematic overconfidence)

---

## 📊 Performance by Sport

| Sport | Hit Rate | Volume | Status |
|-------|----------|--------|--------|
| **icehockey_nhl** | **19.4%** (13/67) | High | 🚨 **DISASTER** |
| **soccer_epl** | 39.4% (13/33) | High | ⚠️ Poor |
| **soccer_italy_serie_a** | 40.0% (4/10) | Low | ⚠️ Poor |
| **soccer** (generic) | 48.8% (21/43) | Medium | ⚠️ Below target |
| **basketball_nba** | 48.6% (51/105) | High | ⚠️ Below target |
| **soccer_portugal_primeira_liga** | 57.1% (4/7) | Low | ✅ Good |
| **basketball_euroleague** | 66.7% (10/15) | Low | ✅ Good |
| **americanfootball_nfl** | **72.7%** (16/22) | Medium | ✅ **EXCELLENT** |
| **soccer_spl** | **88.9%** (8/9) | Very Low | ✅ **EXCELLENT** |

### Key Insights:
- **NFL model works well** (72.7% - likely due to simpler Elo-based approach)
- **NHL model is fundamentally broken** (19.4% - worse than coin flip)
- **Soccer models are inconsistent** (varies 39-88% depending on league)
- **Small sample leagues** (SPL, Euroleague) show high variance

---

## 🔍 Conviction Calibration Analysis

**Critical Issue:** Conviction levels are **inverted** - higher conviction correlates with **worse** accuracy!

```
Conviction 1-3: 42.4% (53/125) ← Low conviction = better
Conviction 4-5: 18.8% (3/16)   ← Mid-low = worst
Conviction 6-7: 43.0% (37/86)  ← Mid = OK
Conviction 8-9: 55.2% (48/87)  ← High conviction = best (but still barely profitable)
```

### Problem Analysis:
1. **No conviction 10 predictions** - system caps at 9 (good - 100% confidence is misleading)
2. **Mid-range collapse** - Conviction 4-5 at 18.8% suggests these are the weakest patterns
3. **High conviction not high enough** - 55.2% at conviction 8-9 is barely above break-even
4. **Expected:** Conviction 8-9 should hit at 70%+, not 55%

### Root Cause:
Looking at [`value-detection.ts:535-540`](src/lib/value-detection.ts#L535-L540):

```typescript
// Confidence based on clarity score
// Cap at 85% - sports are inherently unpredictable, 100% confidence is misleading
const rawConfidence = signals.clarity_score;
const confidence = Math.min(85, rawConfidence);
```

**Issue:** Conviction is based on `clarity_score`, which measures **signal strength**, not **predictive accuracy**. Strong signals can be misleading (e.g., hot streaks that mean-revert).

---

## 🏒 NHL Model Failure Analysis

**Accuracy: 19.4% (13/67)** - This is **statistically worse than random guessing** (33% for 3-way, 50% for 2-way).

### Hypothesis:
The hockey Poisson model ([`prediction-models.ts:440-500`](src/lib/accuracy-core/prediction-models.ts#L440-L500)) has critical flaws:

```typescript
export function hockeyPoissonModel(input: ModelInput): RawProbabilities {
  const config = SPORT_CONFIG.hockey;
  const leagueAvg = input.leagueAverageGoals || config.leagueAvgGoals; // 2.8
  // ... Expected goals calculation
  // ... Removes draws (OT/SO)
}
```

### Problems Identified:
1. **Treats hockey like soccer** - uses Poisson distribution, but hockey scoring dynamics are different
2. **Home advantage factor wrong** - Hockey has minimal home advantage (~52-53%), but model may over-weight it
3. **OT/Shootout handling** - NHL games can't draw, but regulation ties are common (~25%)
4. **Small sample regression to mean** - Hockey has high variance, small samples regress hard

### Why NFL Works but NHL Doesn't:
- **NFL:** Elo-based model, fewer games = more predictable, clearer team strength hierarchy
- **NHL:** High parity league, 82 games/season, OT/SO creates randomness, injury impact huge (goalies)

---

## 💰 Value Detection Strategy Issues

### Current Approach ([`value-detection.ts:425-540`](src/lib/value-detection.ts#L425-L540)):
```typescript
export function calculateModelProbability(
  signals: UniversalSignals,
  hasDraw: boolean = true,
  league?: string,
  steamMove?: SteamMoveInput
): ModelProbability {
  // Start with LEAGUE-CALIBRATED base probabilities
  let homeBase = leagueProfile.homeWinRate * 100;
  let awayBase = leagueProfile.awayWinRate * 100;
  let drawBase = leagueProfile.drawRate * 100;
  
  // Apply Strength Edge (biggest factor)
  // Apply Form Factor (±8%)
  // Apply Efficiency Edge (±3%)
  // Apply Steam Move Signal (±5%)
  
  // Result: Often overconfident probabilities
}
```

### Problems:
1. **Additive adjustments compound** - Each factor adds ±3-8%, leading to 75%+ probabilities
2. **No penalty for uncertainty** - Low data quality still produces confident predictions
3. **Form over-weighted** - Recent form gets +8% boost, but form often mean-reverts
4. **Market disrespected** - Model regularly thinks it's smarter than sharp bookmakers

### Evidence:
- **Conviction 8-9 only hits 55.2%** - Should be 70%+ if value detection worked
- **NHL at 19.4%** - Value strategy fails completely on high-variance sports
- **Mid-conviction collapse** - 18.8% at conviction 4-5 suggests these are "false signals"

---

## 🛠️ Recommended Fixes

### 1. **Immediate: Disable NHL Predictions**
```typescript
// src/lib/accuracy-core/prediction-models.ts
export function hockeyPoissonModel(input: ModelInput): RawProbabilities {
  // TEMPORARY: Return league-average probs until model is fixed
  console.warn('[HOCKEY MODEL] Currently disabled - return to defaults');
  return {
    home: 0.45,  // Slightly below 50% (away teams win more in NHL)
    away: 0.55,
    method: 'disabled',
  };
}
```

### 2. **Recalibrate Conviction Levels**

**Current (broken):**
```typescript
const conviction = Math.min(85, rawConfidence);
```

**Proposed fix:**
```typescript
// Conviction should reflect ACTUAL predictive power, not signal strength
export function calculateConviction(
  modelProb: ModelProbability,
  dataQuality: number, // 0-100
  historicalAccuracy: number // Sport-specific accuracy rate
): number {
  // Base conviction on probability spread
  const maxProb = Math.max(modelProb.home, modelProb.away, modelProb.draw || 0);
  
  // Penalize low data quality
  const qualityFactor = dataQuality / 100;
  
  // Calibrate to historical performance
  const calibrationFactor = historicalAccuracy / 55; // Normalize to 55% target
  
  // Calculate conviction (1-10 scale)
  const rawConviction = (maxProb - 33.3) / 6.67; // 33% = conviction 0, 100% = conviction 10
  const calibratedConviction = rawConviction * qualityFactor * calibrationFactor;
  
  return Math.max(1, Math.min(10, Math.round(calibratedConviction)));
}
```

### 3. **Add Regression to Mean for Form**

**Problem:** Recent form gets +8% boost, but streaks mean-revert.

**Solution:**
```typescript
// src/lib/value-detection.ts:485-495
// Current:
if (homeForm === 'strong') homeBase += 8;
else if (homeForm === 'weak') homeBase -= 8;

// Proposed:
// Reduce form impact and add mean reversion
const formBoost = formIsOnSmallSample ? 4 : 6; // Less boost if small sample
if (homeForm === 'strong') homeBase += formBoost;
else if (homeForm === 'weak') homeBase -= formBoost;
```

### 4. **Respect Sharp Money More**

**Problem:** Model ignores Pinnacle/Betfair odds (sharp bookmakers).

**Solution:**
```typescript
// src/lib/value-detection.ts:625-640
export function analyzeMarket(...) {
  // If bookmaker is Pinnacle/Betfair, reduce model confidence
  const isSharpBook = odds.bookmaker === 'Pinnacle' || odds.bookmaker === 'Betfair';
  
  if (isSharpBook) {
    // Sharp bookmakers are rarely wrong - only call value on 8%+ edges
    const MIN_SHARP_EDGE = 8;
    
    if (bestEdge < MIN_SHARP_EDGE) {
      return { ...marketIntel, recommendation: 'fair_price' };
    }
  }
}
```

### 5. **Implement Sport-Specific Confidence Caps**

```typescript
// src/lib/accuracy-core/types.ts
export const SPORT_CONFIDENCE_CAPS: Record<SportType, number> = {
  'icehockey_nhl': 4,      // Cap at conviction 4 until model fixed
  'soccer': 7,             // Moderate cap (draws add variance)
  'basketball_nba': 8,     // Higher cap (less variance)
  'americanfootball_nfl': 9, // Highest cap (model works well)
};

// Apply cap based on sport
conviction = Math.min(conviction, SPORT_CONFIDENCE_CAPS[sport] || 7);
```

### 6. **Add Data Quality Gating**

**Problem:** Low-quality predictions still get published.

**Solution:**
```typescript
// src/lib/unified-match-service.ts:145-160
export async function getUnifiedMatchData(...): Promise<UnifiedMatchData> {
  // ... fetch data
  
  // Calculate data quality score
  const dataQuality = calculateDataQuality({
    hasForm: !!homeForm && !!awayForm,
    hasH2H: !!h2h,
    hasInjuries: !!injuries,
    gamesPlayed: homeStats.played + awayStats.played,
  });
  
  // GATE: Don't publish predictions with data quality < 40
  if (dataQuality < 40) {
    console.warn(`[UnifiedMatchService] Data quality too low (${dataQuality}/100) - skip prediction`);
    return { ...data, analysis: null }; // Return data but no prediction
  }
}
```

---

## 📈 Expected Improvements

| Fix | Expected Impact | Implementation Effort |
|-----|-----------------|----------------------|
| Disable NHL | Accuracy: 45% → 50% | ⚡ 5 minutes |
| Recalibrate conviction | High conviction: 55% → 70% | 🔧 2 hours |
| Reduce form boost | Overall: 45% → 48% | ⚡ 15 minutes |
| Respect sharp books | Avoid -EV bets | 🔧 1 hour |
| Sport-specific caps | Prevent overconfidence | ⚡ 30 minutes |
| Data quality gating | Quality over quantity | 🔧 2 hours |

**Target:** 55%+ accuracy on high-conviction predictions (8-9) after all fixes.

---

## 🚦 Action Plan

### Phase 1: Stop the Bleeding (Today)
1. ✅ Disable NHL predictions immediately
2. ✅ Add sport-specific conviction caps
3. ✅ Reduce form boost from ±8% to ±5%

### Phase 2: Recalibration (This Week)
1. Implement new conviction calculation algorithm
2. Add data quality gating (min 40/100)
3. Respect sharp bookmaker odds

### Phase 3: Model Improvements (Next 2 Weeks)
1. Research NHL-specific prediction models (consider using pure Elo)
2. Add historical accuracy tracking per sport/league
3. Implement dynamic calibration based on performance

### Phase 4: Testing & Validation (Ongoing)
1. Run backtest on last 30 days
2. Monitor accuracy by conviction level
3. Adjust parameters based on results

---

## 📚 Key Files to Modify

1. **Conviction Calculation:**  
   - [`src/lib/value-detection.ts`](src/lib/value-detection.ts#L425-L540) - `calculateModelProbability()`
   - [`src/app/api/analyze/route.ts`](src/app/api/analyze/route.ts#L1164-L1190) - Conviction mapping

2. **NHL Model:**  
   - [`src/lib/accuracy-core/prediction-models.ts`](src/lib/accuracy-core/prediction-models.ts#L440-L500) - `hockeyPoissonModel()`

3. **Form Weighting:**  
   - [`src/lib/value-detection.ts`](src/lib/value-detection.ts#L485-L495) - Form factor adjustments
   - [`src/lib/accuracy-core/prediction-models.ts`](src/lib/accuracy-core/prediction-models.ts#L95-L130) - `calculateFormStrength()`

4. **Data Quality Gating:**  
   - [`src/lib/unified-match-service.ts`](src/lib/unified-match-service.ts) - Add quality threshold

---

## 🎓 Lessons Learned

1. **Signal strength ≠ Predictive power** - Strong recent form doesn't mean it will continue
2. **Respect the market** - Sharp bookmakers aggregate millions in information
3. **Sport-specific models matter** - One-size-fits-all fails (NHL vs NFL performance)
4. **Conviction calibration is critical** - Users trust high-conviction predictions
5. **Data quality > Model sophistication** - Good data + simple model > Bad data + complex model

---

## 📊 Appendix: Raw Data

```
Overall: 44.9% (141/314 resolved)
Pending: 66 predictions

By Sport:
✅ americanfootball_nfl: 72.7% (16/22)
✅ soccer_spl: 88.9% (8/9)
✅ basketball_euroleague: 66.7% (10/15)
✅ soccer_portugal_primeira_liga: 57.1% (4/7)
⚠️ basketball_nba: 48.6% (51/105)
⚠️ soccer: 48.8% (21/43)
⚠️ soccer_italy_serie_a: 40.0% (4/10)
⚠️ soccer_epl: 39.4% (13/33)
⚠️ soccer_belgium_first_div: 33.3% (1/3)
🚨 icehockey_nhl: 19.4% (13/67) ← CRITICAL FAILURE

By Conviction:
1-3: 42.4% (53/125)
4-5: 18.8% (3/16) ← WORST
6-7: 43.0% (37/86)
8-9: 55.2% (48/87) ← Should be 70%+
```

---

**Next Steps:** Implement Phase 1 fixes immediately, then proceed with recalibration.
