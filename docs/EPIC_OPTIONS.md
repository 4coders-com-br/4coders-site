# EPIC-OPTIONS: Options Trading Extension

**Demonstrating Stack Efficiency Through New Feature Addition**

## Table of Contents
1. [Overview](#overview)
2. [Why This Feature Demonstrates Stack Efficiency](#why-this-feature-demonstrates-stack-efficiency)
3. [MQL5 Taxonomy Alignment](#mql5-taxonomy-alignment)
4. [Options Trading Concepts](#options-trading-concepts)
5. [Data Model Extensions](#data-model-extensions)
6. [Renko Strategy for Options](#renko-strategy-for-options)
7. [MetaTrader Integration](#metatrader-integration)
8. [Educational Guide: Extending the System](#educational-guide-extending-the-system)
9. [Implementation Walkthrough](#implementation-walkthrough)
10. [Code Change Summary](#code-change-summary)

---

## Overview

### What is EPIC-OPTIONS?

EPIC-OPTIONS introduces **options trading** capabilities to the Little Trader system. Options are derivative contracts that give the holder the right (but not obligation) to buy or sell an underlying asset at a predetermined price (strike) on or before a specific date (expiration).

### Key Features

- **Call Options**: Right to BUY at strike price
- **Put Options**: Right to SELL at strike price
- **Weekly/Bi-Weekly Expiration**: Focus on short-term options movement
- **Options Greeks**: Delta, Gamma, Theta, Vega tracking
- **Renko-Based Options Strategy**: Novel approach using Renko charts for options timing
- **MetaTrader 5 Integration**: Via Python SDK (MQL5)

### Technical Highlights

- **New Connector Type**: MetaTrader 5 via Python SDK
- **Extended Data Model**: Options contracts, strikes, greeks
- **MQL5 Naming Convention**: Aligned with MetaTrader taxonomy
- **Configuration-Driven**: Most changes are data-driven, minimal code changes

---

## Why This Feature Demonstrates Stack Efficiency

### The Power of Clojure/Fulcro RAD/Datomic

Adding EPIC-OPTIONS to the system demonstrates why this stack is ideal for trading systems:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Traditional Stack (Java/Spring/PostgreSQL)                         │
│                                                                     │
│  New Feature = ~15-20 files changed                                 │
│  - Entity classes                                                   │
│  - Repository interfaces                                            │
│  - Repository implementations                                       │
│  - Service interfaces                                               │
│  - Service implementations                                          │
│  - Controller classes                                               │
│  - DTO classes                                                      │
│  - Mapper classes                                                   │
│  - SQL migrations                                                   │
│  - Test files for each layer                                        │
│  - Configuration files                                              │
│  - Frontend components (separate)                                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Clojure/Fulcro RAD/Datomic Stack                                   │
│                                                                     │
│  New Feature = ~5-7 files changed                                   │
│  - Schema extension (schema.clj)           → Auto-generates queries │
│  - RAD attributes (model/option.cljc)      → Auto-generates UI      │
│  - Domain logic (domain/options.clj)       → Pure, testable         │
│  - Connector (connectors/metatrader.clj)   → New integration        │
│  - Tests (test/options_test.clj)           → Single test file       │
│                                                                     │
│  RAD auto-generates: resolvers, mutations, forms, reports, tables   │
└─────────────────────────────────────────────────────────────────────┘
```

### Efficiency Breakdown

| Aspect | Traditional | Clojure/RAD |
|--------|-------------|-------------|
| Schema Definition | SQL + ORM mapping | Single Datomic schema |
| API Layer | Controller + Service + DTO | Auto-generated resolvers |
| Data Queries | Repository pattern | Datalog queries |
| Frontend Forms | Manual components | RAD auto-generation |
| Type Validation | Multiple layers | Spec at boundaries |
| Time-Travel Debug | Not available | Built-in (Datomic) |
| Test Isolation | Mocks required | Pure functions |

---

## MQL5 Taxonomy Alignment

### Why MQL5 as First-Class Taxonomy?

[MQL5](https://www.mql5.com/en/docs) (MetaQuotes Language 5) is the industry standard for algorithmic trading on MetaTrader platforms. Aligning our schema with MQL5 conventions ensures:

1. **Interoperability**: Direct mapping to MetaTrader data structures
2. **Familiarity**: Traders recognize standard terminology
3. **Documentation**: Leverage extensive MQL5 documentation
4. **Compatibility**: Easy integration with existing MQL5 tools

### MQL5 Core Concepts Mapping

#### Symbol Information (MQL5: `SymbolInfo`)

```clojure
;; MQL5 → Datomic Schema Mapping
{:symbol/name          ;; SYMBOL_NAME
 :symbol/description   ;; SYMBOL_DESCRIPTION
 :symbol/path          ;; SYMBOL_PATH
 :symbol/currency-base ;; SYMBOL_CURRENCY_BASE
 :symbol/currency-profit ;; SYMBOL_CURRENCY_PROFIT
 :symbol/currency-margin ;; SYMBOL_CURRENCY_MARGIN
 :symbol/trade-mode    ;; SYMBOL_TRADE_MODE
 :symbol/trade-calc-mode ;; SYMBOL_TRADE_CALC_MODE
 :symbol/digits        ;; SYMBOL_DIGITS
 :symbol/point         ;; SYMBOL_POINT
 :symbol/spread        ;; SYMBOL_SPREAD
 :symbol/tick-value    ;; SYMBOL_TRADE_TICK_VALUE
 :symbol/tick-size     ;; SYMBOL_TRADE_TICK_SIZE
 :symbol/contract-size ;; SYMBOL_TRADE_CONTRACT_SIZE
 :symbol/volume-min    ;; SYMBOL_VOLUME_MIN
 :symbol/volume-max    ;; SYMBOL_VOLUME_MAX
 :symbol/volume-step   ;; SYMBOL_VOLUME_STEP}
```

#### Order Types (MQL5: `ENUM_ORDER_TYPE`)

```clojure
(def mql5-order-types
  "MQL5 order types mapped to keywords"
  {:order-type/buy              ;; ORDER_TYPE_BUY
   :order-type/sell             ;; ORDER_TYPE_SELL
   :order-type/buy-limit        ;; ORDER_TYPE_BUY_LIMIT
   :order-type/sell-limit       ;; ORDER_TYPE_SELL_LIMIT
   :order-type/buy-stop         ;; ORDER_TYPE_BUY_STOP
   :order-type/sell-stop        ;; ORDER_TYPE_SELL_STOP
   :order-type/buy-stop-limit   ;; ORDER_TYPE_BUY_STOP_LIMIT
   :order-type/sell-stop-limit  ;; ORDER_TYPE_SELL_STOP_LIMIT
   :order-type/close-by})       ;; ORDER_TYPE_CLOSE_BY
```

#### Position Properties (MQL5: `PositionGet*`)

```clojure
;; Position entity aligned with MQL5
{:position/ticket       ;; POSITION_TICKET
 :position/time         ;; POSITION_TIME
 :position/time-msc     ;; POSITION_TIME_MSC
 :position/time-update  ;; POSITION_TIME_UPDATE
 :position/type         ;; POSITION_TYPE (:position-type/buy, :position-type/sell)
 :position/magic        ;; POSITION_MAGIC (EA identifier)
 :position/identifier   ;; POSITION_IDENTIFIER
 :position/volume       ;; POSITION_VOLUME
 :position/price-open   ;; POSITION_PRICE_OPEN
 :position/price-current ;; POSITION_PRICE_CURRENT
 :position/sl           ;; POSITION_SL (stop loss)
 :position/tp           ;; POSITION_TP (take profit)
 :position/swap         ;; POSITION_SWAP
 :position/profit       ;; POSITION_PROFIT
 :position/symbol       ;; POSITION_SYMBOL
 :position/comment}     ;; POSITION_COMMENT
```

#### Deal Properties (MQL5: `DealGet*`)

```clojure
;; Deal (trade transaction) aligned with MQL5
{:deal/ticket          ;; DEAL_TICKET
 :deal/order           ;; DEAL_ORDER
 :deal/time            ;; DEAL_TIME
 :deal/time-msc        ;; DEAL_TIME_MSC
 :deal/type            ;; DEAL_TYPE
 :deal/entry           ;; DEAL_ENTRY (:deal-entry/in, :deal-entry/out, :deal-entry/inout)
 :deal/magic           ;; DEAL_MAGIC
 :deal/position-id     ;; DEAL_POSITION_ID
 :deal/volume          ;; DEAL_VOLUME
 :deal/price           ;; DEAL_PRICE
 :deal/commission      ;; DEAL_COMMISSION
 :deal/swap            ;; DEAL_SWAP
 :deal/profit          ;; DEAL_PROFIT
 :deal/fee             ;; DEAL_FEE
 :deal/symbol          ;; DEAL_SYMBOL
 :deal/comment}        ;; DEAL_COMMENT
```

---

## Options Trading Concepts

### Core Options Terminology

#### Call Option
A contract giving the holder the **right to BUY** the underlying asset at the strike price.

```clojure
{:option/type :call
 :option/underlying "PETR4"     ;; Petrobras stock
 :option/strike 35.50           ;; Strike price
 :option/expiration #inst "2025-01-17"
 :option/premium 1.25}          ;; Cost to buy the option
```

**Buyer (Long Call)**:
- Pays premium upfront
- Profits if price rises above (strike + premium)
- Maximum loss = premium paid

**Seller (Short Call)**:
- Receives premium upfront
- Obligated to sell at strike if exercised
- Maximum loss = unlimited (theoretically)

#### Put Option
A contract giving the holder the **right to SELL** the underlying asset at the strike price.

```clojure
{:option/type :put
 :option/underlying "VALE3"     ;; Vale stock
 :option/strike 62.00           ;; Strike price
 :option/expiration #inst "2025-01-17"
 :option/premium 2.10}          ;; Cost to buy the option
```

**Buyer (Long Put)**:
- Pays premium upfront
- Profits if price falls below (strike - premium)
- Maximum loss = premium paid

**Seller (Short Put)**:
- Receives premium upfront
- Obligated to buy at strike if exercised
- Maximum loss = strike price × quantity

### The Greeks

The **Greeks** measure sensitivity of option price to various factors:

#### Delta (Δ)
**What**: Rate of change of option price per $1 change in underlying
**Range**: Calls: 0 to +1, Puts: -1 to 0
**Example**: Delta of 0.50 means option gains $0.50 for every $1 underlying gains

```clojure
(defn calculate-delta
  "Black-Scholes delta calculation"
  [{:keys [spot strike time-to-expiry risk-free-rate volatility option-type]}]
  (let [d1 (d1-calc spot strike time-to-expiry risk-free-rate volatility)]
    (if (= option-type :call)
      (normal-cdf d1)
      (- (normal-cdf d1) 1))))
```

#### Gamma (Γ)
**What**: Rate of change of delta per $1 change in underlying
**Always positive**: For both calls and puts
**Highest**: At-the-money options near expiration

```clojure
(defn calculate-gamma
  "Gamma measures delta acceleration"
  [{:keys [spot strike time-to-expiry risk-free-rate volatility]}]
  (let [d1 (d1-calc spot strike time-to-expiry risk-free-rate volatility)]
    (/ (normal-pdf d1)
       (* spot volatility (Math/sqrt time-to-expiry)))))
```

#### Theta (Θ)
**What**: Time decay - rate of option value loss per day
**Always negative**: For long positions (time works against buyers)
**Accelerates**: As expiration approaches

```clojure
(defn calculate-theta
  "Theta measures time decay (per day)"
  [{:keys [spot strike time-to-expiry risk-free-rate volatility option-type]}]
  ;; Complex Black-Scholes theta formula
  ;; Returns daily decay value (typically negative for long positions)
  )
```

#### Vega (ν)
**What**: Sensitivity to volatility changes
**Always positive**: Higher volatility = higher option value
**Highest**: At-the-money options with longer expiration

```clojure
(defn calculate-vega
  "Vega measures volatility sensitivity"
  [{:keys [spot strike time-to-expiry risk-free-rate volatility]}]
  (let [d1 (d1-calc spot strike time-to-expiry risk-free-rate volatility)]
    (* spot (normal-pdf d1) (Math/sqrt time-to-expiry) 0.01)))
```

### Options Contract Schema

```clojure
;; Complete Options Contract Entity
{:option/id                UUID         ;; Unique identifier
 :option/symbol            String       ;; e.g., "PETRA35" (PETR4 Jan 35 Call)
 :option/underlying        String       ;; e.g., "PETR4"
 :option/type              Keyword      ;; :call or :put
 :option/strike            Decimal      ;; Strike price
 :option/expiration        Instant      ;; Expiration date
 :option/premium           Decimal      ;; Current premium
 :option/bid               Decimal      ;; Best bid
 :option/ask               Decimal      ;; Best ask
 :option/volume            Long         ;; Trading volume
 :option/open-interest     Long         ;; Open interest

 ;; The Greeks
 :option/delta             Decimal      ;; Delta
 :option/gamma             Decimal      ;; Gamma
 :option/theta             Decimal      ;; Theta (daily)
 :option/vega              Decimal      ;; Vega
 :option/rho               Decimal      ;; Rho (interest rate sensitivity)

 ;; Calculated fields
 :option/intrinsic-value   Decimal      ;; In-the-money value
 :option/extrinsic-value   Decimal      ;; Time value (premium - intrinsic)
 :option/moneyness         Keyword      ;; :itm, :atm, :otm
 :option/days-to-expiry    Long         ;; Days until expiration

 ;; MQL5 alignment
 :option/contract-size     Decimal      ;; Shares per contract (usually 100)
 :option/tick-size         Decimal      ;; Minimum price movement
 :option/tick-value        Decimal}     ;; Value of minimum movement
```

---

## Data Model Extensions

### Datomic Schema for Options (MQL5-Aligned)

```clojure
(def option-schema
  "Datomic schema for options trading - MQL5 aligned"
  [;; ═══════════════════════════════════════════════════════════════════
   ;; OPTION CONTRACT
   ;; ═══════════════════════════════════════════════════════════════════
   {:db/ident       :option/id
    :db/valueType   :db.type/uuid
    :db/cardinality :db.cardinality/one
    :db/unique      :db.unique/identity
    :db/doc         "Unique option contract identifier"}

   {:db/ident       :option/symbol
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one
    :db/index       true
    :db/doc         "Option symbol (e.g., PETRA35 for PETR4 Jan 35 Call)"}

   {:db/ident       :option/underlying-symbol
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one
    :db/index       true
    :db/doc         "Underlying asset symbol (MQL5: SYMBOL_BASIS)"}

   {:db/ident       :option/type
    :db/valueType   :db.type/keyword
    :db/cardinality :db.cardinality/one
    :db/doc         "Option type: :call or :put (MQL5: SYMBOL_OPTION_RIGHT)"}

   {:db/ident       :option/strike
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Strike price (MQL5: SYMBOL_OPTION_STRIKE)"}

   {:db/ident       :option/expiration
    :db/valueType   :db.type/instant
    :db/cardinality :db.cardinality/one
    :db/index       true
    :db/doc         "Expiration date/time (MQL5: SYMBOL_EXPIRATION_TIME)"}

   {:db/ident       :option/premium
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Current option premium (last price)"}

   {:db/ident       :option/bid
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Best bid price (MQL5: SYMBOL_BID)"}

   {:db/ident       :option/ask
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Best ask price (MQL5: SYMBOL_ASK)"}

   ;; ═══════════════════════════════════════════════════════════════════
   ;; THE GREEKS
   ;; ═══════════════════════════════════════════════════════════════════
   {:db/ident       :option/delta
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Delta: price sensitivity to underlying"}

   {:db/ident       :option/gamma
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Gamma: delta sensitivity to underlying"}

   {:db/ident       :option/theta
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Theta: daily time decay"}

   {:db/ident       :option/vega
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Vega: sensitivity to volatility"}

   {:db/ident       :option/rho
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Rho: sensitivity to interest rates"}

   ;; ═══════════════════════════════════════════════════════════════════
   ;; OPTION TRADE
   ;; ═══════════════════════════════════════════════════════════════════
   {:db/ident       :option-trade/id
    :db/valueType   :db.type/uuid
    :db/cardinality :db.cardinality/one
    :db/unique      :db.unique/identity
    :db/doc         "Unique option trade identifier"}

   {:db/ident       :option-trade/option
    :db/valueType   :db.type/ref
    :db/cardinality :db.cardinality/one
    :db/doc         "Reference to option contract"}

   {:db/ident       :option-trade/action
    :db/valueType   :db.type/keyword
    :db/cardinality :db.cardinality/one
    :db/doc         "Action: :buy-to-open, :sell-to-open, :buy-to-close, :sell-to-close"}

   {:db/ident       :option-trade/quantity
    :db/valueType   :db.type/long
    :db/cardinality :db.cardinality/one
    :db/doc         "Number of contracts"}

   {:db/ident       :option-trade/premium-paid
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Premium paid (buy) or received (sell)"}

   {:db/ident       :option-trade/timestamp
    :db/valueType   :db.type/long
    :db/cardinality :db.cardinality/one
    :db/doc         "Trade execution timestamp (MQL5: DEAL_TIME_MSC)"}

   {:db/ident       :option-trade/underlying-price
    :db/valueType   :db.type/double
    :db/cardinality :db.cardinality/one
    :db/doc         "Underlying price at trade time"}

   {:db/ident       :option-trade/status
    :db/valueType   :db.type/keyword
    :db/cardinality :db.cardinality/one
    :db/doc         "Status: :open, :closed, :exercised, :expired"}])
```

### Integration with Existing Schema

The options schema **extends** the existing schema without modifying it:

```clojure
;; In schema.clj - add options entities
(def full-schema
  "Complete schema for the Little Trader system."
  (vec (concat bar-schema
               brick-schema
               signal-schema
               trade-schema
               execution-schema
               option-schema           ;; NEW: Options entities
               mql5-symbol-schema)))   ;; NEW: MQL5-aligned symbols
```

---

## Renko Strategy for Options

### Why Renko for Options?

Traditional options strategies focus on Greeks and time decay. **Renko-based options trading** offers unique advantages:

1. **Noise Filtering**: Options prices are volatile; Renko filters noise
2. **Trend Clarity**: Clear visual identification of directional moves
3. **Entry Timing**: Brick patterns signal optimal entry points
4. **Weekly Focus**: Renko excels at capturing 5-10 day moves (weekly options)

### The "Renko Options Swing" Strategy

This strategy is optimized for **weekly/bi-weekly options** based on research of successful approaches:

#### Strategy Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RENKO OPTIONS SWING STRATEGY                     │
├─────────────────────────────────────────────────────────────────────┤
│  Timeframe: Weekly/Bi-Weekly Options (5-15 DTE)                     │
│  Brick Size: ATR(14) × 0.5 of underlying                            │
│  Signal Type: Double-Brick Reversal + Greeks Filter                 │
│  Position: Buy ATM/slightly OTM calls or puts                       │
│  Exit: 50% profit target or 2-brick reversal                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Entry Rules

**For CALL Options (Bullish)**:
1. Double-brick bullish pattern: `[-1, -1, +1]` (downtrend then reversal up)
2. Underlying price > 20-period SMA
3. Option delta between 0.40 and 0.60 (ATM zone)
4. Implied volatility < 80th percentile (avoid IV crush)
5. Days to expiry: 5-15 days

**For PUT Options (Bearish)**:
1. Double-brick bearish pattern: `[+1, +1, -1]` (uptrend then reversal down)
2. Underlying price < 20-period SMA
3. Option delta between -0.60 and -0.40 (ATM zone)
4. Implied volatility < 80th percentile
5. Days to expiry: 5-15 days

#### Exit Rules

1. **Profit Target**: Close at 50% gain on premium
2. **Pattern Exit**: Close on 2-brick reversal against position
3. **Time Exit**: Close if position hasn't hit target with 3 DTE remaining
4. **Stop Loss**: Close at 30% loss on premium

#### Implementation

```clojure
(ns com.little-trader.domain.options-signals
  "Options-specific signal detection using Renko patterns"
  (:require [com.little-trader.domain.renko :as renko]
            [com.little-trader.domain.signals :as signals]))

(defn detect-options-entry-signal
  "Detect entry signals for options based on Renko patterns.

   This strategy focuses on double-brick reversals with Greeks filtering.
   Optimized for weekly/bi-weekly options (5-15 DTE).

   Arguments:
   - bricks: sequence of Renko bricks (underlying asset)
   - option: option contract with Greeks
   - config: strategy configuration

   Returns signal map or nil"
  [bricks option {:keys [min-delta max-delta max-iv-percentile
                         min-dte max-dte sma-period]
                  :or {min-delta 0.40
                       max-delta 0.60
                       max-iv-percentile 0.80
                       min-dte 5
                       max-dte 15
                       sma-period 20}}]
  (when (>= (count bricks) 3)
    (let [{:option/keys [type delta theta days-to-expiry iv-percentile]} option
          abs-delta (Math/abs delta)
          directions (renko/directions (renko/last-n-bricks bricks 3))
          last-brick (last bricks)]

      (cond
        ;; CALL entry: Double-brick bullish reversal
        (and (= type :call)
             (= directions [-1 -1 1])        ;; Bearish then reversal up
             (<= min-delta abs-delta max-delta)
             (<= min-dte days-to-expiry max-dte)
             (< iv-percentile max-iv-percentile))
        {:signal-type :options-renko
         :action :buy-call-swing
         :option-type :call
         :pattern :double-brick-bullish
         :price (:close last-brick)
         :delta delta
         :theta theta
         :days-to-expiry days-to-expiry
         :mts (:mts last-brick)}

        ;; PUT entry: Double-brick bearish reversal
        (and (= type :put)
             (= directions [1 1 -1])         ;; Bullish then reversal down
             (<= min-delta abs-delta max-delta)
             (<= min-dte days-to-expiry max-dte)
             (< iv-percentile max-iv-percentile))
        {:signal-type :options-renko
         :action :buy-put-swing
         :option-type :put
         :pattern :double-brick-bearish
         :price (:close last-brick)
         :delta delta
         :theta theta
         :days-to-expiry days-to-expiry
         :mts (:mts last-brick)}

        :else nil))))

(defn detect-options-exit-signal
  "Detect exit signals for open options positions.

   Exit conditions:
   1. Profit target (50% gain)
   2. Stop loss (30% loss)
   3. Pattern reversal (2 bricks against)
   4. Time exit (3 DTE remaining)

   Arguments:
   - bricks: sequence of Renko bricks
   - position: open option position
   - current-premium: current option premium
   - config: strategy configuration"
  [bricks position current-premium
   {:keys [profit-target-pct stop-loss-pct time-exit-dte]
    :or {profit-target-pct 0.50
         stop-loss-pct -0.30
         time-exit-dte 3}}]
  (let [{:keys [entry-premium option-type days-to-expiry]} position
        pnl-pct (/ (- current-premium entry-premium) entry-premium)
        directions (renko/directions (renko/last-n-bricks bricks 2))
        last-brick (last bricks)]

    (cond
      ;; Profit target hit
      (>= pnl-pct profit-target-pct)
      {:signal-type :options-renko
       :action :close-profit-target
       :reason :profit-target
       :pnl-percent pnl-pct
       :mts (:mts last-brick)}

      ;; Stop loss hit
      (<= pnl-pct stop-loss-pct)
      {:signal-type :options-renko
       :action :close-stop-loss
       :reason :stop-loss
       :pnl-percent pnl-pct
       :mts (:mts last-brick)}

      ;; Time exit - close before expiration
      (<= days-to-expiry time-exit-dte)
      {:signal-type :options-renko
       :action :close-time-exit
       :reason :time-decay
       :days-remaining days-to-expiry
       :mts (:mts last-brick)}

      ;; Pattern reversal for calls (2 down bricks)
      (and (= option-type :call)
           (= directions [-1 -1]))
      {:signal-type :options-renko
       :action :close-pattern-reversal
       :reason :bearish-reversal
       :pattern directions
       :mts (:mts last-brick)}

      ;; Pattern reversal for puts (2 up bricks)
      (and (= option-type :put)
           (= directions [1 1]))
      {:signal-type :options-renko
       :action :close-pattern-reversal
       :reason :bullish-reversal
       :pattern directions
       :mts (:mts last-brick)}

      :else nil)))

(def default-options-config
  "Default configuration for options Renko strategy"
  {:min-delta 0.40
   :max-delta 0.60
   :max-iv-percentile 0.80
   :min-dte 5
   :max-dte 15
   :sma-period 20
   :profit-target-pct 0.50
   :stop-loss-pct -0.30
   :time-exit-dte 3
   :brick-size-mode :atr
   :atr-period 14
   :atr-multiplier 0.5})
```

### Brick Size for Options

Options premiums move differently than underlying assets. Recommended brick sizing:

```clojure
(defn calculate-options-brick-size
  "Calculate optimal brick size for options strategy.

   For the underlying asset (not the option itself):
   - Use ATR(14) × 0.5 for weekly options
   - Use ATR(14) × 0.75 for bi-weekly options
   - Use ATR(14) × 1.0 for monthly options"
  [underlying-bars expiry-type]
  (let [atr (renko/calculate-atr underlying-bars 14)
        multiplier (case expiry-type
                     :weekly 0.5
                     :bi-weekly 0.75
                     :monthly 1.0
                     0.5)]
    (* atr multiplier)))
```

---

## MetaTrader Integration

### MetaTrader 5 Python SDK

MetaTrader 5 provides a [Python integration](https://www.mql5.com/en/docs/python_metatrader5) for algorithmic trading. We integrate via a Python subprocess/service.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    METATRADER 5 INTEGRATION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐      ┌──────────────────┐                    │
│  │                  │      │                  │                    │
│  │  Clojure Core    │ ←──→ │  Python Bridge   │ ←──→ MT5 Terminal  │
│  │  (little-trader) │ HTTP │  (mt5-connector) │ IPC  │             │
│  │                  │      │                  │                    │
│  └──────────────────┘      └──────────────────┘                    │
│                                                                     │
│  Communication: HTTP REST API or ZeroMQ                             │
│  Data Format: JSON (Cheshire ↔ json)                                │
│  Authentication: API key + MT5 account credentials                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Python MT5 Connector Service

```python
# mt5_connector.py - Python bridge to MetaTrader 5
"""
MetaTrader 5 connector for Little Trader system.

This service provides HTTP endpoints for:
- Market data retrieval
- Order placement
- Position management
- Account information

Runs as a separate process, communicates via REST API.
"""

import MetaTrader5 as mt5
from flask import Flask, jsonify, request
from datetime import datetime
import json

app = Flask(__name__)

# ═══════════════════════════════════════════════════════════════════
# INITIALIZATION
# ═══════════════════════════════════════════════════════════════════

@app.route('/api/v1/init', methods=['POST'])
def initialize():
    """Initialize MT5 connection"""
    data = request.json
    if not mt5.initialize(
        path=data.get('terminal_path'),
        login=data.get('login'),
        password=data.get('password'),
        server=data.get('server')
    ):
        return jsonify({'error': mt5.last_error()}), 500
    return jsonify({'status': 'connected', 'version': mt5.version()})

@app.route('/api/v1/shutdown', methods=['POST'])
def shutdown():
    """Shutdown MT5 connection"""
    mt5.shutdown()
    return jsonify({'status': 'disconnected'})

# ═══════════════════════════════════════════════════════════════════
# MARKET DATA
# ═══════════════════════════════════════════════════════════════════

@app.route('/api/v1/symbol/<symbol>', methods=['GET'])
def get_symbol_info(symbol):
    """Get symbol information (MQL5: SymbolInfo)"""
    info = mt5.symbol_info(symbol)
    if info is None:
        return jsonify({'error': f'Symbol {symbol} not found'}), 404
    return jsonify({
        'name': info.name,
        'description': info.description,
        'path': info.path,
        'currency_base': info.currency_base,
        'currency_profit': info.currency_profit,
        'digits': info.digits,
        'point': info.point,
        'spread': info.spread,
        'tick_value': info.trade_tick_value,
        'tick_size': info.trade_tick_size,
        'contract_size': info.trade_contract_size,
        'volume_min': info.volume_min,
        'volume_max': info.volume_max,
        'volume_step': info.volume_step,
        'bid': info.bid,
        'ask': info.ask,
        'last': info.last,
        'option_strike': getattr(info, 'option_strike', None),
        'option_right': getattr(info, 'option_right', None),  # CALL/PUT
        'expiration_time': getattr(info, 'expiration_time', None)
    })

@app.route('/api/v1/bars/<symbol>', methods=['GET'])
def get_bars(symbol):
    """Get OHLCV bars (MQL5: CopyRates)"""
    timeframe = request.args.get('timeframe', 'H1')
    count = int(request.args.get('count', 100))

    tf_map = {
        'M1': mt5.TIMEFRAME_M1,
        'M5': mt5.TIMEFRAME_M5,
        'M15': mt5.TIMEFRAME_M15,
        'M30': mt5.TIMEFRAME_M30,
        'H1': mt5.TIMEFRAME_H1,
        'H4': mt5.TIMEFRAME_H4,
        'D1': mt5.TIMEFRAME_D1,
        'W1': mt5.TIMEFRAME_W1
    }

    rates = mt5.copy_rates_from_pos(symbol, tf_map.get(timeframe, mt5.TIMEFRAME_H1), 0, count)
    if rates is None:
        return jsonify({'error': 'Failed to get rates'}), 500

    bars = []
    for rate in rates:
        bars.append({
            'mts': int(rate['time'] * 1000),  # Convert to milliseconds
            'open': float(rate['open']),
            'high': float(rate['high']),
            'low': float(rate['low']),
            'close': float(rate['close']),
            'volume': float(rate['tick_volume'])
        })

    return jsonify({'symbol': symbol, 'timeframe': timeframe, 'bars': bars})

# ═══════════════════════════════════════════════════════════════════
# ORDER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

@app.route('/api/v1/order', methods=['POST'])
def place_order():
    """Place order (MQL5: OrderSend)"""
    data = request.json

    order_type_map = {
        'buy': mt5.ORDER_TYPE_BUY,
        'sell': mt5.ORDER_TYPE_SELL,
        'buy_limit': mt5.ORDER_TYPE_BUY_LIMIT,
        'sell_limit': mt5.ORDER_TYPE_SELL_LIMIT,
        'buy_stop': mt5.ORDER_TYPE_BUY_STOP,
        'sell_stop': mt5.ORDER_TYPE_SELL_STOP
    }

    request_dict = {
        'action': mt5.TRADE_ACTION_DEAL,
        'symbol': data['symbol'],
        'volume': data['volume'],
        'type': order_type_map.get(data['type'], mt5.ORDER_TYPE_BUY),
        'price': data.get('price', mt5.symbol_info_tick(data['symbol']).ask),
        'sl': data.get('stop_loss', 0),
        'tp': data.get('take_profit', 0),
        'deviation': data.get('deviation', 20),
        'magic': data.get('magic', 234000),  # EA identifier
        'comment': data.get('comment', 'little-trader'),
        'type_time': mt5.ORDER_TIME_GTC,
        'type_filling': mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request_dict)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return jsonify({
            'error': 'Order failed',
            'retcode': result.retcode,
            'comment': result.comment
        }), 400

    return jsonify({
        'ticket': result.order,
        'volume': result.volume,
        'price': result.price,
        'comment': result.comment
    })

# ═══════════════════════════════════════════════════════════════════
# POSITION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════

@app.route('/api/v1/positions', methods=['GET'])
def get_positions():
    """Get open positions (MQL5: PositionsTotal, PositionGet*)"""
    symbol = request.args.get('symbol')

    if symbol:
        positions = mt5.positions_get(symbol=symbol)
    else:
        positions = mt5.positions_get()

    if positions is None:
        return jsonify({'positions': []})

    result = []
    for pos in positions:
        result.append({
            'ticket': pos.ticket,
            'time': int(pos.time * 1000),
            'type': 'buy' if pos.type == mt5.POSITION_TYPE_BUY else 'sell',
            'magic': pos.magic,
            'identifier': pos.identifier,
            'volume': pos.volume,
            'price_open': pos.price_open,
            'price_current': pos.price_current,
            'sl': pos.sl,
            'tp': pos.tp,
            'swap': pos.swap,
            'profit': pos.profit,
            'symbol': pos.symbol,
            'comment': pos.comment
        })

    return jsonify({'positions': result})

@app.route('/api/v1/position/<int:ticket>/close', methods=['POST'])
def close_position(ticket):
    """Close position by ticket"""
    position = mt5.positions_get(ticket=ticket)
    if not position:
        return jsonify({'error': 'Position not found'}), 404

    pos = position[0]
    close_type = mt5.ORDER_TYPE_SELL if pos.type == mt5.POSITION_TYPE_BUY else mt5.ORDER_TYPE_BUY
    price = mt5.symbol_info_tick(pos.symbol).bid if pos.type == mt5.POSITION_TYPE_BUY else mt5.symbol_info_tick(pos.symbol).ask

    request_dict = {
        'action': mt5.TRADE_ACTION_DEAL,
        'symbol': pos.symbol,
        'volume': pos.volume,
        'type': close_type,
        'position': ticket,
        'price': price,
        'deviation': 20,
        'magic': pos.magic,
        'comment': 'close by little-trader',
        'type_time': mt5.ORDER_TIME_GTC,
        'type_filling': mt5.ORDER_FILLING_IOC,
    }

    result = mt5.order_send(request_dict)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        return jsonify({'error': 'Close failed', 'retcode': result.retcode}), 400

    return jsonify({'status': 'closed', 'ticket': ticket, 'profit': pos.profit})

# ═══════════════════════════════════════════════════════════════════
# ACCOUNT INFO
# ═══════════════════════════════════════════════════════════════════

@app.route('/api/v1/account', methods=['GET'])
def get_account_info():
    """Get account information (MQL5: AccountInfo*)"""
    info = mt5.account_info()
    if info is None:
        return jsonify({'error': 'Failed to get account info'}), 500

    return jsonify({
        'login': info.login,
        'server': info.server,
        'balance': info.balance,
        'equity': info.equity,
        'margin': info.margin,
        'margin_free': info.margin_free,
        'margin_level': info.margin_level,
        'profit': info.profit,
        'currency': info.currency,
        'leverage': info.leverage,
        'trade_mode': info.trade_mode
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### Clojure Connector

```clojure
(ns com.little-trader.connectors.metatrader
  "MetaTrader 5 connector via Python bridge.

   This connector communicates with the Python MT5 service
   to execute trades and retrieve market data."
  (:require [clj-http.client :as http]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]))

;; ═══════════════════════════════════════════════════════════════════
;; CONFIGURATION
;; ═══════════════════════════════════════════════════════════════════

(def ^:dynamic *mt5-base-url* "http://localhost:5000/api/v1")

(defn set-mt5-url! [url]
  (alter-var-root #'*mt5-base-url* (constantly url)))

;; ═══════════════════════════════════════════════════════════════════
;; HTTP HELPERS
;; ═══════════════════════════════════════════════════════════════════

(defn- api-get [path & [params]]
  (let [response (http/get (str *mt5-base-url* path)
                           {:query-params params
                            :as :json
                            :throw-exceptions false})]
    (if (= 200 (:status response))
      {:success true :data (:body response)}
      {:success false :error (:body response)})))

(defn- api-post [path body]
  (let [response (http/post (str *mt5-base-url* path)
                            {:body (json/generate-string body)
                             :content-type :json
                             :as :json
                             :throw-exceptions false})]
    (if (#{200 201} (:status response))
      {:success true :data (:body response)}
      {:success false :error (:body response)})))

;; ═══════════════════════════════════════════════════════════════════
;; CONNECTION MANAGEMENT
;; ═══════════════════════════════════════════════════════════════════

(defn initialize
  "Initialize MT5 connection.

   Arguments:
   - config: map with :terminal-path, :login, :password, :server"
  [{:keys [terminal-path login password server]}]
  (log/info "Initializing MT5 connection to" server)
  (api-post "/init" {:terminal_path terminal-path
                     :login login
                     :password password
                     :server server}))

(defn shutdown
  "Shutdown MT5 connection"
  []
  (log/info "Shutting down MT5 connection")
  (api-post "/shutdown" {}))

;; ═══════════════════════════════════════════════════════════════════
;; MARKET DATA
;; ═══════════════════════════════════════════════════════════════════

(defn get-symbol-info
  "Get symbol information (MQL5 aligned).

   Returns map with symbol properties including:
   - :name, :description, :digits, :point
   - :bid, :ask, :spread
   - :tick-value, :tick-size, :contract-size
   - :option-strike, :option-right (for options)"
  [symbol]
  (let [result (api-get (str "/symbol/" symbol))]
    (when (:success result)
      (let [data (:data result)]
        {:symbol/name (:name data)
         :symbol/description (:description data)
         :symbol/digits (:digits data)
         :symbol/point (:point data)
         :symbol/spread (:spread data)
         :symbol/bid (:bid data)
         :symbol/ask (:ask data)
         :symbol/tick-value (:tick_value data)
         :symbol/tick-size (:tick_size data)
         :symbol/contract-size (:contract_size data)
         :symbol/volume-min (:volume_min data)
         :symbol/volume-max (:volume_max data)
         :option/strike (:option_strike data)
         :option/type (when-let [right (:option_right data)]
                        (if (= right 0) :call :put))}))))

(defn get-bars
  "Get OHLCV bars for symbol.

   Arguments:
   - symbol: trading symbol
   - timeframe: :1m, :5m, :15m, :30m, :1h, :4h, :1d, :1w
   - count: number of bars to retrieve"
  [symbol timeframe count]
  (let [tf-str (case timeframe
                 :1m "M1" :5m "M5" :15m "M15" :30m "M30"
                 :1h "H1" :4h "H4" :1d "D1" :1w "W1"
                 "H1")
        result (api-get (str "/bars/" symbol)
                        {:timeframe tf-str :count count})]
    (when (:success result)
      (mapv (fn [bar]
              {:mts (:mts bar)
               :open (:open bar)
               :high (:high bar)
               :low (:low bar)
               :close (:close bar)
               :volume (:volume bar)})
            (get-in result [:data :bars])))))

;; ═══════════════════════════════════════════════════════════════════
;; ORDER MANAGEMENT
;; ═══════════════════════════════════════════════════════════════════

(defn place-order
  "Place order via MT5.

   Arguments:
   - order: map with :symbol, :type, :volume, :price (optional), :sl, :tp"
  [{:keys [symbol type volume price stop-loss take-profit comment]}]
  (log/info "Placing order:" type symbol volume)
  (let [result (api-post "/order"
                         {:symbol symbol
                          :type (name type)
                          :volume volume
                          :price price
                          :stop_loss stop-loss
                          :take_profit take-profit
                          :comment (or comment "little-trader")})]
    (if (:success result)
      {:order/ticket (get-in result [:data :ticket])
       :order/volume (get-in result [:data :volume])
       :order/price (get-in result [:data :price])}
      (do
        (log/error "Order failed:" (:error result))
        nil))))

(defn get-positions
  "Get open positions.

   Arguments:
   - symbol: optional symbol filter"
  ([] (get-positions nil))
  ([symbol]
   (let [result (api-get "/positions" (when symbol {:symbol symbol}))]
     (when (:success result)
       (mapv (fn [pos]
               {:position/ticket (:ticket pos)
                :position/time (:time pos)
                :position/type (keyword (:type pos))
                :position/volume (:volume pos)
                :position/price-open (:price_open pos)
                :position/price-current (:price_current pos)
                :position/sl (:sl pos)
                :position/tp (:tp pos)
                :position/profit (:profit pos)
                :position/symbol (:symbol pos)})
             (get-in result [:data :positions]))))))

(defn close-position
  "Close position by ticket.

   Arguments:
   - ticket: position ticket number"
  [ticket]
  (log/info "Closing position:" ticket)
  (let [result (api-post (str "/position/" ticket "/close") {})]
    (if (:success result)
      {:success true :profit (get-in result [:data :profit])}
      (do
        (log/error "Close failed:" (:error result))
        {:success false :error (:error result)}))))

;; ═══════════════════════════════════════════════════════════════════
;; ACCOUNT INFO
;; ═══════════════════════════════════════════════════════════════════

(defn get-account-info
  "Get account information"
  []
  (let [result (api-get "/account")]
    (when (:success result)
      (let [data (:data result)]
        {:account/login (:login data)
         :account/server (:server data)
         :account/balance (:balance data)
         :account/equity (:equity data)
         :account/margin (:margin data)
         :account/margin-free (:margin_free data)
         :account/profit (:profit data)
         :account/currency (:currency data)
         :account/leverage (:leverage data)}))))
```

---

## Educational Guide: Extending the System

### Lesson 1: Understanding the Extension Pattern

When adding a new feature like EPIC-OPTIONS, the Clojure/Fulcro RAD/Datomic stack shines because of its **data-driven architecture**.

#### Key Insight: Data Flows, Not Object Hierarchies

```clojure
;; Traditional OOP approach (verbose, rigid)
;; - Create new classes for each entity
;; - Create interfaces for abstraction
;; - Create implementations
;; - Create DTOs for API boundaries
;; - Create repositories
;; - Create services
;; - Wire everything together

;; Clojure approach (concise, flexible)
;; - Define schema attributes
;; - Write pure domain functions
;; - Auto-generate everything else

;; The data flows through the system:
;; Input → Pure Function → Output → Database
```

### Lesson 2: Schema-First Development

Start with the data model. Everything else follows from it.

```clojure
;; Step 1: Define what data you need
(def option-schema
  [{:db/ident :option/strike
    :db/valueType :db.type/double
    :db/cardinality :db.cardinality/one}
   ;; ... more attributes
   ])

;; Step 2: RAD auto-generates queries, mutations, forms
;; No manual coding required!

;; Step 3: Write domain logic (pure functions)
(defn calculate-intrinsic-value [option underlying-price]
  ;; Pure calculation - easily testable
  )

;; Step 4: Connect to data source (single integration point)
```

### Lesson 3: Configuration Over Code

Most behavior changes should be configuration, not code changes.

```clojure
;; BAD: Hard-coded behavior
(defn detect-signal [bricks]
  (when (= (get-directions bricks 3) [-1 -1 1])
    {:action :buy}))

;; GOOD: Configuration-driven behavior
(defn detect-signal [bricks {:keys [pattern-enabled? pattern-type]}]
  (when pattern-enabled?
    (let [directions (get-directions bricks (count pattern-type))]
      (when (= directions pattern-type)
        {:action :buy}))))

;; Now you can change behavior via config, not code:
{:pattern-enabled? true
 :pattern-type [-1 -1 1]}
```

### Lesson 4: Pure Functions for Testability

All domain logic should be pure functions with no side effects.

```clojure
;; PURE: Easy to test, reason about, parallelize
(defn calculate-greeks [option market-data]
  {:delta (calc-delta option market-data)
   :gamma (calc-gamma option market-data)
   :theta (calc-theta option market-data)
   :vega (calc-vega option market-data)})

;; Test is straightforward:
(deftest calculate-greeks-test
  (is (= {:delta 0.5 :gamma 0.02 :theta -0.05 :vega 0.15}
         (calculate-greeks test-option test-market-data))))

;; IMPURE: Side effects make testing difficult
(defn calculate-and-save-greeks! [option-id]
  (let [option (db/get-option option-id)           ;; side effect
        market (api/get-market-data)                ;; side effect
        greeks (calculate-greeks option market)]
    (db/save-greeks! option-id greeks)             ;; side effect
    greeks))
```

### Lesson 5: Connector Pattern for Integrations

External integrations (MetaTrader, exchanges) use a connector pattern:

```clojure
;; Define a protocol for the interface
(defprotocol ITradingConnector
  (get-symbol-info [this symbol])
  (place-order [this order])
  (get-positions [this])
  (close-position [this ticket]))

;; Implement for each platform
(defrecord MetaTraderConnector [base-url]
  ITradingConnector
  (get-symbol-info [this symbol]
    ;; MT5 implementation
    )
  (place-order [this order]
    ;; MT5 implementation
    ))

(defrecord CCXTConnector [exchange-id credentials]
  ITradingConnector
  (get-symbol-info [this symbol]
    ;; CCXT implementation
    )
  (place-order [this order]
    ;; CCXT implementation
    ))

;; Domain logic doesn't care which connector is used
(defn execute-trade [connector signal]
  (let [order (signal->order signal)]
    (place-order connector order)))
```

---

## Implementation Walkthrough

### Step 1: Schema Extension

Add options entities to `src/com/little_trader/data/schema.clj`:

```clojure
;; Add to existing schema
(def option-schema
  "Schema for options contracts"
  [{:db/ident :option/id ...}
   {:db/ident :option/symbol ...}
   ;; ... all option attributes
   ])

;; Combine with existing
(def full-schema
  (vec (concat bar-schema brick-schema signal-schema
               trade-schema execution-schema
               option-schema)))  ;; <-- Add here
```

### Step 2: RAD Attributes

Create `src/com/little_trader/model/option.cljc`:

```clojure
(ns com.little-trader.model.option
  (:require [com.fulcrologic.rad.attributes :as attr :refer [defattr]]
            [com.fulcrologic.rad.attributes-options :as ao]))

(defattr id :option/id :uuid
  {ao/identity? true
   ao/schema :production})

(defattr symbol :option/symbol :string
  {ao/identities #{:option/id}
   ao/required? true
   ao/schema :production})

;; RAD will auto-generate:
;; - Resolvers for queries
;; - Mutations for CRUD
;; - Forms for UI
;; - Table reports
```

### Step 3: Domain Logic

Create `src/com/little_trader/domain/options.clj`:

```clojure
(ns com.little-trader.domain.options
  "Pure domain logic for options trading")

(defn calculate-intrinsic-value [option underlying-price]
  (case (:option/type option)
    :call (max 0 (- underlying-price (:option/strike option)))
    :put (max 0 (- (:option/strike option) underlying-price))))

(defn calculate-moneyness [option underlying-price]
  (let [intrinsic (calculate-intrinsic-value option underlying-price)]
    (cond
      (> intrinsic 0) :itm  ;; In the money
      (< intrinsic 0) :otm  ;; Out of the money
      :else :atm)))          ;; At the money
```

### Step 4: Tests

Create `test/com/little_trader/domain/options_test.clj`:

```clojure
(ns com.little-trader.domain.options-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.options :as options]))

(deftest calculate-intrinsic-value-test
  (testing "Call option intrinsic value"
    (let [option {:option/type :call :option/strike 100}]
      (is (= 10 (options/calculate-intrinsic-value option 110)))
      (is (= 0 (options/calculate-intrinsic-value option 90)))))

  (testing "Put option intrinsic value"
    (let [option {:option/type :put :option/strike 100}]
      (is (= 10 (options/calculate-intrinsic-value option 90)))
      (is (= 0 (options/calculate-intrinsic-value option 110))))))
```

---

## Code Change Summary

### Files Created (New)

| File | Purpose |
|------|---------|
| `EPIC_OPTIONS.md` | This documentation |
| `src/com/little_trader/model/option.cljc` | RAD attributes for options |
| `src/com/little_trader/domain/options.clj` | Pure options domain logic |
| `src/com/little_trader/domain/options_signals.clj` | Renko-based options signals |
| `src/com/little_trader/connectors/metatrader.clj` | MT5 connector |
| `test/com/little_trader/domain/options_test.clj` | Options tests |
| `scripts/mt5_connector.py` | Python MT5 bridge service |

### Files Modified (Existing)

| File | Change |
|------|--------|
| `src/com/little_trader/data/schema.clj` | Add options schema |
| `src/com/little_trader/model.cljc` | Include option attributes |
| `src/com/little_trader/domain/signals.clj` | Add options signal integration |

### Configuration Changes

| Config | Addition |
|--------|----------|
| `resources/config.edn` | MT5 connection settings |
| `deps.edn` | HTTP client dependency (clj-http) |

---

## Summary

EPIC-OPTIONS demonstrates the efficiency of the Clojure/Fulcro RAD/Datomic stack:

### What We Achieved

- **New Trading Mode**: Options trading with calls, puts, Greeks
- **New Data Model**: Options contracts, trades, greeks
- **New Strategy**: Renko-based options swing trading
- **New Integration**: MetaTrader 5 via Python SDK
- **MQL5 Alignment**: Industry-standard naming conventions

### Stack Efficiency

| Metric | Traditional Stack | Clojure/RAD Stack |
|--------|------------------|-------------------|
| New files | ~20-25 | ~7-10 |
| Lines of code | ~3000-5000 | ~800-1200 |
| Test setup complexity | High (mocks) | Low (pure functions) |
| API layer work | Manual | Auto-generated |
| UI forms | Manual | Auto-generated |
| Time to implement | Weeks | Days |

### Educational Value

This feature demonstrates:
1. **Data-driven development**: Schema → Auto-generated everything
2. **Pure function testing**: No mocks, simple assertions
3. **Connector pattern**: Clean integration abstraction
4. **Configuration over code**: Behavior via config, not code changes
5. **MQL5 taxonomy**: Industry-standard naming

---

## References

- [MQL5 Documentation](https://www.mql5.com/en/docs)
- [MetaTrader Python Integration](https://www.mql5.com/en/docs/python_metatrader5)
- [Options Greeks - Britannica](https://www.britannica.com/money/option-greeks-delta-theta-gamma-vega)
- [Renko Trading Strategies](https://www.quantifiedstrategies.com/renko-trading-strategy/)
- [Fulcro RAD](https://book.fulcrologic.com/RAD.html)
- [Datomic Documentation](https://docs.datomic.com/)
