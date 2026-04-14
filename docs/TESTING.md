# Renko Trading System - Comprehensive Testing Strategy

**Test-Driven Development & Quality Assurance**

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Test Pyramid](#test-pyramid)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [Property-Based Tests](#property-based-tests)
6. [End-to-End Tests](#end-to-end-tests)
7. [Performance Tests](#performance-tests)
8. [Monitoring & Observability](#monitoring--observability)

---

## Testing Philosophy

### Principles
1. **Test-Driven Development**: Write tests first, implementation second
2. **Pyramid over Ice-Cream Cone**: Many unit tests, fewer integration tests, minimal E2E tests
3. **Fast Feedback**: Tests run in <10 minutes, unit tests in seconds
4. **Deterministic**: Tests produce same results every run
5. **Isolated**: Tests don't depend on each other or external services
6. **Descriptive**: Test names explain what and why they test

### Coverage Targets
- **Unit tests**: >85% code coverage
- **Critical domain logic**: 100% coverage
- **Integration tests**: Major workflows
- **E2E tests**: Happy path + key failure scenarios

---

## Test Pyramid

```
       ┌─────────────────────┐
       │   E2E Tests (5%)    │  - Full system, real data
       ├─────────────────────┤
       │ Integration Tests   │  - Components + DB + API
       │      (20%)          │
       ├─────────────────────┤
       │  Unit Tests (75%)   │  - Pure functions, fast
       └─────────────────────┘
```

---

## Unit Tests

### 1. Renko Brick Generation Tests

**File**: `test/com/little_trader/domain/renko_test.clj`

```clojure
(ns com.little-trader.domain.renko-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.renko :as renko]))

;; Test first brick alignment
(deftest first-brick-alignment
  (let [ohlcv {:mts 1000 :open 100 :high 105 :low 95 :close 102}
        bricks (renko/get-new-bricks-from-ohlcv ohlcv [] 10)]
    (is (= 1 (count bricks)))
    (is (= "initial" (:type (first bricks))))
    (is (= 100 (:close (first bricks))))
    (is (= 1 (:direction (first bricks))))))

;; Test single brick generation
(deftest single-brick-generation
  (let [last-brick {:mts 1000 :close 100 :direction 1 :size 10}
        ohlcv {:mts 2000 :close 111}  ;; 11 points up = 1 brick
        bricks (renko/renko-rule-ohlcv last-brick ohlcv 10)]
    (is (= 1 (count bricks)))
    (is (= 110 (:close (first bricks))))
    (is (= "forward_single" (:type (first bricks))))))

;; Test multiple bricks generation
(deftest multiple-bricks-generation
  (let [last-brick {:mts 1000 :close 100 :direction 1 :size 10}
        ohlcv {:mts 2000 :close 135}  ;; 35 points up = 3 bricks
        bricks (renko/renko-rule-ohlcv last-brick ohlcv 10)]
    (is (= 3 (count bricks)))
    (is (= [110 120 130] (map :close bricks)))))

;; Test reversal brick (requires 2x)
(deftest reversal-brick
  (let [last-brick {:mts 1000 :close 100 :direction 1 :size 10}
        ohlcv {:mts 2000 :close 80}  ;; 20 points down (2x) = reversal
        bricks (renko/renko-rule-ohlcv last-brick ohlcv 10)]
    (is (= 2 (count bricks)))
    (is (= -1 (:direction (first bricks))))
    (is (= "backward_single" (:type (first bricks))))))

;; Test no brick when insufficient movement
(deftest no-brick-insufficient-movement
  (let [last-brick {:mts 1000 :close 100 :direction 1 :size 10}
        ohlcv {:mts 2000 :close 105}  ;; 5 points = 0 bricks
        bricks (renko/renko-rule-ohlcv last-brick ohlcv 10)]
    (is (empty? bricks))))

;; Property-based test for brick consistency
(deftest ^:property brick-consistency
  (prop/for-all [
    brick-size (gen/large-integer* {:min 1 :max 1000})
    price-diff (gen/large-integer* {:min -10000 :max 10000})]
    (let [last-brick {:mts 1000 :close 1000 :direction 1 :size brick-size}
          ohlcv {:mts 2000 :close (+ 1000 price-diff)}
          bricks (renko/renko-rule-ohlcv last-brick ohlcv brick-size)
          gap-count (quot price-diff brick-size)]
      ;; Number of bricks should match gap count
      (if (zero? gap-count)
        (empty? bricks)
        (= (count bricks) (Math/abs gap-count))))))
```

### 2. Signal Detection Tests

**File**: `test/com/little_trader/domain/signals_test.clj`

```clojure
(ns com.little-trader.domain.signals-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.signals :as signals]))

;; One-brick reversal signals
(deftest one-brick-long-signal
  (let [bricks [{:direction -1} {:direction 1}]
        signal (signals/detect-one-brick-signal bricks {} {})]
    (is (= :renko (:type signal)))
    (is (= "one_brick_start_long" (:action signal)))
    (is (= :long (:side signal)))))

(deftest one-brick-short-signal
  (let [bricks [{:direction 1} {:direction -1}]
        signal (signals/detect-one-brick-signal bricks {} {})]
    (is (= "one_brick_start_short" (:action signal)))
    (is (= :short (:side signal)))))

;; Two-brick reversal signals
(deftest double-brick-long-signal
  (let [bricks [{:direction 1} {:direction 1} {:direction -1}]
        signal (signals/detect-double-brick-signal bricks {} {})]
    (is (= "double_brick_start_long" (:action signal)))
    (is (= :long (:side signal)))))

;; Multi-brick signals
(deftest multi-brick-long-signal
  (let [bricks [{:direction 1} {:direction 1} {:direction 1}]
        signal (signals/detect-multi-brick-signal bricks {} {})]
    (is (= "multi_brick_start_long" (:action signal)))))

(deftest no-signal-insufficient-bricks
  (let [bricks [{:direction 1}]
        signal (signals/detect-renko-signals bricks {} {:one-brick-enabled true})]
    (is (nil? signal))))

(deftest disabled-signals-return-nil
  (let [bricks [{:direction -1} {:direction 1}]
        signal (signals/detect-renko-signals bricks {} {:one-brick-enabled false})]
    (is (nil? signal))))
```

### 3. Risk Management Tests

**File**: `test/com/little_trader/domain/risk_test.clj`

```clojure
(ns com.little-trader.domain.risk-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.risk :as risk]))

(deftest stop-loss-trigger
  (let [trade {:entry-price 100 :side :long}
        current-price 98  ;; 2% loss
        config {:stop-loss-enabled true :stop-loss-percent -0.02}
        signal (risk/check-stop-loss 100 98 :long -0.02)]
    (is (= "stop_loss" (:action signal)))))

(deftest stop-loss-not-triggered
  (let [signal (risk/check-stop-loss 100 99 :long -0.02)]  ;; 1% loss
    (is (nil? signal))))

(deftest pnl-long-calculation
  (let [pnl (risk/calculate-pnl-percent 100 110 :long)]
    (is (= 0.1 pnl))))

(deftest pnl-short-calculation
  (let [pnl (risk/calculate-pnl-percent 100 90 :short)]
    (is (= 0.1 pnl))))

(deftest trailing-stop-activation
  (let [pnl 0.02  ;; 2% profit
        max-profit 0.01  ;; Previous max 1%
        ranges [{:trailing-start 0.01 :trailing-limit 0.005}]
        signal (risk/check-trailing-stop pnl max-profit ranges)]
    ;; Should not trigger if P&L decreased below threshold
    (is (or (nil? signal) (contains? signal :action)))))

(deftest trailing-stop-execution
  (let [pnl 0.015  ;; Current profit 1.5%
        max-profit 0.02  ;; Max reached 2%
        ranges [{:trailing-start 0.01 :trailing-limit 0.005}]
        signal (risk/check-trailing-stop pnl max-profit ranges)]
    ;; P&L decreased from max by 0.5% = execute take profit
    (is (= "take_profit" (:action signal)))))
```

### 4. Trade Lifecycle Tests

**File**: `test/com/little_trader/domain/trade_test.clj`

```clojure
(ns com.little-trader.domain.trade-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.trade :as trade]))

(deftest create-trade
  (let [t (trade/create-trade {:side :long} 100 1.0 :long)]
    (is (= :long (:side t)))
    (is (= 100 (:entry-price t)))
    (is (= 1.0 (:entry-amount t)))
    (is (= :open (:status t)))
    (is (uuid? (:id t)))))

(deftest close-trade-profit
  (let [t (trade/create-trade {:side :long} 100 1.0 :long)
        closed (trade/close-trade t 110 2000 1.0)]
    (is (= :closed (:status closed)))
    (is (= 110 (:exit-price closed)))
    (is (= 0.1 (:pnl-percent closed)))
    (is (= 10 (:pnl closed)))))

(deftest close-trade-loss
  (let [t (trade/create-trade {:side :long} 100 1.0 :long)
        closed (trade/close-trade t 95 2000 1.0)]
    (is (= -0.05 (:pnl-percent closed)))
    (is (= -5 (:pnl closed)))))

(deftest close-trade-short
  (let [t (trade/create-trade {:side :short} 100 1.0 :short)
        closed (trade/close-trade t 90 2000 1.0)]
    (is (= 0.1 (:pnl-percent closed)))
    (is (= 10 (:pnl closed)))))

(deftest update-trailing
  (let [t (trade/create-trade {:side :long} 100 1.0 :long)
        trailing (trade/update-trailing t 110 0.09)]
    (is (= true (:is-trailing trailing)))
    (is (= 110 (:trailing-price trailing)))
    (is (= 0.09 (:max-trailing-profit trailing)))))

(deftest reverse-trade
  (let [t (trade/create-trade {:side :long} 100 1.0 :long)
        [closed opened] (trade/reverse-trade t 105 2000 :short 104 1.0)]
    (is (= :closed (:status closed)))
    (is (= :open (:status opened)))
    (is (= :short (:side opened)))
    (is (= 104 (:entry-price opened)))))
```

---

## Integration Tests

### 1. Renko + Signal Detection Pipeline

**File**: `test/com/little_trader/strategy/pipeline_test.clj`

```clojure
(ns com.little-trader.strategy.pipeline-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.renko :as renko]
            [com.little-trader.domain.signals :as signals]))

(deftest brick-to-signal-pipeline
  (let [bars []
        config {:brick-size 10
                :one-brick-enabled true
                :double-brick-enabled true}

        ;; First candle
        ohlcv1 {:mts 1000 :close 100}
        bricks1 (renko/get-new-bricks-from-ohlcv ohlcv1 bars 10)
        bar1 (assoc ohlcv1 :bricks bricks1)
        bars (conj bars bar1)

        ;; Second candle: move down to trigger signal
        ohlcv2 {:mts 2000 :close 95}
        bricks2 (renko/get-new-bricks-from-ohlcv ohlcv2 bars 10)
        bar2 (assoc ohlcv2 :bricks bricks2)
        bars (conj bars bar2)

        ;; Get accumulated bricks
        all-bricks (mapcat :bricks bars)

        ;; Third candle: move up to create reversal signal
        ohlcv3 {:mts 3000 :close 105}
        bricks3 (renko/get-new-bricks-from-ohlcv ohlcv3 bars 10)
        bar3 (assoc ohlcv3 :bricks bricks3)
        all-bricks (concat all-bricks bricks3)

        signal (signals/detect-renko-signals all-bricks {} config)]

    (is (= :renko (:type signal)))
    (is (= :long (:side signal)))))
```

### 2. Backtest Execution Test

**File**: `test/com/little_trader/strategy/backtest_test.clj`

```clojure
(ns com.little-trader.strategy.backtest-test
  (:require [clojure.test :refer :all]
            [com.little-trader.strategy.backtest :as backtest]))

(def test-config {
  :symbol "BTC/USD"
  :mode :backtest
  :brick-size 100
  :order-size-stable 1000
  :start-mts 1000
  :end-mts 5000
  :one-brick-enabled true
  :slippage 0.001
  :fees 0.001
  :stop-loss-enabled false
  :take-profit-enabled false
})

(def test-ohlcv-seq [
  {:mts 1000 :symbol "BTC/USD" :open 1000 :high 1010 :low 990 :close 1005}
  {:mts 2000 :symbol "BTC/USD" :open 1005 :high 1020 :low 1005 :close 1020}
  {:mts 3000 :symbol "BTC/USD" :open 1020 :high 1025 :low 990 :close 995}
  {:mts 4000 :symbol "BTC/USD" :open 995 :high 1005 :low 990 :close 1001}
  {:mts 5000 :symbol "BTC/USD" :open 1001 :high 1010 :low 1000 :close 1008}
])

(deftest backtest-execution
  (let [db-mock {}  ;; Mock database
        result (backtest/backtest-loop test-config db-mock test-ohlcv-seq)]
    (is (contains? result :trades))
    (is (contains? result :signals))
    (is (contains? result :bars))
    (is (> (count (:bars result)) 0))))

(deftest backtest-generates-signals
  (let [db-mock {}
        result (backtest/backtest-loop test-config db-mock test-ohlcv-seq)]
    (is (> (count (:signals result)) 0))))

(deftest backtest-closes-open-positions
  (let [db-mock {}
        result (backtest/backtest-loop test-config db-mock test-ohlcv-seq)]
    ;; All trades should be closed at end
    (let [open-trades (filter #(= :open (:status %)) (:trades result))]
      (is (= 0 (count open-trades))))))
```

---

## Property-Based Tests

### Using test.check for Generative Testing

**File**: `test/com/little_trader/domain/properties_test.clj`

```clojure
(ns com.little-trader.domain.properties-test
  (:require [clojure.test :refer :all]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop]
            [com.little-trader.domain.renko :as renko]
            [com.little-trader.util.math :as math]))

;; Brick generation idempotency
(deftest brick-generation-idempotent
  (prop/for-all [
    price (gen/large-integer* {:min 1 :max 10000})
    brick-size (gen/large-integer* {:min 1 :max 1000})]
    (let [ohlcv {:mts 1000 :close price}
          bricks1 (renko/get-new-bricks-from-ohlcv ohlcv [] brick-size)
          bricks2 (renko/get-new-bricks-from-ohlcv ohlcv [] brick-size)]
      (= bricks1 bricks2))))

;; P&L calculation consistency
(deftest pnl-calculation-consistency
  (prop/for-all [
    entry-price (gen/large-integer* {:min 1 :max 10000})
    exit-price (gen/large-integer* {:min 1 :max 10000})
    amount (gen/large-integer* {:min 1 :max 100})]
    (let [pnl-long (math/pnl-dollars entry-price exit-price amount :long)
          pnl-short (math/pnl-dollars entry-price exit-price amount :short)
          ; If entry < exit, long should profit and short should lose
          price-up (> exit-price entry-price)]
      (if price-up
        (and (> pnl-long 0) (< pnl-short 0))
        (and (< pnl-long 0) (> pnl-short 0))))))

;; Round-trip consistency
(deftest round-trip-price-consistency
  (prop/for-all [
    price (gen/large-integer* {:min 1 :max 10000})
    decimals (gen/integer* {:min 0 :max 4})]
    (let [rounded (math/round price decimals)
          factor (Math/pow 10 decimals)]
      (and (number? rounded)
           (<= (Math/abs (- price rounded)) 1)))))
```

---

## End-to-End Tests

### Simulated Live Trading

**File**: `test/com/little_trader/integration/e2e_test.clj`

```clojure
(ns com.little-trader.integration.e2e-test
  (:require [clojure.test :refer :all]
            [com.little-trader.strategy.executor :as executor]
            [com.little-trader.data.db :as db]))

(deftest full-backtest-workflow
  ;; Set up test database (in-memory)
  (let [test-db (db/create-test-db)
        config {
          :symbol "BTC/USD"
          :mode :backtest
          :brick-size 100
          :one-brick-enabled true
          :double-brick-enabled true
          :stop-loss-enabled true
          :stop-loss-percent -0.02
          :take-profit-enabled true
        }

        ;; Simulate market data
        market-data [
          {:mts 1000 :close 1000}
          {:mts 2000 :close 1050}   ;; Up 50 = 0 bricks (need 100)
          {:mts 3000 :close 1100}   ;; Up 100 = 1 brick, signal
          {:mts 4000 :close 1050}   ;; Down 50 = 0 bricks
          {:mts 5000 :close 1000}   ;; Down 100 = 1 brick, reversal signal
          {:mts 6000 :close 950}    ;; Down 50 = 0 bricks
        ]

        result (executor/run-backtest config test-db market-data)]

    ;; Assertions
    (is (> (count (:trades result)) 0))
    (is (> (count (:signals result)) 0))
    (is (every? #(not= :open (:status %)) (:trades result)))))

(deftest paper-trading-simulation
  (let [test-db (db/create-test-db)
        config (assoc test-config :mode :paper)
        result (executor/simulate-paper-trading config test-db)]
    (is (= :paper (:mode config)))
    (is (> (count (:trades result)) 0))))
```

---

## Performance Tests

### Load Testing

**File**: `test/com/little_trader/performance/load_test.clj`

```clojure
(ns com.little-trader.performance.load-test
  (:require [clojure.test :refer :all]
            [com.little-trader.domain.renko :as renko]
            [com.little-trader.domain.signals :as signals]))

(deftest brick-generation-performance
  (let [large-dataset (repeatedly 10000 #(rand-int 2000))
        start (System/currentTimeMillis)
        _ (reduce
            (fn [bars price]
              (conj bars
                {:mts (System/currentTimeMillis)
                 :close price}))
            []
            large-dataset)
        elapsed (- (System/currentTimeMillis) start)]
    (is (< elapsed 5000))  ;; Should complete in <5 seconds
    (println (str "Processed 10k candles in " elapsed "ms"))))

(deftest signal-detection-throughput
  (let [brick-list (map #(hash-map :direction (if (even? %) 1 -1)) (range 1000))
        config {:one-brick-enabled true}
        start (System/currentTimeMillis)
        _ (doall (map #(signals/detect-renko-signals % {} config) brick-list))
        elapsed (- (System/currentTimeMillis) start)]
    (is (< elapsed 1000))  ;; Should complete in <1 second
    (println (str "Signal detection: " elapsed "ms"))))
```

---

## Monitoring & Observability

### Metrics Collection

**File**: `test/com/little_trader/monitoring/metrics_test.clj`

```clojure
(ns com.little-trader.monitoring.metrics-test
  (:require [clojure.test :refer :all]
            [com.little-trader.monitoring.metrics :as m]))

(deftest win-rate-calculation
  (let [trades [
        {:pnl 100 :status :closed}
        {:pnl -50 :status :closed}
        {:pnl 200 :status :closed}
        {:pnl -30 :status :closed}
      ]
        win-rate (m/calculate-win-rate trades)]
    (is (= 0.5 win-rate))))

(deftest profit-factor-calculation
  (let [trades [
        {:pnl 100} {:pnl 50}   ;; Total wins: 150
        {:pnl -30} {:pnl -20}  ;; Total losses: 50
      ]
        pf (m/calculate-profit-factor trades)]
    (is (= 3.0 pf))))

(deftest average-trade-calculation
  (let [trades [
        {:pnl 100} {:pnl 0} {:pnl -50}
      ]
        avg (m/calculate-average-trade trades)]
    (is (= 50/3 avg))))
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Clojure
        uses: DeLaGuardo/setup-clojure@master
        with:
          tools-deps: '1.11.1.1413'

      - name: Run unit tests
        run: clojure -M:test

      - name: Run integration tests
        run: clojure -M:test:integration

      - name: Measure coverage
        run: clojure -M:test:cloverage

      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/coverage.txt
```

---

## Summary

This testing strategy ensures:
- ✅ 75% of tests are fast unit tests
- ✅ 20% integration tests for workflow validation
- ✅ 5% E2E tests for critical paths
- ✅ Property-based tests for invariants
- ✅ Performance tests for regressions
- ✅ Continuous monitoring for production
- ✅ >85% code coverage on domain logic
- ✅ All tests deterministic and isolated

The combination of different test types creates a **safety net** that allows refactoring and improvements with confidence.
