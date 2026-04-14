# Little-Trader: 7-Day Production Plan

**Goal**: Make little-trader run for real trading across multiple assets and strategies.

**Sessions**: 7 days × 4 hours = 28 hours total

---

## System Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           LITTLE-TRADER SYSTEM FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────┐
                                    │   DATA SOURCES   │
                                    └────────┬─────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        │                                    │                                    │
        ▼                                    ▼                                    ▼
┌───────────────┐               ┌────────────────────┐               ┌───────────────┐
│   EXCHANGES   │               │   METATRADER 5    │               │  NEWS/SOCIAL  │
│               │               │                    │               │               │
│ • Bitfinex    │               │ • Forex pairs      │               │ • News APIs   │
│ • Binance     │               │ • CFDs             │               │ • Twitter     │
│ • CCXT        │               │ • Stocks           │               │ • Reddit      │
│               │               │ • Indices          │               │ • Sentiment   │
└───────┬───────┘               └──────────┬─────────┘               └───────┬───────┘
        │                                  │                                  │
        │            WebSocket/REST        │         MQL5 Bridge              │
        │                                  │                                  │
        └──────────────────────────────────┼──────────────────────────────────┘
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │     KAFKA STREAMS      │
                              │                        │
                              │  • ohlcv.raw           │
                              │  • ohlcv.normalized    │
                              │  • signals.detected    │
                              │  • trades.executed     │
                              │  • sentiment.analyzed  │
                              └───────────┬────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        ▼                                 ▼                                 ▼
┌───────────────────┐         ┌───────────────────────┐         ┌───────────────────┐
│  STRATEGY LAYER   │         │   AI/ML LAYER         │         │   SENTIMENT LAYER │
│                   │         │                       │         │                   │
│ Deterministic:    │         │ Neural Networks:      │         │ Analysis:         │
│ • Renko Signals   │         │ • MA Crossover NN     │ ◄──────►│ • News NLP        │
│ • SMA/EMA Cross   │         │ • Renko Pattern NN    │         │ • Social Sentiment│
│ • DEMA Confirm    │         │ • Multi-Asset NN      │         │ • Fear/Greed      │
│ • ATR Sizing      │         │                       │         │                   │
│                   │         │ LLM Agent:            │         │ Alerts:           │
│ Risk Rules:       │         │ • Market Analyst      │         │ • Breaking News   │
│ • Stop Loss       │         │ • Risk Evaluator      │         │ • Trend Shifts    │
│ • Trailing Profit │         │ • Decision Maker      │         │                   │
│ • Position Size   │         │ • Explainer           │         │                   │
└─────────┬─────────┘         └───────────┬───────────┘         └─────────┬─────────┘
          │                               │                               │
          └───────────────────────────────┼───────────────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │   DECISION COMBINER    │
                              │                        │
                              │ • Strategy Weights     │
                              │ • Confidence Thresholds│
                              │ • Risk Limits          │
                              │ • Portfolio Allocation │
                              └───────────┬────────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
                      ▼                   ▼                   ▼
              ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
              │   BACKTEST    │   │ PAPER TRADING │   │  PRODUCTION   │
              │               │   │               │   │               │
              │ Historical    │   │ Live Data     │   │ Real Orders   │
              │ Simulation    │   │ Simulated     │   │ Real Money    │
              │ No Money      │   │ No Money      │   │ Full Risk     │
              │               │   │               │   │               │
              │ Metrics:      │   │ Metrics:      │   │ Metrics:      │
              │ • PnL         │   │ • PnL (sim)   │   │ • PnL (real)  │
              │ • Sharpe      │   │ • Latency     │   │ • Slippage    │
              │ • Drawdown    │   │ • Accuracy    │   │ • Fees        │
              └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
                      │                   │                   │
                      └───────────────────┼───────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │      DATOMIC DB        │
                              │                        │
                              │ • Trades               │
                              │ • Signals              │
                              │ • Models               │
                              │ • Accounts             │
                              │ • Audit Trail          │
                              └───────────┬────────────┘
                                          │
                      ┌───────────────────┼───────────────────┐
                      │                   │                   │
                      ▼                   ▼                   ▼
              ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
              │   FULCRO UI   │   │   REPL/API    │   │  LLM COPILOT  │
              │               │   │               │   │               │
              │ • Dashboard   │   │ • nREPL       │   │ • Chat UI     │
              │ • Charts      │   │ • REST API    │   │ • Voice Cmd   │
              │ • Controls    │   │ • WebSocket   │   │ • Explain     │
              │               │   │               │   │ • Suggest     │
              │ Modes:        │   │ Full Control: │   │               │
              │ • Dev Mode    │   │ • Any query   │   │ Context:      │
              │ • Pilot Mode  │   │ • Any action  │   │ • Portfolio   │
              │ • Both        │   │ • Hot reload  │   │ • Market      │
              └───────────────┘   └───────────────┘   └───────────────┘
```

---

## Component Dependencies Graph

```
                              ┌─────────────────────────────┐
                              │      AUTHENTICATION         │
                              │  (JWT, Session, API Keys)   │
                              └──────────────┬──────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
          ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
          │ EXCHANGE CREDS  │     │  USER ACCOUNTS  │     │   MT5 ACCOUNTS  │
          │                 │     │                 │     │                 │
          │ • API Key/Sec   │     │ • Email/Pass    │     │ • Login/Pass    │
          │ • Permissions   │     │ • Preferences   │     │ • Server        │
          │ • Rate Limits   │     │ • Risk Profile  │     │ • Terminal      │
          └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
                   │                       │                       │
                   └───────────────────────┼───────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │   STRATEGY ASSEMBLY     │
                              │                         │
                              │ Configure:              │
                              │ • Asset Selection       │
                              │ • Strategy Mix          │
                              │ • Risk Parameters       │
                              │ • Execution Mode        │
                              └────────────┬────────────┘
                                           │
        ┌──────────────────────────────────┼──────────────────────────────────┐
        │                                  │                                  │
        ▼                                  ▼                                  ▼
┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
│  DETERMINISTIC    │           │   NN STRATEGIES   │           │  LLM + SENTIMENT  │
│                   │           │                   │           │                   │
│ Pure Rules:       │           │ Trained Models:   │           │ AI-Augmented:     │
│ • SMA Cross       │───Train──►│ • SMA-NN          │◄──Consult─│ • Claude/GPT      │
│ • Renko Signals   │           │ • Renko-NN        │           │ • News Feed       │
│ • MACD            │           │ • Multi-Strat-NN  │           │ • Sentiment       │
│ • Bollinger       │           │                   │           │                   │
│ • Custom Rules    │           │ Self-Learning:    │           │ Reasoning:        │
│                   │           │ • Reinforcement   │           │ • Market Context  │
│ Verification:     │           │ • Online Learning │           │ • Trade Rationale │
│ • NN trains on    │           │ • Drift Detection │           │ • Risk Explain    │
│   deterministic   │           │                   │           │                   │
└───────────────────┘           └───────────────────┘           └───────────────────┘
        │                                  │                                  │
        │         Training Data            │      Predictions                 │
        │              ▼                   │           ▼                      │
        │    ┌─────────────────┐           │    ┌─────────────────┐           │
        │    │ Historical Bars │           │    │ Signal + Conf   │           │
        │    │ Labels from     │           │    │ ─────────────   │           │
        │    │ Strategy Rules  │           │    │ BUY  @ 87%      │           │
        │    └─────────────────┘           │    │ SELL @ 12%      │           │
        │                                  │    │ HOLD @  1%      │           │
        │                                  │    └─────────────────┘           │
        │                                  │                                  │
        └──────────────────────────────────┼──────────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │    EXECUTION ENGINE     │
                              │                         │
                              │ • Order Management      │
                              │ • Position Tracking     │
                              │ • Risk Enforcement      │
                              │ • Multi-Asset Alloc     │
                              └─────────────────────────┘
```

---

## Strategy Combinations Matrix

| Base Strategy | + NN Training | + LLM Agent | + Sentiment | Full Stack |
|--------------|---------------|-------------|-------------|------------|
| **SMA Crossover** | NN learns SMA patterns | LLM confirms/explains | News affects thresholds | SMA-NN + LLM + Sentiment |
| **Renko Signals** | NN learns brick patterns | LLM risk assessment | Social sentiment weight | Renko-NN + LLM + Sentiment |
| **MACD** | NN learns divergence | LLM market context | Earnings calendar | MACD-NN + LLM + News |
| **RSI** | NN learns oversold/bought | LLM timing | VIX correlation | RSI-NN + LLM + Fear/Greed |
| **Bollinger** | NN learns bands | LLM volatility | Options sentiment | BB-NN + LLM + Put/Call |
| **Custom Rules** | NN generalizes | LLM validates | Custom sources | Custom-NN + LLM + Custom |

---

## Execution Modes Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXECUTION MODES                                   │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │         STRATEGY DEFINED         │
                    │                                  │
                    │  Asset: BTC/USD                  │
                    │  Strategy: Renko + NN + LLM      │
                    │  Risk: 2% stop, 1% trail         │
                    └───────────────┬──────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │      SELECT EXECUTION MODE       │
                    └───────────────┬──────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼

┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│     BACKTEST        │   │   PAPER TRADING     │   │    PRODUCTION       │
│                     │   │                     │   │                     │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │ Historical DB │  │   │  │ Live WebSocket│  │   │  │ Live WebSocket│  │
│  │ 2 years data  │  │   │  │ Real-time     │  │   │  │ Real-time     │  │
│  └───────┬───────┘  │   │  └───────┬───────┘  │   │  └───────┬───────┘  │
│          │          │   │          │          │   │          │          │
│          ▼          │   │          ▼          │   │          ▼          │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │ Simulate Bars │  │   │  │ Process Bars  │  │   │  │ Process Bars  │  │
│  │ Fast Forward  │  │   │  │ Real-time     │  │   │  │ Real-time     │  │
│  └───────┬───────┘  │   │  └───────┬───────┘  │   │  └───────┬───────┘  │
│          │          │   │          │          │   │          │          │
│          ▼          │   │          ▼          │   │          ▼          │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │ Generate      │  │   │  │ Generate      │  │   │  │ Generate      │  │
│  │ Signals       │  │   │  │ Signals       │  │   │  │ Signals       │  │
│  └───────┬───────┘  │   │  └───────┬───────┘  │   │  └───────┬───────┘  │
│          │          │   │          │          │   │          │          │
│          ▼          │   │          ▼          │   │          ▼          │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │ Simulate      │  │   │  │ Simulate      │  │   │  │ REAL ORDER    │  │
│  │ Order Fill    │  │   │  │ Order Fill    │  │   │  │ EXECUTION     │  │
│  │               │  │   │  │               │  │   │  │               │  │
│  │ No fees       │  │   │  │ Simulated fee │  │   │  │ Real fees     │  │
│  │ No slippage   │  │   │  │ Est. slippage │  │   │  │ Real slippage │  │
│  └───────┬───────┘  │   │  └───────┬───────┘  │   │  └───────┬───────┘  │
│          │          │   │          │          │   │          │          │
│          ▼          │   │          ▼          │   │          ▼          │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │ Track PnL     │  │   │  │ Track PnL     │  │   │  │ Track PnL     │  │
│  │ (simulated)   │  │   │  │ (paper)       │  │   │  │ (REAL MONEY)  │  │
│  └───────┬───────┘  │   │  └───────┬───────┘  │   │  └───────┬───────┘  │
│          │          │   │          │          │   │          │          │
│          ▼          │   │          ▼          │   │          ▼          │
│  ┌───────────────┐  │   │  ┌───────────────┐  │   │  ┌───────────────┐  │
│  │ Metrics:      │  │   │  │ Metrics:      │  │   │  │ Metrics:      │  │
│  │ • Total PnL   │  │   │  │ • Paper PnL   │  │   │  │ • Real PnL    │  │
│  │ • Sharpe      │  │   │  │ • Latency     │  │   │  │ • Real Sharpe │  │
│  │ • Max DD      │  │   │  │ • Signal Acc  │  │   │  │ • Real DD     │  │
│  │ • Win Rate    │  │   │  │ • Strategy    │  │   │  │ • Actual Win  │  │
│  │ • # Trades    │  │   │  │   Alignment   │  │   │  │ • Actual $    │  │
│  └───────────────┘  │   │  └───────────────┘  │   │  └───────────────┘  │
│                     │   │                     │   │                     │
│  Use For:           │   │  Use For:           │   │  Use For:           │
│  • Strategy Dev     │   │  • Live Validation  │   │  • Real Trading     │
│  • Parameter Tune   │   │  • System Test      │   │  • Making Money     │
│  • NN Training      │   │  • Confidence Build │   │  • Full Risk        │
│  • Quick Iterate    │   │  • Bug Finding      │   │  • Real Results     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
```

---

## UI Modes: Dev vs Pilot

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI MODES                                       │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┬────────────────────────────────────────┐
│            DEV MODE                │              PILOT MODE                │
├────────────────────────────────────┼────────────────────────────────────────┤
│                                    │                                        │
│  Full System Access:               │  Simplified Interface:                 │
│  • REPL Console                    │  • Start/Stop Trading                  │
│  • Code Evaluation                 │  • View Positions                      │
│  • Hot Reload                      │  • See PnL                             │
│  • Schema Browser                  │  • Adjust Risk                         │
│  • Debug Tools                     │  • Emergency Stop                      │
│                                    │                                        │
│  Strategy Development:             │  Monitoring:                           │
│  • Create Strategies               │  • Live Charts                         │
│  • Train Models                    │  • Signal Alerts                       │
│  • Tune Parameters                 │  • Trade Notifications                 │
│  • Run Backtests                   │  • Performance Dashboard               │
│                                    │                                        │
│  LLM Agent:                        │  LLM Agent:                            │
│  • System Prompts                  │  • "Why did we buy?"                   │
│  • Debug Reasoning                 │  • "What's the market outlook?"        │
│  • Tune Behavior                   │  • "Should I be worried?"              │
│  • View Full Context               │  • "Explain this trade"                │
│                                    │                                        │
│  Data Access:                      │  Simple Controls:                      │
│  • Raw Datomic Queries             │  • Toggle Strategies                   │
│  • Kafka Topics                    │  • Set Max Risk                        │
│  • Model Weights                   │  • Pause All Trading                   │
│  • Full Audit Log                  │  • Weekly Report                       │
│                                    │                                        │
└────────────────────────────────────┴────────────────────────────────────────┘

                              COMBINED MODE
                    ┌────────────────────────────────┐
                    │                                │
                    │  ┌────────────┬─────────────┐  │
                    │  │            │             │  │
                    │  │  Pilot     │   Dev       │  │
                    │  │  Dashboard │   Console   │  │
                    │  │            │             │  │
                    │  │  [Charts]  │   > (repl)  │  │
                    │  │  [Trades]  │   > (query) │  │
                    │  │  [PnL]     │   > (eval)  │  │
                    │  │            │             │  │
                    │  └────────────┴─────────────┘  │
                    │                                │
                    │  LLM Copilot: [Chat Interface] │
                    │  ────────────────────────────  │
                    │  You: Why did we enter BTC?    │
                    │  AI: Based on Renko signal...  │
                    │                                │
                    └────────────────────────────────┘
```

---

## Non-Functional Requirements

### Authentication & Accounts

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │          USER SIGNUP             │
                    │                                  │
                    │  Email: ___________________      │
                    │  Password: ________________      │
                    │  [Create Account]                │
                    └───────────────┬──────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │      ACCOUNT CONFIGURATION       │
                    │                                  │
                    │  Trading Preferences:            │
                    │  • Risk Tolerance: [Low/Med/Hi]  │
                    │  • Max Position: $___            │
                    │  • Daily Loss Limit: $___        │
                    │                                  │
                    │  Connect Exchanges:              │
                    │  • [+ Add Bitfinex]              │
                    │  • [+ Add Binance]               │
                    │  • [+ Add MetaTrader 5]          │
                    └───────────────┬──────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ EXCHANGE CONNECT  │   │ MT5 CONNECT       │   │ API KEY MANAGE    │
│                   │   │                   │   │                   │
│ API Key: ____     │   │ Login: _____      │   │ Internal API:     │
│ Secret: ____      │   │ Password: ___     │   │ • REPL Access     │
│ Permissions:      │   │ Server: _____     │   │ • Webhook Key     │
│ [x] Read          │   │ Terminal: ____    │   │ • OAuth Token     │
│ [x] Trade         │   │                   │   │                   │
│ [ ] Withdraw      │   │ [Connect MT5]     │   │ [Generate Key]    │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

### Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: Network
├── TLS/HTTPS everywhere
├── VPC for cloud components
└── Rate limiting

Layer 2: Authentication
├── JWT tokens with short expiry
├── Refresh token rotation
├── MFA for exchange operations
└── Session management

Layer 3: Authorization
├── Role-based access (admin/trader/viewer)
├── Per-exchange permission scoping
├── API key permission limits
└── Trade size limits per role

Layer 4: Data Protection
├── Encrypted credentials at rest (AES-256)
├── Secrets in environment/vault
├── Audit logging for all trades
└── No logging of sensitive data

Layer 5: Trading Safety
├── Daily loss limits (hard stop)
├── Position size limits
├── Drawdown circuit breaker
├── Manual approval for large trades
└── Emergency stop (kill switch)
```

---

## 7-Day Implementation Plan

### Day 1: Foundation & Exchange Integration (4 hours)

**Goal**: Connect to real exchanges with authentication

```
Hour 1: Account & Auth Schema
├── [ ] Add user account schema to Datomic
├── [ ] Add exchange credentials schema (encrypted)
├── [ ] Add API key management schema
└── [ ] Create account creation flow

Hour 2: Exchange Connector Base
├── [ ] Implement exchange connector protocol
├── [ ] Add CCXT wrapper for multi-exchange
├── [ ] Implement rate limiting
└── [ ] Add connection health checks

Hour 3: Bitfinex Integration
├── [ ] Complete REST API integration
├── [ ] Add WebSocket for live data
├── [ ] Test order placement (paper)
├── [ ] Handle reconnection

Hour 4: Credential Management
├── [ ] Implement secure credential storage
├── [ ] Add encryption at rest
├── [ ] Create credential validation flow
└── [ ] Test connection with real API keys
```

**Deliverables**:
- ✅ User can create account
- ✅ User can add exchange API keys
- ✅ System connects to Bitfinex
- ✅ Real-time price data flowing

---

### Day 2: Backtesting Engine (4 hours)

**Goal**: Complete backtesting with performance metrics

```
Hour 1: Historical Data Loader
├── [ ] CSV data import
├── [ ] Datomic historical storage
├── [ ] Data validation and cleaning
└── [ ] Multi-asset data support

Hour 2: Simulation Engine
├── [ ] Backtest runner with bar replay
├── [ ] Order simulation (market/limit)
├── [ ] Slippage modeling
└── [ ] Fee calculation

Hour 3: Performance Metrics
├── [ ] PnL calculation (realized/unrealized)
├── [ ] Sharpe ratio
├── [ ] Max drawdown
├── [ ] Win rate, profit factor
└── [ ] Trade statistics

Hour 4: Report Generation
├── [ ] Backtest summary report
├── [ ] Trade-by-trade log
├── [ ] Equity curve visualization
└── [ ] Store results in Datomic
```

**Deliverables**:
- ✅ Run backtest on any strategy
- ✅ Get comprehensive metrics
- ✅ Compare strategy performance
- ✅ Historical trades stored

---

### Day 3: Paper Trading Mode (4 hours)

**Goal**: Real-time paper trading with live data

```
Hour 1: Live Data Pipeline
├── [ ] WebSocket data consumer
├── [ ] Kafka producer for OHLCV
├── [ ] Bar aggregation (1m, 5m, 1h)
└── [ ] Multi-asset stream handling

Hour 2: Paper Order Execution
├── [ ] Paper order book
├── [ ] Simulated fills with realistic timing
├── [ ] Slippage estimation
└── [ ] Position tracking

Hour 3: Signal-to-Order Bridge
├── [ ] Signal consumer from strategies
├── [ ] Order generation from signals
├── [ ] Risk checks before order
└── [ ] Order state machine

Hour 4: Paper Trading Dashboard
├── [ ] Live position display
├── [ ] Real-time PnL
├── [ ] Signal log
└── [ ] Start/stop paper trading
```

**Deliverables**:
- ✅ Paper trade with live prices
- ✅ See simulated positions
- ✅ Track paper PnL
- ✅ Validate strategy in real-time

---

### Day 4: Strategy Assembly & Multiple Assets (4 hours)

**Goal**: Mix strategies across multiple assets

```
Hour 1: Strategy Configuration
├── [ ] Strategy definition schema
├── [ ] Parameter configuration UI
├── [ ] Strategy enable/disable
└── [ ] Multi-strategy composition

Hour 2: Multi-Asset Support
├── [ ] Asset configuration
├── [ ] Symbol mapping across exchanges
├── [ ] Multi-asset portfolio state
└── [ ] Position allocation rules

Hour 3: Strategy Combinations
├── [ ] Deterministic + NN blending
├── [ ] Confidence-weighted signals
├── [ ] Conflict resolution rules
└── [ ] Strategy priority ordering

Hour 4: Risk Across Portfolio
├── [ ] Portfolio-level risk limits
├── [ ] Correlation-aware sizing
├── [ ] Sector/asset class limits
└── [ ] Drawdown management
```

**Deliverables**:
- ✅ Run multiple strategies on multiple assets
- ✅ Blend NN predictions with rules
- ✅ Portfolio-level risk management
- ✅ Configure from UI or REPL

---

### Day 5: LLM Agent & Sentiment (4 hours)

**Goal**: AI copilot and sentiment integration

```
Hour 1: LLM API Integration
├── [ ] Claude/OpenAI client
├── [ ] Prompt template system
├── [ ] Response parsing
└── [ ] Context window management

Hour 2: Trading Copilot
├── [ ] Market analysis queries
├── [ ] Trade explanation
├── [ ] Risk assessment
└── [ ] Strategy suggestions

Hour 3: Sentiment Integration
├── [ ] News API integration
├── [ ] Basic NLP sentiment scoring
├── [ ] Sentiment signal generation
└── [ ] Sentiment-weighted decisions

Hour 4: LLM-Augmented Decisions
├── [ ] LLM validates NN predictions
├── [ ] Generate trade rationale
├── [ ] Store reasoning in Datomic
└── [ ] UI for LLM explanations
```

**Deliverables**:
- ✅ Ask LLM about market/trades
- ✅ LLM explains trade decisions
- ✅ News sentiment affects trading
- ✅ All reasoning logged

---

### Day 6: MetaTrader 5 Integration (4 hours)

**Goal**: Connect to MT5 for forex/CFD trading

```
Hour 1: MT5 Bridge Protocol
├── [ ] MQL5 ZeroMQ or REST bridge
├── [ ] Authentication flow
├── [ ] Symbol mapping
└── [ ] Connection management

Hour 2: MT5 Data & Execution
├── [ ] Historical data pull
├── [ ] Live price subscription
├── [ ] Order placement
└── [ ] Position synchronization

Hour 3: MT5 Specific Features
├── [ ] Handle MT5 deal/order/position model
├── [ ] Map to internal trade model
├── [ ] Support MT5 order types
└── [ ] Handle partial fills

Hour 4: Multi-Platform Trading
├── [ ] Unified position view (Exchange + MT5)
├── [ ] Cross-platform risk limits
├── [ ] Asset allocation across platforms
└── [ ] Unified reporting
```

**Deliverables**:
- ✅ Connect to MetaTrader 5
- ✅ Trade forex/CFD alongside crypto
- ✅ Unified portfolio view
- ✅ Same strategies across platforms

---

### Day 7: Production Mode & Go-Live (4 hours)

**Goal**: Safe production trading with real money

```
Hour 1: Production Safety
├── [ ] Kill switch implementation
├── [ ] Daily loss limits (hard stop)
├── [ ] Position size limits
└── [ ] Error handling & recovery

Hour 2: Production Execution
├── [ ] Real order submission
├── [ ] Order confirmation tracking
├── [ ] Fill handling
└── [ ] Reconciliation with exchange

Hour 3: Monitoring & Alerting
├── [ ] Trade notifications (email/SMS)
├── [ ] Error alerting
├── [ ] Performance monitoring
└── [ ] Health dashboard

Hour 4: Final Integration & Testing
├── [ ] End-to-end test (small position)
├── [ ] UI final polish
├── [ ] Documentation update
└── [ ] Go-live checklist
```

**Deliverables**:
- ✅ Trade with real money safely
- ✅ Automatic safety limits
- ✅ Alerts and monitoring
- ✅ Production ready!

---

## Current Status (What Exists)

| Component | Status | % Complete |
|-----------|--------|------------|
| **Renko Signal Detection** | ✅ Complete | 100% |
| **Neural Network Engine** | ✅ Complete | 100% |
| **MA Crossover Strategy** | ✅ Complete | 100% |
| **NN Training Pipeline** | ✅ Complete | 100% |
| **LLM Agent Framework** | ✅ Complete | 100% |
| **Datomic Schema** | ✅ Complete | 100% |
| **Fulcro UI** | ✅ Complete | 90% |
| **Backtesting Engine** | ⚠️ Partial | 30% |
| **Exchange Connectors** | ⚠️ Partial | 20% |
| **Paper Trading** | ❌ Not Started | 0% |
| **Production Trading** | ❌ Not Started | 0% |
| **Authentication** | ❌ Not Started | 0% |
| **MT5 Integration** | ❌ Not Started | 0% |
| **Sentiment/News** | ❌ Not Started | 0% |

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Exchange API changes | Abstract behind protocol, use CCXT |
| Data loss | Datomic immutability, backups |
| Model drift | Continuous evaluation, retraining |
| Latency issues | Kafka buffering, async processing |
| System failure | Circuit breakers, graceful degradation |

### Trading Risks

| Risk | Mitigation |
|------|------------|
| Large losses | Daily loss limits, position limits |
| Flash crashes | Circuit breaker, volatility pause |
| Model failure | Fallback to rules, human override |
| Connectivity loss | Pending order cleanup, position check |
| Fat finger | Size validation, confirmation for large trades |

---

## Success Criteria

By end of Day 7:

- [ ] Can create account and login
- [ ] Can connect to 2+ exchanges
- [ ] Can connect to MetaTrader 5
- [ ] Can backtest any strategy
- [ ] Can paper trade with live data
- [ ] Can trade real money (small position)
- [ ] NN predictions integrated
- [ ] LLM explains trades
- [ ] Sentiment affects decisions
- [ ] UI works in dev and pilot mode
- [ ] REPL accessible for all operations
- [ ] Safety limits enforced
- [ ] Monitoring and alerts working

---

## REPL Access Points

All operations accessible via nREPL:

```clojure
;; Account operations
(account/create-user "email@example.com" "password")
(account/add-exchange-credentials user-id :bitfinex api-key secret)

;; Strategy operations
(strategy/define {:name "BTC-Renko-NN"
                  :asset "BTC/USD"
                  :base :renko
                  :enhance [:nn :llm]
                  :risk {:stop-loss 0.02}})

;; Trading operations
(trading/start-paper-trading strategy-id)
(trading/start-production strategy-id)
(trading/emergency-stop!)

;; Query operations
(query/current-positions)
(query/todays-pnl)
(query/strategy-performance strategy-id)

;; LLM operations
(llm/explain-trade trade-id)
(llm/market-analysis "BTC/USD")
(llm/suggest-parameters strategy-id)
```

---

## Next Steps After 7 Days

1. **Week 2**: Options trading integration
2. **Week 3**: Advanced NN architectures (LSTM, Transformer)
3. **Week 4**: Multi-agent LLM system (bull/bear debate)
4. **Month 2**: Mobile app, voice commands
5. **Month 3**: Social trading, strategy marketplace

---

*Plan created: 2025-12-19*
*Total estimated effort: 28 hours (7 days × 4 hours)*
*Confidence: HIGH (85% of system already built)*