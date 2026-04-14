# Local Development Setup

## Prerequisites

- **Java 21** (for Clojure)
- **Node 18+** (for ClojureScript)
- **Docker Desktop** (with Docker Compose)
- **Git**

```bash
# Verify installations
java -version   # should show 21.x
node -version   # should show 18.x or higher
docker -version
```

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/4coders-com-br/little-trader.git
cd little-trader

# 2. Copy environment template
cp .env.example .env

# 3. Start minimal dev environment
make dev

# 4. In another terminal, connect to REPL
make repl

# 5. In the REPL, start the application
(go)

# 6. Visit http://localhost:8080
```

## Development Modes

### Mode 1: Minimal Dev (Coding & Unit Tests)
```bash
make dev
```
**Includes:** PostgreSQL, Datomic Transactor, Clojure nREPL (7888), shadow-cljs dev server (3000), MinIO  
**Use for:** Writing code, running unit tests, quick iterations  
**Start time:** ~30 seconds

### Mode 2: Dev + Market Data (Backtesting & Strategy Testing)
```bash
make dev-market
```
**Includes:** Everything from `dev` + Apache Pulsar (6650), Pulsar Manager (9527), FastStreaming worker  
**Use for:** Backtesting strategies, testing with real market data topology  
**Start time:** ~60 seconds  
**Note:** Pulsar consumes market data from Deribit API

### Mode 3: Dev + Monitoring (Performance Profiling)
```bash
make dev-monitor
```
**Includes:** Everything from `dev` + Prometheus (9090), Grafana (3001), Loki (3100), Promtail  
**Use for:** Performance profiling, metrics collection, log aggregation  
**Start time:** ~60 seconds  
**Login:** Grafana admin/admin

### Mode 4: Full Stack (Local Everything)
```bash
make dev-full
```
**Includes:** `dev` + `dev-market` + `dev-monitor`  
**Use for:** Full integration testing before cloud deploy  
**Start time:** ~90 seconds  
**Note:** Heavy on resources, best on 8GB+ RAM

### Mode 5: Cloud-Backed Dev (Integration with GCP)
```bash
make dev-cloud
```
**Includes:** Local server + shadow-cljs, but connected to:
- Cloud SQL (PostgreSQL on GCP)
- Cloud Datomic Transactor VM
- Cloud Pulsar (GCP VM)
- Google Cloud Storage (instead of MinIO)

**Use for:** Testing against real cloud infrastructure without deploying  
**Requirements:** GCP credentials, VPC network access  
**Note:** Faster iteration with real services

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| App (Ring HTTP) | 8080 | http://localhost:8080 |
| Clojure nREPL | 7888 | localhost:7888 |
| shadow-cljs dev | 3000 | http://localhost:3000 |
| shadow-cljs nREPL | 9000 | localhost:9000 |
| PostgreSQL | 5432 | localhost:5432 |
| Datomic Transactor | 4334 | localhost:4334 |
| Apache Pulsar | 6650 | localhost:6650 |
| Pulsar HTTP | 8081 | http://localhost:8081 |
| Pulsar Manager | 9527 | http://localhost:9527 (admin/apachepulsar) |
| MinIO S3 API | 9100 | localhost:9100 |
| MinIO Console | 9101 | http://localhost:9101 (littletrader/littletrader123) |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 (admin/admin) |
| Loki | 3100 | http://localhost:3100 |

## REPL Workflow

### Connecting to the REPL

```bash
# Option 1: Use make target
make repl

# Option 2: Direct ncat connection
ncat localhost 7888

# Option 3: From your editor (VS Code Calva, IntelliJ, etc.)
# Configure REPL connection to localhost:7888
```

### Common REPL Operations

```clojure
; Start the application
(go)

; Stop the application (but keep REPL running)
(halt)

; Reload changed namespaces
(clojure.tools.namespace.repl/refresh)

; Run tests
(require '[kaocha.repl :as k])
(k/run)

; REPL eval is enabled for Anthropic MCP
(eval-string "(+ 1 2)")
```

## Market Data Stack

The market data stack runs independently from the app and can stay up between code changes.

```bash
# Start market data independently
make dev-market

# If you already have `make dev` running, just add market profile
docker compose --profile market up -d --build

# Check market data services
make ps

# View Pulsar Manager UI
# http://localhost:9527 → admin/apachepulsar
# Add environment: Service URL = http://pulsar:8080
```

## Building & Testing

```bash
# Run Clojure tests
make test

# Run ClojureScript tests
make lint && npm test

# Build production artifacts (without running)
make build

# Build production Docker image (for testing locally)
make docker

# Run full CI locally
make ci

# Run API smoke test (requires app running)
make smoke
```

## Common Tasks

### Backup Database

```bash
make backup-db

# Restore from latest
make restore-db

# Restore from specific backup
make restore-db BACKUP=backups/datomic-20260413-120000.sql.gz
```

### View Logs

```bash
# All service logs (follow mode)
make logs

# Single service
make logs SERVICE=server
make logs SERVICE=shadow-watch
make logs SERVICE=pulsar

# Use docker compose directly
docker compose logs -f server
```

### Stop Services

```bash
# Stop all (keep data)
make stop

# Stop and delete (deletes volumes)
make down

# Restart all
make restart
```

### Clean Up

```bash
# Remove build artifacts
make clean

# Full reset (stop, delete volumes, clean)
make reset
```

## Troubleshooting

### Port already in use

```bash
# Kill process on port
lsof -ti:8080 | xargs kill -9

# Or specify custom port in .env
DATOMIC_URI=datomic:sql://little-trader?jdbc:postgresql://localhost:5432/datomic
```

### Pulsar connection refused

```bash
# Check if pulsar is running
docker compose ps pulsar

# Check Pulsar health
curl http://localhost:8081/admin/v2/clusters

# Restart Pulsar
docker compose restart pulsar
```

### Out of disk space

```bash
# Clean Docker volumes (WARNING: deletes all data)
make reset

# Or manually clean old pulsar data
rm -rf ~/4coders/data/little-trader/pulsar/
```

### nREPL connection refused

```bash
# Check if server is running
docker compose ps server

# Check logs
docker compose logs server | tail -50

# Reconnect with fresh terminal
make repl
```

## Environment Variables

Key variables in `.env`:

```bash
# Database
DATOMIC_URI=datomic:sql://...

# Auth
JWT_SECRET=dev-secret-...
ADMIN_EMAIL=admin@littletrader.dev
ADMIN_PASSWORD=admin123

# Market data
PULSAR_ENABLED=true
DERIBIT_ENABLED=true
DERIBIT_TESTNET=true

# Cloud endpoints (for make dev-cloud)
CLOUD_SQL_IP=104.155.169.11
CLOUD_PULSAR_HOST=35.193.217.34
```

See `.env.example` for complete list.

## Next Steps

- Explore `docs/CLOUD_DEPLOY.md` for cloud deployment
- Check project README for architecture overview
- See CLAUDE.md for AI-assisted development patterns
