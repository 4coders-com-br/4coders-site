# EQL-Only Architecture Migration

## Summary

This document describes the refactoring that unified all data operations through EQL/Pathom, eliminating REST endpoints that bypassed the RAD data layer.

## Architecture Before

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BEFORE: Bifurcated Paths                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  UIx Components                    Fulcro RAD                        │
│       │                                 │                            │
│       ▼                                 ▼                            │
│  state.cljs                        client.cljs                       │
│  (REST calls)                      (EQL via Fulcro)                  │
│       │                                 │                            │
│       ▼                                 ▼                            │
│  /api/trade/open ──┐           ┌── /api/eql                         │
│  /api/trade/close  │           │                                    │
│  /api/sample       │           │                                    │
│       │            │           │                                    │
│       ▼            │           ▼                                    │
│  routes.clj ───────┘    Pathom Processor                            │
│  (in-memory only!)            │                                     │
│       │                       ▼                                     │
│       ✗               ┌── Datomic ──┐                               │
│   NOT PERSISTED       │  Persisted  │                               │
│                       └─────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

**Problems:**
- Trades from UIx chart not persisted to Datomic
- RAD reports showed nothing (no shared data)
- Two state systems with no synchronization
- Lost trades on page refresh

## Architecture After

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AFTER: Unified EQL Layer                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  UIx Components                    Fulcro RAD                        │
│       │                                 │                            │
│       ▼                                 ▼                            │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │              mutations.cljs (Unified Adapter)               │     │
│  │  - open-trade!      - load-sample-data!                    │     │
│  │  - close-trade!     - load-trades!                         │     │
│  │  - transact-eql!    - load-open-trade!                     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│                    /api/eql (Transit)                                │
│                           │                                          │
│                           ▼                                          │
│                  ┌─────────────────┐                                 │
│                  │ Pathom3 Parser  │                                 │
│                  │  - RAD plugins  │                                 │
│                  │  - Resolvers    │                                 │
│                  │  - Mutations    │                                 │
│                  └────────┬────────┘                                 │
│                           │                                          │
│                           ▼                                          │
│                  ┌─────────────────┐                                 │
│                  │    Datomic      │                                 │
│                  │   (Persisted)   │                                 │
│                  └─────────────────┘                                 │
│                                                                      │
│  State Synchronization:                                              │
│  ┌─────────────────┐         ┌──────────────────┐                   │
│  │   UIx Atoms     │◄───────►│   Fulcro DB      │                   │
│  │ (real-time UI)  │ sync    │ (normalized)     │                   │
│  └─────────────────┘         └──────────────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

## Files Changed

### New Files

| File | Purpose |
|------|---------|
| `ui/mutations.cljs` | Unified EQL mutation adapter for UIx and Fulcro |

### Modified Files

| File | Changes |
|------|---------|
| `ui/state.cljs` | Removed REST-based `open-trade!`, `close-trade!`, `fetch-sample-data!` |
| `ui/app.cljs` | Now uses `mutations.cljs` for all data operations |
| `components/resolvers.clj` | Added `all-trades` and `open-trades` resolvers |
| `server/routes.clj` | Removed REST trade handlers, kept only deprecated `/api/sample` |

## Migration Guide

### UIx Components

**Before:**
```clojure
;; state.cljs
(defn open-trade! [side]
  (-> (js/fetch "/api/trade/open" ...)
      (.then ...)))
```

**After:**
```clojure
;; Use mutations.cljs
(require '[com.little-trader.ui.mutations :as mutations])

(mutations/open-trade! {:account-id account-id
                        :side :long
                        :symbol "BTC/USD"
                        :price current-price
                        :amount 0.01})
```

### Data Loading

**Before:**
```clojure
(js/fetch "/api/sample?limit=100&brick-size=100")
```

**After:**
```clojure
(mutations/load-sample-data! {:limit 100 :brick-size 100.0})
```

### EQL Queries (Direct)

For custom queries, use `transact-eql!` directly:

```clojure
(mutations/transact-eql!
  [{:trade/all-trades
    [:trade/id :trade/symbol :trade/pnl]}]
  {:on-success (fn [result] ...)})
```

## Benefits

1. **Single Source of Truth** - All trades persisted in Datomic
2. **RAD Reports Work** - `TradeList` and `OpenTradesList` show all trades
3. **Page Refresh Recovery** - Trades survive browser refresh
4. **Optimistic Updates** - UIx shows immediate feedback, rollback on failure
5. **Audit Trail** - Datomic history tracks all changes
6. **Computed Attributes** - P&L, metrics auto-calculated by resolvers

## Optimistic Update Pattern

The mutations module implements optimistic updates:

```clojure
(transact-eql!
  [(list 'open-trade params)]
  {:optimistic (fn []
                 ;; Show pending state immediately
                 (state/set-trade! {:trade/status :pending ...}))
   :on-success (fn [result]
                 ;; Update with server response
                 (state/set-trade! (merge ... {:trade/status :open})))
   :on-error (fn [_]
               ;; Rollback on failure
               (state/clear-trade!))})
```

## Deprecated Endpoints

The following REST endpoints are deprecated:

| Endpoint | Replacement |
|----------|-------------|
| `POST /api/trade/open` | EQL: `[(open-trade {...})]` |
| `POST /api/trade/close` | EQL: `[(close-trade {...})]` |
| `GET /api/trades` | EQL: `[{:trade/all-trades [...]}]` |
| `GET /api/trades/open` | EQL: `[{:trade/open-trades [...]}]` |
| `GET /api/sample` | EQL: `[{(sample-market-data {...}) [...]}]` |

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Trade Lifecycle                               │
└──────────────────────────────────────────────────────────────────────┘

1. USER ACTION (Click "LONG" on chart)
   │
   ▼
2. mutations/open-trade!
   │
   ├──► Optimistic update: state/set-trade! {:status :pending}
   │
   ▼
3. POST /api/eql
   Body: [(com.little-trader.components.resolvers/open-trade
           {:account-id uuid :side :long :price 50000 :amount 0.01})]
   │
   ▼
4. Pathom3 Parser
   │
   ├──► RAD Attribute validation
   │
   ▼
5. open-trade mutation
   │
   ├──► d/transact to Datomic
   │
   ▼
6. Response: {:trade/id uuid :trade/status :open}
   │
   ├──► state/set-trade! (final state)
   │
   └──► Fulcro DB merge (for RAD reports)
```
