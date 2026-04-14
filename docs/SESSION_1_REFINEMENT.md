# Session 1 Refinement — E2E Test Results & Issues

> Date: 2026-04-04
> Branch: `feature/EXECUTOR001`

## E2E Test Summary

### Strategies Tested

| Strategy | Type | Bars | Trades | WR | P&L | PF | Sides | Price Kind |
|----------|------|------|--------|----|-----|----|----|-----------|
| btc-near-expiry | Simple (options) | 200 | 4 | 100% | +838 | - | 3C/1P | ohlc |
| btc-near-expiry | Simple (500 bars) | 500 | 12 | 83% | +2249 | 14.8 | 6C/6P | ohlc |
| btc-near-expiry | Multi-TF (1h) | 300 | 8 | 87.5% | +1464 | - | 6C/2P | ohlc |
| btc-near-expiry | Multi-TF (15m) | 300 | 7 | 71% | +800 | - | 4C/3P | ohlc |
| btc-near-expiry | Multi-TF (1d) | 300 | 7 | 86% | +1327 | - | 4C/3P | ohlc |
| momentum-scalper | Medium (renko) | 200 | 7 | 43% | +200 | - | 4S/3L | renko |
| momentum-scalper | Medium (500) | 500 | 12 | 75% | +1500 | - | 7S/5L | renko |
| momentum-scalper | Medium (1000) | 1000 | 22 | 73% | +2600 | - | 10S/12L | renko |
| e2e-test-strategy | Renko stress | 200 | 12 | 58% | +8300 | - | 6S/6L | renko |

### Data Consistency Checks — PASS

| Check | btc-near-expiry | momentum-scalper |
|-------|:-:|:-:|
| Bars match request | PASS | PASS |
| Bars time-sorted | PASS | PASS |
| Trades have P&L | PASS | PASS |
| Trade count matches summary | PASS | PASS |
| P&L sum matches total | PASS | PASS |
| Equity curve present | PASS (200) | PASS (340) |
| Entry/exit indices valid | PASS | N/A |
| Correct side types | call/put | long/short |
| Has bricks (renko) | N/A | PASS |

### Payoff Bridge Check — PASS
- 8 option trades → 8 payoff legs generated
- 8 unique strikes
- All premiums positive
- Spot set from last bar close ($91,868)

### Live FS Data — PASS
- BTC: $67,446 (reasonable range)
- DVOL: 63.76% (reasonable)
- Options: 517 calls + 517 puts
- OHLCV: 8 bars (Pulsar accumulating)

---

## Issues Found

### CRITICAL
None.

### HIGH
1. **`profit-factor` is nil** for some strategies — the summary returns `nil` when gross-loss is 0 (100% WR). Need to handle `(/ gross-profit 0)` → `:infinity` or a large number.
2. **momentum-scalper trades lack `:id` field** — `trades-have-ids` failed. The renko executor doesn't assign trade IDs. Trade blotter may not key correctly.
3. **Multi-window not implemented** — react-resizable-panels compiled but never verified in browser. Panel presets, tear-off, keyboard shortcuts all missing.

### MEDIUM
4. **Payoff legs use entry-price as strike** — btc-near-expiry trades have `:entry-price` but not `:strike`. The actual option strike should come from the strategy's `option-lens` config, not the underlying entry price. Currently legs show strikes at the underlying price level (~86k-91k) rather than proper option strikes (e.g. 85000, 90000, 95000).
5. **Payoff premium estimated from P&L** — `|pnl/qty|` is the realized P&L, not the premium paid. Needs actual premium from the strategy execution.
6. **No tick-by-tick sync** — execution results are static; no real-time bar-by-bar replay where all panels update simultaneously.
7. **Collapsible sections use defonce atom** — won't hot-reload properly. State isn't persisted.
8. **Equity curve length mismatches bar count for renko** — 340 equity points vs 500 bars (because equity tracks per-brick, not per-bar).

### LOW
9. **Log verbosity in param-box doesn't filter execution-log** — the select is present but the log component may not read the current verbosity sub.
10. **Renko strategies don't show on payoff diagram** — only call/put sides trigger the bridge; long/short sides are ignored (by design, but could show as synthetic positions).
11. **No error boundary** — if a strategy execution throws, the UI shows nothing. Need error state in execution panel.

---

## Refinement Backlog (Next Work)

### Must Fix Before Demo
- [ ] Handle nil profit-factor (div by zero)
- [ ] Add trade IDs to renko executor trades
- [ ] Verify react-resizable-panels renders in browser (needs user to open page)

### Should Fix
- [ ] Extract actual option strike from strategy config / Deribit book
- [ ] Pass actual premium paid (not estimated from P&L) to payoff legs
- [ ] Add tick-by-tick replay mode (step through bars, all panels update)
- [ ] Persist collapsible section state to localStorage
- [ ] Error boundary in execution panel

### Nice to Have
- [ ] Verbosity filtering in execution-log
- [ ] Synthetic payoff position for renko long/short strategies
- [ ] Panel presets (Trading/Coding/Analysis layouts)
- [ ] Keyboard shortcuts for panel navigation
