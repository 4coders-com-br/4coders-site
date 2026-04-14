# Options Strategies 101: The Long Call

> **Tutorial Strategy** for the Little Trader Learning Platform
> Asset: SynthETF (fictional index)  |  Strategy: Long Call  |  Timeframe: Daily

---

## Overview

This is the first tutorial in the **Options Strategies 101** series. It teaches fundamental options concepts through a hands-on simulation of a Long Call strategy on synthetic data.

### What You'll Learn
- What a call option is and how it works
- How to time entries using SMA crossover + RSI filter
- How to manage positions with take-profit, stop-loss, and time-based exits
- How to read execution results, equity curves, and trade blotters
- How parameter tuning affects strategy performance

---

## The SynthETF Asset

SynthETF is a **fictional index** generated deterministically from a seed-based random walk:

- **Base price:** 100.0
- **Daily volatility:** ~1.5%
- **Regime shifts:** trending-up, trending-down, ranging, volatile
- **History:** 780 daily bars (~3 years)
- **Seed:** 42 (reproducible)

The data includes realistic features: trending periods, mean-reversions, volatility clusters, and regime changes.

---

## Strategy Rules

### Entry Signal
1. **SMA Crossover:** Close price crosses above the 20-day Simple Moving Average
2. **RSI Filter:** 14-period RSI must be below 70 (not overbought)
3. **No Open Position:** Can only enter when flat
4. **Cooldown:** Must wait 3 bars after the last exit

**Entry Action:** Buy 1 ATM Call with 30 DTE

### Exit Conditions (priority order)

| Exit | Condition | Default |
|------|-----------|---------|
| **Take Profit** | Premium gain ≥ target | +50% |
| **Stop Loss** | Premium loss ≥ threshold | -30% |
| **ATR Stop** | Underlying < entry − ATR×mult | 2.0× |
| **Time Exit** | DTE ≤ threshold | 5 days |

---

## Tunable Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `sma-period` | 20 | 10–50 | SMA lookback period |
| `rsi-period` | 14 | 7–21 | RSI calculation period |
| `rsi-ceiling` | 70 | 60–80 | Maximum RSI for entry |
| `profit-target-pct` | 0.50 | 0.20–1.00 | Take profit threshold |
| `stop-loss-pct` | -0.30 | -0.50 to -0.10 | Stop loss threshold |
| `dte-entry` | 30 | 14–45 | DTE when entering |
| `dte-exit` | 5 | 2–10 | DTE exit threshold |
| `cooldown-bars` | 3 | 1–5 | Bars between trades |
| `atr-period` | 14 | 7–21 | ATR calculation period |
| `atr-stop-mult` | 2.0 | 1.0–4.0 | ATR multiplier for stop |

---

## Expected Results (Default Parameters)

| Metric | Value |
|--------|-------|
| Total Trades | ~29 |
| Wins | ~14 (48%) |
| Break-Even | ~2 (7%) |
| Losses | ~13 (45%) |
| Total P&L | +9.31 (cumulative %) |
| Max Drawdown | ~0.45 |
| Avg Holding | ~4 bars |

**Key insight:** The strategy is profitable despite a <50% win rate because average wins are larger than average losses.

---

## Running the Tutorial

### From the Strategy IDE
1. Navigate to the Strategy IDE workspace
2. Click the **Tutorial 101** button
3. Use the Simulation Transport slider to step through bars
4. Observe: OHLC chart, trade markers, payoff diagram, metrics

### From the REPL
```clojure
(require '[com.little-trader.domain.tutorial-long-call :as tlc])

;; Run with defaults
(let [result (tlc/run-tutorial {:verbose? false})]
  (:metrics result))

;; Run with custom parameters
(let [params (assoc-in tlc/default-params [:sma-period :value] 10)
      bars (com.little-trader.domain.synth-data/generate-synth-bars 42 780)
      result (tlc/run-simulation bars params {:iv 0.30 :verbose? false})]
  (:metrics result))
```

### From the API
```bash
curl -X POST http://localhost:8080/api/strategy-ide/tutorial-101 \
  -H "Content-Type: application/json" \
  -d '{"verbose": true}'
```

---

## Architecture

### Files

| File | Purpose |
|------|---------|
| `domain/synth_data.cljc` | SynthETF bar generator + topic persistence |
| `domain/tutorial_long_call.cljc` | Strategy rules + simulation engine |
| `domain/strategy_executor.clj` | Verbose tick logging support |
| `server/strategy_ide_api.clj` | `/tutorial-101` endpoint |
| `ui/rf/events.cljs` | `:tutorial-101/run` re-frame event |
| `ui/strategy_editor.cljs` | Tutorial 101 button |
| `ui/learn.cljs` | Options 101 lesson content |

### Data Flow

```
[Tutorial 101 Button] → :tutorial-101/run event
  → POST /api/strategy-ide/tutorial-101
    → synth-data/ensure-topic! (generate or load from topic)
    → tutorial-long-call/run-tutorial
      → For each bar: compute SMA, RSI, ATR → detect signals → execute
    → Return {bars, trades, signals, metrics, tick-logs}
  → :tutorial-101/result event
    → :strategy-ide/execution (UI metrics, blotter)
    → :sim/init (transport bar)
    → :options/on-execution-result (payoff diagram)
```

---

## Next in the Series

- **102: Bull Call Spread** — Reducing cost with a spread
- **103: Iron Condor** — Profiting from range-bound markets
- **104: Protective Put** — Hedging existing positions
