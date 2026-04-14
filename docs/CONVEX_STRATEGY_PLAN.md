# BTC Convex Strategy - Architecture Plan

## Executive Summary

This document outlines the architecture for implementing a BTC volatility convexity strategy within Little Trader, using Clara Rules for decision logic and a hybrid connector approach for market data and execution.

---

## 1. Exchange/Broker Compatibility Analysis

### Primary Finding: MT5 Does NOT Support BTC Options

| Exchange/Broker | MT5 Support | BTC Spot | BTC Futures | BTC Options | Notes |
|-----------------|-------------|----------|-------------|-------------|-------|
| **Deribit** | No | No | Yes | **Yes (85% market)** | Native API only |
| Eightcap | Yes | CFD | CFD | No | 120+ crypto CFDs |
| Pepperstone | Yes | CFD | CFD | No | Major crypto CFDs |
| AvaTrade | Yes | CFD | CFD | Forex only | Vanilla options on FX |
| BingX | Yes | Yes | Yes (125x) | No | MT5 integration |
| MEXC | Yes | Yes | Yes | No | 500+ cryptos |

**Conclusion**: For true BTC options (LEAPS-style convexity), we must use **Deribit's native API**. MT5 cannot provide options exposure.

### Architecture (Phase 1: Deribit Focus)

**Decision**: MT5 integration deferred to future phase. Clean protocol interface preserved for future MT5 support.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Little Trader Core                          │
│                    (Clara Rules Engine)                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │  IConnector Protocol
                      │  (abstract interface for future MT5)
                      │
                      ▼
            ┌───────────────────┐
            │  Deribit Connector │
            │  (HTTP/WebSocket)  │
            │                    │
            │  • BTC Options     │
            │  • Options Greeks  │
            │  • IV Data         │
            │  • Options Exec    │
            └───────────────────┘
                      │
                      ▼
            ┌───────────────────┐
            │    Deribit.com    │
            │  (Options Exchange)│
            └───────────────────┘

Future: MT5 connector will implement same IConnector protocol
```

### Strategy Instrument Selection (Phase 1)

| Strategy Mode | Instrument | Exchange | Connector | Convexity Profile |
|---------------|------------|----------|-----------|-------------------|
| **Primary** | BTC Call Options (3-6mo) | Deribit | Deribit API | High (gamma) |
| **Future** | BTC CFD Futures (2-3x) | TBD | MT5 (future) | Moderate (linear) |

---

## 2. Clara Rules Architecture

### 2.1 Fact Definitions (defrecord)

```clojure
(ns com.little-trader.domain.convex.facts
  "Clara Rules fact definitions for convex strategy.")

;; ═══════════════════════════════════════════════════════════════
;; MARKET DATA FACTS
;; ═══════════════════════════════════════════════════════════════

(defrecord MarketTick
  [symbol timestamp bid ask last volume])

(defrecord OHLCV
  [symbol timestamp open high low close volume])

(defrecord VolatilityData
  [symbol timestamp
   atr                    ;; Absolute ATR value
   atr-percentile         ;; Percentile vs trailing 1Y (0-100)
   realized-vol-30d       ;; 30-day realized volatility
   bollinger-width        ;; BB width (normalized)
   range-compression])    ;; 20-day range / ATR

(defrecord ImpliedVolData
  [symbol timestamp
   iv-atm                 ;; ATM implied volatility
   iv-25d-call            ;; 25-delta call IV
   iv-25d-put             ;; 25-delta put IV
   iv-rv-ratio            ;; IV / RV ratio
   term-structure])       ;; Near vs far IV

;; ═══════════════════════════════════════════════════════════════
;; REGIME FACTS (derived from market data)
;; ═══════════════════════════════════════════════════════════════

(defrecord RegimeState
  [timestamp
   regime                 ;; :compression, :expansion-up, :expansion-down, :neutral
   confidence             ;; 0.0 - 1.0
   duration-bars          ;; How long in this regime
   indicators])           ;; Map of indicator values

(defrecord RegimeTransition
  [timestamp
   from-regime
   to-regime
   trigger-indicator])

;; ═══════════════════════════════════════════════════════════════
;; STRATEGY STATE FACTS
;; ═══════════════════════════════════════════════════════════════

(defrecord StrategyState
  [status                 ;; :inactive, :awaiting-entry, :position-open, etc.
   last-transition-time
   cooldown-until])

(defrecord Position
  [id
   instrument-type        ;; :option, :future, :spot
   symbol
   side                   ;; :long, :short
   entry-price
   entry-time
   quantity
   premium-paid           ;; For options
   strike                 ;; For options
   expiry                 ;; For options
   current-price
   current-pnl
   max-profit-seen])

(defrecord RiskLimit
  [type                   ;; :max-position, :cooldown, :daily-loss
   value
   current])

;; ═══════════════════════════════════════════════════════════════
;; SIGNAL FACTS (rule outputs)
;; ═══════════════════════════════════════════════════════════════

(defrecord EntrySignal
  [timestamp
   signal-type            ;; :regime-compression
   confidence
   recommended-instrument ;; :option or :future
   recommended-strike     ;; For options
   recommended-expiry     ;; For options
   max-premium])

(defrecord ExitSignal
  [timestamp
   signal-type            ;; :profit-target, :expiry, :early-exit
   reason
   target-pnl-multiple])

(defrecord RiskAlert
  [timestamp
   alert-type             ;; :cooldown-active, :position-limit, :regime-invalid
   message
   blocking?])            ;; Prevents action if true
```

### 2.2 Rule Definitions (defrule)

```clojure
(ns com.little-trader.domain.convex.rules
  "Clara Rules for BTC convex volatility strategy."
  (:require [clara.rules :refer [defrule defquery insert! retract!]]
            [clara.rules.accumulators :as acc]
            [com.little-trader.domain.convex.facts :as f]))

;; ═══════════════════════════════════════════════════════════════
;; REGIME DETECTION RULES
;; ═══════════════════════════════════════════════════════════════

(defrule detect-compression-regime
  "Detect volatility compression - potential entry opportunity."
  [f/VolatilityData
   (< atr-percentile 20)           ;; ATR at historical lows
   (< bollinger-width 0.10)        ;; Bands squeezed
   (= ?symbol symbol)
   (= ?timestamp timestamp)]
  [f/ImpliedVolData
   (= symbol ?symbol)
   (< iv-rv-ratio 1.5)]            ;; IV not already expensive
  [:not [f/RegimeState (= regime :compression)]]  ;; Not already detected
  =>
  (insert! (f/->RegimeState
            ?timestamp
            :compression
            0.8                     ;; High confidence
            0
            {:atr-percentile atr-percentile
             :bollinger-width bollinger-width})))

(defrule detect-expansion-regime
  "Detect volatility expansion - position monitoring mode."
  [f/VolatilityData
   (> atr-percentile 60)           ;; ATR expanding
   (> bollinger-width 0.20)        ;; Bands widening
   (= ?symbol symbol)
   (= ?timestamp timestamp)]
  [f/OHLCV (= symbol ?symbol) (= ?close close)]
  [f/OHLCV (= symbol ?symbol) (= ?sma-200 sma-200)]  ;; Assume computed
  [:not [f/RegimeState (= regime :expansion-up)]]
  [:not [f/RegimeState (= regime :expansion-down)]]
  [:test (> ?close ?sma-200)]      ;; Price above 200 MA = up
  =>
  (insert! (f/->RegimeState
            ?timestamp
            :expansion-up
            0.7
            0
            {:atr-percentile atr-percentile
             :direction :up})))

;; ═══════════════════════════════════════════════════════════════
;; ENTRY SIGNAL RULES
;; ═══════════════════════════════════════════════════════════════

(defrule generate-entry-signal-options
  "Generate entry signal for options when compression detected."
  [f/RegimeState
   (= regime :compression)
   (>= confidence 0.7)
   (= ?timestamp timestamp)]
  [f/StrategyState
   (= status :inactive)]
  [:not [f/RiskAlert (= blocking? true)]]
  [f/MarketTick
   (= ?price last)]
  =>
  (insert! (f/->EntrySignal
            ?timestamp
            :regime-compression
            0.8
            :option
            (* ?price 1.1)         ;; 10% OTM strike
            (+ ?timestamp (* 120 24 60 60 1000))  ;; 120 days out
            10000)))               ;; Max $10k premium

(defrule generate-entry-signal-futures
  "Generate entry signal for futures when compression detected (fallback)."
  [f/RegimeState
   (= regime :compression)
   (>= confidence 0.7)
   (= ?timestamp timestamp)]
  [f/StrategyState
   (= status :inactive)]
  [:not [f/RiskAlert (= blocking? true)]]
  [f/MarketTick
   (= ?price last)]
  ;; Only if options not available
  [:not [f/EntrySignal (= recommended-instrument :option)]]
  =>
  (insert! (f/->EntrySignal
            ?timestamp
            :regime-compression
            0.6                    ;; Lower confidence for futures
            :future
            nil                    ;; No strike
            nil                    ;; No expiry
            10000)))

;; ═══════════════════════════════════════════════════════════════
;; EXIT SIGNAL RULES
;; ═══════════════════════════════════════════════════════════════

(defrule profit-target-5x
  "Exit 50% at 5x profit."
  [f/Position
   (= instrument-type :option)
   (= ?premium premium-paid)
   (= ?current current-pnl)]
  [:test (>= ?current (* 5 ?premium))]
  =>
  (insert! (f/->ExitSignal
            (System/currentTimeMillis)
            :profit-target
            "5x profit target reached"
            5.0)))

(defrule profit-target-10x
  "Exit remaining at 10x profit."
  [f/Position
   (= instrument-type :option)
   (= ?premium premium-paid)
   (= ?current current-pnl)]
  [:test (>= ?current (* 10 ?premium))]
  =>
  (insert! (f/->ExitSignal
            (System/currentTimeMillis)
            :profit-target
            "10x profit target reached"
            10.0)))

(defrule option-expiry-warning
  "Alert when option approaching expiry."
  [f/Position
   (= instrument-type :option)
   (= ?expiry expiry)]
  [:test (< (- ?expiry (System/currentTimeMillis))
            (* 14 24 60 60 1000))]  ;; < 14 days
  =>
  (insert! (f/->RiskAlert
            (System/currentTimeMillis)
            :expiry-warning
            "Option expiring in < 14 days"
            false)))

;; ═══════════════════════════════════════════════════════════════
;; RISK MANAGEMENT RULES
;; ═══════════════════════════════════════════════════════════════

(defrule enforce-cooldown
  "Block entry during cooldown period."
  [f/StrategyState
   (not (nil? cooldown-until))
   (= ?cooldown cooldown-until)]
  [:test (> ?cooldown (System/currentTimeMillis))]
  =>
  (insert! (f/->RiskAlert
            (System/currentTimeMillis)
            :cooldown-active
            "Strategy in cooldown period"
            true)))

(defrule prevent-averaging-down
  "NEVER average down - block additional entries when position losing."
  [f/Position
   (< current-pnl 0)
   (= ?symbol symbol)]
  [f/EntrySignal
   (= ?signal-symbol symbol)]  ;; Assume symbol available
  [:test (= ?symbol ?signal-symbol)]
  =>
  (insert! (f/->RiskAlert
            (System/currentTimeMillis)
            :no-averaging-down
            "BLOCKED: Cannot add to losing position"
            true)))

(defrule single-position-limit
  "Only one position per cycle."
  [f/Position]
  [f/EntrySignal]
  =>
  (insert! (f/->RiskAlert
            (System/currentTimeMillis)
            :position-limit
            "BLOCKED: Already have open position"
            true)))
```

### 2.3 Query Definitions (defquery)

```clojure
(ns com.little-trader.domain.convex.queries
  "Clara queries for strategy state inspection."
  (:require [clara.rules :refer [defquery]]
            [com.little-trader.domain.convex.facts :as f]))

(defquery current-regime
  "Get the current market regime."
  []
  [?regime <- f/RegimeState])

(defquery active-entry-signals
  "Get all active entry signals."
  []
  [?signal <- f/EntrySignal])

(defquery active-exit-signals
  "Get all active exit signals."
  []
  [?signal <- f/ExitSignal])

(defquery blocking-alerts
  "Get all blocking risk alerts."
  []
  [?alert <- f/RiskAlert (= blocking? true)])

(defquery open-positions
  "Get all open positions."
  []
  [?position <- f/Position])

(defquery strategy-status
  "Get current strategy state."
  []
  [?state <- f/StrategyState])
```

### 2.4 Session Management

```clojure
(ns com.little-trader.domain.convex.engine
  "Clara Rules session management for convex strategy."
  (:require [clara.rules :as r]
            [clara.rules.accumulators :as acc]
            [com.little-trader.domain.convex.facts :as f]
            [com.little-trader.domain.convex.rules]
            [com.little-trader.domain.convex.queries :as q]))

(def session-atom
  "Atom holding the current Clara session.
   Immutable - each fire-rules produces new session."
  (atom nil))

(defn create-session
  "Create a fresh Clara session with initial strategy state."
  [config]
  (-> (r/mk-session 'com.little-trader.domain.convex.rules
                    'com.little-trader.domain.convex.queries)
      (r/insert (f/->StrategyState :inactive nil nil))
      (r/fire-rules)))

(defn process-market-data!
  "Process new market data through the rules engine.
   Returns the updated session (pure - does not mutate atom)."
  [session market-data]
  (-> session
      (r/insert market-data)
      (r/fire-rules)))

(defn get-entry-signals
  "Query for any entry signals."
  [session]
  (r/query session q/active-entry-signals))

(defn get-exit-signals
  "Query for any exit signals."
  [session]
  (r/query session q/active-exit-signals))

(defn get-blocking-alerts
  "Query for any blocking risk alerts."
  [session]
  (r/query session q/blocking-alerts))

(defn can-enter?
  "Check if entry is allowed (no blocking alerts)."
  [session]
  (empty? (get-blocking-alerts session)))

;; ═══════════════════════════════════════════════════════════════
;; EVENT LOOP INTEGRATION
;; ═══════════════════════════════════════════════════════════════

(defn handle-tick
  "Main event handler - process a market tick through the engine.
   Returns {:session updated-session
            :actions [{:type :entry/:exit :details {...}}]}"
  [session tick volatility-data iv-data]
  (let [;; Insert all new facts
        updated (-> session
                    (r/insert (f/map->MarketTick tick))
                    (r/insert (f/map->VolatilityData volatility-data))
                    (r/insert (f/map->ImpliedVolData iv-data))
                    (r/fire-rules))

        ;; Query for actions
        entry-signals (get-entry-signals updated)
        exit-signals (get-exit-signals updated)
        can-act? (can-enter? updated)

        ;; Determine actions
        actions (cond-> []
                  (and can-act? (seq entry-signals))
                  (conj {:type :entry
                         :signal (first entry-signals)})

                  (seq exit-signals)
                  (conj {:type :exit
                         :signal (first exit-signals)}))]

    {:session updated
     :actions actions}))
```

---

## 3. Connector Architecture

### 3.1 Existing MT5 Connector (Already Implemented)

Location: `src/com/little_trader/connectors/metatrader.clj`

**Capabilities**:
- Market data (bars, ticks, symbol info)
- Order management (place, modify, cancel)
- Position management (get, close, modify)
- Account info
- History (deals, orders)

**Limitations for Options**:
- No native options chain access
- No Greeks calculation from exchange
- No IV data feed

### 3.2 New Deribit Connector (To Be Implemented)

```clojure
(ns com.little-trader.connectors.deribit
  "Deribit connector for BTC options trading.

   ARCHITECTURE:
   ┌──────────────────┐      ┌──────────────────┐
   │  Clojure Core    │      │    Deribit API   │
   │  (little-trader) │ ←──→ │  (JSON-RPC/WS)   │
   └──────────────────┘ HTTP └──────────────────┘

   API REFERENCE:
   https://docs.deribit.com/

   FEATURES:
   - BTC/ETH options and futures
   - Options chains with Greeks
   - IV surface data
   - WebSocket for real-time data")

;; Protocol for exchange connectors
(defprotocol IOptionsConnector
  (get-options-chain [this underlying expiry])
  (get-option-quote [this instrument-name])
  (get-greeks [this instrument-name])
  (get-iv-surface [this underlying])
  (place-option-order [this order])
  (get-option-positions [this]))
```

### 3.3 Connector Protocol Unification

```clojure
(ns com.little-trader.connectors.protocol
  "Unified protocol for all trading connectors.")

(defprotocol IMarketDataConnector
  "Market data operations."
  (get-symbol-info [this symbol])
  (get-bars [this symbol timeframe count])
  (get-tick [this symbol])
  (subscribe-ticks [this symbol callback]))

(defprotocol IOrderConnector
  "Order execution operations."
  (place-order [this order])
  (cancel-order [this order-id])
  (get-open-orders [this]))

(defprotocol IPositionConnector
  "Position management."
  (get-positions [this])
  (close-position [this position-id])
  (modify-position [this position-id params]))

(defprotocol IAccountConnector
  "Account operations."
  (get-account-info [this])
  (get-balance [this]))

;; Options-specific
(defprotocol IOptionsDataConnector
  "Options-specific market data."
  (get-options-chain [this underlying expiry-date])
  (get-option-greeks [this option-symbol])
  (get-iv-surface [this underlying])
  (get-term-structure [this underlying]))
```

---

## 4. Python Bridge for Deribit

### 4.1 Python Script Structure

```
python/
├── mt5_connector.py        (existing)
├── deribit_connector.py    (new)
└── unified_bridge.py       (new - combines both)
```

### 4.2 Deribit Python Bridge

```python
# python/deribit_connector.py
"""
Deribit API connector for Little Trader.
Provides HTTP REST API for Clojure interop.

Endpoints:
  GET  /deribit/options-chain/{underlying}
  GET  /deribit/quote/{instrument}
  GET  /deribit/greeks/{instrument}
  GET  /deribit/iv-surface/{underlying}
  POST /deribit/order
  GET  /deribit/positions
"""

from flask import Flask, jsonify, request
import asyncio
import websockets
import json
import hmac
import hashlib
import time

app = Flask(__name__)

DERIBIT_WS_URL = "wss://www.deribit.com/ws/api/v2"
DERIBIT_REST_URL = "https://www.deribit.com/api/v2"

class DeribitClient:
    def __init__(self, client_id, client_secret, testnet=False):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = (
            "https://test.deribit.com/api/v2" if testnet
            else DERIBIT_REST_URL
        )
        self.access_token = None

    async def authenticate(self):
        """Authenticate and get access token."""
        # ... implementation
        pass

    async def get_options_chain(self, underlying: str, expiry: str = None):
        """Get options chain for underlying."""
        # ... implementation
        pass

    async def get_greeks(self, instrument: str):
        """Get Greeks for option instrument."""
        # ... implementation
        pass

# Flask endpoints
@app.route('/deribit/options-chain/<underlying>')
def options_chain(underlying):
    # ... implementation
    pass
```

---

## 5. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVENT LOOP                                    │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐ │
│  │ MT5 Bridge  │    │   Deribit   │    │      Clara Rules Engine     │ │
│  │             │    │   Bridge    │    │                             │ │
│  │ • BTC/USD   │    │ • Options   │    │  ┌─────────────────────┐   │ │
│  │   Spot/CFD  │    │   Chain     │    │  │    Working Memory   │   │ │
│  │ • OHLCV     │    │ • Greeks    │    │  │                     │   │ │
│  │ • Ticks     │    │ • IV        │    │  │ • MarketTick        │   │ │
│  └──────┬──────┘    └──────┬──────┘    │  │ • VolatilityData    │   │ │
│         │                  │           │  │ • RegimeState       │   │ │
│         ▼                  ▼           │  │ • Position          │   │ │
│  ┌─────────────────────────────────┐   │  │ • Signals           │   │ │
│  │      Data Normalization         │   │  └─────────────────────┘   │ │
│  │                                 │   │             │              │ │
│  │  • Convert to fact records      │   │             ▼              │ │
│  │  • Calculate derived metrics    │   │  ┌─────────────────────┐   │ │
│  │  • ATR percentile               │   │  │   Rule Evaluation   │   │ │
│  │  • Bollinger width              │   │  │                     │   │ │
│  │  • IV/RV ratio                  │   │  │ • Regime Detection  │   │ │
│  └──────────────┬──────────────────┘   │  │ • Entry Signals     │   │ │
│                 │                      │  │ • Exit Signals      │   │ │
│                 │                      │  │ • Risk Alerts       │   │ │
│                 ▼                      │  └──────────┬──────────┘   │ │
│  ┌─────────────────────────────────┐   │             │              │ │
│  │      insert! → fire-rules       │───┼─────────────┘              │ │
│  └─────────────────────────────────┘   │                            │ │
│                                        └─────────────────────────────┘ │
│                                                      │                 │
│                                                      ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Action Dispatcher                          │  │
│  │                                                                 │  │
│  │  query signals → validate → dispatch to connector → confirm     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Module Structure

```
src/com/little_trader/
├── domain/
│   ├── convex/
│   │   ├── facts.clj           ;; Clara fact definitions
│   │   ├── rules.clj           ;; Clara rule definitions
│   │   ├── queries.clj         ;; Clara query definitions
│   │   ├── engine.clj          ;; Session management
│   │   ├── regime.clj          ;; Regime calculation (pure)
│   │   ├── volatility.clj      ;; Volatility metrics (pure)
│   │   └── config.clj          ;; Strategy configuration
│   ├── renko.clj               ;; (existing) - reuse ATR calc
│   ├── risk.clj                ;; (existing) - extend for convex
│   └── trades.clj              ;; (existing) - reuse patterns
├── connectors/
│   ├── metatrader.clj          ;; (existing) - MT5 bridge
│   ├── deribit.clj             ;; (new) - Deribit API
│   └── protocol.clj            ;; (new) - unified protocols
└── components/
    └── convex_runner.clj       ;; (new) - strategy lifecycle

python/
├── mt5_connector.py            ;; (existing)
├── deribit_connector.py        ;; (new)
└── bridge_server.py            ;; (new) - unified HTTP server
```

---

## 7. Implementation Phases

### Phase 1: Clara Rules Foundation (Week 1)
- [ ] Add Clara Rules dependency to deps.edn
- [ ] Implement fact definitions (`facts.clj`)
- [ ] Implement core rules (`rules.clj`)
- [ ] Implement queries (`queries.clj`)
- [ ] Implement session management (`engine.clj`)
- [ ] Write unit tests for rules

### Phase 2: Volatility & Regime Detection (Week 2)
- [ ] Implement volatility metrics (`volatility.clj`)
- [ ] Implement regime detection (`regime.clj`)
- [ ] Integrate with existing ATR from `renko.clj`
- [ ] Backtest regime detection on historical data
- [ ] Validate regime signals vs actual vol expansions

### Phase 3: Deribit Connector (Week 3)
- [ ] Implement Deribit Python bridge
- [ ] Implement Clojure connector (`deribit.clj`)
- [ ] Test options chain retrieval
- [ ] Test Greeks and IV data
- [ ] Test order placement (paper trading)

### Phase 4: Integration & Testing (Week 4)
- [ ] Integrate Clara engine with connectors
- [ ] Implement action dispatcher
- [ ] Full backtesting with historical options data
- [ ] Paper trading validation
- [ ] Documentation

---

## 8. Dependencies

### Clojure deps.edn additions

```clojure
{:deps
 {;; Clara Rules engine
  com.cerner/clara-rules {:mvn/version "0.21.1"}

  ;; HTTP client for Deribit
  clj-http/clj-http {:mvn/version "3.12.3"}

  ;; WebSocket for Deribit streaming
  stylefruits/gniazdo {:mvn/version "1.2.2"}

  ;; Existing deps...
  }}
```

### Python requirements.txt additions

```
# Deribit
aiohttp>=3.8.0
websockets>=10.0
flask>=2.0.0
python-dotenv>=0.19.0
```

---

## 9. Risk Considerations

### Operational Risks
| Risk | Mitigation |
|------|------------|
| Deribit API downtime | Graceful degradation, alerts |
| MT5 bridge failure | Health checks, reconnection logic |
| Clara session corruption | Immutable sessions, recovery from last known good |
| Network latency | Async operations, timeout handling |

### Strategy Risks (Already Addressed)
| Risk | Mitigation |
|------|------------|
| Averaging down | Hard rule: `prevent-averaging-down` |
| Over-trading | Cooldown periods, single position limit |
| Premature exit | Options naturally define risk |
| Wrong regime detection | Multiple confirming indicators required |

---

## 10. Configuration

```clojure
(def default-convex-config
  {:strategy/name "btc-convex-volatility"
   :strategy/version "1.0.0"

   ;; Capital
   :capital/total-usd 10000
   :capital/max-per-trade-usd 10000

   ;; Regime thresholds
   :regime/atr-percentile-threshold 20
   :regime/bb-width-threshold 0.10
   :regime/iv-rv-max-ratio 1.5
   :regime/min-compression-bars 5

   ;; Options preferences
   :options/min-expiry-days 90
   :options/max-expiry-days 180
   :options/target-delta-min 0.35
   :options/target-delta-max 0.50
   :options/max-bid-ask-spread 0.05

   ;; Exit rules
   :exit/profit-target-1-multiplier 5.0
   :exit/profit-target-1-close-pct 50
   :exit/profit-target-2-multiplier 10.0
   :exit/profit-target-2-close-pct 100

   ;; Cooldowns
   :cooldown/after-loss-days 30
   :cooldown/after-profit-days 14

   ;; Connectors
   :connector/primary :deribit
   :connector/secondary :mt5
   :connector/deribit-testnet? true  ;; Start with testnet
   :connector/mt5-bridge-url "http://localhost:5000/api/v1"
   :connector/deribit-bridge-url "http://localhost:5001/api/v1"})
```

---

## 11. Confirmation Required

Before proceeding with implementation, please confirm:

1. **Connector Strategy**:
   - [x] Hybrid approach (Deribit for options + MT5 for futures fallback)
   - [ ] Deribit only (options-focused)
   - [ ] MT5 only (futures-focused, sacrifice convexity)

2. **Clara Rules Approach**:
   - [x] Forward-chaining rules as designed
   - [ ] Alternative: Pure FSM without rules engine

3. **Testnet First**:
   - [x] Start with Deribit testnet
   - [ ] Skip to production immediately

4. **Implementation Priority**:
   - [x] Phase 1-4 as outlined
   - [ ] Alternative sequencing

---

## Sources

- [Deribit API Documentation](https://docs.deribit.com/)
- [Clara Rules GitHub](https://github.com/oracle-samples/clara-rules)
- [Clara Rules Guide](https://github.com/oracle-samples/clara-rules/wiki/Guide)
- [Best MT5 Crypto Brokers](https://socialcapitalmarkets.net/crypto-trading/platforms/mt5-crypto-brokers/)
- [Eightcap Crypto CFDs](https://www.fxempire.com/brokers/best/metatrader-crypto)
