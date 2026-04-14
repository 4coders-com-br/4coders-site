# Renko Trading System - Implementation Guide

**Step-by-Step Guide to Build in Clojure**

## Table of Contents
1. [Project Setup](#project-setup)
2. [Phase 1: Foundation](#phase-1-foundation)
3. [Phase 2: Core Domain](#phase-2-core-domain)
4. [Phase 3: Data Layer](#phase-3-data-layer)
5. [Phase 4: Strategy Engine](#phase-4-strategy-engine)
6. [Phase 5: Frontend](#phase-5-frontend)
7. [Phase 6: Deployment](#phase-6-deployment)

---

## Project Setup

### 1. Create Project Structure
```bash
lein new app renko-trader
cd renko-trader

# Create directory structure
mkdir -p src/com/little_trader/{server,domain,strategy,data,streams,util,ui}
mkdir -p test/com/little_trader
mkdir -p resources/{public,config}
mkdir -p k8s
```

### 2. Update `project.clj`
```clojure
(defproject renko-trader "0.1.0-SNAPSHOT"
  :description "Renko trading system in Clojure"
  :url "https://github.com/4coders-com-br/little-trader"
  :license {:name "EPL-2.0"}

  :dependencies [
    [org.clojure/clojure "1.11.1"]
    [org.clojure/clojurescript "1.11.0"]
    [org.clojure/core.async "1.6.673"]
    [org.clojure/spec.alpha "0.3.218"]
    [org.clojure/test.check "1.1.1"]

    ;; Fulcro stack
    [com.fulcrologic/fulcro "3.5.0"]
    [com.fulcrologic/fulcro-rad "1.0.0"]
    [com.fulcrologic/fulcro-rad-semantic-ui "1.0.0"]
    [com.fulcrologic/fulcro-inspect "3.3.10"]

    ;; Database
    [com.datomic/datomic-pro "1.0.6242"]
    [com.datomic/local "1.0.6242"]

    ;; Server
    [ring "1.9.5"]
    [ring/ring-core "1.9.5"]
    [com.taoensso/timbre "6.0.0"]  ;; Logging

    ;; Kafka
    [clj-kafka "0.6.1"]
    [org.apache.kafka/kafka-clients "3.4.0"]

    ;; Charting
    [metasoarous/oz "1.6.0"]
    [vega "1.0.0-SNAPSHOT"]

    ;; Utilities
    [juxt/crux "21.12-1.17.1"]  ;; Alternative temporal DB
    [mount "0.1.16"]  ;; Component lifecycle
    [medley "1.4.0"]  ;; Utility functions
    [clj-time "0.15.4"]  ;; Date/time
  ]

  :plugins [
    [lein-figwheel "0.5.20"]
    [lein-cljsbuild "1.7.1"]
  ]

  :cljsbuild {
    :builds [{
      :id "dev"
      :source-paths ["src"]
      :figwheel true
      :compiler {
        :main com.little-trader.ui.core
        :asset-path "js/compiled/out"
        :output-to "resources/public/js/compiled/app.js"
        :output-dir "resources/public/js/compiled/out"
        :source-map-timestamp true
      }
    }]
  }

  :main com.little-trader.main
  :aot [com.little-trader.main]

  :profiles {
    :dev {
      :source-paths ["dev"]
      :dependencies [
        [org.clojure/tools.namespace "0.3.0"]
        [org.clojure/tools.nrepl "0.2.13"]
      ]
    }
    :test {
      :dependencies [
        [org.clojure/test.check "1.1.1"]
      ]
    }
  }
)
```

### 3. Setup Configuration
**`resources/config.edn`**:
```clojure
{:datomic {
   :uri "datomic:dev://localhost:4334/renko-trader"
  }
 :kafka {
   :brokers ["localhost:9092"]
   :topic-ohlcv "ohlcv-data"
  }
 :broker {
   :type :bitfinex
   :api-key (System/getenv "BITFINEX_API_KEY")
   :api-secret (System/getenv "BITFINEX_API_SECRET")
  }
 :execution {
   :mode :paper  ;; or :backtest, :production
   :symbol "BTC/USD"
  }
}
```

---

## Phase 1: Foundation

### Step 1.1: Logger Utility
**`src/com/little_trader/util/logger.clj`**:
```clojure
(ns com.little-trader.util.logger
  (:require [taoensso.timbre :as timbre]))

(timbre/set-config! {:level :info
                     :appenders {
                       :println (timbre/println-appender {:output-fn timbre/default-output-fn})
                     }})

(defn log-info [msg & args]
  (timbre/info msg args))

(defn log-warn [msg & args]
  (timbre/warn msg args))

(defn log-error [msg & args]
  (timbre/error msg args))

(defn log-trade [trade]
  (log-info (str "TRADE: " trade)))

(defn log-signal [signal]
  (log-info (str "SIGNAL: " signal)))

(defn log-bar [bar]
  (log-info (str "BAR: " bar)))
```

### Step 1.2: Spec Definitions
**`src/com/little_trader/util/spec.clj`**:
```clojure
(ns com.little-trader.util.spec
  (:require [clojure.spec.alpha :as s]))

;; Common types
(s/def ::uuid uuid?)
(s/def ::timestamp #(and (integer? %) (pos? %)))
(s/def ::symbol string?)
(s/def ::price (s/and number? pos?))
(s/def ::amount (s/and number? pos?))
(s/def ::side #{:long :short})

;; OHLCV
(s/def ::ohlcv (s/keys :req [:ohlcv/mts :ohlcv/open :ohlcv/high
                              :ohlcv/low :ohlcv/close :ohlcv/volume]))

;; Strategy config
(s/def ::strategy-config (s/keys :req [:strategy/symbol :strategy/brick-size
                                       :strategy/mode :strategy/exec-mode]))

;; Trade
(s/def ::trade (s/keys :req [:trade/id :trade/symbol :trade/side
                             :trade/entry-price :trade/status]))

;; Signal
(s/def ::signal (s/keys :req [:signal/id :signal/type :signal/action :signal/side]))
```

### Step 1.3: Time Utilities
**`src/com/little_trader/util/time.clj`**:
```clojure
(ns com.little-trader.util.time
  (:require [clj-time.core :as t]
            [clj-time.coerce :as tc]))

(defn now-ms []
  "Current time in milliseconds"
  (System/currentTimeMillis))

(defn mts->date [mts]
  "Convert millisecond timestamp to java.util.Date"
  (java.util.Date. mts))

(defn date->mts [date]
  "Convert java.util.Date to millisecond timestamp"
  (.getTime date))

(defn format-duration [ms]
  "Format duration in ms to human-readable string"
  (let [seconds (quot ms 1000)
        minutes (quot seconds 60)
        hours (quot minutes 60)]
    (cond
      (< seconds 60) (str seconds "s")
      (< minutes 60) (str minutes "m")
      :else (str hours "h"))))
```

### Step 1.4: Math Utilities
**`src/com/little_trader/util/math.clj`**:
```clojure
(ns com.little-trader.util.math)

(defn round [num decimals]
  "Round to N decimal places"
  (let [factor (Math/pow 10 decimals)]
    (/ (Math/round (* num factor)) factor)))

(defn pnl-percent [entry-price exit-price side]
  "Calculate P&L percentage"
  (let [diff (if (= side :long)
               (- exit-price entry-price)
               (- entry-price exit-price))]
    (/ diff entry-price)))

(defn pnl-dollars [entry-price exit-price amount side]
  "Calculate P&L in dollars"
  (* amount (pnl-percent entry-price exit-price side)))

(defn slippage-adjusted-price [price slippage-pct]
  "Apply slippage to price"
  (* price (+ 1 slippage-pct)))

(defn fee-deducted [amount fee-pct]
  "Deduct fee from amount"
  (* amount (- 1 fee-pct)))
```

---

## Phase 2: Core Domain

### Step 2.1: Renko Brick Generation
**`src/com/little_trader/domain/renko.clj`**:
```clojure
(ns com.little-trader.domain.renko
  (:require [clojure.spec.alpha :as s]
            [com.little-trader.util.math :as math]
            [com.little-trader.util.logger :as log]))

(s/def ::brick (s/keys :req-un [::mts ::open ::high ::low ::close
                                ::direction ::size ::type]))

(defn build-brick
  "Construct a Renko brick"
  [mts close direction size brick-type]
  (let [open (if (= direction 1)
               (- close size)
               (+ close size))]
    {:mts mts
     :open open
     :high (max open close)
     :low (min open close)
     :close close
     :direction direction
     :size size
     :type brick-type}))

(defn classify-brick-type
  "Determine brick type from gap count"
  [gap-count last-direction direction]
  (let [abs-gap (Math/abs gap-count)]
    (cond
      (and (= direction last-direction) (= abs-gap 1))
      "forward_single"

      (and (= direction last-direction) (= abs-gap 2))
      "forward_double_first"

      (and (= direction last-direction) (> abs-gap 2))
      "forward_multiple_first"

      (and (not= direction last-direction) (= abs-gap 2))
      "backward_single"

      (and (not= direction last-direction) (= abs-gap 3))
      "backward_double_first"

      (and (not= direction last-direction) (> abs-gap 3))
      "backward_multiple_first"

      :else "unknown")))

(defn renko-rule-ohlcv
  "Generate bricks from new OHLCV and last brick"
  [last-brick ohlcv brick-size]
  (if (nil? last-brick)
    ;; First brick: alignment
    (let [factor (long (/ (:close ohlcv) brick-size))
          direction (if (>= (:close ohlcv) (:open ohlcv)) 1 -1)
          aligned-close (* factor brick-size)]
      [(build-brick (:mts ohlcv) aligned-close direction brick-size "initial")])

    ;; Subsequent bricks
    (let [price-diff (- (:close ohlcv) (:close last-brick))
          gap-count (long (/ price-diff brick-size))]

      (if (zero? gap-count)
        []  ;; No new bricks yet

        (let [direction (java.lang.Long/signum gap-count)
              new-bricks-count (Math/abs gap-count)
              last-direction (:direction last-brick)
              brick-type (classify-brick-type gap-count last-direction direction)

              ;; Generate bricks
              bricks (reduce
                      (fn [acc idx]
                        (let [brick-close (+ (:close last-brick)
                                            (* brick-size direction (inc idx)))]
                          (conj acc (build-brick (:mts ohlcv) brick-close direction brick-size brick-type))))
                      []
                      (range new-bricks-count))]

          bricks)))))

(defn get-new-bricks-from-ohlcv
  "Main entry point for brick generation"
  [ohlcv bars brick-size]
  (let [last-bricks (last bars)
        last-brick (when (seq last-bricks) (last last-bricks))]
    (renko-rule-ohlcv last-brick ohlcv brick-size)))
```

### Step 2.2: Signal Detection
**`src/com/little_trader/domain/signals.clj`**:
```clojure
(ns com.little-trader.domain.signals
  (:require [clojure.spec.alpha :as s]
            [com.little-trader.util.logger :as log]))

(s/def ::signal (s/keys :req-un [::type ::action ::side]))

(defn get-brick-directions
  "Get direction sequence of last N bricks"
  [bricks n]
  (->> bricks
       (take-last n)
       reverse
       (map :direction)))

(defn detect-one-brick-signal
  "Detect single brick reversal"
  [brick-list state config]
  (let [last-two (take-last 2 brick-list)
        directions (map :direction last-two)]
    (cond
      (= directions '(1 -1))
      {:type :renko :action "one_brick_start_long" :side :long}

      (= directions '(-1 1))
      {:type :renko :action "one_brick_start_short" :side :short}

      :else nil)))

(defn detect-double-brick-signal
  "Detect two-brick reversal"
  [brick-list state config]
  (let [last-three (take-last 3 brick-list)
        directions (map :direction last-three)]
    (cond
      (= directions '(1 1 -1))
      {:type :renko :action "double_brick_start_long" :side :long}

      (= directions '(-1 -1 1))
      {:type :renko :action "double_brick_start_short" :side :short}

      :else nil)))

(defn detect-multi-brick-signal
  "Detect 3+ brick trend"
  [brick-list state config]
  (let [last-three (take-last 3 brick-list)
        directions (map :direction last-three)]
    (cond
      (every? #(= % 1) directions)
      {:type :renko :action "multi_brick_start_long" :side :long}

      (every? #(= % -1) directions)
      {:type :renko :action "multi_brick_start_short" :side :short}

      :else nil)))

(defn detect-renko-signals
  "Main signal detection"
  [brick-list state config]
  (or
    (when (:one-brick-enabled config) (detect-one-brick-signal brick-list state config))
    (when (:double-brick-enabled config) (detect-double-brick-signal brick-list state config))
    (when (:multi-brick-enabled config) (detect-multi-brick-signal brick-list state config))))
```

### Step 2.3: Risk Management
**`src/com/little_trader/domain/risk.clj`**:
```clojure
(ns com.little-trader.domain.risk
  (:require [com.little-trader.util.math :as math]))

(defn calculate-pnl-percent
  "Calculate current P&L percentage"
  [base-price current-price side]
  (if (= side :long)
    (/ (- current-price base-price) base-price)
    (/ (- base-price current-price) base-price)))

(defn check-stop-loss
  "Check if stop loss threshold exceeded"
  [base-price current-price side stop-loss-pct]
  (let [pnl (calculate-pnl-percent base-price current-price side)]
    (if (and stop-loss-pct (<= pnl stop-loss-pct))
      {:type :risk :action "stop_loss" :side side}
      nil)))

(defn check-trailing-stop
  "Check if trailing stop should trigger"
  [pnl max-profit trailing-ranges]
  (if (> pnl (get (first trailing-ranges) :trailing-start))
    (let [limit (get (first trailing-ranges) :trailing-limit)
          take-profit-level (- max-profit limit)]
      (if (<= pnl take-profit-level)
        {:type :risk :action "take_profit" :is-trailing true}
        nil))
    nil))

(defn detect-risk-signals
  "Check all risk conditions"
  [active-trade current-price config]
  (when active-trade
    (let [base-price (:entry-price active-trade)
          side (:side active-trade)]
      (or
        (when (:stop-loss-enabled config)
          (check-stop-loss base-price current-price side (:stop-loss-percent config)))
        (when (:take-profit-enabled config)
          (check-trailing-stop
            (calculate-pnl-percent base-price current-price side)
            (:max-trailing-profit active-trade)
            (:trailing-ranges config)))))))
```

### Step 2.4: Trade Lifecycle
**`src/com/little_trader/domain/trade.clj`**:
```clojure
(ns com.little-trader.domain.trade
  (:require [java.util UUID]
            [com.little-trader.util.math :as math]))

(defn create-trade
  "Create new trade from signal"
  [signal entry-price amount side]
  {:id (UUID/randomUUID)
   :entry-price entry-price
   :entry-amount amount
   :entry-timestamp (System/currentTimeMillis)
   :side side
   :status :open})

(defn close-trade
  "Calculate P&L and close trade"
  [trade exit-price exit-timestamp fees]
  (let [pnl-pct (math/pnl-percent (:entry-price trade) exit-price (:side trade))
        pnl (math/pnl-dollars (:entry-price trade) exit-price (:entry-amount trade) (:side trade))]
    (assoc trade
      :exit-price exit-price
      :exit-timestamp exit-timestamp
      :exit-fees fees
      :pnl (math/round pnl 2)
      :pnl-percent (math/round pnl-pct 4)
      :status :closed)))

(defn update-trailing
  "Update trailing stop state"
  [trade current-price max-trailing-profit]
  (assoc trade
    :trailing-price current-price
    :max-trailing-profit max-trailing-profit
    :is-trailing true))

(defn reverse-trade
  "Close and open opposite trade"
  [trade exit-price exit-timestamp new-side new-entry-price amount]
  (let [closed (close-trade trade exit-price exit-timestamp 0)]
    [closed (create-trade nil new-entry-price amount new-side)]))
```

---

## Phase 3: Data Layer

### Step 3.1: Datomic Schema
**`src/com/little_trader/data/schema.clj`**:
```clojure
(ns com.little-trader.data.schema)

(def trading-schema [
  ;; OHLCV Bars
  {:db/ident :bar/id :db/valueType :db.type/uuid :db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
  {:db/ident :bar/mts :db/valueType :db.type/long :db/cardinality :db.cardinality/one}
  {:db/ident :bar/symbol :db/valueType :db.type/string :db/cardinality :db.cardinality/one}
  {:db/ident :bar/ohlcv :db/valueType :db.type/tuple :db/tupleType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :bar/volume :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :bar/type :db/valueType :db.type/keyword :db/cardinality :db.cardinality/one}

  ;; Renko Bricks
  {:db/ident :brick/id :db/valueType :db.type/uuid :db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
  {:db/ident :brick/bar :db/valueType :db.type/ref :db/cardinality :db.cardinality/one}
  {:db/ident :brick/mts :db/valueType :db.type/long :db/cardinality :db.cardinality/one}
  {:db/ident :brick/ohlc :db/valueType :db.type/tuple :db/tupleType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :brick/direction :db/valueType :db.type/long :db/cardinality :db.cardinality/one}
  {:db/ident :brick/size :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :brick/type :db/valueType :db.type/string :db/cardinality :db.cardinality/one}

  ;; Signals
  {:db/ident :signal/id :db/valueType :db.type/uuid :db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
  {:db/ident :signal/brick :db/valueType :db.type/ref :db/cardinality :db.cardinality/one}
  {:db/ident :signal/type :db/valueType :db.type/keyword :db/cardinality :db.cardinality/one}
  {:db/ident :signal/action :db/valueType :db.type/string :db/cardinality :db.cardinality/one}
  {:db/ident :signal/side :db/valueType :db.type/keyword :db/cardinality :db.cardinality/one}
  {:db/ident :signal/mts :db/valueType :db.type/long :db/cardinality :db.cardinality/one}

  ;; Trades
  {:db/ident :trade/id :db/valueType :db.type/uuid :db/cardinality :db.cardinality/one :db/unique :db.unique/identity}
  {:db/ident :trade/symbol :db/valueType :db.type/string :db/cardinality :db.cardinality/one}
  {:db/ident :trade/entry-signal :db/valueType :db.type/ref :db/cardinality :db.cardinality/one}
  {:db/ident :trade/entry-price :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :trade/entry-amount :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :trade/entry-timestamp :db/valueType :db.type/long :db/cardinality :db.cardinality/one}
  {:db/ident :trade/side :db/valueType :db.type/keyword :db/cardinality :db.cardinality/one}
  {:db/ident :trade/exit-signal :db/valueType :db.type/ref :db/cardinality :db.cardinality/one}
  {:db/ident :trade/exit-price :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :trade/exit-timestamp :db/valueType :db.type/long :db/cardinality :db.cardinality/one}
  {:db/ident :trade/status :db/valueType :db.type/keyword :db/cardinality :db.cardinality/one}
  {:db/ident :trade/pnl :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
  {:db/ident :trade/pnl-percent :db/valueType :db.type/double :db/cardinality :db.cardinality/one}
])
```

---

## Phase 4: Strategy Engine

### Step 4.1: Backtest Executor
**`src/com/little_trader/strategy/backtest.clj`**:
```clojure
(ns com.little-trader.strategy.backtest
  (:require [com.little-trader.domain.renko :as renko]
            [com.little-trader.domain.signals :as signals]
            [com.little-trader.domain.risk :as risk]
            [com.little-trader.domain.trade :as trade]
            [com.little-trader.data.db :as db]))

(defn backtest-loop
  "Main backtest execution loop"
  [config db ohlcv-seq]
  (loop [bars []
         trades []
         signals []
         active-trade nil
         ohlcvs ohlcv-seq]

    (if-let [ohlcv (first ohlcvs)]
      ;; Skip if outside date range
      (if (and (>= (:mts ohlcv) (:start-mts config))
               (<= (:mts ohlcv) (:end-mts config)))

        ;; Generate bricks
        (let [new-bricks (renko/get-new-bricks-from-ohlcv ohlcv bars (:brick-size config))
              bar-with-bricks (assoc ohlcv :bricks new-bricks)
              bars (conj bars bar-with-bricks)

              ;; Detect signal
              signal (signals/detect-renko-signals new-bricks {} config)

              ;; Risk check
              risk-signal (when active-trade
                           (risk/detect-risk-signals active-trade (:close ohlcv) config))

              final-signal (or risk-signal signal)

              ;; Execute trade
              [new-active-trade new-closed new-started]
              (if final-signal
                (cond
                  (clojure.string/includes? (:action final-signal) "start")
                  [(trade/create-trade final-signal (:close ohlcv)
                                      (/ (:order-size-stable config) (:close ohlcv))
                                      (:side final-signal)) nil nil]

                  (clojure.string/includes? (:action final-signal) "stop")
                  [(assoc active-trade :status :closed) active-trade nil]

                  :else [active-trade nil nil])
                [active-trade nil nil])

              signals (if final-signal (conj signals final-signal) signals)
              trades (cond
                       new-started (conj trades new-started)
                       new-closed (conj trades new-closed)
                       :else trades)]

          ;; Persist to DB
          (when final-signal
            (db/transact-signal! db final-signal))
          (when new-started
            (db/transact-trade! db new-started))
          (when new-closed
            (db/transact-trade! db new-closed))

          (recur bars trades signals new-active-trade (rest ohlcvs)))

        ;; Outside date range, skip
        (recur bars trades signals active-trade (rest ohlcvs)))

      ;; End of data
      (do
        (when active-trade
          (let [final-bar (last bars)
                closed (trade/close-trade active-trade (:close final-bar) (:mts final-bar) 0)]
            (db/transact-trade! db closed)
            (conj trades closed)))
        {:bars bars :trades trades :signals signals}))))
```

---

## Phase 5: Frontend

### Step 5.1: Fulcro Components
**`src/com/little_trader/ui/trades.cljs`**:
```clojure
(ns com.little-trader.ui.trades
  (:require [com.fulcrologic.fulcro.components :as comp :refer [defsc]]
            [com.fulcrologic.fulcro.dom :as dom]))

(defsc TradeListItem [this {trade-id :trade/id
                           entry-price :trade/entry-price
                           exit-price :trade/exit-price
                           pnl :trade/pnl
                           status :trade/status}]
  {:query [:trade/id :trade/entry-price :trade/exit-price :trade/pnl :trade/status]
   :ident :trade/id}
  (dom/div :.trade-item {:key trade-id}
    (dom/span :.entry-price (str "$" entry-price))
    (dom/span :.exit-price (str "$" exit-price))
    (dom/span :.pnl (str "$" pnl))
    (dom/span :.status (str status))))

(defsc TradeList [this {trades :trades/all}]
  {:query [{:trades/all (comp/get-query TradeListItem)}]}
  (dom/div :.trade-list
    (map (fn [trade] (ui-trade-list-item trade)) trades)))
```

---

## Phase 6: Deployment

### Step 6.1: Docker Setup
**`Dockerfile`**:
```dockerfile
FROM clojure:openjdk-17-lein-2.9.10

WORKDIR /app
COPY . .

RUN lein do clean, compile

EXPOSE 3000 8080

CMD ["lein", "run"]
```

**`docker-compose.yml`**:
```yaml
version: '3.8'
services:
  datomic:
    image: datomic:latest
    ports:
      - "4334:4334"
    environment:
      DATOMIC_URI: datomic:mem://trading

  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"

  app:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    depends_on:
      - datomic
      - kafka
    environment:
      DATOMIC_URI: datomic:mem://trading
      KAFKA_BROKERS: kafka:9092
```

---

## Summary

This implementation guide provides:
- ✅ Project structure and dependencies
- ✅ Core domain logic implementation
- ✅ Data persistence layer
- ✅ Strategy execution engine
- ✅ Frontend components
- ✅ Containerization and deployment

Follow phases sequentially and test each module independently.
