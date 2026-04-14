# Executor Platform

This document defines the big executor feature as a local-first platform capability, not just a single "Run" button in the Strategy IDE.

It connects:

- market observation via Fast Streaming workers
- distribution via Pulsar
- local synchronization and durable storage
- strategy execution across simulate, live, optimize, and train modes
- advisory inputs from the Trade Advisor and NN models
- eventual upstream sync for collaboration, audit, and larger-scale jobs

This document is the entry point for the supporting docs:

- [Executor Storage and Local Data](./EXECUTOR_STORAGE_AND_LOCAL_DATA.md)
- [Executor Streaming and Sync](./EXECUTOR_STREAMING_AND_SYNC.md)
- [Executor Processing and Runtime](./EXECUTOR_PROCESSING_AND_RUNTIME.md)
- [Executor Heavy Job Execution](./EXECUTOR_HEAVY_JOB_EXECUTION.md)
- [Executor LLM Advisor and Decision Weighting](./EXECUTOR_LLM_ADVISOR_AND_DECISION_WEIGHTING.md)

Related existing docs:

- [FastStreaming Cloud DevOps](./FastStreamingCloudDevOps.md)
- [LLM Strategy Advisor](./LLM_STRATEGY_ADVISOR.md)
- [UI Copilot and Rules Builder](./UI_COPILOT_AND_RULES.md)

## Product Thesis

The Executor is the feature that turns Little Trader from a UI with charts and experiments into a local-first trading workstation.

The core idea is:

1. Fast Streaming workers watch the world.
2. Pulsar spreads normalized market state to nodes.
3. Each node keeps a durable local data plane.
4. The local executor runs strategies against that data plane.
5. The same executor can run in simulation, live, optimization, or training mode.
6. Online sync is fast, but local execution is not blocked by network dependency.

The source of truth for the UI should not be Fulcro state, re-frame state, or an arbitrary browser cache. The source of truth should be the local data plane exposed through a local Pathom parser.

## Current Code Anchors

The current system already has pieces of this platform:

- Strategy IDE execution toolbar:
  - [`../src/com/little_trader/ui/strategy_editor.cljs`](../src/com/little_trader/ui/strategy_editor.cljs)
- Strategy execution event path:
  - [`../src/com/little_trader/ui/rf/events.cljs`](../src/com/little_trader/ui/rf/events.cljs)
- Server-side strategy execution by loading and evaluating project source:
  - [`../src/com/little_trader/server/strategy_ide_api.clj`](../src/com/little_trader/server/strategy_ide_api.clj)
- Strategy signal aggregation and execution adapters:
  - [`../src/com/little_trader/domain/strategy_executor.clj`](../src/com/little_trader/domain/strategy_executor.clj)
- Clara session lifecycle for deterministic rule processing:
  - [`../src/com/little_trader/domain/convex/engine.clj`](../src/com/little_trader/domain/convex/engine.clj)
- Server Pathom / EQL interface:
  - [`../src/com/little_trader/components/parser.clj`](../src/com/little_trader/components/parser.clj)
  - [`../src/com/little_trader/components/middleware.clj`](../src/com/little_trader/components/middleware.clj)

The missing step is to make these pieces converge on one local execution and storage model.

## Main User Surface

The current Strategy IDE toolbar is a narrow execution strip. It should evolve into a parameter box between the strategy code editor and the execution terminal/charts.

The parameter box should own:

- mode selection
- dataset and market universe selection
- strategy parameters
- optimization ranges
- training configuration
- runtime target
- action buttons

The parameter box should expose these primary actions:

- `Simulate`
- `Live`
- `Optimize`
- `Train`
- `Stop`
- `Resume`

Execution output should remain in the terminal and chart panels, but the parameter box becomes the authoritative execution configuration surface.

## Execution Modes

| Mode | Primary purpose | Data requirement | Runtime default | Notes |
|---|---|---|---|---|
| `:simulate` | sequential replay and validation | local historical slices | browser for small runs, local daemon for larger | deterministic by default |
| `:live` | real-time strategy operation | implicit backfill plus live tail | local daemon | local-first decisions, async sync upstream |
| `:optimize` | parameter sweeps and ranking | many repeated reads over local history | local daemon | browser should submit jobs, not loop locally |
| `:train` | NN / ML feature generation and model training | large feature windows and artifacts | local daemon, remote optional | local is first-class, remote is scale-out |

## End-to-End Architecture

```text
Fast Streaming workers
  -> Pulsar topics
  -> local sync service
  -> local data plane
     -> Datalevin metadata / journal / manifests
     -> chunk store for time series and artifacts
     -> local Pathom parser
  -> UI, CLI, local jobs, and desktop clients
  -> optional remote sync and heavy-job offload
```

## Data Lineage Story

Every output in the executor should be explainable by lineage.

The minimum lineage chain is:

`world event -> normalized market event -> local chunk -> rule/feature input -> signal -> decision -> execution event -> result summary -> sync status`

The executor should retain lineage at five levels:

1. `observation`
   - exchange payloads, snapshots, ticks, derived market state
2. `storage`
   - chunk IDs, manifests, cursors, replication checkpoints
3. `processing`
   - rule facts, strategy params, feature windows, runtime target
4. `decision`
   - rule decision, advisor contribution, NN contribution, confidence, reason
5. `execution`
   - order intent, fills, run summary, sync acknowledgements

## Phase Model

These are planning phases and envelopes, not benchmark guarantees.

| Phase | What happens | Canonical state | Planning cap |
|---|---|---|---|
| `P0 Observe` | workers watch exchanges and external feeds | Pulsar raw and projected topics | high-ingest append-only |
| `P1 Spread` | Pulsar distributes to nodes | Pulsar + topic lineage | sub-second propagation target |
| `P2 Sync` | local node subscribes and checkpoints | local journal + checkpoints | resilient to disconnects and replays |
| `P3 Materialize` | chunks and entity views become queryable | Datalevin + chunk store | low-latency local reads |
| `P4 Execute` | strategies run sequentially or in batches | execution specs + run state | local-first, bounded by runtime |
| `P5 Reconcile` | results, fills, and summaries sync upstream | outbox + acknowledgements | async and resumable |

## Single Local Source of Truth

The platform needs one local data plane that all local consumers can share:

- SPA
- PWA
- Electron renderer
- local CLI
- local notebooks and ML jobs
- background optimization and training jobs

That local source of truth should consist of:

- a local Pathom parser as the API
- a durable local metadata/index store
- a durable local chunk store for large series and artifacts
- a sync journal and checkpoint ledger

The browser can mirror part of that state in IndexedDB or OPFS, but the browser mirror should not be the only local truth for the platform.

## Rules Engine Primacy

The rules engine remains the primary deterministic layer.

The hierarchy should be:

1. rules engine decides the admissible action space
2. NN models add predictive signal
3. Trade Advisor adds advisory weight and risk refinement
4. the execution policy resolves the final action

This preserves:

- deterministic baseline behavior
- explainability
- auditability
- safer live operation

## Runtime Targets

The same execution spec should be runnable on different targets:

- `:browser`
- `:local-daemon`
- `:remote-server`

The target should depend on workload size, data locality, and latency sensitivity, not on which UI happened to launch the run.

## Immediate Design Direction

Near-term implementation should introduce:

- a local Pathom parser for the UI-to-data boundary
- a local data plane service
- a durable execution spec model
- a richer parameter box in the Strategy IDE
- explicit lineage and sync state in execution results

## Non-Goals

This platform is not trying to:

- move all logic into the browser
- make LLM output authoritative over rules
- make remote infrastructure mandatory for local execution
- store all time series as datoms
- collapse every workload into one runtime
