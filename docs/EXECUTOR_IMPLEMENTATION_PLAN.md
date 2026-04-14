# Executor Implementation Plan

Current status: April 3, 2026.

This document is the multi-session implementation plan for the Executor platform.

It is intentionally written for incremental delivery across several sessions, with:

- one thin vertical slice per session
- automated tests at the end of each slice
- a short manual validation step before moving on
- explicit parallel work lanes for sub-agents or parallel contributors

The platform-level architecture is described in:

- [Executor Platform](./EXECUTOR_PLATFORM.md)
- [Executor Storage and Local Data](./EXECUTOR_STORAGE_AND_LOCAL_DATA.md)
- [Executor Streaming and Sync](./EXECUTOR_STREAMING_AND_SYNC.md)
- [Executor Processing and Runtime](./EXECUTOR_PROCESSING_AND_RUNTIME.md)
- [Executor Heavy Job Execution](./EXECUTOR_HEAVY_JOB_EXECUTION.md)
- [Executor LLM Advisor and Decision Weighting](./EXECUTOR_LLM_ADVISOR_AND_DECISION_WEIGHTING.md)

## Working Rules

Each session should finish with:

1. code landed
2. automated tests for the slice
3. one short manual validation checklist
4. a documented stop point for the next session

Each session should avoid mixing:

- foundational contracts
- UI expansion
- storage engine rollout
- live execution semantics

unless the session explicitly owns that integration.

## Session Roadmap

### Session 0: Executor Contract Foundation

Status:

- in progress in this session

Goals:

- add a shared `ExecutionSpec` contract
- seed Strategy IDE state from a shared executor contract
- make mode/runtime part of the IDE execution state
- keep the current server execution path working

Primary files:

- `src/com/little_trader/domain/executor_spec.cljc`
- `src/com/little_trader/ui/rf/events.cljs`
- `src/com/little_trader/ui/rf/core.cljs`
- `src/com/little_trader/ui/strategy_editor.cljs`

Automated tests:

- contract normalization tests
- Strategy IDE state wiring tests

Manual validation:

1. open `#/strategy-editor`
2. select a project
3. confirm mode/runtime selectors are visible
4. confirm config load seeds the execution inputs
5. run the existing execution path and verify the result pane still works

Step-by-step execution:

1. Land the shared `ExecutionSpec` contract in `src/com/little_trader/domain/executor_spec.cljc`.
2. Run the contract test namespace before touching UI wiring.
3. Wire Strategy IDE state to seed and mutate `:execution-spec`.
4. Run the focused `cljs` re-frame tests before adjusting any visual copy or layout.
5. Lift the execution toolbar to read mode/runtime/bar inputs from the shared spec.
6. Run the same focused `cljs` tests again after the UI wiring change.
7. Perform the manual validation checklist above in the browser.
8. Stop the session only after documenting test results and the next slice boundary.

Parallel lanes:

- Lane A:
  - executor contract namespace
  - file owner: `src/com/little_trader/domain/executor_spec.cljc`
- Lane B:
  - Strategy IDE state wiring
  - file owner: `src/com/little_trader/ui/rf/events.cljs`
- Lane C:
  - toolbar UI lift
  - file owner: `src/com/little_trader/ui/strategy_editor.cljs`

### Session 1: Parameter Box v1

Goals:

- replace the narrow execution toolbar with a parameter box
- expose mode, dataset, symbol, timeframe, price model, params, and runtime target
- add action buttons:
  - `Simulate`
  - `Live`
  - `Optimize`
  - `Train`

Automated tests:

- UI state and selector tests
- parameter serialization tests

Manual validation:

1. change parameters in the box
2. refresh the route or navigate away/back
3. confirm the box restores expected state
4. confirm the button labels and badges match the chosen mode

Parallel lanes:

- Lane A: parameter-box layout and component state
- Lane B: re-frame wiring and subscriptions
- Lane C: serialization and test coverage

### Session 2: Local Pathom Parser Skeleton

Goals:

- introduce the local Pathom parser as the UI-to-data boundary
- define the first local EQL contract for executor reads and writes
- keep the remote server path as fallback

Automated tests:

- parser read tests
- mutation contract tests

Manual validation:

1. inspect an execution spec through the local parser
2. confirm the UI can read from the local parser without changing the screen flow

Parallel lanes:

- Lane A: local parser namespace and resolvers
- Lane B: UI adapter/fallback wiring
- Lane C: test fixtures and contract examples

### Session 3: Local Data Plane v1

Goals:

- add the local daemon-facing storage contract
- introduce Datalevin metadata/index/journal support
- define chunk manifests for large series and artifacts

Automated tests:

- local metadata persistence tests
- manifest and checkpoint tests

Manual validation:

1. ingest a small local series
2. restart the local runtime
3. confirm the series manifest and cursors survive restart

Parallel lanes:

- Lane A: Datalevin adapter
- Lane B: manifest/chunk metadata model
- Lane C: local parser integration

### Session 4: Streaming Sync and Backfill

Goals:

- subscribe local nodes to Fast Streaming / Pulsar outputs
- add checkpointed sync state
- implement implicit backfill before live execution

Automated tests:

- sync cursor tests
- backfill detection tests
- stale/fresh status tests

Manual validation:

1. disconnect and reconnect the local runtime
2. confirm backfill resumes and execution freshness badges recover

Parallel lanes:

- Lane A: sync service and checkpoints
- Lane B: local freshness/status projection
- Lane C: UI visibility for sync state

### Session 5: Live and Simulate Runtime Split

Goals:

- separate `simulate` and `live` runtime handling explicitly
- keep sequential processing deterministic
- persist run summaries and audit outputs locally

Automated tests:

- live mode transition tests
- simulation replay tests
- audit emission tests

Manual validation:

1. run a simulate flow
2. start a live flow with implicit backfill
3. confirm state transitions, sync lag badges, and audit output

Parallel lanes:

- Lane A: runtime protocol
- Lane B: audit and run-state persistence
- Lane C: UI/terminal output polish

### Session 6: Optimization Jobs

Goals:

- introduce optimization as a job system
- add range inputs to the parameter box
- move heavy optimization off the interactive renderer by default

Automated tests:

- job creation tests
- checkpoint/resume tests
- top-result summary tests

Manual validation:

1. submit a small optimization range
2. inspect progress and partial results
3. stop and resume the job

Parallel lanes:

- Lane A: job model and persistence
- Lane B: optimization runner integration
- Lane C: parameter box range UI

### Session 7: Training Jobs

Goals:

- make training a first-class executor mode
- create training dataset manifests and model artifact manifests
- support local training first, remote optional

Automated tests:

- training spec tests
- artifact manifest tests
- training progress projection tests

Manual validation:

1. submit a small training run
2. confirm progress, metrics, and artifact persistence
3. inspect model metadata from the UI

Parallel lanes:

- Lane A: training job model
- Lane B: artifact persistence
- Lane C: UI panels and progress views

### Session 8: Trade Advisor Weighting in Execution

Goals:

- integrate advisor weighting into execution decisions explicitly
- expose aggregation method and weights in the parameter box
- keep rules engine primary

Automated tests:

- weighted aggregation tests
- fail-closed advisor tests
- decision packet structure tests

Manual validation:

1. compare conservative vs balanced weighting
2. confirm the final decision packet exposes rules, NN, advisor, and final decision
3. confirm unsafe advisor output falls back safely

Parallel lanes:

- Lane A: aggregation and decision packet
- Lane B: advisor configuration and UI controls
- Lane C: audit and lineage visibility

## Test Strategy Between Sessions

Each session must include both:

- automated verification
- one short manual validation checklist

Recommended automated split:

- `clj` tests for domain contracts, storage, sync, and heavy-job logic
- `cljs` tests for re-frame state and UI contracts

Recommended manual split:

- one validation focused on the screen flow
- one validation focused on data durability or recovery

Current Session 0 checkpoints:

1. Contract test passes.
2. Focused Strategy IDE state tests pass.
3. Full frontend node test run is recorded as either:
   - clean, or
   - blocked by pre-existing unrelated failures called out in the session summary.
4. Manual browser validation is completed by the user before Session 1 expands the parameter box.

## Parallelization Policy

Sub-agents or parallel contributors should work only on disjoint write sets.

Good split examples:

- one agent writes domain contracts
- one agent writes UI wiring
- one agent writes tests
- one agent writes docs or migration notes

Avoid parallel edits on the same file unless there is a planned merge point.

## Current Session Stop Point

The current session should stop after:

- the shared `ExecutionSpec` contract is landed
- Strategy IDE state is seeded from it
- the first tests pass
- the manual validation checklist for Session 0 is documented in the final response

The next session should start from Session 1 unless this session finishes enough of the parameter box to absorb part of that work.
