# Executor Processing and Runtime

This document defines how strategies should execute, where they should execute, and why the rules engine remains primary.

## Current Runtime Shape

Today, the repo has three important processing anchors:

- a server-side strategy execution path that evaluates project source dynamically
- a deterministic Clara-based rules engine
- a higher-level strategy executor that can aggregate signals from multiple sources

Code anchors:

- [`../src/com/little_trader/server/strategy_ide_api.clj`](../src/com/little_trader/server/strategy_ide_api.clj)
- [`../src/com/little_trader/domain/convex/engine.clj`](../src/com/little_trader/domain/convex/engine.clj)
- [`../src/com/little_trader/domain/strategy_executor.clj`](../src/com/little_trader/domain/strategy_executor.clj)

The target architecture should preserve that separation, but formalize it.

## Rules Engine First

The processing hierarchy should be:

1. deterministic rules engine
2. model-driven signal sources
3. advisor-driven policy refinement
4. execution adapter

The rules engine is primary because it gives:

- deterministic state transitions
- explainable decisions
- easier regression testing
- stronger audit trail

The Clara session lifecycle already matches this direction well:

- create session
- insert facts sequentially
- fire rules
- query strategy state and actionable signals

## Sequential Processing Model

Strategies should process input sequentially in all modes.

That means:

- one ordered stream of bars, bricks, or derived events per strategy instance
- one evolving strategy state
- one decision packet per processing step

This matters in:

- backtesting
- live mode
- optimization
- training feature extraction

Even when jobs are parallelized, each individual run is still sequential internally.

## Runtime Targets

The same execution spec should be runnable on one of three targets:

### `:browser`

Use for:

- lightweight simulation
- chart-driven replay
- parameter tweaking
- inspectable local experiments

Keep browser workloads bounded. The browser should not become the default home for large optimization or training jobs.

### `:local-daemon`

Use for:

- live mode
- serious optimization
- local training
- long-running backfills
- resumable jobs

This should be the main runtime for local-first execution.

### `:remote-server`

Use for:

- larger shared workloads
- burst capacity
- team-scale execution pools
- jobs that exceed local CPU, memory, or thermal budgets

Remote is scale-out, not the baseline.

## Execution Spec

Every action from the parameter box should become an explicit execution spec.

Example:

```clojure
{:execution/id ...
 :strategy/id ...
 :strategy/version-hash ...
 :mode :simulate
 :runtime-target :local-daemon
 :dataset {:symbols ["BTC-PERPETUAL"]
           :timeframe :1m
           :window {:from ... :to ...}}
 :params {:brick-size 35.0
          :slippage-bps 12.0}
 :policy {:aggregation-method :weighted
          :min-confidence 0.60}}
```

This makes execution:

- reproducible
- auditable
- resumable
- schedulable

## Parameter Box

The current Strategy IDE toolbar should evolve into a richer parameter box between:

- the strategy code editor
- the execution terminal and charts

It should contain:

- execution mode
- symbol and timeframe
- price model
- strategy parameters
- optimization ranges
- training parameters
- runtime target
- sync/freshness badges
- action buttons

Action buttons:

- `Simulate`
- `Live`
- `Optimize`
- `Train`
- `Stop`
- `Resume`

## Where Squint Fits

The main SPA should remain on `shadow-cljs` and the normal CLJS toolchain. The current app depends on Fulcro, Pathom, re-frame, and the broader CLJS ecosystem, and that is the right foundation for the main interactive client.

Squint is interesting for a different problem space.

From the Squint README:

- it is a light-weight CLJS dialect
- it targets JS with smaller output
- it uses built-in JS data structures
- it works well with ES modules
- it is positioned for places where startup time, interop, or bundle size matter
- it is not intended as a full replacement for ClojureScript
- it is still a moving project and should be adopted selectively

That makes Squint attractive for:

- lightweight sidecar strategy transforms
- browser-safe helper modules
- Electron or Node-side scriptable tooling
- small execution helpers near JS-heavy runtimes
- edge and worker-style utilities

It is less attractive for:

- replacing the main Fulcro app
- large CLJS modules that expect standard CLJS semantics
- complex persistent client state modeling

In short:

- main app: keep `shadow-cljs`
- local platform and CLI: keep JVM Clojure first
- lightweight JS-facing execution helpers: consider Squint

## Why Squint Is Worth Considering

Squint is worth introducing selectively if we want:

- smaller JS-side helper bundles
- easier JS ecosystem interop
- ES-module friendly output
- faster startup for small processing tasks

Good candidates:

- parameter-box local validators
- compact feature calculators
- renderer-side data transforms
- Electron renderer helpers
- scripting utilities around execution specs

Bad candidates:

- the whole Pathom/Fulcro application
- the canonical rules engine
- the canonical local data plane

## Training Runtime

Training should be treated as a first-class executor mode, not a separate hidden subsystem.

The repo already has:

- feature-generation logic in `cljc`
- neural net training code in JVM namespaces

That means training is partially portable but not yet genuinely client-first.

The right trajectory is:

- keep small feature inspection in the browser
- run real training in the local daemon first
- offload only when scale requires it

## Optimization Runtime

Optimization is fundamentally a job system:

- many execution specs
- repeated local range reads
- repeated sequential runs
- ranking and artifact generation

The browser should launch and inspect optimization, but the local daemon should perform it by default.

## Local CLI and REPL

Local arbitrary execution should stay first-class.

The repo already has:

- JVM nREPL support
- browser `cljs-repl` support
- guarded server-side eval for admin/non-production workflows

The architecture should keep:

- CLI and local REPL as power-user surfaces
- product UI execution as bounded, explicit executor actions

Those are different responsibilities and should remain distinct.

## Processing Principle

The main processing principle is:

`deterministic rules and durable local data first, model and advisor enhancements second, remote scale-out third`

## Reference

Squint project:

- https://github.com/squint-cljs/squint
