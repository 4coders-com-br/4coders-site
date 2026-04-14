# Testing Strategy — Little Trader Platform

> Comprehensive test architecture covering unit, integration, browser, UI, API,
> trading logic, monitoring, troubleshooting, and Learn module verification.
>
> Last updated: 2026-04-05

---

## 1. Test Pyramid

```
                      ┌───────────┐
                      │  Browser  │  Etaoin headless Chrome (4 test files)
                     ┌┴───────────┴┐
                     │  API Smoke   │  ci-api-smoke.sh (server spawn + curl)
                    ┌┴─────────────┴┐
                    │  Integration   │  ^:integration metadata (Deribit testnet)
                   ┌┴───────────────┴┐
                   │   re-frame UI    │  rf-test/run-test-sync (17 CLJS files)
                  ┌┴─────────────────┴┐
                  │    Domain Unit     │  Pure functions, no I/O (CLJ/CLJC files)
                  └───────────────────┘
```

| Layer | Technology | Speed | Requires |
|-------|-----------|-------|----------|
| Domain Unit | `clojure.test` + Kaocha | <1s per test | JVM only |
| re-frame UI | `day8.re-frame/test` + shadow-cljs | <2s per test | Node.js |
| Integration | `^:integration` + real network | 1-10s per test | Network/Deribit |
| API Smoke | Bash + curl | ~30s total | JVM + port |
| Browser | Etaoin + headless Chrome | 2-5s per test | Chrome + chromedriver |

---

## 2. Test Conventions

### Namespace Naming
```
Source:  com.little-trader.<module>.<namespace>
Test:   com.little-trader.<module>.<namespace>-test
File:   test/com/little_trader/<module>/<namespace>_test.clj
```

### Fixture Patterns

**Domain fixtures** — builder functions for test data:
```clojure
(defn make-brick [direction close]
  {:direction direction :close close :mts (System/currentTimeMillis)})

(defn make-trade [pnl pnl-percent]
  {:id (java.util.UUID/randomUUID) :status :closed :pnl pnl :pnl-percent pnl-percent})
```

**Server API fixtures** — `with-redefs` for config/dependency isolation:
```clojure
(with-redefs [cfg/commands-config (constantly {...})]
  (let [result (api/handle-request req)]
    (is (= 200 (:status result)))))
```

**CLJS fixtures** — mock effects + test DB:
```clojure
(rf-test/run-test-sync
  (h/init-test-db!)
  (h/mock-response! "/api/chat" {:text "response"})
  (rf/dispatch [:mel/send-message "hello"])
  (is (= 2 (count (h/sub-value [:mel/messages])))))
```

**Browser fixtures** — Etaoin lifecycle:
```clojure
(use-fixtures :once (h/browser-fixture))

(deftest my-test
  (h/go! "/#/learn")
  (h/wait-el {:class "lesson-title"})
  (is (h/has-text? "Welcome")))
```

### Metadata Tags
- `^:integration` — requires network (Deribit testnet, Pulsar, etc.)
- `^:slow` — takes >5s, may be excluded from fast feedback loops
- `^:browser` — requires Chrome + chromedriver

### Test Isolation
- No shared mutable state between tests
- Each test creates its own fixtures
- `with-redefs` scopes mocks to individual tests
- CLJS: `init-test-db!` resets re-frame DB + mock effects per test

---

## 3. Running Tests

```bash
# ── Clojure (Kaocha) ──────────────────────────────────────────────────────
clj -M:test                        # All CI-safe suites
clj -M:test --focus :domain        # Domain logic only
clj -M:test --focus :auth          # Auth + RBAC + middleware
clj -M:test --focus :server        # Server API tests
clj -M:test --focus :options       # Options pricing/pnl
clj -M:test --focus :fs            # Fast-streaming pipeline
clj -M:test --focus :connectors    # Exchange connectors (Deribit, MT5)
clj -M:test --focus :services      # Services layer (crawlers, feeds)
clj -M:test --focus :components    # Resolvers & middleware
clj -M:test --focus :browser       # Headless Chrome (requires chromedriver)

# ── ClojureScript (shadow-cljs) ──────────────────────────────────────────
npm test                           # All CLJS tests (node-test target)

# ── API Smoke (Bash) ─────────────────────────────────────────────────────
./scripts/ci-api-smoke.sh          # Spawn server, test health/auth/eql/UI

# ── REPL (interactive) ───────────────────────────────────────────────────
(require '[clojure.test :refer [run-tests]])
(require 'com.little-trader.domain.risk-test :reload)
(run-tests 'com.little-trader.domain.risk-test)
```

---

## 4. Kaocha Suite Registry (tests.edn)

### Suites and their patterns

| Suite | Patterns | File Count |
|-------|----------|------------|
| `:auth` | `auth\\.auth-test`, `auth\\.rbac-test`, `auth\\.middleware-test`, `strategy-resolvers-test` | 4 |
| `:domain` | `domain\\..*-test` (wildcard) | 17+ |
| `:fs` | `fast-streaming\\..*-test` (wildcard) | 8+ |
| `:server` | `server\\..*-test`, `config-test` | 5+ |
| `:options` | `options\\..*-test` | 3 |
| `:connectors` | `connectors\\..*-test` | 2+ |
| `:services` | `services\\..*-test` | 2+ |
| `:components` | `components\\..*-test` (excl. strategy-resolvers in :auth) | 2+ |
| `:browser` | `browser\\..*-test` | 4 |

---

## 5. Complete Coverage Map

### 5.1 Domain Logic (17 files)

| Source Namespace | Test File | Status | Notes |
|-----------------|-----------|--------|-------|
| `domain/signals` | `domain/signals_test.clj` | ✅ Tested | |
| `domain/renko` | `domain/renko_test.clj` | ✅ Tested | |
| `domain/metrics` | `domain/metrics_test.clj` | ✅ Tested | |
| `domain/ma_crossover` | `domain/ma_crossover_test.clj` | ✅ Tested | |
| `domain/options_strategy_pack` | `domain/options_strategy_pack_test.clj` | ✅ Tested | |
| `domain/options_ruleset` | `domain/options_ruleset_test.clj` | ✅ Tested | |
| `domain/convex/engine` | `domain/convex/engine_test.clj` | ✅ Tested | |
| `domain/neural_network` | `domain/neural_network_test.clj` | ✅ Tested | |
| `domain/llm_agent` | `domain/llm_agent_test.clj` | ✅ Tested | Was orphaned — now registered |
| `domain/executor_spec` | `domain/executor_spec_test.clj` | ✅ Tested | Was orphaned — now registered |
| `domain/risk` | `domain/risk_test.cljc` | ✅ Tested | New in PR #63 |
| `domain/trades` | `domain/trades_test.cljc` | ✅ Tested | New in PR #63 |
| `domain/options_backtest` | `domain/options_backtest_test.clj` | ✅ Tested | Was orphaned — now registered |
| `domain/nnm_integration` | `domain/nnm_integration_test.clj` | ✅ Integration | Was orphaned — now registered |
| `domain/opscan` | `domain/opscan_test.clj` | 🆕 Surface | Mock test with comments |
| `domain/options_signals` | `domain/options_signals_test.clj` | 🆕 Surface | Mock test with comments |
| `domain/strategy_executor` | `domain/strategy_executor_test.clj` | 🆕 Surface | Mock test with comments |
| `domain/param_optimizer` | — | ❌ Missing (P2) | Complex optimizer — needs design |
| `domain/data_cache` | — | ❌ Missing (P2) | Caching layer |
| `domain/deribit_options_replay` | — | ❌ Missing (P2) | Depends on data files |
| `domain/rules_engine` | `domain/rules_engine_test.clj` | 🆕 Surface | Clara Rules mock |
| `domain/strategy_format` | `domain/strategy_format_test.clj` | 🆕 Surface | Format validation |
| `domain/options` | `domain/options_test.clj` | 🆕 Surface | Options domain logic |
| `domain/mcp` | — | ❌ Skip | MCP tooling, tested via REPL |
| `domain/mt5_bridge` | — | ❌ Skip | Python interop, needs MT5 |
| `domain/nnm_trainer` | — | ❌ Skip | Long-running training |
| `domain/strategy_examples` | — | ❌ Skip | Example data, no logic |
| `domain/convex/facts` | — | ❌ Skip | Data definitions |
| `domain/convex/queries` | — | ❌ Skip | Query definitions |
| `domain/convex/rules` | — | ❌ Skip | Rule definitions |

### 5.2 Auth & Security (4 files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `auth/core` | `auth/auth_test.clj` | ✅ Tested |
| `auth/middleware` | `auth/middleware_test.clj` | ✅ Tested (PR #63) |
| `auth/resolvers` | `auth/resolvers_test.clj` | 🆕 Surface |

### 5.3 Server / API (10 files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `server/strategy_ide_api` | `server/strategy_ide_api_test.clj` | ✅ Tested |
| `server/chat_local` | `server/chat_local_test.clj` | ✅ Tested |
| `config` | `config_test.clj` | ✅ Tested |
| `server/admin_api` | `server/admin_api_test.clj` | 🆕 Surface |
| `server/docs_api` | `server/docs_api_test.clj` | 🆕 Surface |
| `server/learn_api` | `server/learn_api_test.clj` | 🆕 Surface |
| `server/portfolio_api` | `server/portfolio_api_test.clj` | 🆕 Surface |
| `server/opscan_api` | `server/opscan_api_test.clj` | 🆕 Surface |
| `server/metrics` | `server/metrics_test.clj` | 🆕 Surface |
| `server/core` | — | ⚠️ Partial (via smoke + browser) |
| `server/routes` | — | ❌ Skip (thin routing wiring) |
| `server/ws` | — | ❌ Skip (WebSocket, needs integration) |

### 5.4 Options Pricing (3 files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `options/pricing` | `options/pricing_test.clj` | ✅ Tested |
| `options/pnl` | `options/pnl_test.clj` | ✅ Tested |
| `options/engine` | `options/engine_test.clj` | ✅ Tested |
| `options/model` | — | ❌ Skip (data definitions) |

### 5.5 Connectors (2+ files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `connectors/deribit` | `connectors/deribit_test.clj` | ✅ Unit + Integration |
| `connectors/metatrader` | `connectors/metatrader_test.clj` | ✅ Tested |
| `connectors/deribit_ws` | — | ⚠️ Partial (via deribit_test) |
| `connectors/exchange` | — | ❌ Skip (protocol dispatch) |
| `connectors/protocol` | — | ❌ Skip (protocol definitions) |

### 5.6 Components / Resolvers (6 files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `components/strategy_resolvers` | `components/strategy_resolvers_test.clj` | ✅ Tested (in :auth) |
| `components/fs_resolvers` | `components/fs_resolvers_test.clj` | ✅ Tested — was orphaned |
| `components/resolvers` | `components/resolvers_test.clj` | ✅ Tested — was orphaned |
| `components/database` | — | ❌ Skip (Mount lifecycle) |
| `components/middleware` | — | ❌ Skip (RAD middleware) |
| `components/parser` | — | ❌ Skip (Pathom parser setup) |
| `components/deribit_resolvers` | — | ❌ Missing (P3) |
| `components/kg_resolvers` | — | ❌ Missing (P3) |
| `components/optimization_resolvers` | — | ❌ Missing (P3) |

### 5.7 Fast Streaming (8+ files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `fast_streaming/topology` | `fast_streaming/topology_test.clj` | ✅ Tested |
| `fast_streaming/markets` | `fast_streaming/markets_test.clj` | ✅ Tested |
| `fast_streaming/worker` | `fast_streaming/worker_test.clj` | ✅ Tested |
| `fast_streaming/blob_store` | `fast_streaming/blob_store_test.clj` | ✅ Tested — was orphaned |
| `fast_streaming/knowledge_graph` | `fast_streaming/knowledge_graph_test.clj` | ✅ Tested — was orphaned |
| `fast_streaming/e2e_pipeline` | `fast_streaming/e2e_pipeline_test.clj` | ✅ Integration — was orphaned |
| `fast_streaming/options_backtest` | `fast_streaming/options_backtest_test.clj` | ✅ Tested — was orphaned |
| `fast_streaming/worker_api` | `fast_streaming/worker_api_test.clj` | 🆕 Surface |
| `fast_streaming/history` | — | ❌ Missing (P2) |
| `fast_streaming/archiver` | — | ❌ Skip (Pulsar needed) |
| `fast_streaming/backfill` | — | ❌ Skip (Pulsar needed) |
| `fast_streaming/blob_loader` | — | ❌ Skip (S3 needed) |
| `fast_streaming/materialized` | — | ❌ Skip (Pulsar needed) |
| `fast_streaming/options_chain` | — | ❌ Skip (Deribit needed) |
| `fast_streaming/kg_context` | — | ❌ Skip (KG infra) |
| `fast_streaming/kg_ingest` | — | ❌ Skip (KG infra) |

### 5.8 Services (2+ files)

| Source Namespace | Test File | Status |
|-----------------|-----------|--------|
| `services/news_crawler` | `services/news_crawler_test.clj` | ✅ Tested — was orphaned |
| `services/pulsar_price_projection` | `services/pulsar_price_projection_test.clj` | ✅ Tested — was orphaned |
| `llm/connector` | `llm/connector_test.clj` | ✅ Tested — was orphaned |
| `services/deribit_*` | — | ❌ Skip (network-dependent) |
| `services/topic_bus` | — | ❌ Skip (Pulsar infra) |
| `services/pulsar_ws_bridge` | — | ❌ Skip (WebSocket infra) |

### 5.9 Browser Integration (4 files)

| Test File | Covers |
|-----------|--------|
| `browser/smoke_test.clj` | Health, static assets, SPA shell |
| `browser/learn_test.clj` | Learn routes, sidebar, lesson nav, code blocks |
| `browser/mel_test.clj` | Mel avatar, drawer, chat input, docs tab |
| `browser/workspace_test.clj` | Panel structure, popout, responsive layout |

### 5.10 ClojureScript UI (17 files)

| Test File | Covers |
|-----------|--------|
| `ui/rf_test.cljs` | Init DB, auth events, streams, trades, Mel, config, strategy IDE |
| `ui/mel_commands_test.cljs` | Slash command parsing, backend dispatch |
| `ui/mel_test.cljs` | Mel assistant behavior |
| `ui/mel_workflows_test.cljs` | Mel workflow flows |
| `ui/mel_payoff_test.cljs` | Payoff slash command |
| `ui/workspace_test.cljs` | Command line normalization |
| `ui/auth_flow_test.cljs` | Auth flow UI |
| `ui/dashboard_test.cljs` | Dashboard component |
| `ui/navigation_test.cljs` | Nav routing |
| `ui/strategy_editor_test.cljs` | Strategy IDE UI |
| `ui/options_live_test.cljs` | Live options chain |
| `ui/options_replay_test.cljs` | Options replay |
| `ui/options_navigation_test.cljs` | Options navigation |
| `ui/fs_chart_test.cljs` | Fast streaming chart |
| `ui/payoff_chart_test.cljs` | Payoff visualization |
| `ui/rf/options_test.cljs` | Options re-frame subs |
| `ui/test_helpers.cljs` | Shared test utilities |

### 5.11 Model Namespaces (10 files)

All model namespaces (`model/*.cljc`) are **data definitions** (specs, schemas, constructors).
They are **indirectly tested** through domain tests that use them. No dedicated test files needed.

---

## 6. Previously Orphaned Tests — Now Registered

These 12 test files existed on disk but were NOT matched by any kaocha suite pattern.
Fixed by switching to wildcard patterns in tests.edn:

| File | Was missing from | Now in suite |
|------|-----------------|-------------|
| `domain/llm_agent_test.clj` | :domain | ✅ :domain |
| `domain/options_backtest_test.clj` | :domain | ✅ :domain |
| `domain/nnm_integration_test.clj` | :domain | ✅ :domain |
| `domain/neural_network_test.clj` | :domain | ✅ :domain |
| `domain/executor_spec_test.clj` | :domain | ✅ :domain |
| `fast_streaming/blob_store_test.clj` | :fs | ✅ :fs |
| `fast_streaming/options_backtest_test.clj` | :fs | ✅ :fs |
| `fast_streaming/knowledge_graph_test.clj` | :fs | ✅ :fs |
| `fast_streaming/e2e_pipeline_test.clj` | :fs | ✅ :fs |
| `components/fs_resolvers_test.clj` | none | ✅ :components |
| `components/resolvers_test.clj` | none | ✅ :components |
| `services/news_crawler_test.clj` | none | ✅ :services |
| `services/pulsar_price_projection_test.clj` | none | ✅ :services |
| `llm/connector_test.clj` | none | ✅ :services |

---

## 7. Surface Mock Tests — Scaffolding

These test files have 1-2 real test cases and `TODO` comments marking where to implement the rest.
They serve as **scaffolding** to prevent regressions and as a map for future test authors.

| Test File | Real Cases | Comment TODOs |
|-----------|-----------|---------------|
| `server/admin_api_test.clj` | 2 | list-status, worker-health |
| `server/docs_api_test.clj` | 2 | serve-known-file, reject-traversal |
| `server/learn_api_test.clj` | 2 | repl-eval, auth-guard |
| `server/portfolio_api_test.clj` | 1 | portfolio-summary |
| `server/opscan_api_test.clj` | 1 | payoff-analysis |
| `server/metrics_test.clj` | 1 | wrap-metrics |
| `domain/opscan_test.clj` | 1 | scan-basic |
| `domain/options_signals_test.clj` | 1 | detect-signal |
| `domain/strategy_executor_test.clj` | 1 | execute-step |
| `domain/rules_engine_test.clj` | 1 | fire-rules |
| `domain/strategy_format_test.clj` | 1 | validate-format |
| `domain/options_test.clj` | 1 | greeks-shape |
| `auth/resolvers_test.clj` | 1 | login-route |
| `fast_streaming/worker_api_test.clj` | 1 | status-endpoint |

---

## 8. Monitoring & Observability Testing

### Health Endpoint
```bash
curl -s http://localhost:8080/health  # → {"status": "ok"}
```
- Verified by `ci-api-smoke.sh` and `browser/smoke_test.clj`

### Metrics Endpoint
```bash
curl -s http://localhost:8080/metrics  # → Prometheus format
```
- Request count, latency histograms, error rates
- Cross-reference: `docs/SRE_OPERATIONS.md` for alert thresholds

### Pipeline Health
- Fast-streaming status at `/api/fast-streaming/status`
- Tests: `fast_streaming/topology_test.clj`, `worker_test.clj`
- Data freshness: compare `last-bar-time` vs current wall clock

### Admin Panel
- Worker controls (start/stop/restart/health) at `/api/admin/*`
- Surface tested in `server/admin_api_test.clj`

---

## 9. Trading-Specific Test Patterns

### Backtest Scenario Tests
```clojure
(let [bars (generate-trending-bars 100)
      bricks (renko/generate-all-bricks bars 100.0)
      signals (map #(signals/detect-signal % config false) (partition-windows bricks))
      trades (execute-signals signals)
      metrics (metrics/calculate-backtest-metrics trades 10000)]
  (is (pos? (:total-return-pct metrics))))
```

### Risk Management Tests
- Stop loss triggers at exact threshold (boundary testing)
- Trailing stop activates, tracks max profit, triggers on pullback
- Multi-level trailing: correct range selection at each profit level
- Position sizing: correct lot calculation from risk budget

### Edge Cases
- Zero PnL (close at entry price)
- `(= 0.0 -0.0)` is false in Clojure — use `(zero? x)` for drawdown
- Very small amounts (dust trades)
- Empty trade list → zero metrics, no division by zero

---

## 10. CI Pipeline

```yaml
Jobs:
  test:      clojure -M:test --fail-fast     # All kaocha suites
  lint:      clj-kondo --lint src test       # Non-blocking
  cljs-test: npm test                        # shadow-cljs :test build
  build:     shadow-cljs release + uberjar   # Depends on test + cljs-test
  docker:    Build + push to GHCR            # Main branch only
```

### Browser Tests in CI (optional)
```yaml
browser-test:
  needs: build
  steps:
    - Setup Chrome + chromedriver
    - clojure -M:test --focus :browser
```

---

## 11. Coverage Statistics

| Category | Source Files | Test Files | Tested | Orphaned→Fixed | Surface | Missing |
|----------|------------|-----------|--------|----------------|---------|---------|
| Domain | 30 | 17 | 14 | 5 | 6 | 3 (P2) |
| Auth | 3 | 4 | 3 | 0 | 1 | 0 |
| Server | 10 | 8 | 3 | 0 | 6 | 0 |
| Options | 4 | 3 | 3 | 0 | 0 | 0 |
| Connectors | 5 | 2 | 2 | 0 | 0 | 0 |
| Components | 9 | 3 | 1 | 2 | 0 | 3 (P3) |
| Fast Stream | 16 | 8 | 3 | 4 | 1 | 0 |
| Services | 11 | 3 | 0 | 3 | 0 | 0 |
| LLM | 1 | 1 | 0 | 1 | 0 | 0 |
| Browser | — | 4 | 4 | 0 | 0 | 0 |
| CLJS UI | ~50 | 17 | 17 | 0 | 0 | 0 |
| **Total** | **~104** | **~70** | **50** | **15** | **14** | **6** |

---

## 12. Key Principle

> Tests are not bureaucracy.
>
> They are the immune system of the codebase —
> they protect against regression, document intent,
> and enable fearless refactoring.
>
> Every untested function is a liability.
> Every tested function is an asset.
>
> Surface tests with TODO comments are better than
> no tests at all — they mark the territory.
