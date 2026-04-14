# Strategy Execution Engine

## Overview

The Strategy Execution Engine is the core module that runs trading strategies against market data. It sits between the data feed (bars, ticks) and the execution adapters (backtest, paper, production), aggregating signals from multiple sources before making trading decisions.

For the platform-level architecture (local-first storage, streaming sync, heavy jobs), see:
- [Executor Platform](./EXECUTOR_PLATFORM.md)
- [Executor Implementation Plan](./EXECUTOR_IMPLEMENTATION_PLAN.md)

This document focuses on the **current working execution flow** as implemented.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FEED (External)                            │
│                   Bars, Ticks, Market Data                              │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      STRATEGY EXECUTOR                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │Clara Rules  │  │Neural Net   │  │LLM Agent    │  │Technical      │  │
│  │Engine       │  │Model        │  │             │  │Indicators     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────┬───────┘  │
│         │                │                │                  │          │
│         ▼                ▼                ▼                  ▼          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     SIGNAL AGGREGATOR                           │    │
│  │  Unanimous · Majority · Weighted · First-Match · Priority-Chain │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                         │
│                               ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     DECISION MAKER                              │    │
│  │  Final signal with confidence threshold                         │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                         │
│                               ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        AUDIT LOGGER                             │    │
│  │  Records all decisions with configurable resolution             │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      EXECUTION ADAPTERS                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │Backtest     │  │Paper        │  │MT5 Bridge   │  │API Broker   │   │
│  │Engine       │  │Trading      │  │             │  │             │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

**File**: `src/com/little_trader/domain/strategy_executor.clj`

## Signal Sources

Each source implements the `SignalSource` protocol with two methods: `source-id` and `generate-signal`.

| Source | Record | Description |
|--------|--------|-------------|
| Clara Rules | `ClaraRulesSource` | Session-based rules evaluation via Clara Rules engine |
| Neural Network | `NeuralNetworkSource` | NN model predictions with configurable confidence threshold |
| LLM Agent | `LLMAgentSource` | LLM consultation — simulated or live, with prepared agent context |
| Technical Indicators | `TechnicalIndicatorSource` | Traditional signal detection from brick/bar patterns |
| MCP | `MCPSource` | MCP tool-based signal generation for agentic strategies |

## Signal Aggregation

Five aggregation methods, configured via `:aggregation-method` in strategy config:

| Method | Function | Logic |
|--------|----------|-------|
| `:unanimous` | `aggregate-unanimous` | All sources must agree on direction |
| `:majority` | `aggregate-majority` | Direction with >50% of votes wins |
| `:weighted` | `aggregate-weighted` | Configurable source weights (default: Clara 0.4, NN 0.3, LLM 0.2, Tech 0.1) |
| `:first-match` | `aggregate-first-match` | First signal above confidence threshold |
| `:priority-chain` | `aggregate-priority-chain` | Try sources in priority order until one fires |

For more on advisor weighting, see [Executor LLM Advisor and Decision Weighting](./EXECUTOR_LLM_ADVISOR_AND_DECISION_WEIGHTING.md).

## Execution Adapters

| Adapter | Record | Behavior |
|---------|--------|----------|
| Backtest | `BacktestAdapter` | Instant fills, position tracking in atom |
| Paper Trading | `PaperTradingAdapter` | Simulated 50-150ms latency, same fill logic |
| Production | (explicit) | Must supply a live adapter — no default |

Factory: `create-adapter-for-mode` dispatches on `:backtest`, `:paper`, `:production`.

## Execution Spec Contract

**File**: `src/com/little_trader/domain/executor_spec.cljc`

The shared execution request contract normalizes parameters across CLJ and CLJS:

- **Modes**: `:simulate`, `:live`, `:optimize`, `:train` (legacy `:backtest` → `:simulate`, `:paper` → `:live`)
- **Runtime targets**: `:browser`, `:local-daemon`, `:remote-server`
- **Timeframes**: `:tick`, `:1m`, `:5m`, `:15m`, `:30m`, `:1h`, `:4h`, `:1d`, `:1w`, `:1M`
- **Price models**: `:ohlc`, `:renko`, `:options-surface`, `:derived-factors`

`build-execution-spec` merges project defaults, strategy config, current state, and user overrides into a normalized request.

## IDE Execution Pipeline

**File**: `src/com/little_trader/server/strategy_ide_api.clj`

When the user clicks "Run" in the Strategy IDE, the server-side execution flow is:

| Stage | What Happens |
|-------|-------------|
| 1. Load Source | Read strategy `.cljc` from S3 bucket |
| 2. Parse | `read-string` to get Clojure forms |
| 3. Namespace Setup | Create temporary ns, rewrite `(ns ...)` form |
| 4. Eval | Evaluate all forms into the temporary namespace |
| 5. Resolve | Find `init-state` and `on-bar` functions via `ns-resolve` |
| 6. Build Input | Convert bars or bricks to input series |
| 7. Execute | `reduce` over bars: `(on-bar-fn state bar)` per bar |
| 8. Collect | Accumulate trades, signals, equity curve, and log entries |
| 9. Summarize | Compute metrics: total PnL, win rate, profit factor, max drawdown |
| 10. Cleanup | Remove temporary namespace |

The execution produces structured log entries at configurable verbosity (TRACE → ERROR), with state transitions, signals, and trade events clearly marked.

## Audit System

- Resolution levels: `:tick`, `:bar`, `:signal`, `:trade`, `:summary`
- Buffer: configurable size (default 1000), auto-flush with optional persist-fn
- Query: `get-audit-entries` with optional `:strategy-id`, `:symbol`, `:since`, `:limit` filters
- Each entry records: market state, source signals, aggregated decision, confidence, processing time

## S3 Strategy Projects

Each strategy is a self-contained Clojure project stored in S3 (MinIO):

```
{project-name}/
├── deps.edn                      — Clojure dependencies
├── src/strategy/core.cljc         — Primary entry point (must define init-state, on-bar)
├── src/strategy/rules.cljc        — Clara Rules definitions (optional)
├── src/strategy/signals.cljc      — Signal helpers (optional)
├── resources/strategy.edn         — Runtime metadata (chart, stream, execution config)
├── config.edn                     — Project configuration
└── README.md                      — Project documentation
```

### Strategy Protocol

Projects implement (or are expected to export):

```clojure
(defn init-state [config] ...)   ;; → initial state map
(defn on-bar [state bar] ...)     ;; → next state map (with :trades, :signals, :events)
(defn summary [final-state] ...)  ;; → optional summary metrics
```

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/strategy-ide/projects` | List all projects |
| POST | `/api/strategy-ide/project` | Create from template |
| GET | `/api/strategy-ide/tree/:project` | File listing |
| GET | `/api/strategy-ide/file` | Read file content |
| PUT | `/api/strategy-ide/file` | Write file content |
| POST | `/api/strategy-ide/execute` | Run strategy |
| GET | `/api/strategy-ide/config/:project` | Read project config |

## MCP Integration

**File**: `src/com/little_trader/domain/mcp.clj`

Built-in MCP tools registered for strategy execution and LLM interaction:

| Tool | Purpose |
|------|---------|
| `RunBacktestTool` | Quick backtest on simulated bars with Renko detection |
| `AnalyzeTradeTool` | Analyze trade performance metrics |
| `SearchCodeTool` | Search project code |
| `GitOpsTool` | Git operations for strategy versioning |

Tools exposed via:
- `GET /api/strategy-ide/mcp/status` — health and tool inventory
- `GET /api/strategy-ide/mcp/tools` — list all tools with schemas
- `POST /api/strategy-ide/mcp/execute` — execute a tool by id with args

## Related Documentation

- [Executor Platform](./EXECUTOR_PLATFORM.md) — platform vision
- [Executor Processing and Runtime](./EXECUTOR_PROCESSING_AND_RUNTIME.md) — runtime details
- [Executor Heavy Job Execution](./EXECUTOR_HEAVY_JOB_EXECUTION.md) — optimization and training
- [Fast Streaming Architecture](../FastStreaming.md) — data pipeline
- [S3 Strategy Projects](../features/S3Strategy.md) — original feature spec
