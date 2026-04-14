# Cherry/Squint Runtime — Architecture & Reference

## Overview

Little Trader embeds [Cherry](https://github.com/squint-cljs/cherry) as an in-browser
ClojureScript runtime compiler. This enables real CLJS evaluation directly in the browser
without server roundtrips — powering the terminal REPL, strategy executor, and Mel AI.

## Why Cherry?

| Approach | Language | Data Structures | Latency | Offline | re-frame Access |
|----------|----------|-----------------|---------|---------|-----------------|
| `js/eval` (Browser) | JavaScript | JS native | Instant | ✓ | Mangled globals |
| `/api/repl/eval` (JVM) | Clojure | Immutable | Network | ✗ | None |
| **Cherry** | **ClojureScript** | **Immutable** | **Instant** | **✓** | **Native** |
| SCI (interpreter) | ClojureScript | Immutable | ~64x slower | ✓ | Via bindings |

Cherry compiles ClojureScript to JavaScript in the browser, then evals the result.
It uses the same immutable persistent data structures as standard ClojureScript.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Terminal  │  │ Strategy │  │   Mel    │         │
│  │   REPL   │  │ Executor │  │    AI    │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │              │              │               │
│       └──────────────┼──────────────┘               │
│                      │                              │
│              ┌───────┴───────┐                      │
│              │ cherry-runtime│                      │
│              │  eval-string  │                      │
│              │ compile-string│                      │
│              └───────┬───────┘                      │
│                      │                              │
│              ┌───────┴───────┐                      │
│              │ cherry.embed  │                      │
│              │  (compiler)   │                      │
│              └───────┬───────┘                      │
│                      │                              │
│         ┌────────────┼────────────┐                 │
│         │            │            │                 │
│    ┌────┴────┐ ┌─────┴─────┐ ┌───┴────┐           │
│    │cljs.core│ │ re-frame  │ │lt.app  │           │
│    │  (std)  │ │  (state)  │ │lt.market│          │
│    └─────────┘ └───────────┘ └────────┘           │
└─────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `src/.../ui/cherry_runtime.cljs` | Core wrapper around `cherry.embed` |
| `src/.../ui/cherry_bindings.cljs` | App-specific JS globals (`lt.app`, `lt.market`, etc.) |
| `src/.../ui/strategy_executor.cljs` | Strategy compilation & execution engine |
| `src/.../ui/learn_cherry.cljs` | Interactive Cherry REPL lessons |

## API Reference

### cherry-runtime

```clojure
(require '[com.little-trader.ui.cherry-runtime :as cherry-rt])

;; Safe eval — returns {:ok result} or {:error message}
(cherry-rt/eval-string "(+ 1 2)")
;; => {:ok 3}

;; Compile to JS string
(cherry-rt/compile-string "(map inc [1 2 3])")
;; => {:ok "cljs.core.map.call(null, cljs.core.inc, ...)"}

;; Raw eval — throws on error
(cherry-rt/eval-string-raw "(+ 1 2)")
;; => 3

;; Pretty-print result
(cherry-rt/result->str [1 2 3])
;; => "[1 2 3]"
```

### cherry-bindings (JS globals)

These are available from Cherry-evaluated code:

```clojure
;; App state
(lt.app/db)              ;; full app-db snapshot
(lt.app/keys)            ;; top-level keys
(lt.app/sub :some/sub)   ;; deref a subscription
(lt.app/dispatch [:event])  ;; dispatch event

;; Market data
(lt.market/bars)         ;; OHLCV bars
(lt.market/snapshot)     ;; live market snapshot
(lt.market/price)        ;; current BTC price
(lt.market/heartbeat)    ;; pipeline health

;; Portfolio
(lt.portfolio/summary)   ;; portfolio state
```

### strategy-executor

```clojure
(require '[com.little-trader.ui.strategy-executor :as executor])

;; Execute strategy code
(executor/execute-strategy "(strategy/signal! :long \"MA cross\")")
;; => {:ok {:signals [{:side :long :reason "MA cross" :timestamp ...}]
;;          :logs [] :result nil}}

;; Execute and report to terminal
(executor/execute-and-report! code)
```

Strategy code has access to:
- `(strategy/bars)` — current OHLCV bars
- `(strategy/price)` — current index price
- `(strategy/signal! side reason)` — emit a trading signal
- `(strategy/log msg)` — log to terminal

## Mel Commands

| Command | Description |
|---------|-------------|
| `/cherry (+ 1 2)` | Eval CLJS via Cherry (in-browser, instant) |
| `/eval (+ 1 2)` | Eval CLJS via server (requires running server) |
| `/cljs (+ 1 2)` | Same as `/eval` |

## Bundle Size Impact

Cherry's `preserve-ns 'cljs.core` adds ~330KB to the bundle (the full cljs.core standard
library must be preserved as globals). Total cherry overhead is ~550KB uncompressed,
~150KB gzipped.

## Performance

Cherry compiles CLJS to JS, so execution speed is near-native:
- Cherry: ~9ms for numerical loops
- SCI (interpreter): ~566ms for same loop
- Self-hosted CLJS: ~10ms

## Security Notes

Cherry-evaluated code runs in the same JS context as the app. It has full access to:
- re-frame app-db (read/write)
- DOM APIs
- `js/fetch` and network
- `js/localStorage`

This is intentional — users are evaluating their own code. For untrusted code execution
(e.g., shared strategies from unknown users), additional sandboxing would be needed.

## Sources

- [Cherry GitHub](https://github.com/squint-cljs/cherry)
- [Cherry Embed Docs](https://github.com/squint-cljs/cherry/blob/main/doc/embed.md)
- [Squint GitHub](https://github.com/squint-cljs/squint)
- [Cherry Embed Blog](https://blog.michielborkent.nl/cherry-embed.html)
