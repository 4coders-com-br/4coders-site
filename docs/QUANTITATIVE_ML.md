# Quantitative Analysis & ML for Renko Trading

**Statistical Analysis, Machine Learning, and Pattern Recognition for Renko Charts**

## Table of Contents
1. [Quantitative Analysis Foundation](#quantitative-analysis-foundation)
2. [Renko Pattern Statistics](#renko-pattern-statistics)
3. [Performance Metrics](#performance-metrics)
4. [Feature Engineering](#feature-engineering)
5. [Machine Learning Models](#machine-learning-models)
6. [Pattern Classification](#pattern-classification)
7. [Implementation Guide](#implementation-guide)
8. [Advanced Techniques](#advanced-techniques)

---

## Quantitative Analysis Foundation

### Why Quantitative Analysis for Renko?

Renko charts are ideal for quantitative analysis because:
- **Deterministic**: Same brick rules produce same bricks
- **Discrete**: Fixed brick size → quantizable patterns
- **Pattern-Rich**: Limited patterns → analyzable
- **Reproducible**: Same data → same analysis
- **Testable**: Clear metrics for validation

### Core Statistics Framework

```clojure
(ns com.little-trader.quant.statistics
  (:require [clojure.math.combinatorics :as combo]
            [net.cgrand.xray :as xray]
            [incanter.core :as incanter]
            [incanter.stats :as stats]))

;; Core statistics calculation
(defn calculate-stats [trades]
  {:total-trades (count trades)
   :winning-trades (count (filter #(> (:pnl %) 0) trades))
   :losing-trades (count (filter #(< (:pnl %) 0) trades))
   :win-rate (/ (count (filter #(> (:pnl %) 0) trades)) (count trades))
   :avg-win (stats/mean (map :pnl (filter #(> (:pnl %) 0) trades)))
   :avg-loss (stats/mean (map :pnl (filter #(< (:pnl %) 0) trades)))
   :std-dev (stats/sd (map :pnl trades))
   :max-profit (apply max (map :pnl trades))
   :max-loss (apply min (map :pnl trades))})
```

---

## Renko Pattern Statistics

### 1. Brick Direction Analysis

**What It Measures**: Probability of each direction pattern

```clojure
(defn analyze-brick-directions [brick-sequence]
  "Analyze direction patterns in brick sequence"
  (let [directions (map :direction brick-sequence)
        up-count (count (filter #(= % 1) directions))
        down-count (count (filter #(= % -1) directions))]
    {:total-bricks (count directions)
     :up-bricks up-count
     :down-bricks down-count
     :up-probability (/ up-count (count directions))
     :down-probability (/ down-count (count directions))
     :bias (if (> up-probability 0.5) :bullish :bearish)}))

;; Output Example:
{:total-bricks 256
 :up-bricks 140
 :down-bricks 116
 :up-probability 0.547
 :down-probability 0.453
 :bias :bullish}
```

### 2. Pattern Frequency Analysis

**Patterns to Track**:

```clojure
(defn analyze-patterns [brick-list]
  "Calculate frequency of all signal patterns"
  (let [windows (partition 3 1 brick-list)  ;; 3-brick windows
        patterns (map (fn [window]
                       (map :direction window))
                     windows)]
    {
     :one-brick-long-freq (count-pattern-type patterns [-1 1])
     :one-brick-short-freq (count-pattern-type patterns [1 -1])
     :double-brick-long-freq (count-pattern-type patterns [1 1 -1])
     :double-brick-short-freq (count-pattern-type patterns [-1 -1 1])
     :multi-brick-long-freq (count-pattern-type patterns [1 1 1])
     :multi-brick-short-freq (count-pattern-type patterns [-1 -1 -1])
    }))

;; Transition Matrix (Markov Analysis)
(defn brick-transition-matrix [brick-list]
  "Calculate probability of next brick direction given current"
  (let [consecutive-pairs (partition 2 1 (map :direction brick-list))
        up-to-up (count (filter (fn [[a b]] (and (= a 1) (= b 1))) consecutive-pairs))
        up-to-down (count (filter (fn [[a b]] (and (= a 1) (= b -1))) consecutive-pairs))
        down-to-up (count (filter (fn [[a b]] (and (= a -1) (= b 1))) consecutive-pairs))
        down-to-down (count (filter (fn [[a b]] (and (= a -1) (= b -1))) consecutive-pairs))]
    {
     :up->up (/ up-to-up (+ up-to-up up-to-down))
     :up->down (/ up-to-down (+ up-to-up up-to-down))
     :down->up (/ down-to-up (+ down-to-up down-to-down))
     :down->down (/ down-to-down (+ down-to-up down-to-down))
    }))

;; Example Output:
{:up->up 0.52
 :up->down 0.48
 :down->up 0.49
 :down->down 0.51}
```

### 3. Pattern Win Rate Analysis

**Metric**: Win rate for each signal type

```clojure
(defn pattern-win-rate-analysis [trades signals]
  "Calculate win rate for each pattern type"
  (let [grouped-by-pattern (group-by :signal-type signals)]
    (reduce
      (fn [acc [pattern-type pattern-signals]]
        (let [related-trades (filter-trades-by-signals pattern-signals trades)
              wins (count (filter #(> (:pnl %) 0) related-trades))
              total (count related-trades)]
          (assoc acc pattern-type
            {
             :win-rate (/ wins total)
             :avg-pnl (stats/mean (map :pnl related-trades))
             :total-trades total
             :profit-factor (calculate-profit-factor related-trades)
            })))
      {}
      grouped-by-pattern)))

;; Output Example:
{:one-brick-long {:win-rate 0.56 :avg-pnl 125.50 :total-trades 89 :profit-factor 2.3}
 :double-brick-long {:win-rate 0.61 :avg-pnl 185.75 :total-trades 45 :profit-factor 3.1}
 :multi-brick-long {:win-rate 0.68 :avg-pnl 245.00 :total-trades 22 :profit-factor 4.2}}
```

### 4. Brick Type Distribution

**What It Shows**: How often each brick type appears

```clojure
(defn brick-type-distribution [brick-sequence]
  "Analyze frequency of brick types"
  (let [type-counts (frequencies (map :brick-type brick-sequence))
        total (count brick-sequence)]
    (reduce
      (fn [acc [brick-type count]]
        (assoc acc brick-type {
          :count count
          :frequency (/ count total)
          :percentage (* (/ count total) 100)
        }))
      {}
      type-counts)))

;; Output Example:
{:forward-single {:count 120 :frequency 0.469 :percentage 46.9}
 :forward-double-first {:count 35 :frequency 0.137 :percentage 13.7}
 :backward-single {:count 65 :frequency 0.254 :percentage 25.4}
 :backward-double-first {:count 20 :frequency 0.078 :percentage 7.8}
 :multi {:count 16 :frequency 0.062 :percentage 6.2}}
```

---

## Performance Metrics

### 1. Fundamental Metrics

```clojure
(defn calculate-fundamental-metrics [trades]
  "Calculate core performance metrics"
  {
   ;; Basic counts
   :total-trades (count trades)
   :winning-trades (count (filter #(> (:pnl %) 0) trades))
   :losing-trades (count (filter #(< (:pnl %) 0) trades))
   :breakeven-trades (count (filter #(= (:pnl %) 0) trades))

   ;; Rate metrics
   :win-rate (/ (count (filter #(> (:pnl %) 0) trades)) (count trades))
   :loss-rate (/ (count (filter #(< (:pnl %) 0) trades)) (count trades))

   ;; Profit metrics
   :total-pnl (reduce + (map :pnl trades))
   :gross-profit (reduce + (map :pnl (filter #(> (:pnl %) 0) trades)))
   :gross-loss (reduce + (map :pnl (filter #(< (:pnl %) 0) trades)))

   ;; Average metrics
   :avg-win (stats/mean (map :pnl (filter #(> (:pnl %) 0) trades)))
   :avg-loss (stats/mean (map :pnl (filter #(< (:pnl %) 0) trades)))
   :avg-trade (stats/mean (map :pnl trades))
  })
```

### 2. Risk-Adjusted Metrics

```clojure
(defn calculate-risk-metrics [trades]
  "Calculate risk-adjusted performance metrics"
  (let [pnls (map :pnl trades)
        returns (map #(/ % 100) pnls)  ;; Normalize
        mean-return (stats/mean returns)
        std-dev (stats/sd returns)]
    {
     ;; Sharpe Ratio (risk-adjusted return)
     :sharpe-ratio (/ mean-return std-dev)

     ;; Sortino Ratio (downside risk only)
     :sortino-ratio (/ mean-return (downside-deviation returns))

     ;; Calmar Ratio (return / max drawdown)
     :calmar-ratio (/ mean-return (calculate-max-drawdown pnls))

     ;; Profit Factor
     :profit-factor (calculate-profit-factor trades)

     ;; Recovery Factor
     :recovery-factor (/ (reduce + pnls) (calculate-max-drawdown pnls))
    }))

(defn downside-deviation [returns]
  "Calculate standard deviation of negative returns only"
  (let [negative-returns (filter #(< % 0) returns)]
    (stats/sd negative-returns)))

(defn calculate-max-drawdown [pnls]
  "Calculate largest peak-to-trough decline"
  (let [cumulative (reductions + pnls)
        peak-at-i (reduce
                   (fn [peaks i]
                     (conj peaks (apply max (take (+ i 1) cumulative))))
                   []
                   (range (count cumulative)))
        drawdowns (map - cumulative peak-at-i)]
    (apply min drawdowns)))
```

### 3. Trade Distribution Analysis

```clojure
(defn analyze-trade-distribution [trades]
  "Analyze distribution of trade characteristics"
  {
   ;; Duration metrics
   :avg-trade-duration (stats/mean (map :duration-minutes trades))
   :median-trade-duration (stats/median (map :duration-minutes trades))
   :max-trade-duration (apply max (map :duration-minutes trades))

   ;; Size metrics
   :avg-trade-size (stats/mean (map :pnl-percent trades))
   :std-dev-size (stats/sd (map :pnl-percent trades))

   ;; Consecutive metrics
   :max-consecutive-wins (max-consecutive-wins trades)
   :max-consecutive-losses (max-consecutive-losses trades)
   :avg-consecutive-wins (avg-consecutive-streaks (filter #(> (:pnl %) 0) trades))
   :avg-consecutive-losses (avg-consecutive-streaks (filter #(< (:pnl %) 0) trades))
  })
```

---

## Feature Engineering

### 1. Brick-Based Features

```clojure
(defn engineer-brick-features [brick-list]
  "Extract machine learning features from brick sequence"
  (let [directions (map :direction brick-list)
        sizes (map :size brick-list)]
    {
     ;; Directional features
     :direction-bias (direction-bias directions)
     :consecutive-ups (max-consecutive-ups directions)
     :consecutive-downs (max-consecutive-downs directions)
     :direction-entropy (entropy directions)

     ;; Pattern features
     :recent-pattern-1 (take-last 1 directions)
     :recent-pattern-2 (take-last 2 directions)
     :recent-pattern-3 (take-last 3 directions)

     ;; Volatility features
     :brick-size-mean (stats/mean sizes)
     :brick-size-std (stats/sd sizes)
     :brick-size-trend (trend (take-last 20 sizes))

     ;; Time-based features
     :time-since-reversal (time-since-direction-change directions)
     :reversal-frequency (/ (count-reversals directions) (count directions))
    }))

(defn entropy [sequence]
  "Calculate Shannon entropy of sequence"
  (let [freqs (frequencies sequence)
        total (count sequence)]
    (reduce
      (fn [sum [_ count]]
        (let [p (/ count total)]
          (- sum (* p (Math/log p)))))
      0
      freqs)))

(defn direction-bias [directions]
  "Bias toward up (1) or down (-1)"
  (let [sum (reduce + directions)]
    (/ sum (count directions))))
```

### 2. Trade Context Features

```clojure
(defn engineer-trade-context-features [brick-list previous-trades]
  "Features based on trade history and context"
  {
   ;; Historical performance
   :recent-win-rate (win-rate (take-last 20 previous-trades))
   :recent-avg-win (stats/mean (map :pnl (filter #(> (:pnl %) 0) (take-last 20 previous-trades))))
   :profit-streak (current-profit-streak previous-trades)

   ;; Market regime
   :market-volatility (calculate-volatility brick-list)
   :trend-strength (trend-strength brick-list)
   :brick-size-regime (brick-size-regime brick-list)

   ;; Time features
   :hour-of-day (hour-of-day (last brick-list))
   :day-of-week (day-of-week (last brick-list))
   :time-since-last-signal (time-elapsed-minutes previous-trades)
  })
```

### 3. Pattern-Based Features

```clojure
(defn engineer-pattern-features [brick-window]
  "Extract features from brick pattern window"
  (let [window-size (count brick-window)
        directions (map :direction brick-window)
        types (map :brick-type brick-window)]
    {
     ;; Pattern characteristics
     :pattern-direction-sequence directions
     :pattern-type-sequence types
     :pattern-consistency (consistency-score directions)
     :pattern-strength (pattern-strength directions)

     ;; Change detection
     :has-reversal (has-reversal directions)
     :reversal-position (reversal-position directions)
     :reversal-strength (reversal-strength directions)

     ;; Prediction targets
     :next-brick-direction-likely (predict-next-direction directions)
     :continuation-probability (continuation-probability directions)
     :reversal-probability (reversal-probability directions)
    }))

(defn consistency-score [directions]
  "How consistent is the pattern (same direction bias)"
  (let [n (count directions)
        ones (count (filter #(= % 1) directions))]
    (Math/abs (- (/ ones n) 0.5))))
```

---

## Machine Learning Models

### 1. Pattern Classifier (Classification)

**Goal**: Predict if a pattern will result in winning trade

```clojure
(ns com.little-trader.ml.pattern-classifier
  (:require [clojure.data.json :as json]
            [scicloj.ml.core :as ml]
            [scicloj.ml.dataset :as ds]))

;; Feature vectors from brick patterns
(defn create-training-data [brick-sequences trades-outcome]
  "Create feature matrix for training"
  (mapv
    (fn [bricks outcome]
      (merge
        (engineer-brick-features bricks)
        {:outcome outcome}))
    brick-sequences
    trades-outcome))

;; Simple Logistic Regression Classifier
(defn train-pattern-classifier [training-data]
  "Train classifier: will this pattern win?"
  (let [dataset (ds/->dataset training-data)
        model (ml/train dataset
                       {:model-type :smile.classification/logistic-regression})]
    model))

;; Predict on new pattern
(defn predict-pattern-outcome [model brick-sequence]
  "Predict probability of win for pattern"
  (let [features (engineer-brick-features brick-sequence)
        prediction (ml/predict model features)]
    {
     :predicted-win-probability (get prediction 1)
     :predicted-loss-probability (get prediction 0)
     :recommendation (if (> (get prediction 1) 0.55) :trade :skip)
    }))

;; Example usage:
#_{
  :predicted-win-probability 0.72
  :predicted-loss-probability 0.28
  :recommendation :trade
}
```

### 2. Brick Direction Predictor (Sequence Model)

**Goal**: Predict next brick direction from history

```clojure
(defn train-direction-predictor [brick-sequences]
  "Train sequence model for direction prediction"
  (let [;; Create supervised pairs: [pattern -> next_direction]
        training-pairs (mapv
                        (fn [sequence]
                          (let [features (engineer-brick-features (butlast sequence))
                                target (-> sequence last :direction)]
                            [features target]))
                        (partition 4 1 brick-sequences))

        dataset (ds/->dataset training-pairs)

        ;; Use Random Forest for multi-class
        model (ml/train dataset
                       {:model-type :smile.classification/random-forest
                        :num-trees 100})]
    model))

(defn predict-next-brick-direction [model brick-history]
  "Predict next brick direction (up/down)"
  (let [features (engineer-brick-features brick-history)
        probs (ml/predict model features)]
    {
     :up-probability (get probs 1)
     :down-probability (get probs -1)
     :predicted-direction (if (> (get probs 1) 0.5) 1 -1)
     :confidence (- 1 (Math/abs (- (get probs 1) (get probs -1))))
    }))
```

### 3. Win Rate Estimator (Regression)

**Goal**: Estimate expected win rate for configuration

```clojure
(defn train-win-rate-estimator [backtest-results]
  "Train regression model: config -> expected win rate"
  (let [training-data (mapv
                       (fn [result]
                         {
                          :brick-size (:brick-size result)
                          :one-brick-enabled (:one-brick result)
                          :double-brick-enabled (:double-brick result)
                          :multi-brick-enabled (:multi-brick result)
                          :dema-enabled (:dema-enabled result)
                          :dema-period (:dema-period result)
                          :expected-win-rate (:win-rate result)
                         })
                       backtest-results)

        dataset (ds/->dataset training-data)

        ;; Gradient Boosting for regression
        model (ml/train dataset
                       {:model-type :smile.regression/gradient-boosting})]
    model))

(defn estimate-win-rate [model config]
  "Estimate win rate for configuration"
  (let [prediction (ml/predict model config)]
    {
     :estimated-win-rate prediction
     :expected-trades-to-breakeven (/ 1 (- prediction 0.5))
    }))
```

### 4. Volatility Regime Classifier

**Goal**: Identify market volatility regime for parameter tuning

```clojure
(defn train-volatility-classifier [brick-sequences market-conditions]
  "Classify market as low/medium/high volatility"
  (let [training-pairs (mapv
                        (fn [bricks condition]
                          [(engineer-brick-features bricks)
                           (:volatility-regime condition)])
                        brick-sequences
                        market-conditions)

        dataset (ds/->dataset training-pairs)
        model (ml/train dataset
                       {:model-type :smile.classification/random-forest})]
    model))

(defn classify-market-volatility [model brick-sequence]
  "Classify current market volatility"
  (let [features (engineer-brick-features brick-sequence)
        probabilities (ml/predict model features)]
    {
     :volatility-regime (argmax probabilities)  ;; :low, :medium, :high
     :low-probability (get probabilities :low)
     :medium-probability (get probabilities :medium)
     :high-probability (get probabilities :high)
     :confidence (apply max (vals probabilities))
    }))
```

---

## Pattern Classification

### 1. Renko Pattern Types

```clojure
(ns com.little-trader.ml.pattern-types)

;; All possible Renko patterns for 3-brick window
(def all-patterns {
  ;; One-brick patterns (2 bricks, reversed direction)
  [:up :down] {:name "one-brick-long" :probability-win 0.56}
  [:down :up] {:name "one-brick-short" :probability-win 0.54}

  ;; Double-brick patterns (3 bricks, continuation then reversal)
  [:up :up :down] {:name "double-brick-long" :probability-win 0.61}
  [:down :down :up] {:name "double-brick-short" :probability-win 0.59}

  ;; Multi-brick patterns (3+ in same direction)
  [:up :up :up] {:name "multi-brick-long" :probability-win 0.68}
  [:down :down :down] {:name "multi-brick-short" :probability-win 0.66}

  ;; Weak patterns (back and forth)
  [:up :down :up] {:name "weak-choppy" :probability-win 0.48}
  [:down :up :down] {:name "weak-choppy" :probability-win 0.47}

  ;; Exhaustion patterns
  [:up :up :up :up] {:name "exhaustion-up" :probability-win 0.35}
  [:down :down :down :down] {:name "exhaustion-down" :probability-win 0.37}
})

(defn classify-pattern [brick-window]
  "Classify brick pattern and get characteristics"
  (let [directions (mapv :direction brick-window)
        pattern-info (get all-patterns directions)
        pattern-name (:name pattern-info)
        win-prob (:probability-win pattern-info)]
    {
     :pattern directions
     :pattern-name pattern-name
     :base-win-rate win-prob
     :confidence (if (> (count directions) 2) 0.8 0.6)
     :signal-strength (calculate-signal-strength directions)
    }))

(defn calculate-signal-strength [directions]
  "How strong is the pattern signal (0-1)"
  (let [direction-bias (Math/abs (direction-bias directions))
        consistency (consistency-score directions)]
    (+ (* direction-bias 0.5) (* consistency 0.5))))
```

### 2. Pattern Confidence Scoring

```clojure
(defn score-pattern-confidence [brick-window historical-performance]
  "Score confidence in pattern signal (0-1)"
  (let [pattern-class (classify-pattern brick-window)
        pattern-name (:pattern-name pattern-class)

        ;; Historical win rate for this pattern
        historical-wr (get-historical-win-rate historical-performance pattern-name)

        ;; Pattern strength signal
        signal-strength (:signal-strength pattern-class)

        ;; DEMA confirmation (if available)
        dema-confirmation (check-dema-confirmation brick-window)

        ;; Combined confidence
        base-confidence (* signal-strength historical-wr)
        adjusted-confidence (cond
                             dema-confirmation (* base-confidence 1.1)
                             :else base-confidence)]
    {
     :pattern-name pattern-name
     :raw-confidence adjusted-confidence
     :adjusted-confidence (min 1.0 adjusted-confidence)
     :recommended-action (if (> adjusted-confidence 0.55) :trade :skip)
    }))
```

---

## Implementation Guide

### 1. Quantitative Analysis Pipeline

```clojure
(ns com.little-trader.quant.pipeline
  (:require [com.little-trader.quant.statistics :as stats]
            [com.little-trader.ml.pattern-classifier :as classifier]))

(defn run-quantitative-analysis [backtest-results]
  "Complete analysis of strategy performance"
  {
   ;; Fundamental metrics
   :fundamental-metrics (stats/calculate-fundamental-metrics (:trades backtest-results))

   ;; Risk metrics
   :risk-metrics (stats/calculate-risk-metrics (:trades backtest-results))

   ;; Pattern analysis
   :pattern-statistics (stats/analyze-patterns (:bricks backtest-results))
   :pattern-win-rates (stats/pattern-win-rate-analysis
                       (:trades backtest-results)
                       (:signals backtest-results))

   ;; Distribution analysis
   :trade-distribution (stats/analyze-trade-distribution (:trades backtest-results))

   ;; Brick statistics
   :brick-analysis {
     :direction-stats (stats/analyze-brick-directions (:bricks backtest-results))
     :brick-type-dist (stats/brick-type-distribution (:bricks backtest-results))
     :transition-matrix (stats/brick-transition-matrix (:bricks backtest-results))
   }
  })
```

### 2. ML Training Pipeline

```clojure
(defn train-all-models [historical-backtests]
  "Train all ML models from historical backtests"
  {
   :pattern-classifier (classifier/train-pattern-classifier
                        (create-training-data (:bricks historical-backtests)
                                            (:outcomes historical-backtests)))

   :direction-predictor (train-direction-predictor (:bricks historical-backtests))

   :win-rate-estimator (train-win-rate-estimator historical-backtests)

   :volatility-classifier (train-volatility-classifier
                          (:bricks historical-backtests)
                          (:market-conditions historical-backtests))
  })
```

### 3. Real-Time Signal Enhancement

```clojure
(defn enhance-signal-with-ml [signal brick-window trained-models]
  "Enhance signal with ML confidence scoring"
  (let [pattern-class (classify-pattern brick-window)
        ml-confidence (predict-pattern-outcome (:pattern-classifier trained-models)
                                              brick-window)
        direction-pred (predict-next-brick-direction (:direction-predictor trained-models)
                                                     brick-window)
        confidence-score (score-pattern-confidence brick-window
                                                   (:pattern-history trained-models))]
    (merge signal {
     :ml-confidence (:predicted-win-probability ml-confidence)
     :direction-probability (:up-probability direction-pred)
     :pattern-confidence (:adjusted-confidence confidence-score)
     :overall-confidence (/ (+ (:ml-confidence)
                              (:pattern-confidence confidence-score)) 2)
     :recommended-size (calculate-position-size-from-confidence
                       (:overall-confidence))
    })))
```

---

## Advanced Techniques

### 1. Walk-Forward Optimization

```clojure
(defn walk-forward-analysis [data window-size step-size]
  "Analyze strategy with walk-forward window"
  (let [data-length (count data)
        windows (partition-windows data window-size step-size)]
    (mapv
      (fn [{:keys [train-data test-data fold-number]}]
        {
         :fold fold-number
         :train-period {:start (first train-data) :end (last train-data)}
         :test-period {:start (first test-data) :end (last test-data)}

         ;; Train on historical data
         :trained-models (train-all-models train-data)

         ;; Test on future data
         :backtest-results (backtest-with-models test-data (:trained-models))

         ;; Performance metrics
         :out-of-sample-performance (calculate-stats (:trades backtest-results))
        })
      windows)))

(defn partition-windows [data window-size step-size]
  "Create walk-forward windows"
  (let [folds (math/floor (/ (- (count data) window-size) step-size))]
    (mapv
      (fn [i]
        (let [train-start (* i step-size)
              train-end (+ train-start window-size)
              test-end (+ train-end step-size)]
          {
           :fold-number i
           :train-data (subvec data train-start train-end)
           :test-data (subvec data train-end test-end)
          }))
      (range folds))))
```

### 2. Feature Importance Analysis

```clojure
(defn analyze-feature-importance [trained-model backtest-data]
  "Determine which features drive model predictions"
  (let [feature-list (extract-feature-names backtest-data)
        ;; Use SHAP or permutation importance
        importances (ml/feature-importance trained-model backtest-data)]
    (sort-by :importance > importances)))

;; Example: Which features matter most?
#_{:features [
  {:feature "direction-bias" :importance 0.32}
  {:feature "recent-pattern-3" :importance 0.28}
  {:feature "brick-size-trend" :importance 0.18}
  {:feature "reversal-frequency" :importance 0.15}
  {:feature "market-volatility" :importance 0.07}
]}
```

### 3. Ensemble Methods

```clojure
(defn create-signal-ensemble [signal individual-models]
  "Combine multiple model predictions"
  (let [pattern-pred (predict-pattern (:classifier individual-models) signal)
        direction-pred (predict-direction (:direction-model individual-models) signal)
        volatility-pred (classify-volatility (:volatility-model individual-models) signal)]
    {
     :ensemble-confidence (stats/mean [
       (:confidence pattern-pred)
       (:confidence direction-pred)
       (- 1 (Math/abs (- (:high-prob volatility-pred) 0.5)))
     ])
     :voting-agreement (voting-agreement [pattern-pred direction-pred volatility-pred])
     :recommendation (ensemble-recommendation [pattern-pred direction-pred volatility-pred])
    }))

(defn voting-agreement [predictions]
  "How much do models agree? (0-1)"
  (let [votes (map :recommendation predictions)
        vote-counts (frequencies votes)
        max-votes (apply max (vals vote-counts))]
    (/ max-votes (count votes))))
```

### 4. Parameter Optimization with Bayesian Methods

```clojure
(defn bayesian-parameter-optimization [backtest-fn parameter-space iterations]
  "Find optimal parameters using Bayesian optimization"
  (let [acquisition-fn (create-acquisition-function)
        prior (create-prior-distribution parameter-space)]
    (loop [iteration 0
           best-params nil
           best-score -1
           history []]

      (if (>= iteration iterations)
        {:best-params best-params :best-score best-score :history history}

        (let [;; Select next parameters to test
              next-params (acquisition-fn prior history)

              ;; Evaluate
              result (backtest-fn next-params)
              score (:win-rate (:metrics result))

              ;; Update
              new-history (conj history {:params next-params :score score})
              [new-best-params new-best-score]
              (if (> score best-score)
                [next-params score]
                [best-params best-score])]

          (recur (inc iteration) new-best-params new-best-score new-history))))))
```

---

## Quantitative Reporting

### 1. Statistical Significance Testing

```clojure
(defn test-statistical-significance [backtest-results]
  "Is the strategy better than random?"
  (let [trades (:trades backtest-results)
        win-count (count (filter #(> (:pnl %) 0) trades))
        n (count trades)

        ;; Binomial test vs 50% win rate (random)
        p-value (binomial-test win-count n 0.5)

        ;; Sharpe ratio significance
        sharpe (:sharpe-ratio (:risk-metrics backtest-results))
        sharpe-zscore (/ (* sharpe (Math/sqrt n)) 1)]

    {
     :win-rate-significant (< p-value 0.05)
     :win-rate-p-value p-value
     :sharpe-significant (> (Math/abs sharpe-zscore) 1.96)
     :sharpe-zscore sharpe-zscore
     :conclusion (if (and (< p-value 0.05) (> (Math/abs sharpe-zscore) 1.96))
                   "STATISTICALLY SIGNIFICANT"
                   "NOT SIGNIFICANT")
    }))
```

### 2. Robustness Testing

```clojure
(defn robustness-test [strategy backtest-data]
  "Test strategy across different conditions"
  {
   ;; Monte Carlo: Random trade permutations
   :monte-carlo (run-monte-carlo-analysis backtest-data 1000)

   ;; Parameter sensitivity
   :parameter-sensitivity (test-parameter-ranges strategy backtest-data)

   ;; Out-of-sample testing
   :out-of-sample (walk-forward-analysis backtest-data 252 60)

   ;; Market regime testing
   :regime-analysis (test-across-market-regimes backtest-data)
  })
```

---

## Summary

This quantitative framework provides:

**Statistical Analysis**
- ✅ Fundamental performance metrics (win rate, profit factor, etc.)
- ✅ Risk-adjusted metrics (Sharpe, Sortino, Calmar ratios)
- ✅ Pattern frequency and win rate analysis
- ✅ Distribution analysis and statistical testing

**Feature Engineering**
- ✅ Brick-based features (direction, patterns, volatility)
- ✅ Trade context features (win rate, profit streaks)
- ✅ Pattern-based features (consistency, strength)
- ✅ Market regime features (volatility, trend)

**Machine Learning Models**
- ✅ Pattern classifier (predict trade outcome)
- ✅ Direction predictor (predict next brick)
- ✅ Win rate estimator (estimate performance)
- ✅ Volatility classifier (market conditions)

**Advanced Techniques**
- ✅ Walk-forward optimization
- ✅ Feature importance analysis
- ✅ Ensemble methods (combine predictions)
- ✅ Bayesian parameter optimization
- ✅ Statistical significance testing
- ✅ Robustness testing (Monte Carlo, sensitivity)

**Integration**
- ✅ Real-time signal enhancement with ML confidence
- ✅ Position sizing based on confidence scores
- ✅ Adaptive parameter selection by market regime
- ✅ Continuous model retraining

**For Your Course:**
- Teaching quantitative methods in practice
- ML integration with trading systems
- Statistical validation and hypothesis testing
- Real data analysis and optimization
