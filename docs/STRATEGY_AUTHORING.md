# Strategy Authoring Guide

## Overview

Little Trader lets you write trading strategies in **ClojureScript** and execute them
directly in your browser using the Cherry runtime. No server needed — instant feedback.

## Quick Start

### 1. Open the Terminal

Switch the REPL mode to **CLJS** (Cherry) using the mode toggle.

### 2. Try a Simple Expression

```clojure
(+ 1 2)
;; => 3
```

### 3. Check Market Data

```clojure
(lt.market/price)
;; => 67432.50

(count (lt.market/bars))
;; => 720
```

### 4. Write Your First Strategy

In the Strategy IDE, write:

```clojure
;; Simple Moving Average Crossover
(let [bars (lt.market/bars)
      closes (map :close bars)
      sma-20 (/ (reduce + (take-last 20 closes)) 20)
      sma-50 (/ (reduce + (take-last 50 closes)) 50)]
  (cond
    (> sma-20 sma-50)
    (strategy/signal! :long "SMA 20 > SMA 50 — bullish crossover")

    (< sma-20 sma-50)
    (strategy/signal! :short "SMA 20 < SMA 50 — bearish crossover")

    :else
    (strategy/log "SMA 20 ≈ SMA 50 — no signal")))
```

Click **🧪 Cherry** to run it.

## Available APIs

### Market Data

```clojure
(lt.market/bars)         ;; Vector of {:open :high :low :close :volume :time}
(lt.market/price)        ;; Current BTC index price (number)
(lt.market/snapshot)     ;; Full snapshot: {:index-price :dvol :timestamp ...}
(lt.market/heartbeat)    ;; Pipeline health: {:pulsar :bar-count :data-fresh ...}
```

### App State

```clojure
(lt.app/db)              ;; Full app-db (large map)
(lt.app/keys)            ;; Top-level keys in app-db
(lt.app/sub :some/sub)   ;; Deref a re-frame subscription
(lt.app/dispatch [:evt]) ;; Dispatch a re-frame event
```

### Strategy Actions (inside strategy execution)

```clojure
(strategy/signal! :long "reason")   ;; Emit a long signal
(strategy/signal! :short "reason")  ;; Emit a short signal
(strategy/log "message")            ;; Log to terminal
(strategy/bars)                      ;; Get OHLCV bars
(strategy/price)                     ;; Get current price
```

### Portfolio

```clojure
(lt.portfolio/summary)   ;; Portfolio summary from server
```

## Strategy Examples

### RSI Threshold

```clojure
(let [bars (take-last 14 (lt.market/bars))
      closes (map :close bars)
      gains (filter pos? (map - (rest closes) closes))
      losses (filter neg? (map - (rest closes) closes))
      avg-gain (/ (reduce + 0 gains) 14)
      avg-loss (/ (reduce + 0 (map - losses)) 14)
      rs (if (zero? avg-loss) 100 (/ avg-gain avg-loss))
      rsi (- 100 (/ 100 (+ 1 rs)))]
  (strategy/log (str "RSI-14: " (.toFixed rsi 1)))
  (cond
    (< rsi 30) (strategy/signal! :long "RSI oversold")
    (> rsi 70) (strategy/signal! :short "RSI overbought")
    :else (strategy/log "RSI neutral")))
```

### Price Change Alert

```clojure
(let [bars (lt.market/bars)
      last-bar (last bars)
      prev-bar (last (butlast bars))
      change-pct (* 100 (/ (- (:close last-bar) (:close prev-bar))
                           (:close prev-bar)))]
  (strategy/log (str "Last bar change: " (.toFixed change-pct 2) "%"))
  (when (> (abs change-pct) 2)
    (strategy/signal! (if (pos? change-pct) :long :short)
                      (str "Large move: " (.toFixed change-pct 2) "%"))))
```

## Testing Strategies

Before running a strategy, test individual pieces in the Cherry REPL:

```clojure
;; Test: do we have bars?
(count (lt.market/bars))

;; Test: what does a bar look like?
(last (lt.market/bars))

;; Test: can we compute SMA?
(let [closes (map :close (take-last 5 (lt.market/bars)))]
  (/ (reduce + closes) (count closes)))
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+Enter | Evaluate in REPL |
| Cmd+S | Save file in IDE |

## Debugging Tips

- Use `(lt.app/keys)` to explore what state exists
- Use `(get-in @re-frame.db/app-db [:path :to :data])` for deep access
- Use `(strategy/log ...)` to trace strategy execution
- Check the terminal for error messages with source locations
