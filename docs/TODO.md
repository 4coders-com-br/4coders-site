# Little Trader — EXECUTOR Epic Backlog

> Single source of truth for all outstanding work on the Executor platform.
> Last updated: 2026-04-04

## Legend
- [x] Done and verified
- [~] Initiated but flaky / partially working
- [ ] Not started

---

## 1. Workspace Shell & Layout

- [x] Unified workspace replacing sidebar+router
- [x] Top header with logo, live BTC/DVOL, user controls, Mel toggle
- [x] react-resizable-panels installed (v2.1.9) and compiled
- [~] **Panel resize handles render but initial load is flaky** — after login the workspace sometimes shows empty until page refresh. `mount-shell-widgets!` retry loop helps but doesn't always trigger.
- [~] **Candlestick chart** — creates from OHLCV bars but only after manual refresh or `create-chart!` call. Chart doesn't auto-create on first load.
- [ ] Convert bottom 4 tabs (Payoff/Blotter/FS Worker/Pipeline) into individual collapsible panels, all visible at once
- [ ] Panel header bars have minimize (—) and pop-out (⧉) but pop-out is placeholder only

## 2. Multi-Window / Pop-Out

- [~] **Pop-out button exists** on each panel header but opens a blank placeholder window
- [ ] Implement real pop-out: render actual Reagent component into child window via `rdom/render`
- [ ] Child windows share re-frame app-db (same atom, live updates)
- [ ] Parent close → child windows close
- [ ] Panel settings modal (⚙) exists but visibility toggles don't persist to localStorage

## 3. Parameter Box

- [x] `param_box.cljs` with mode buttons (Simulate/Live/Optimize/Train)
- [x] Parameter grid: Symbol, Timeframe, Price Model, Bars, Brick Size, Slippage, Runtime
- [x] Live symbol dropdown from `:workspace/available-symbols`
- [x] Execution-spec persistence to localStorage
- [~] **Symbol dropdown shows strings not properly formatted** — works but display is raw
- [ ] Move simulation transport controls (▶ ⏸ ◀ ▶▶ speed) into the param box after execution completes
- [ ] Range inputs for optimization mode (min/max/step per parameter)

## 4. Execution Engine

- [x] Server `POST /strategy-ide/execute` endpoint works
- [x] `run-backtest` Pathom mutation in strategy_resolvers
- [x] btc-near-expiry: options strategy with call/put trades, verified E2E
- [x] momentum-scalper: renko strategy with long/short trades
- [x] Execution results: bars, trades, equity-curve, summary all returned
- [~] **profit-factor is nil** when 100% win rate (division by zero in gross-loss)
- [~] **Renko trades missing `:id` field** — trade blotter may not key correctly
- [ ] Separate simulate vs live runtime paths
- [ ] Streaming execution results (live P&L curve during backtest)
- [ ] Run summaries persisted to Datomic
- [ ] Audit trail for execution decisions

## 5. Simulation Transport & Playback

- [x] `sim_transport.cljs` with play/pause/step/seek/speed controls
- [x] Re-frame state: `:sim/idx`, `:sim/total`, `:sim/playing?`, `:sim/speed`
- [x] Auto-init from `:strategy-ide/execution-result`
- [~] **Transport bar renders but chart doesn't sync** — stepping through bars doesn't update the candlestick chart or payoff spot price
- [ ] Sync OHLC chart with `:sim/visible-bars` (show only bars up to current index)
- [ ] Sync payoff diagram spot with current bar's close (`:options/set-spot`)
- [ ] Animate both panels at playback velocity

## 6. Execution→Payoff Bridge

- [x] `:options/on-execution-result` extracts call/put legs from trades
- [x] Sets strategy name "From Execution" + spot from last bar
- [~] **Legs use entry-price as strike** — should use actual option strike from strategy config or Deribit book
- [~] **Premium estimated from |P&L/qty|** — should be actual premium paid at entry
- [ ] IV smile overlay from FS data on payoff chart
- [ ] Click payoff chart to add/modify legs
- [ ] Greeks display from execution position

## 7. Strategy IDE Integration

- [x] Monaco editor + file tree + project selector
- [x] execution-toolbar replaced with param-box
- [x] Execution panel with collapsible sections (Charts, Payoff, Blotter, Log, MCP)
- [~] **Collapsible sections default-open** but state uses `defonce` atom (doesn't persist, doesn't hot-reload)
- [~] **strategy_editor.cljs has undeclared var warnings** — `tool-defaults`, `chart-theme` referenced but not defined
- [ ] Persist section collapse state to localStorage
- [ ] Error boundary in execution panel (currently shows nothing on error)

## 8. FS Worker Status

- [x] `fs_status.cljs` panel with live metrics, domain cards, topic table
- [x] Polls EQL every 10s for topology + snapshot data
- [x] Available as "FS Worker" tab in bottom panel
- [~] **No start/stop controls** — shows status but can't control the worker
- [ ] Add start/stop/restart buttons (requires server endpoint)
- [ ] Show per-topic message rates and lag

## 9. Trade Blotter

- [x] `trade-blotter-panel` in workspace bottom tabs
- [x] Table: #, Side, Entry, Exit, P&L, Reason, Bars held
- [x] Color-coded: green for calls/longs, red for puts/shorts
- [~] **Only shows after execution** — "Run a simulation" placeholder when empty
- [ ] Click trade row to highlight on chart + payoff diagram
- [ ] Export trades to CSV
- [ ] Filter by side/reason

## 10. Mel AI Advisor

- [x] Right panel with chat + docs tabs
- [x] Quick action chips
- [x] Mel mode toggle (full/half/collapsed)
- [ ] Context injection from execution results + market state
- [ ] Mel can dispatch re-frame events (adjust params, run execution)
- [ ] Decision weighting: rules + NN + Mel → weighted signal
- [ ] Conversation memory across sessions

## 11. Live Data Pipeline

- [x] FS worker publishing BTC/ETH options + prices to Pulsar
- [x] EQL resolvers for live snapshot, OHLCV, IV smile
- [x] Workspace polls every 10s
- [~] **OHLCV bars accumulate slowly** (1 per hour) — fresh Pulsar has few bars initially
- [~] **history.clj fixed to use PULSAR_SERVICE_URL** but cache is 5-min stale
- [ ] WebSocket real-time bar updates (pulsar-ws-bridge → re-frame)
- [ ] Multi-asset selector (BTC/ETH/SOL) in workspace
- [ ] Timeframe selector in workspace (1m/5m/15m/1h/1d)

## 12. CI/CD

- [x] GitHub Actions CI: lint + build + Docker push
- [x] Cloud Run deploy to staging (in-memory Datomic)
- [x] FS worker image built in CI + pushed to GAR
- [x] Staging live at https://little-trader-staging-x4miahfzia-uc.a.run.app
- [~] **Tests skipped** (`if: false`) for fast deploy — need to re-enable
- [~] **Smoke test re-enabled** but kaocha still skipped (Clara Rules too slow)
- [~] **FS worker refresh step fails** (SSH permission) — marked continue-on-error
- [ ] Fix staging VPC → Datomic VM connection (currently using in-memory fallback)
- [ ] Re-enable kaocha with Clara-free test suites
- [ ] Add CLJS test runner to CI

---

## Priority Order

| Priority | Item | Impact |
|----------|------|--------|
| P0 | Fix initial load flakiness (chart + IDE not mounting) | Users see blank page |
| P0 | Sync chart + payoff with simulation transport | Core demo feature |
| P1 | Collapsible bottom panels (not tabs) | UX completeness |
| P1 | Transport controls in param box | Single control surface |
| P1 | Real pop-out windows with shared state | Multi-monitor workflow |
| P1 | Fix profit-factor nil + trade IDs | Data correctness |
| P2 | Actual option strikes + premiums in payoff | Analysis accuracy |
| P2 | WebSocket real-time updates | Live trading prep |
| P2 | Re-enable CI tests | Code quality gate |
| P3 | Mel AI context + tool use | Intelligence layer |
| P3 | Optimization + training jobs | Advanced execution |

---

## Active Parallel Streams (2026-04-04)

Two independent work streams running concurrently. **No file overlap** — safe to merge independently.

### Stream A: Simulation Sync & Execution Data Correctness (Claude Code session)

**Owner**: Claude Code (multi-agent worktrees)
**Branch**: `feature/sim-sync-and-metrics`
**Priority**: P0 + P1 items
**Files touched**: `ui/sim_transport.cljs`, `ui/workspace.cljs`, `ui/chart.cljs`, `ui/payoff_chart.cljs`, `ui/param_box.cljs`, `domain/strategy_executor.clj`, `domain/trades.cljc`

| Agent | Task | Key File | Status |
|-------|------|----------|--------|
| 1 — chart-sync | Wire `:sim/visible-bars` → workspace chart so stepping updates OHLC | `workspace.cljs` | [ ] |
| 2 — payoff-sync | Wire `:sim/current-bar` close → `:options/set-spot` on payoff diagram | `payoff_chart.cljs` | [ ] |
| 3 — executor-fix | Replace hardcoded `profit-factor 0.0` in `strategy_executor.clj:714` with `trades/calculate-trade-metrics`; add `:id` to renko trades | `strategy_executor.clj`, `trades.cljc` | [ ] |
| 4 — transport-ui | Move transport controls into `param_box.cljs` after execution completes | `param_box.cljs`, `sim_transport.cljs` | [ ] |

**Acceptance criteria**:
- [ ] Stepping through sim updates candlestick chart (bars 1..N shown)
- [ ] Stepping through sim updates payoff spot price marker
- [ ] Play/pause animates both chart + payoff in sync
- [ ] `profit-factor` returns correct value (not nil/0.0) for all trade outcomes
- [ ] All renko trades have unique `:id` field
- [ ] Transport bar appears inside param box post-execution

### Stream B: CI/CD Hardening & Test Infrastructure (External agent)

**Owner**: External agent (Codex / separate Claude session)
**Branch**: `feature/ci-test-hardening`
**Priority**: P2
**Files touched**: `.github/workflows/ci.yml`, `.github/workflows/cloud-run.yml`, `tests.edn`, `shadow-cljs.edn`, test files only

| # | Task | Details |
|---|------|---------|
| 1 | Re-enable kaocha test runner | Remove `if: false` guard in `ci.yml`; create Clara-free test selector in `tests.edn` so non-rules tests run fast |
| 2 | Add CLJS test runner to CI | Configure `shadow-cljs.edn` `:test` build target; add CI step running `npx shadow-cljs compile test` |
| 3 | Fix FS worker refresh SSH | Debug SSH permission failure in cloud-run.yml FS worker refresh step; either fix key or replace with GCP API call |
| 4 | Staging VPC→Datomic connection | Fix `DATOMIC_URI` in Cloud Run service to reach Datomic transactor VM via VPC connector instead of falling back to in-memory |
| 5 | Strategy execution smoke test | Add a CI job that boots the server, runs `POST /strategy-ide/execute` with sample params, asserts 200 + non-empty trades |

**Acceptance criteria**:
- [ ] CI runs Clojure tests (non-Clara subset) and passes
- [ ] CI runs CLJS tests and passes
- [ ] FS worker refresh step succeeds (no `continue-on-error` needed)
- [ ] Staging uses Datomic Pro (not in-memory) after deploy
- [ ] Smoke test catches regressions in execution endpoint

**Coordination notes**:
- Streams share NO source files — merge order doesn't matter
- Stream B should branch from `main` at this commit
- Both streams merge back to `main` via PR when complete

---

## 9. Mel Evolution — Flying Avatar & Conversation Persistence

> See [MEL_EVOLUTION.md](./MEL_EVOLUTION.md) for full architecture plan.

- [ ] **Flying avatar mode** — Mel as draggable floating mascot with speech balloon + hover prompt
- [ ] **Conversation entity** — first-class Datomic schema for mel.conversation + mel.message
- [ ] **Provider metadata capture** — latency, tokens, cost, pathway on every assistant message
- [ ] **localStorage persistence** — local-first snapshot of last 50 conversations
- [ ] **Pulsar topic** — `mel.conversations.events` for durable event log + cross-device sync
- [ ] **Datomic materializer** — Pulsar consumer that writes to Datomic cache
- [ ] **Recovery waterfall** — localStorage → Datomic → Pulsar replay
- [ ] **Usage analytics** — provider costs, token counts, model comparison stats
- [ ] **Offline queue** — pending messages with sync-on-reconnect

;; WARNING TODO PENDING REPL REACH — flying avatar DOM injection needs testing from cljs repl

---

## 13. CICD Review: Full Local Dev for Offline/Special Scenarios

> **Session planned**: Review and ensure a complete local development path that works
> without any cloud dependencies, for offline work or environments where cloud
> access is restricted.

- [ ] Verify `make dev-core` works fully offline with local PG + Datomic + MinIO
- [ ] Document the `PULSAR=local make dev-all` path with local Pulsar broker
- [ ] Ensure docker-compose.fs.yml local Pulsar + FS worker works standalone
- [ ] Test blob_store.clj falls back gracefully when BLOB_ENDPOINT is MinIO (localhost:9100)
- [ ] Create `.env.local` template with all env vars defaulted to local services
- [ ] Document offline-first data seeding: backfill from local CSV/fixtures instead of Deribit API
- [ ] Test full CI pipeline (`make ci`) can run without any cloud connectivity
- [ ] Verify admin panel shows meaningful data in fully local mode (no cloud status rows)
- [ ] Consider adding a `CLOUD_MODE=false` env var that disables cloud-specific UI sections

---

## 10. Testing — Comprehensive Coverage Plan

> See [docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md) for full test pyramid, coverage map, and patterns.

### Current State (as of PR #64)
- **70 test files** across CLJ, CLJC, CLJS, and browser integration
- **9 Kaocha suites**: `:auth`, `:domain`, `:fs`, `:server`, `:options`, `:connectors`, `:services`, `:components`, `:browser`
- **15 previously orphaned** test files now registered via wildcard patterns
- **14 surface mock tests** added with 1-2 real cases + TODO comments for expansion
- **Etaoin headless browser** tests (4 files) — Learn UI, Mel, Workspace, Smoke

### Priority Gaps (P2)
- [ ] `domain/param_optimizer` — complex optimizer, needs design
- [ ] `domain/data_cache` — caching layer tests
- [ ] `domain/deribit_options_replay` — depends on data files
- [ ] `fast_streaming/history` — needs mock bar data
- [ ] `server/admin_api` — expand from surface to full coverage
- [ ] `server/learn_api` — expand REPL eval + auth guard tests

### Surface Tests to Expand
Each file below has 1-2 real cases and TODO comments marking remaining work:
- [ ] `server/admin_api_test.clj` — JVM metrics, worker controls
- [ ] `server/docs_api_test.clj` — file serving, traversal rejection
- [ ] `server/learn_api_test.clj` — eval, auth, chat
- [ ] `server/portfolio_api_test.clj` — positions, orders, Greeks
- [ ] `server/opscan_api_test.clj` — multi-leg payoff
- [ ] `server/metrics_test.clj` — Prometheus output
- [ ] `domain/opscan_test.clj` — all leg types
- [ ] `domain/options_signals_test.clj` — signal detection
- [ ] `domain/strategy_executor_test.clj` — multi-source aggregation
- [ ] `domain/rules_engine_test.clj` — Clara fact insertion + firing
- [ ] `domain/strategy_format_test.clj` — round-trip serialization
- [ ] `domain/options_test.clj` — Greeks, moneyness
- [ ] `auth/resolvers_test.clj` — login/signup/logout flow
- [ ] `fast_streaming/worker_api_test.clj` — status, health, backfill

### How to Run
```bash
clj -M:test                        # All CI-safe suites
clj -M:test --focus :browser       # Headless Chrome (needs chromedriver)
npm test                           # ClojureScript UI tests
```
