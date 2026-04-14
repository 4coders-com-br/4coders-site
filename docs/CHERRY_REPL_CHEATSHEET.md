# Cherry REPL Cheat Sheet

## Basics

```clojure
(+ 1 2)                          ;; => 3
(str "hello" " " "world")       ;; => "hello world"
(range 5)                        ;; => (0 1 2 3 4)
(map inc [1 2 3])                ;; => (2 3 4)
(filter odd? (range 10))         ;; => (1 3 5 7 9)
(reduce + [1 2 3 4])             ;; => 10
```

## App State

```clojure
(lt.app/keys)                    ;; top-level app-db keys
(lt.app/db)                      ;; full app-db (large!)
(lt.app/sub :workspace/market)   ;; current market ("btc")
```

## Market Data

```clojure
(lt.market/price)                ;; current BTC price
(lt.market/snapshot)             ;; live snapshot
(count (lt.market/bars))         ;; number of bars loaded
(last (lt.market/bars))          ;; most recent bar
(lt.market/heartbeat)            ;; pipeline status
```

## Portfolio

```clojure
(lt.portfolio/summary)           ;; portfolio overview
```

## Direct re-frame Access

```clojure
(keys @re-frame.db/app-db)                       ;; all keys
(get-in @re-frame.db/app-db [:workspace :market]) ;; nested access
@(re-frame.core/subscribe [:workspace/market])    ;; subscription
(re-frame.core/dispatch [:some/event "arg"])      ;; dispatch
```

## Common Patterns

```clojure
;; Last N bars
(take-last 10 (lt.market/bars))

;; Close prices
(map :close (lt.market/bars))

;; Simple Moving Average
(let [closes (map :close (take-last 20 (lt.market/bars)))]
  (/ (reduce + closes) (count closes)))

;; Price change %
(let [bars (lt.market/bars)
      curr (:close (last bars))
      prev (:close (last (butlast bars)))]
  (* 100 (/ (- curr prev) prev)))
```

## Mel Commands

```
/cherry (+ 1 2)                  ;; Cherry eval (in-browser)
/cherry (lt.market/price)        ;; Check price via Cherry
/eval (keys @re-frame.db/app-db) ;; Server-side eval
```

## Keyboard Shortcuts

- **Cmd+Enter** — Evaluate in REPL
- **Up/Down** — History navigation (in terminal)
