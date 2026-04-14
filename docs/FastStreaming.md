# Fast Streaming Architecture

## Overview

Fast Streaming is Little Trader's real-time market data pipeline built on Apache Pulsar, with S3-compatible blob archival and Datomic materialized views.

It connects exchange APIs to the strategy execution engine through a chain of workers, topics, and storage layers — each carrying provenance metadata so any chart, signal, or execution trace can walk back to its raw source.

## Architecture

```
┌──────────────────┐     ┌────────────────────┐     ┌─────────────────┐
│ Exchange APIs    │     │ FS Worker          │     │ Apache Pulsar   │
│ (Deribit REST)   │────▶│ (polling + derive) │────▶│ (persistent)    │
│                  │     │                    │     │                 │
│ book-summary     │     │ derives:           │     │ topics per      │
│ ticker           │     │ - calls/puts       │     │ topology.edn    │
│ index-price      │     │ - greeks           │     │                 │
└──────────────────┘     │ - iv-surface       │     └────────┬────────┘
                         └────────────────────┘              │
                                                    ┌────────┼────────┐
                                               ┌────▼───┐ ┌──▼──────┐│
                                               │Datomic │ │Blob     ││
                                               │Materi- │ │Store    ││
                                               │alized  │ │(S3/     ││
                                               │Views   │ │MinIO)   ││
                                               └────────┘ └─────────┘│
                                                    │                 │
                                               ┌────▼─────────────────▼──┐
                                               │ Knowledge Graph         │
                                               │ (kg.indicator,          │
                                               │  kg.signal, kg.news,    │
                                               │  kg.llm-opinion)        │
                                               └─────────────────────────┘
```

## Topology Registry

**File**: `src/com/little_trader/fast_streaming/topology.clj`
**Source of truth**: `resources/fast-streaming/topology.edn`

The topology is the single source of truth for all Pulsar topics. It is immutable at startup — adding a new topic means editing topology.edn and restarting.

### Capabilities

- **Topic resolution**: EDN id → full Pulsar topic URI (`persistent://public/default/{topic-name}`)
- **Lineage graph**: for any topic, walk back to its raw sources
- **Metadata envelope**: every message carries `_fs` provenance metadata so the UI can display source + transforms on any chart
- **Topic lifecycle**: create / list / validate against the EDN

### Key Functions

| Function | Purpose |
|----------|---------|
| `load-topology` | Read and parse topology.edn from classpath |
| `build-topic-index` | Flat `{topic-id → topic-def}` map from nested topology |
| `resolve-topic-uri` | Topic id → full Pulsar URI |
| `all-topic-uris` | Map of all topic ids to their URIs |
| `lineage-chain` | Walk back from any topic to its raw data sources |

## Worker

**File**: `src/com/little_trader/fast_streaming/worker.clj`
**Run**: `clj -M:run-fs-worker` or `java -jar fast-streaming-worker.jar`

Standalone container entry point that:

1. Loads topology.edn
2. Creates a Pulsar producer per source topic
3. Schedules REST polling for each source (Deribit book-summary)
4. On each poll: derives calls/puts/greeks/iv-surface and publishes to derived topics with `_fs` metadata envelope
5. Blocks until SIGTERM

## Blob Store

**File**: `src/com/little_trader/fast_streaming/blob_store.clj`

S3-compatible storage with tagged naming. Works with MinIO (local dev), AWS S3, GCS, or R2 — switching is one environment variable change.

### Key Naming Convention

```
{topic-id}/{YYYY}/{MM}/{DD}/{HH}-{seq}.json.gz
```

Example: `market-data.options.btc-usdt.calls.1h/2026/03/29/03-0001.json.gz`

### Object Tags

Every object is tagged with metadata for portability and lineage:

| Tag | Description |
|-----|-------------|
| `x-fs-topic-id` | Source topic identifier |
| `x-fs-domain` | Market domain (e.g. options, spot) |
| `x-fs-asset` | Asset pair (e.g. BTC-USDT) |
| `x-fs-timeframe` | Candle timeframe |
| `x-fs-lineage-sources` | Upstream data sources |
| `x-fs-lineage-transforms` | Applied transformations |
| `x-fs-captured-at` | Capture timestamp |

Migration is simple: copy the bucket. Keys and tags carry all context.

### Key Functions

| Function | Purpose |
|----------|---------|
| `create-client` | S3 client factory (reads BLOB_ENDPOINT, BLOB_ACCESS_KEY, etc.) |
| `put-object` | Write gzipped JSON to S3 |
| `get-object` | Read and decompress from S3 |
| `list-objects` | Paginated listing by prefix |

## Materialized Views

**File**: `src/com/little_trader/fast_streaming/materialized.clj`

Pulsar → Datomic sync. Local-first cache of key market metrics. Reads are fast (Datomic), writes come from Pulsar topic consumers.

### Schema

- **`fs.state/*`**: Key-value state entries (key, value, value-edn, updated-at)
- **`fs.balance/*`**: Balance snapshots (currency, total, available, equity, margin, timestamp, source)

### Key Functions

| Function | Purpose |
|----------|---------|
| `install-materialized-schema!` | Transact schema to Datomic |
| `upsert-state!` | Write/update state entry |
| `get-state` / `get-all-state` | Read state entries |
| `record-balance!` | Write balance snapshot |
| `get-latest-balance` | Latest balance for currency |
| `get-balance-history` | Historical balance series |

## Knowledge Graph

**File**: `src/com/little_trader/fast_streaming/knowledge_graph.clj`

A Noumenon-inspired Datomic knowledge layer for trading data. Every LLM interface in the system (UI assistant, trading agent, Clara rules) queries this graph for grounded context instead of building prompts from scratch.

### Entity Types

| Entity | Purpose |
|--------|---------|
| `kg.indicator` | Technical indicator values from FastStreaming |
| `kg.signal` | Strategy signals (Clara rules, backtest, manual) |
| `kg.news` | Normalized news items |
| `kg.llm-opinion` | LLM agent responses (for consensus tracking) |
| `kg.user-input` | User chat messages and strategy edits |
| `kg.regime` | Market regime classifications from Clara |
| `kg.rule-firing` | Clara rules audit trail |

## Options Chain

**File**: `src/com/little_trader/fast_streaming/options_chain.clj`

Derives calls, puts, greeks, and IV surface from Deribit book summary data. This is the primary derived data source for options strategies.

## History & Backfill

**Files**: `src/com/little_trader/fast_streaming/history.clj`, `backfill.clj`

Replays historical data from the blob store for backtesting. The history module reads archived chunks and replays them as if they were live, maintaining the same provenance metadata.

## Integration with Strategy Executor

Strategies declare their data source in `resources/strategy.edn`:

```clojure
{:stream {:source :fast-streaming
          :mode :historical+live}}
```

The executor fetches bars/bricks through three paths:

1. **History module** — for backfill of missing ranges
2. **Blob store** — for archived data retrieval
3. **Pulsar consumer** — for live data subscription

See also: [Executor Streaming and Sync](docs/EXECUTOR_STREAMING_AND_SYNC.md)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PULSAR_SERVICE_URL` | `pulsar://pulsar:6650` | Pulsar broker URL |
| `DERIBIT_TESTNET` | `true` | Use Deribit testnet |
| `DERIBIT_OPTIONS_CURRENCY` | `BTC` | Options currency |
| `FS_TOPOLOGY_PATH` | `fast-streaming/topology.edn` | Topology file path |
| `BLOB_ENDPOINT` | `http://minio:9000` | S3-compatible endpoint |
| `BLOB_ACCESS_KEY` | `littletrader` | S3 access key |
| `BLOB_SECRET_KEY` | `littletrader123` | S3 secret key |
| `BLOB_REGION` | `us-east-1` | S3 region |

## Related Documentation

- [Executor Platform](docs/EXECUTOR_PLATFORM.md) — how Fast Streaming feeds into the executor
- [Executor Streaming and Sync](docs/EXECUTOR_STREAMING_AND_SYNC.md) — sync protocol details
- [Executor Storage and Local Data](docs/EXECUTOR_STORAGE_AND_LOCAL_DATA.md) — local data plane
