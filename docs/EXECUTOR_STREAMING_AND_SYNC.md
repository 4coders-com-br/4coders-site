# Executor Streaming and Sync

This document describes how market observation becomes local executable truth.

The short version is:

- FS workers watch the world
- Pulsar spreads normalized market state
- local nodes subscribe and checkpoint
- local storage materializes execution-ready datasets
- local execution keeps running even when remote sync degrades

## Core Streaming Story

```text
exchange / external world
  -> FS workers
  -> Pulsar topics
  -> local sync service
  -> local chunk/materialization layer
  -> local Pathom parser
  -> UI / executor / CLI / local jobs
```

The local node is not a passive cache. It is an execution-capable replica with its own checkpoint and replay logic.

## Responsibilities by Layer

### FS workers

They:

- poll or subscribe to exchange state
- normalize payloads
- attach topology and lineage
- publish into topic families

### Pulsar

It:

- fans out market state to nodes
- provides ordering per topic/partition
- supports replay and durable subscriptions
- acts as the world-to-node transport backbone

### Local sync service

It:

- subscribes to required topics
- keeps durable cursors
- batches and persists local chunks
- triggers backfill when gaps are detected
- materializes views needed for local execution

### Local executor

It:

- reads from local materialized state
- runs without waiting on cloud round-trips
- emits local decision and execution events
- syncs those events upstream asynchronously

## Data Classes

The streaming plane should distinguish:

- raw observations
- normalized events
- time-bucketed series
- option chain snapshots
- execution-relevant derived views
- decision and audit events

Not every topic needs the same local retention and not every topic should be mirrored into the browser.

## Implicit Backfill for Live Mode

Live mode should always imply a backfill contract.

When the user presses `Live`:

1. validate local freshness for required symbols and windows
2. backfill missing ranges
3. materialize the execution dataset
4. start the live tail
5. expose sync lag and freshness in the UI

The point is to prevent "live" from meaning "start from an unknown partial local state".

## Sync States

Each series or topic family should expose a sync state such as:

- `:cold`
- `:backfilling`
- `:warm`
- `:live`
- `:stale`
- `:degraded`
- `:offline`

The parameter box and execution terminal should show this explicitly.

## Local Checkpoints

The local sync service should maintain:

- last message ID or equivalent per subscription
- last fully committed chunk per series
- last backfill watermark per requested horizon
- stale windows needing refresh
- replay-safe pending writes

Without durable checkpoints, local-first execution is an illusion.

## Lineage in Streaming

Every materialized local chunk should retain:

- source topic family
- source market
- transform stage
- time window
- cursor or watermark range

This enables:

- re-materialization
- audit
- recovery
- explanation of stale or partial windows

## Online and Offline Behavior

### Online

When connectivity is healthy:

- local node keeps ingesting
- browser stays close to live
- execution syncs upstream quickly

### Offline

When connectivity degrades:

- local node continues serving warm local history
- simulation stays fully available
- optimization and training can continue on local datasets
- live mode may downgrade to paper or guarded mode depending on policy
- pending writes remain in outbox until reconciliation succeeds

## Performance Envelopes

These are planning targets.

| Stage | Planning target |
|---|---|
| worker to broker publish | low-latency streaming path |
| broker to local node propagation | sub-second target for live-relevant topics |
| local materialization lag | seconds, not minutes, for active series |
| local query latency for active windows | interactive UI budget |
| backlog recovery | bounded by local disk and replay rate, not by UI responsiveness |

## Failure Modes

The design should survive:

- broker unavailable
- cloud app healthy but FS degraded
- partial topic availability
- local disk pressure
- stale browser mirror
- local daemon restart during live mode

The correct response is not "the UI still loads". The correct response is:

- surface the degraded state
- preserve the last-good local dataset
- recover via replay and checkpoints

## UI Implications

The Strategy IDE and workspace should expose:

- source freshness
- backfill progress
- current runtime target
- last sync time
- live lag
- lineage / source badge

These are execution inputs, not secondary debugging details.

## Relation to Existing FS Docs

This document focuses on executor-facing streaming theory.

For the current cloud and staging operational shape, use:

- [FastStreaming Cloud DevOps](./FastStreamingCloudDevOps.md)
