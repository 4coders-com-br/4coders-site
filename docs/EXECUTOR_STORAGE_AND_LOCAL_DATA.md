# Executor Storage and Local Data

This document defines the local data plane for the Executor.

The storage problem is not only "where do we save bars". It is:

- how the SPA reads durable state
- how offline mode keeps working
- how the executor reads and writes sequentially
- how optimization and training reuse the same data without duplication
- how the system preserves lineage and sync state

## Storage Thesis

Use different stores for different data shapes.

- `Datalevin` stores metadata, manifests, journals, indexes, and execution state.
- `Chunk storage` stores time series and artifacts.
- `OPFS` stores browser-side mirrors of large chunks when the UI runs in the browser sandbox.
- `IndexedDB` stores structured browser-side metadata and small cached views.
- `localStorage` stores only tiny boot/session preferences.

The platform should not try to force every byte into one database.

## Canonical Local Storage Layers

### Layer 1: session and UI hints

Use:

- route hints
- UI preferences
- tiny auth/session hints

Do not use:

- bars
- strategy runs
- optimization outputs
- training data

### Layer 2: browser durable cache

Use:

- recent entity cache
- last-known execution specs
- small manifests
- pending UI-side operations

Good fit:

- IndexedDB
- OPFS for larger browser-local chunks

### Layer 3: local platform store

Use:

- strategy entities
- execution specs
- job metadata
- chunk manifests
- sync cursors
- outbox and acknowledgement ledger
- audit metadata

Good fit:

- Datalevin

### Layer 4: local chunk store

Use:

- OHLCV chunks
- option chain snapshots
- IV surfaces
- replay traces
- feature windows
- optimizer result packs
- training datasets
- model checkpoints

Good fit:

- file-oriented local storage on disk
- browser mirror via OPFS when needed

## Why Datalevin Here

Datalevin is a good initial local platform store because it fits the embedded local-daemon model:

- Datalog query model
- embedded/local durability
- good metadata and index story
- suitable for manifests, execution state, and sync journals

Datalevin should index the world, not physically contain every high-volume series.

That means:

- store datoms for entities and manifests
- store references to large chunks
- keep range-heavy numerical data out of the main datalog index

## Why Not Store Large Time Series as Datoms

Dense time series have very different access patterns from strategy metadata.

Typical series workloads are:

- range scans by time
- chunk append
- compression
- retention management
- model feature extraction

Typical datalog workloads are:

- identity lookups
- joins
- graph traversal
- query composition
- lineage lookup

Putting all bars, ticks, replay traces, and features directly into the datalog store would hurt:

- write amplification
- index growth
- scan efficiency
- retention cost
- browser mirroring complexity

## OPFS in This Architecture

OPFS is useful, but it is not the platform center.

Use OPFS for:

- browser-side time-series chunk cache
- replay artifact cache
- training window cache
- local model checkpoint mirror

Do not use OPFS as the only local truth for:

- CLI jobs
- local daemon services
- ML tooling outside the renderer
- cross-app local coordination

That is why the canonical architecture is:

- local daemon + Datalevin + real chunk store
- browser mirror via IndexedDB and OPFS

## Browser, PWA, Electron, Desktop

| Runtime | Local metadata | Large local chunks | Best role |
|---|---|---|---|
| Browser SPA | IndexedDB | OPFS | portable local-first UI cache |
| PWA | IndexedDB | OPFS | same as SPA with better app UX |
| Electron renderer | IndexedDB | OPFS | strong desktop UI cache layer |
| Local daemon / CLI | Datalevin | filesystem chunk store | canonical local platform store |

Electron does not remove the need for the local daemon model if the goal is to support:

- CLI reuse
- ML jobs
- local notebooks
- offline execution services

## Core Local Entities

The local platform store should track at least:

- `instrument`
- `series`
- `chunk`
- `snapshot`
- `strategy`
- `strategy-version`
- `execution-spec`
- `execution-run`
- `optimization-batch`
- `training-batch`
- `advisor-policy`
- `sync-cursor`
- `outbox-entry`
- `audit-entry`

Example manifest shape:

```clojure
{:series/id "btc.ohlcv.1m"
 :series/kind :ohlcv
 :series/symbol "BTC-PERPETUAL"
 :series/timeframe :1m
 :series/chunks
 [{:chunk/id "btc-1m-2026-04-01"
   :chunk/start-ts 1775001600000
   :chunk/end-ts 1775087999999
   :chunk/rows 1440
   :chunk/location :local-opfs
   :chunk/lineage [:fs.price.ohlcv.1m]}]}
```

## Performance Envelopes

These are planning envelopes, not measured guarantees.

| Layer | Data class | Planning envelope |
|---|---|---|
| renderer memory | active chart and terminal state | tens of MB |
| browser durable cache | recent local working set | low single-digit GB practical envelope |
| Datalevin local metadata | manifests, runs, cursors, audit metadata | millions of small facts, not raw tick archive |
| local chunk store | historical bars and artifacts | tens to hundreds of GB, machine-dependent |
| remote archive | long retention and team-scale history | effectively larger, slower, cheaper per GB |

## Sync Ledger

The local platform store should track:

- last Pulsar message checkpoint per topic family
- last chunk persisted per series
- pending upstream writes
- upstream acknowledgements
- stale windows requiring refill

This ledger is what lets the system recover after:

- browser refresh
- laptop sleep
- network interruption
- daemon restart
- staging or cloud outage

## Retention Strategy

Keep different retention horizons for different data classes:

- hot local replay windows
- warm recent market history
- cold large archive
- durable small metadata

Suggested policy shape:

- keep metadata much longer than payload chunks
- compact low-value logs into summaries
- keep lineage pointers after payload compaction
- allow artifacts to be re-generated from source chunks when possible

## Fulcro / Pathom Fit

Fulcro should not talk to storage backends directly.

The UI should ask EQL through a local Pathom parser, and that parser should resolve:

- entities from Datalevin
- ranges from chunk storage
- execution state from the local journal
- sync and freshness state from checkpoints

That keeps:

- one contract for UI reads
- one contract for UI writes
- one place to evolve offline and online behavior
