# Interceptor Chain Engine

## Overview

The executor engine uses a **Pedestal-style interceptor chain** for processing
market data through trading strategies. Instead of a monolithic `on-bar` loop,
each concern (indicators, signals, risk, orders, P&L) is a composable
interceptor with `enter`, `leave`, and `error` phases.

## Mental Model

```
  ┌─────────────────────────────────────────────────────┐
  │                  Interceptor Chain                   │
  │                                                     │
  │  ENTER PHASE (queue order)                          │
  │  ┌──────┐  ┌──────────┐  ┌────────┐  ┌───────┐    │
  │  │init  │→ │indicators│→ │signal  │→ │order  │    │
  │  │bar   │  │SMA,RSI,  │  │detect  │  │execute│    │
  │  │      │  │ATR       │  │        │  │       │    │
  │  └──────┘  └──────────┘  └────────┘  └───────┘    │
  │                                                     │
  │  LEAVE PHASE (reverse/stack order)                  │
  │  ┌──────┐  ┌──────────┐                            │
  │  │audit │← │pnl       │← ...                      │
  │  │log   │  │track     │                            │
  │  └──────┘  └──────────┘                            │
  └─────────────────────────────────────────────────────┘
```

### How Data Flows

1. A **context map** (`ctx`) flows through each interceptor
2. During **enter**, interceptors add data: indicators, signals, orders
3. During **leave**, interceptors compute derived values: P&L, audit logs
4. On **error**, the chain reverses, calling `:error` handlers up the stack

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Interceptor** | Map with `:name`, `:enter`, `:leave`, `:error` keys |
| **Context** | Map flowing through the chain — carries bar, state, params |
| **Queue** | Interceptors awaiting enter phase (FIFO) |
| **Stack** | Executed interceptors for leave/error phase (LIFO) |
| **Terminate** | Skip remaining enters, go straight to leave phase |

## Interceptor Structure

```clojure
(def my-interceptor
  {:name  ::my-interceptor
   :enter (fn [ctx]
            ;; Called during enter phase
            ;; Must return updated ctx
            (assoc ctx :my-data (compute-something ctx)))
   :leave (fn [ctx]
            ;; Called during leave phase (reverse order)
            ;; Good for cleanup, metrics, logging
            ctx)
   :error (fn [ctx ex]
            ;; Called when a downstream interceptor throws
            ;; Return ctx to handle the error (resumes leave)
            ;; Throw to propagate to next error handler
            (assoc ctx :error-handled true))})
```

## Standard Trading Interceptors

| Interceptor | Phase | Purpose |
|-------------|-------|---------|
| `::init-bar` | enter | Normalize bar, attach `:close`, `:high`, `:low`, `:open` |
| `::accumulate-prices` | enter | Push close into state's `:prices` and `:bars-hist` |
| `::indicators` | enter | Compute SMA-fast, SMA-slow, RSI, ATR |
| `::cooldown` | enter | Track bars-since-exit counter |
| `::signal-detect` | enter | Run strategy entry/exit logic |
| `::trailing-stop` | enter | Update trailing stop levels |
| `::order-execute` | enter | Execute orders (simulated or live fills) |
| `::bars-in-trade-tick` | enter | Increment bars-in-trade counter |
| `::pnl-track` | leave | Calculate realized/unrealized P&L |
| `::audit-log` | enter+leave | Timing and log entry for each bar |

## Execution Modes

### Simulation (In-Browser via Cherry)

```clojure
;; The bar stream is a reduce over historical data
(reduce
  (fn [state bar]
    (let [ctx (-> (chain/make-context {:bar bar :state state-atom :params params})
                  (chain/execute simulation-chain))]
      (:state ctx)))
  (init-state params)
  bars)
```

- Runs entirely in the browser via shadow-cljs compiled code
- Strategy functions compiled by Cherry, interceptor chain pre-compiled
- Results stream to terminal-bus and sim-transport

### Live (Server via Pulsar)

Same interceptor chain, but:
- Bar stream from Pulsar tick subscriptions
- `::order-execute` connects to exchange adapter (Deribit)
- Runs on CLJ server

## Writing a Custom Interceptor

```clojure
;; Example: Add a max-position-size check
(def max-position-check
  {:name  ::max-position-check
   :enter (fn [ctx]
            (let [position (:position @(:state ctx))
                  max-size (get-in ctx [:params :max-position-size] 1)]
              (if (and position (>= (:size position) max-size))
                ;; Terminate: skip signal detection, go to leave
                (chain/terminate ctx)
                ctx)))})

;; Insert into chain before signal-detect:
[::init-bar ::accumulate-prices ::indicators ::max-position-check ::signal-detect ...]
```

## Strategy as Chain Configuration

A strategy template defines which interceptors run and in what order:

```clojure
{:strategy/chain
  [::init-bar
   ::accumulate-prices
   ::indicators
   ::cooldown
   ::signal-detect      ;; user-defined entry/exit logic
   ::trailing-stop
   ::order-execute
   ::bars-in-trade-tick
   ::pnl-track
   ::audit-log]}
```

The `::signal-detect` interceptor wraps user-provided `detect-entry` and
`detect-exit` functions — these are the only strategy-specific code.

## Files

| File | Purpose |
|------|---------|
| `domain/interceptor_chain.cljc` | Core engine: execute, enqueue, terminate |
| `domain/executor_interceptors.cljc` | Standard trading interceptors |
| `ui/strategy_executor.cljs` | In-browser simulation via Cherry |
| `server/strategy_ide_api.clj` | Server-side execution (auto-detects chain) |
