# Renko Trading System - AI/LLM Integration

**Leveraging Large Language Models for Trading Intelligence**

## Table of Contents
1. [Architecture](#architecture)
2. [LLM Integration Points](#llm-integration-points)
3. [Use Cases](#use-cases)
4. [Implementation](#implementation)
5. [Prompt Engineering](#prompt-engineering)
6. [Evaluation & Feedback Loops](#evaluation--feedback-loops)

---

## Architecture

### LLM Service Architecture

```
┌─────────────────────────────────────────┐
│        Frontend / User Interface         │
│  - Chat interface for strategy analysis │
│  - Suggested parameters display         │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │  API Gateway    │
        │ (Rate limiting) │
        └────────┬────────┘
                 │
┌────────────────┼────────────────────┐
│                │                    │
│  ┌─────────────▼────────────┐  ┌───▼──────────┐
│  │  LLM Orchestrator        │  │ Context      │
│  │  (Claude API)            │  │ Manager      │
│  │  - Request routing       │  │ - Gather    │
│  │  - Response formatting   │  │   relevant  │
│  │  - Error handling        │  │   context   │
│  └──────────────────────────┘  └──────────────┘
│                │
│  ┌─────────────▼──────────────────┐
│  │ Prompt Templates & Engineering │
│  │ - Strategy explanation         │
│  │ - Parameter suggestion         │
│  │ - Trade analysis              │
│  │ - Error diagnosis             │
│  └────────────────────────────────┘
│
└─────────────────────────────────────┘
         │                │
    ┌────▼─────┐    ┌─────▼────┐
    │ Datomic   │    │ Feedback │
    │ Database  │    │ Store    │
    └───────────┘    └──────────┘
```

---

## LLM Integration Points

### 1. Strategy Explanation

**Purpose**: Explain why a specific trade was executed

**Trigger**: User clicks on a trade in history

**Input Context**:
- Trade entry/exit prices and timestamps
- Signals that triggered entry/exit
- Market conditions (volatility, trends)
- Strategy configuration
- Historical brick patterns

**Prompt Template**:
```
You are an expert trading analyst. Analyze this trade and provide clear explanation.

TRADE DETAILS:
- Entry: $100 @ 2024-01-15 10:30 UTC
- Exit: $105 @ 2024-01-15 11:45 UTC
- Side: LONG
- P&L: +$50 (5% profit)

ENTRY SIGNAL:
- Type: renko
- Action: double_brick_start_long
- Pattern: [+1, +1, -1] reversal

MARKET CONTEXT:
- Brick size: $1.00
- Daily volatility: 2.5%
- Volume: Above average

STRATEGY CONFIG:
- Double brick enabled: true
- DEMA confirmation: true
- Stop loss: -2%
- Take profit: Trailing with 1% start

Explain:
1. Why did the double brick pattern trigger?
2. How did market conditions support this trade?
3. What made this trade profitable?
4. What risk factors were present?
```

**Output**: Human-readable explanation of trade logic

### 2. Parameter Suggestion Engine

**Purpose**: Suggest strategy parameters based on historical performance

**Trigger**: User requests optimization advice

**Input Context**:
- Historical trade data (last 100 trades)
- Performance metrics (win rate, profit factor)
- Market characteristics
- Account size and risk tolerance

**Prompt Template**:
```
Analyze this strategy performance and suggest parameter optimizations.

HISTORICAL PERFORMANCE:
- Total trades: 50
- Win rate: 55%
- Profit factor: 2.1
- Average win: $150
- Average loss: $75
- Max drawdown: 8%
- Consecutive losses: 3
- Best trading time: 14:00-18:00 UTC

CURRENT PARAMETERS:
- Brick size: $100
- One brick enabled: true
- Double brick enabled: true
- Multi brick enabled: true
- DEMA confirmation: true
- DEMA period: 1
- Stop loss: -2%
- Take profit ranges:
  - 1% profit → 0.5% trail
  - 2% profit → 1.0% trail

MARKET CHARACTERISTICS:
- Pair: BTC/USD
- Average daily range: $1000-$2000
- Volatility: Medium (2-3%)
- Best direction: Long (65% win rate)

Based on this analysis:
1. Which parameters should be adjusted?
2. What brick size would suit volatility better?
3. Should I increase signal selectivity?
4. Any risk management improvements?
5. Suggest 3 alternative configurations to backtest
```

**Output**: Specific parameter suggestions with reasoning

### 3. Trade Analysis & Post-Mortem

**Purpose**: Analyze why trades failed or succeeded

**Trigger**: User requests analysis of specific losing trade

**Input Context**:
- Trade details (entry, exit, P&L)
- Signals generated
- Market data during trade
- Comparison with similar trades

**Prompt**:
```
Analyze this losing trade to identify lessons learned.

TRADE DETAILS:
- Entry: LONG at $100 on 2024-01-15 10:30
- Exit: STOPPED OUT at $98 on 2024-01-15 10:45
- P&L: -$20 (2% loss)
- Status: Stopped at loss limit

ENTRY SIGNAL:
- Type: renko
- Action: one_brick_start_long
- Market: Consolidation phase

EXIT REASON:
- Type: risk
- Action: stop_loss
- Loss threshold: -2%

SIMILAR TRADES HISTORY:
- Win rate on one-brick in consolidation: 40%
- Win rate on one-brick in trending: 70%
- Average duration: 2-5 minutes

What went wrong and how to improve?
1. Was this a setup issue or bad timing?
2. Should I add filters for consolidation?
3. What confluence signals would improve entry quality?
4. Should stop loss be tighter or trailing?
5. What probability should I expect from this pattern?
```

**Output**: Root cause analysis and improvement suggestions

### 4. Error Diagnosis & Debugging

**Purpose**: Diagnose system errors and suggest fixes

**Trigger**: Monitoring system detects anomaly

**Input Context**:
- Error messages and logs
- System state at time of error
- Recent changes
- Performance metrics before/after

**Prompt**:
```
Help diagnose this system error.

ERROR LOG:
[2024-01-15T10:30:45Z] ERROR - NullPointerException in trade execution
[2024-01-15T10:30:45Z] java.lang.NullPointerException at com.little_trader.domain.trade/create-trade
[2024-01-15T10:30:45Z] Cause: signal object missing :side field

CONTEXT:
- This started 2 hours ago
- No code changes in last 24h
- Kafka lag increased from 5s to 300s
- Database transaction time: 50ms (normal: 20ms)

RECENT CHANGES:
- Deployed new monitoring changes
- Upgraded Datomic client library
- None to trading logic

System metrics:
- Memory usage: 78% (normal: 45%)
- CPU: 95% (normal: 30%)
- GC pauses: 2-3 seconds (normal: 100ms)

Diagnose the issue:
1. What's causing this error?
2. Is it a data issue or code issue?
3. What should be checked first?
4. Quick mitigation steps?
5. Root cause fix?
```

**Output**: Diagnostic steps and fixes

---

## Use Cases

### 1. Interactive Strategy Advisor
```
User: "Why did the BTC trade exit so quickly?"
LLM: "The double-brick pattern triggered exit after just 15 minutes because:
1. Price moved down 1.5 bricks (reversal of the up-trend)
2. The DEMA confirmation showed price below MA
3. Your trailing stop was set to 0.5% - price declined 0.6%

This is actually good risk management - it preserved capital when the setup failed."
```

### 2. Automated Parameter Tuning
```
System: "Analyzing last 100 trades..."
LLM: "Win rate is 52% (good), but most losses come from one-brick signals
in choppy markets. I recommend:

Configuration A (Conservative):
- Disable one-brick on volatility > 3%
- Require DEMA confirmation for all signals
- Expected: 60% win rate, fewer trades

Configuration B (Aggressive):
- Add multi-brick signal with 4+ brick requirement
- Tighter stops on one-brick (1% instead of 2%)
- Expected: 55% win rate, higher profit factor

Run backtest on both to see which suits your risk tolerance."
```

### 3. Learning Mode
```
User: "Help me understand Renko patterns"
LLM: "Let me analyze your trades and teach you:

Pattern: Double-Brick Reversal
Your win rate: 68% (excellent!)
Why it works: After 2 bricks up, a down brick suggests momentum exhaustion.
This often leads to consolidation or reversal.

Real example from your trades:
- Bricks went: [+1, +1, -1]
- Price reversed from $1000 to $980
- You caught a 2% move down
- Entry signal quality: High confidence (DEMA confirmed)

Key learning: Double-brick patterns work best in trending markets
(your data shows 75% win rate vs 60% in choppy markets)."
```

---

## Implementation

### 1. LLM Service Module

**`src/com/little_trader/services/llm.clj`**:
```clojure
(ns com.little-trader.services.llm
  (:require [org.httpkit.client :as http]
            [cheshire.core :as json]
            [clojure.string :as str]))

(def ^:private api-key (System/getenv "ANTHROPIC_API_KEY"))
(def ^:private model "claude-3-5-sonnet-20241022")

(defn call-claude
  "Call Claude API with messages"
  [messages system-prompt max-tokens]
  (let [request {
    :model model
    :max_tokens max-tokens
    :system system-prompt
    :messages messages
  }
        response @(http/post "https://api.anthropic.com/v1/messages"
          {:headers {"anthropic-version" "2023-06-01"
                     "content-type" "application/json"
                     "x-api-key" api-key}
           :body (json/generate-string request)})
        body (json/parse-string (:body response) true)]
    (get-in body [:content 0 :text])))

(defn explain-trade
  "Explain why a trade was executed"
  [trade market-context brick-pattern]
  (let [system-prompt "You are an expert trading analyst. Provide clear, concise explanations of trading patterns and decisions. Focus on risk management and market context."
        user-message (format "
Trade: %s
Entry Price: %.2f
Exit Price: %.2f
P&L: %.2f
Brick Pattern: %s
Market Context: %s

Explain this trade briefly."
          (:id trade) (:entry-price trade) (:exit-price trade)
          (:pnl trade) brick-pattern market-context)]
    (call-claude [{:role "user" :content user-message}] system-prompt 500)))

(defn suggest-parameters
  "Suggest parameter improvements"
  [trade-history performance-metrics market-char]
  (let [system-prompt "You are a trading strategy optimizer. Analyze performance data and suggest specific, testable parameter changes."
        user-message (format "
Trade History (last 50 trades):
%s

Performance Metrics:
%s

Market Characteristics:
%s

Based on this data, suggest 3 alternative parameter configurations I should backtest."
          (pr-str trade-history) (pr-str performance-metrics) (pr-str market-char))]
    (call-claude [{:role "user" :content user-message}] system-prompt 1000)))

(defn analyze-loss
  "Analyze why a trade lost"
  [losing-trade historical-similar-trades]
  (let [system-prompt "You are a trading psychologist and analyst. Help traders learn from losses with constructive, actionable feedback."
        user-message (format "
Losing Trade:
%s

Similar Winning Trades (for comparison):
%s

What can this trader learn from this loss? Be specific and actionable."
          (pr-str losing-trade) (pr-str historical-similar-trades))]
    (call-claude [{:role "user" :content user-message}] system-prompt 800)))

(defn diagnose-error
  "Diagnose system errors"
  [error-log context metrics]
  (let [system-prompt "You are a debugging expert for trading systems. Provide clear diagnostic steps and potential fixes."
        user-message (format "
System Error:
%s

Context:
%s

System Metrics:
%s

What could cause this error? Suggest diagnostic steps."
          error-log context metrics)]
    (call-claude [{:role "user" :content user-message}] system-prompt 1000)))
```

### 2. Prompt Templates

**`src/com/little_trader/services/prompts.clj`**:
```clojure
(ns com.little-trader.services.prompts)

(def ^:const system-prompt-trade-analysis
  "You are an expert trading analyst with deep knowledge of:
   - Renko charts and pattern recognition
   - Technical analysis and market dynamics
   - Risk management and position sizing
   - Cryptocurrency markets

   Provide analysis that is:
   - Specific to the trade details provided
   - Actionable and learning-focused
   - Grounded in market facts
   - Free of unsupported speculation

   Always mention:
   1. What worked in this trade
   2. What could be improved
   3. Risk factors present
   4. Relevant statistics from similar trades")

(def ^:const system-prompt-parameter-suggestion
  "You are a trading strategy optimization expert.

   Suggest parameter changes that are:
   - Evidence-based (use historical data)
   - Specific with numerical values
   - Testable via backtest
   - Ranked by probability of improvement

   Always provide:
   1. Change description
   2. Expected impact (quantified)
   3. Backtest suggestion
   4. Risk considerations")

(defn build-trade-explanation-prompt [trade brick-pattern market-context]
  (format "
Please explain this trading decision:

TRADE DETAILS:
- Entry: $%.2f (Long position)
- Exit: $%.2f
- Duration: %.1f hours
- P&L: $%.2f (%.1f%%)
- Status: %s

ENTRY SIGNAL:
%s

MARKET CONTEXT AT ENTRY:
%s

Provide a 3-paragraph explanation suitable for a trader learning the system."
    (:entry-price trade)
    (or (:exit-price trade) "Open")
    (/ (- (or (:exit-timestamp trade) (System/currentTimeMillis))
          (:entry-timestamp trade))
       3600000.0)
    (:pnl trade)
    (:pnl-percent trade)
    (:status trade)
    (pr-str brick-pattern)
    market-context))

(defn build-parameter-suggestion-prompt [recent-trades metrics]
  (format "
Analyze this strategy performance and suggest optimizations:

RECENT PERFORMANCE (last 50 trades):
- Win rate: %.1f%%
- Profit factor: %.2f
- Average win: $%.2f
- Average loss: $%.2f
- Max consecutive losses: %d

TRADE DETAILS:
%s

Based on this analysis, provide 3 parameter configurations to backtest, ranked by likelihood of improvement."
    (* (:win-rate metrics) 100)
    (:profit-factor metrics)
    (:average-win metrics)
    (:average-loss metrics)
    (:max-consecutive-losses metrics)
    (pr-str (map #(select-keys % [:entry-price :exit-price :side :pnl]) recent-trades))))
```

---

## Prompt Engineering

### Effective Techniques

#### 1. Few-Shot Examples
```
Analyze the following trading patterns and provide win rate estimates:

EXAMPLE 1:
Pattern: [+1, +1, -1]
Market: Trending
DEMA: Confirmed
Result: Win

EXAMPLE 2:
Pattern: [+1, +1, -1]
Market: Choppy
DEMA: Not confirmed
Result: Loss

Now analyze this pattern:
Pattern: [+1, +1, -1]
Market: Consolidating
DEMA: Confirmed
Win rate estimate: ___
```

#### 2. Chain-of-Thought Prompting
```
"Let's analyze this trade step by step:

1. What was the entry signal? (renko double-brick)
2. What market condition triggered it? (uptrend + reversal)
3. What confirmation was present? (DEMA above price)
4. Why did it exit? (trailing stop triggered)
5. What did we learn? (consolidation is risky)

Therefore, this trade demonstrates..."
```

#### 3. Role-Based Prompting
```
"You are a mentor teaching Renko trading to a beginner.

Explain why this trade succeeded in a way a beginner can understand:
- Use simple language
- Avoid jargon without explanation
- Relate to patterns they know
- Emphasize the 'why', not just 'what'"
```

---

## Evaluation & Feedback Loops

### 1. Suggestion Accuracy Tracking

**Track whether suggested parameters improve backtest results**:

```clojure
(defn track-suggestion-accuracy [suggestion actual-results]
  (let [improvement (- (:win-rate actual-results)
                       (:expected-win-rate suggestion))]
    {:suggestion-id (:id suggestion)
     :expected-improvement (:expected-improvement suggestion)
     :actual-improvement improvement
     :accuracy (/ improvement (max 0.01 (:expected-improvement suggestion)))
     :timestamp (System/currentTimeMillis)}))
```

### 2. User Feedback Integration

**Allow users to rate LLM responses**:

```clojure
(defn store-llm-feedback [response-id rating comment helpful-aspects]
  {:response-id response-id
   :rating rating  ;; 1-5 stars
   :comment comment
   :helpful-aspects helpful-aspects  ;; [:accuracy :clarity :actionability]
   :timestamp (System/currentTimeMillis)})
```

### 3. Continuous Improvement

**Fine-tune prompts based on feedback**:
- Track which prompt templates get highest ratings
- Identify patterns in low-rated responses
- A/B test prompt variations
- Update system prompts quarterly based on accumulated feedback

---

## Summary

This AI/LLM integration provides:
- ✅ Interactive strategy explanation
- ✅ Automated parameter suggestions
- ✅ Trade analysis and learning
- ✅ System error diagnosis
- ✅ Educational chatbot capabilities
- ✅ Feedback-driven improvement
- ✅ Enterprise-grade prompting
- ✅ Cost-effective batch processing

The system is designed to **augment human decision-making**, not replace it. All suggestions are backed by historical data and market context.
