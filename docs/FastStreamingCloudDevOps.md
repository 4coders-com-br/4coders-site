# FastStreaming Cloud DevOps

Current implementation status: April 3, 2026.

This document explains the FastStreaming feature set, the local and GCP deployment shape, the operational commands, the healthcheck flow, and the current resolver caveats that matter when the UI says "FS" but the backend is still partially bypassing cloud FS.

## TL;DR

### Initial operation

1. Provision the shared staging infra VM:

```bash
export GCP_PROJECT_ID=little-trader
export GCP_REGION=us-central1
export GCP_ZONE=us-central1-a
export POSTGRES_PASSWORD='your-password'
./cloud-run/setup-infra.sh
```

2. Add the emitted GitHub secrets:

- `DATOMIC_URI_STAGING`
- `PULSAR_SERVICE_URL_STAGING`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- optional Deribit secrets if you want the app-side Deribit fetcher enabled

3. Deploy staging Cloud Run and refresh the dedicated FS worker VM:

- Push to `main`, or
- run the `Deploy to Cloud Run` GitHub Actions workflow for `staging`

4. Verify the app, broker, and worker separately:

```bash
curl -fsS https://little-trader-staging-<hash>-uc.a.run.app/health
gcloud compute ssh datomic-transactor --zone=us-central1-a --command="cd ~/infra && sudo docker compose -f docker-compose.infra.yml ps"
gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="cd ~/fs-worker && sudo docker compose -f docker-compose.worker.yml ps"
gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="curl -fsS http://127.0.0.1:8090/health"
gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="curl -fsS http://127.0.0.1:8090/status"
```

5. If the UI still looks healthy but FS data is missing, inspect worker logs and resolver behavior. The app health endpoint only proves the Ring server is up.

### Healthcheck TL;DR

- Cloud Run `/health` means the web app is alive.
- Worker `/health` means the worker management API is alive.
- Pulsar broker health means the actual FS pipeline can publish.
- Resolver checks are the final truth for client-facing availability.

If the worker logs show `ConnectTimeoutException` to the staging broker, cloud FS is down even if the app itself is still answering HTTP.

## What FastStreaming Is

FastStreaming is the Deribit-to-Pulsar market data plane for Little Trader.

It currently produces:

- live options chain source topics
- derived calls, puts, Greeks, and IV surface topics
- live perpetual and spot price topics
- hourly OHLCV price topics
- lineage metadata attached to every message via the topology registry

The single source of truth for topics is `resources/fast-streaming/topology.edn`, loaded through [topology.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/topology.clj).

## Feature Scope

### Worker defaults

The standalone worker currently defaults to:

- option markets: `btc`, `eth`, `btc-usdc`, `eth-usdc`
- price markets: `btc`, `eth`, `btc-usdc`, `eth-usdc`, `btc-usdt`, `eth-usdt`, `usdc-usdt`

Those defaults come from [worker.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/worker.clj) and [docker-compose.worker.yml](/Users/victorinacio/4coders/little-trader/docker-compose.worker.yml).

### Supported market matrix in code

The canonical market definitions live in [markets.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/markets.clj).

- Option markets:
  - `btc`
  - `eth`
  - `btc-usdc`
  - `eth-usdc`
- Price markets:
  - `btc`
  - `eth`
  - `btc-usdc`
  - `eth-usdc`
  - `btc-usdt`
  - `eth-usdt`
  - `usdc-usdt`

The topology expansion also exposes `btc-usdt` option aliases for compatibility, but the worker default publish matrix does not currently poll a separate `btc-usdt` option market.

### Topic families

For each option market, the topology defines:

- `instruments`
- `book-summaries.1h`
- `book-summaries.1d`
- `calls.1h`
- `calls.1d`
- `puts.1h`
- `puts.1d`
- `greeks.1h`
- `greeks.1d`
- `iv-surface.1h`
- `dvol.1h`
- `index-price`
- `trades`
- `settlements`

For each price market, the topology defines:

- `price`
- `ohlcv.1h`

## Architecture

### Local development stack

The local stack is defined in [docker-compose.fs.yml](/Users/victorinacio/4coders/little-trader/docker-compose.fs.yml).

It runs:

- Pulsar standalone
- Pulsar topic initialization
- optional Pulsar Manager UI
- the FS worker

This is the easiest way to test FS end to end without GCP.

### GCP staging stack

The staging shape is split across three runtimes:

1. Cloud Run app:
   - serves the main backend and UI
   - can use Datomic over Direct VPC Egress
   - is deployed by [cloud-run.yml](/Users/victorinacio/4coders/little-trader/.github/workflows/cloud-run.yml)

2. Shared infra VM:
   - created by [setup-infra.sh](/Users/victorinacio/4coders/little-trader/cloud-run/setup-infra.sh)
   - currently runs PostgreSQL, Datomic transactor, and Pulsar on one Compute Engine instance
   - this is the current single point of failure for staging FS

3. Dedicated FS worker VM:
   - created or refreshed by [setup-worker.sh](/Users/victorinacio/4coders/little-trader/cloud-run/setup-worker.sh)
   - runs [docker-compose.worker.yml](/Users/victorinacio/4coders/little-trader/docker-compose.worker.yml)
   - polls Deribit and publishes to the Pulsar broker on the shared infra VM
   - exposes a local-only management API on `127.0.0.1:8090`

### Data flow

```text
Deribit REST
  -> FastStreaming worker
  -> Pulsar topics with _fs lineage envelope
  -> backend resolvers / projections / history readers
  -> Fulcro UI queries
```

### Topology and lineage

The worker loads topology from `FS_TOPOLOGY_PATH`, resolves topic IDs to Pulsar URIs, and wraps every published payload with an `_fs` envelope containing:

- topic ID
- topic URI
- timestamp
- lineage chain
- transitive sources
- transforms

That logic is implemented in [topology.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/topology.clj).

## Runtime Components

### Worker runtime

The worker entry point is [worker.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/worker.clj).

It does four things:

1. loads topology
2. creates Pulsar producers for every configured topic
3. schedules Deribit polling by topic family and cadence
4. starts the local management API if `WORKER_API_PORT` is enabled

### Worker management API

The worker API is defined in [worker_api.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/worker_api.clj).

Endpoints:

- `GET /health`
- `GET /status`
- `POST /backfill`
- `POST /restart`

Important behavior:

- `/health` only proves the management API is up
- `/status` reports worker state and uptime, but it is not yet a deep broker or Deribit readiness probe
- `POST /backfill` runs a 1095-day hourly price backfill using current env configuration

### Historical price backfill

The backfill logic lives in [backfill.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/backfill.clj).

It:

- fetches OHLCV bars from Deribit in chunks
- publishes one bar per Pulsar message
- targets the `market-data.<market>.ohlcv.1h` topics
- defaults to three years of hourly bars when possible

## Deployment Files

### Local

- [docker-compose.fs.yml](/Users/victorinacio/4coders/little-trader/docker-compose.fs.yml)
- [Dockerfile.fast-streaming](/Users/victorinacio/4coders/little-trader/Dockerfile.fast-streaming)

### GCP

- [cloud-run/setup-infra.sh](/Users/victorinacio/4coders/little-trader/cloud-run/setup-infra.sh)
- [cloud-run/setup-worker.sh](/Users/victorinacio/4coders/little-trader/cloud-run/setup-worker.sh)
- [cloud-run/service-staging.yaml](/Users/victorinacio/4coders/little-trader/cloud-run/service-staging.yaml)
- [.github/workflows/cloud-run.yml](/Users/victorinacio/4coders/little-trader/.github/workflows/cloud-run.yml)

## Environment Variables

### Worker

- `PULSAR_SERVICE_URL`
- `DERIBIT_TESTNET`
- `FS_OPTION_MARKETS`
- `FS_PRICE_MARKETS`
- `FS_TOPOLOGY_PATH`
- `WORKER_API_PORT`
- `JVM_OPTS`

### Cloud Run app

Relevant staging vars in the GitHub workflow:

- `DATOMIC_URI`
- `PULSAR_ENABLED`
- `PULSAR_SERVICE_URL`
- `DERIBIT_ENABLED`
- `DERIBIT_TESTNET`
- `DERIBIT_CLIENT_ID`
- `DERIBIT_PRIVATE_KEY`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Operations

### Local bring-up

Start the local FS stack:

```bash
docker compose -f docker-compose.fs.yml up -d --build
```

Check health:

```bash
docker compose -f docker-compose.fs.yml ps
curl -fsS http://localhost:8081/admin/v2/clusters
docker compose -f docker-compose.fs.yml logs --tail=100 fs-worker
```

Optional UI:

- Pulsar Manager runs on `http://localhost:9527`
- it is non-critical and can be stopped to free resources

### Staging infra bring-up from zero

Provision the shared VM:

```bash
export GCP_PROJECT_ID=little-trader
export GCP_REGION=us-central1
export GCP_ZONE=us-central1-a
export POSTGRES_PASSWORD='your-password'
./cloud-run/setup-infra.sh
```

This creates:

- a VPC subnet for Cloud Run egress
- a firewall rule for private connectivity
- a static internal IP
- the `datomic-transactor` VM
- Docker services for PostgreSQL, Datomic, and Pulsar

### Staging app deploy

Deploy staging through GitHub Actions:

- the workflow deploys Cloud Run with `min-instances=1`
- CPU throttling is disabled
- VPC egress is attached when `DATOMIC_URI_STAGING` is present
- the worker refresh step runs after the app deploy

Manual trigger:

```bash
gh workflow run "Deploy to Cloud Run" -f environment=staging
```

### Dedicated worker refresh

Refresh the FS worker VM directly:

```bash
export GCP_PROJECT_ID=little-trader
export GCP_ZONE=us-central1-a
export PULSAR_SERVICE_URL='pulsar://<internal-ip>:6650'
export FS_DERIBIT_TESTNET=false
export FS_OPTION_MARKETS='btc,eth,btc-usdc,eth-usdc'
export FS_PRICE_MARKETS='btc,eth,btc-usdc,eth-usdc,btc-usdt,eth-usdt,usdc-usdt'
export FS_TOPOLOGY_PATH='fast-streaming/topology.edn'
export WORKER_API_PORT=8090
./cloud-run/setup-worker.sh
```

What the script does:

- creates or refreshes `fs-worker-staging`
- installs Docker if needed
- copies `src`, `resources`, `deps.edn`, `build.clj`, and compose files
- writes a `.env`
- rebuilds and restarts the worker container
- waits on `http://127.0.0.1:8090/health`

### Backfill hourly price history

From the worker VM API:

```bash
gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="curl -X POST -fsS http://127.0.0.1:8090/backfill"
```

From Clojure directly:

```bash
clojure -M -m com.little-trader.fast-streaming.backfill
```

For specific markets:

```clojure
(require '[com.little-trader.fast-streaming.backfill :as backfill] :reload)
(backfill/backfill-market-matrix!
  :markets ["eth" "btc-usdc" "eth-usdc" "btc-usdt" "eth-usdt" "usdc-usdt"]
  :days 1095
  :resolution "60"
  :testnet? false
  :pulsar-url "pulsar://localhost:6650"
  :topology-path "fast-streaming/topology.edn")
```

## Healthchecks

### Healthcheck matrix

| Surface | Command | Healthy signal | Bad signal |
|---|---|---|---|
| Cloud Run app | `curl -fsS https://<service-url>/health` | JSON `{"status":"ok"}` | timeout, 5xx, failed revision |
| Infra VM services | `gcloud compute ssh datomic-transactor --zone=us-central1-a --command="cd ~/infra && sudo docker compose -f docker-compose.infra.yml ps"` | postgres, transactor, pulsar up | exited or restarting containers |
| Pulsar broker | `gcloud compute ssh datomic-transactor --zone=us-central1-a --command="sudo docker compose -f ~/infra/docker-compose.infra.yml exec -T pulsar bash -lc 'bin/pulsar-admin brokers healthcheck'"` | broker healthcheck succeeds | healthcheck hangs or fails |
| Worker container | `gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="cd ~/fs-worker && sudo docker compose -f docker-compose.worker.yml ps"` | `Up` and eventually `healthy` | restarting loop, `health: starting` forever |
| Worker API | `gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="curl -fsS http://127.0.0.1:8090/health"` | JSON `{"status":"ok"}` | connection refused |
| Worker status | `gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="curl -fsS http://127.0.0.1:8090/status"` | state payload with uptime | no response or stale status |
| Worker publish path | `gcloud compute ssh fs-worker-staging --zone=us-central1-a --command="cd ~/fs-worker && sudo docker compose -f docker-compose.worker.yml logs --tail=200 fs-worker"` | producer creation, published topics | `ConnectTimeoutException`, repeated metadata failures |

### Important healthcheck semantics

- Cloud Run app health is not FS health.
- Worker API health is not broker health.
- Only Pulsar broker health plus worker publish success plus resolver checks prove the pipeline is actually serving client data.

## Backend Resolver Surface

The client currently depends on four FS-style queries and one bar mutation.

### UI demand surface

The main callers are:

- [workspace.cljs](/Users/victorinacio/4coders/little-trader/src/com/little_trader/ui/workspace.cljs)
- [trading_dashboard.cljs](/Users/victorinacio/4coders/little-trader/src/com/little_trader/ui/trading_dashboard.cljs)
- [fs_chart.cljs](/Users/victorinacio/4coders/little-trader/src/com/little_trader/ui/fs_chart.cljs)

They request:

- `:fs/topology`
- `:fs/live-snapshot`
- `:fs/iv-smile`
- `:fs/btc-ohlcv`
- `com.little-trader.components.resolvers/bars-for-symbol`

### Resolver truth table

| Query | Intended source | Current implementation | Operational meaning |
|---|---|---|---|
| `:fs/topology` | topology registry | pure EDN lookup | good for metadata and lineage only |
| `:fs/live-snapshot` | looks like FS to the UI | direct Deribit calls with `deribit/*testnet?* true` | can succeed even when cloud FS is down |
| `:fs/iv-smile` | looks like FS to the UI | direct Deribit calls with `deribit/*testnet?* true` | can succeed even when cloud FS is down |
| `:fs/btc-ohlcv` | Pulsar topic `market-data.btc.ohlcv.1h` | local Pulsar history reader defaulting to `localhost:6650` | currently not cloud-safe |
| `bars-for-symbol` | Pulsar projection first | falls back to Datomic, then Deribit | current success may only mean fallback worked |

### Current caveats

As of April 3, 2026:

- [fs_resolvers.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/components/fs_resolvers.clj) still hardcodes `deribit/*testnet?* true` for `:fs/live-snapshot` and `:fs/iv-smile`
- [history.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/history.clj) defaults to `pulsar://localhost:6650`
- direct EQL checks showed `:fs/btc-ohlcv` as unreachable through Pathom root lookup in local validation, even though the underlying resolver function exists
- `bars-for-symbol` currently proves fallback availability more reliably than cloud FS availability because it reports `:bars-source`

## Resolver Validation Commands

Run these in a REPL inside the app environment:

```clojure
(require '[com.little-trader.components.parser :as parser] :reload)

(parser/process-eql
  '[{:fs/topology [:topic-count]}])

(parser/process-eql
  '[{:fs/live-snapshot [:index-price :btc-perp-price :dvol :calls-count :puts-count]}])

(parser/process-eql
  '[{:fs/iv-smile [:expiry :underlying-price :data-points]}])

(parser/process-eql
  '[(com.little-trader.components.resolvers/bars-for-symbol
      {:symbol "BTC-PERPETUAL" :timeframe :1h :limit 10})
    [:bars-source {:bars [:bar/mts :bar/open :bar/high :bar/low :bar/close :bar/volume]}]])
```

Interpretation:

- `:fs/topology` proves topology load only
- `:fs/live-snapshot` and `:fs/iv-smile` currently prove direct Deribit reachability, not Pulsar health
- `bars-for-symbol` must be checked for `:bars-source`
  - `:pulsar-projection` is the best result
  - `:datomic` is a degraded but usable fallback
  - `:deribit` means the chart is alive without cloud FS

## Common Failure Modes

### 1. Worker cannot reach Pulsar broker

Typical log signature:

```text
ConnectTimeoutException ... /<broker-ip>:6650
Could not get connection while getPartitionedTopicMetadata
```

Meaning:

- the worker VM is up
- the worker process starts
- the broker is unreachable from the worker
- cloud FS publish is down

This was the current staging failure mode on April 3, 2026.

### 2. Cloud Run is healthy but FS data is stale or missing

Meaning:

- the web app is still serving HTTP
- backend resolvers are either degraded or falling back
- the worker and broker must be checked independently

### 3. Local Pulsar goes read-only because of disk threshold

Symptom:

- Pulsar topics appear empty
- BookKeeper marks ledger dirs non-writable

Mitigation already reflected in [docker-compose.fs.yml](/Users/victorinacio/4coders/little-trader/docker-compose.fs.yml):

- `PULSAR_DISK_USAGE_THRESHOLD` defaults to `0.9995`
- `PULSAR_DISK_USAGE_WARN_THRESHOLD` defaults to `0.995`

If local disk is still exhausted, rotate or remove local data directories before restarting.

### 4. Topology file not found inside the worker

Symptom:

- worker fails on topology load during startup

Mitigations already in place:

- [Dockerfile.fast-streaming](/Users/victorinacio/4coders/little-trader/Dockerfile.fast-streaming) copies `resources/fast-streaming`
- [topology.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/topology.clj) loads topology from classpath or filesystem
- [docker-compose.worker.yml](/Users/victorinacio/4coders/little-trader/docker-compose.worker.yml) mounts `src` and `resources` into the container

## Current Staging Reality

As of April 3, 2026:

- Cloud Run staging deploy path exists
- the dedicated worker VM exists
- the worker container is being refreshed from repo source mounted into the container
- the shared broker/transactor VM remains the weak point
- the observed staging worker failure mode is broker connection timeout

That means:

- topology queries can still work
- direct Deribit-backed FS-style resolvers can still work
- true cloud-FS-backed reads are not healthy until the broker is reachable again

## Recommended Next Hardening Steps

1. Wire `:fs/live-snapshot` and `:fs/iv-smile` to actual FS topics instead of direct Deribit calls.
2. Make `:fs/btc-ohlcv` read `PULSAR_SERVICE_URL` instead of hardcoding localhost.
3. Fix the Pathom root accessibility issue for `:fs/btc-ohlcv`.
4. Extend worker `/status` to include broker and last-publish readiness.
5. Split Pulsar off the shared `datomic-transactor` VM to remove the current single point of failure.
6. Add one staging smoke test that verifies `bars-for-symbol` returns `:pulsar-projection` when FS is healthy.

## File Map

- [docker-compose.fs.yml](/Users/victorinacio/4coders/little-trader/docker-compose.fs.yml): local FS stack
- [docker-compose.worker.yml](/Users/victorinacio/4coders/little-trader/docker-compose.worker.yml): worker VM container
- [Dockerfile.fast-streaming](/Users/victorinacio/4coders/little-trader/Dockerfile.fast-streaming): worker image
- [cloud-run/setup-infra.sh](/Users/victorinacio/4coders/little-trader/cloud-run/setup-infra.sh): shared GCP infra bootstrap
- [cloud-run/setup-worker.sh](/Users/victorinacio/4coders/little-trader/cloud-run/setup-worker.sh): worker VM bootstrap and refresh
- [.github/workflows/cloud-run.yml](/Users/victorinacio/4coders/little-trader/.github/workflows/cloud-run.yml): staging and production deploy workflow
- [src/com/little_trader/fast_streaming/worker.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/worker.clj): FS worker runtime
- [src/com/little_trader/fast_streaming/worker_api.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/worker_api.clj): worker management API
- [src/com/little_trader/fast_streaming/backfill.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/backfill.clj): historical backfill
- [src/com/little_trader/fast_streaming/topology.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/topology.clj): topology and lineage
- [src/com/little_trader/components/fs_resolvers.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/components/fs_resolvers.clj): current FS resolver surface
- [src/com/little_trader/fast_streaming/history.clj](/Users/victorinacio/4coders/little-trader/src/com/little_trader/fast_streaming/history.clj): Pulsar OHLCV history reader
