# Executor Platform — Holistic Backlog

> Branch: `feature/EXECUTOR001`
> Architecture: `docs/EXECUTOR_*.md` (7 design docs)
> Last updated: 2026-04-04

## Vision

The Executor is the **central nervous system** binding together:
- **Price Engine** — live market data from FastStreaming/Pulsar
- **Strategy Code** — Clojure rules in Monaco IDE projects
- **Simulators** — backtest/paper/live execution with replay
- **Options Engine** — BSM pricing, payoff diagrams, P&L curves
- **Live Visuals** — real-time charts, metrics, equity curves
- **Mel AI** — context-aware advisor with decision weighting
- **Multi-Window UI** — resizable panels via react-resizable-panels

---

## Data Flow (Current)

```
Strategy Code (Monaco IDE)
  → POST /strategy-ide/execute
    → Server: load bars + run strategy rules
      → Result: {trades, bars, equity-curve, summary}
        → re-frame :strategy-ide/execution
          → Execution Charts (price + equity canvases)
          → Execution Metrics (cards)
          → Trade Blotter (table)
          → Execution Log (verbosity filtered)
          → Options Payoff Diagram ← NOW fed from execution trades
```

## Session Status

### Session 0: Contract Foundation — DONE
- [x] `executor_spec.cljc` — modes, targets, timeframes, price-models, specs
- [x] Re-frame wiring: `:execution-spec` sub/events
- [x] Server execute endpoint + run-backtest mutation
- [x] Test coverage

### Session 1: Parameter Box — DONE
- [x] `param_box.cljs` — mode buttons, parameter grid, summary badges
- [x] Live symbol dropdown from `:workspace/available-symbols`
- [x] Execution-spec persistence to localStorage
- [x] Full round-trip verified (CLJS → server → results)

### Session 1.5: Integration Fix — DONE
- [x] Execution trades feed payoff diagram legs (call/put from btc-near-expiry)
- [x] Collapsible sections default-open (charts, payoff, blotter, MCP)
- [x] Spot price set from execution's last bar

---

## Remaining Sessions

### Session 2: Multi-Window Panel System
**Priority: HIGH** — core UX improvement

- [ ] Verify react-resizable-panels renders correctly in browser
- [ ] Panel presets: "Trading" (chart big), "Coding" (IDE big), "Analysis" (payoff big)
- [ ] Collapsible panels — click header to minimize/restore
- [ ] Tear-off panels — open chart/IDE/payoff in separate browser window
- [ ] Panel state persistence in localStorage
- [ ] Keyboard shortcuts for panel focus (Ctrl+1 chart, Ctrl+2 IDE, etc.)

### Session 3: Price Engine Integration
**Priority: HIGH** — live data in all panels

- [ ] WebSocket subscription in workspace (pulsar-ws-bridge → re-frame)
- [ ] Real-time bar updates in execution chart (not just static replay)
- [ ] Multi-asset selector (BTC/ETH/SOL) in workspace metric bar
- [ ] Timeframe selector in workspace (1m/5m/15m/1h/1d)
- [ ] Live options chain sorted/filtered by strike distance to spot

### Session 4: Strategy Engine Hardening
**Priority: MEDIUM** — execution quality

- [ ] Wire `executor_spec` modes to `strategy_executor.clj` properly
- [ ] Separate simulate vs live runtime paths
- [ ] Streaming execution results (live P&L curve during backtest)
- [ ] Run summaries persisted to Datomic
- [ ] Audit trail for all execution decisions

### Session 5: Options Payoff Deep Integration
**Priority: MEDIUM** — strategy ↔ payoff bidirectional

- [ ] Strategy trades auto-populate payoff legs (DONE for basic call/put)
- [ ] Strike/premium from actual Deribit book (not estimated from P&L)
- [ ] IV smile overlay from FS data on payoff chart
- [ ] Click payoff chart to add/modify legs
- [ ] Strategy code `option-lens` config drives preset selection
- [ ] Greeks display from execution position

### Session 6: Parameter Optimization
**Priority: MEDIUM** — systematic improvement

- [ ] Range inputs in param box (min/max/step for each param)
- [ ] Grid search / genetic optimization runner
- [ ] Job system with progress tracking and checkpoint/resume
- [ ] Top-result summary with comparison table
- [ ] Optimization history persistence

### Session 7: Mel AI Advisor
**Priority: MEDIUM** — intelligence layer

- [ ] Context injection: execution results, market state, strategy params
- [ ] Mel suggests parameter changes based on execution metrics
- [ ] Mel can dispatch re-frame events (adjust params, run execution)
- [ ] Decision weighting: rules engine + NN + Mel advisor → weighted signal
- [ ] Fail-closed safety for Mel recommendations
- [ ] Conversation memory across sessions

### Session 8: Training & Heavy Jobs
**Priority: LOW** — advanced features

- [ ] Training mode as first-class executor mode
- [ ] Dataset manifests + model artifact storage
- [ ] Training progress metrics in UI
- [ ] Heavy job offloading (cloud worker for long backtests)
- [ ] Job queue with status dashboard

---

## Architecture Binding Points

| Component | Reads From | Writes To |
|-----------|-----------|----------|
| **Param Box** | `:execution-spec`, `:workspace/available-symbols` | `:strategy-ide/set-execution-field` |
| **Execution Engine** | Strategy source (S3), bars (server-side) | `:strategy-ide/execution-result` |
| **Execution Charts** | `:strategy-ide/execution` | lightweight-charts canvases |
| **Payoff Diagram** | `:options/strategy`, `:options/spot` | SVG payoff curve |
| **Trade→Payoff Bridge** | `:strategy-ide/execution` trades | `:options/set-strategy`, `:options/set-spot` |
| **FS Live Data** | Pulsar → EQL resolvers | `:workspace/fs-snapshot`, `:workspace/fs-ohlcv` |
| **Mel AI** | `:mel-context` (app state summary) | Chat messages, dispatches |
| **Workspace Panels** | react-resizable-panels | localStorage auto-save |

---

## File Map

| File | Role |
|------|------|
| `executor_spec.cljc` | Shared execution contract |
| `strategy_executor.clj` | Server-side execution engine |
| `strategy_ide_api.clj` | HTTP execute endpoint |
| `param_box.cljs` | Parameter panel component |
| `strategy_editor.cljs` | IDE root + execution panel |
| `workspace.cljs` | Unified layout with panels |
| `rf/options.cljs` | Payoff diagram state |
| `rf/events.cljs` | All re-frame events |
| `payoff_chart.cljs` | BSM payoff SVG component |
| `mel_assistant.cljs` | AI chat panel |
| `mel_context.cljs` | Context builder for Mel |
