# Little Trader

Renko Trading System built with Clojure, Fulcro RAD, Datomic, and TradingView Charts.

**Live Staging**: https://little-trader-staging-x4miahfzia-uc.a.run.app

``` clojure
{:buy  📉
 :sell 📈}
 ```

[![Deploy to Cloud Run](https://github.com/4coders-com-br/little-trader/actions/workflows/main.yml/badge.svg)](https://github.com/4coders-com-br/little-trader/actions/workflows/main.yml)

---

## Onboarding Documentation

## Documentation

**New unified documentation:**
- [Local Development Setup](docs/LOCAL_DEV.md) — all development modes (minimal, market, monitoring, cloud-backed)
- [Cloud Deployment Guide](docs/CLOUD_DEPLOY.md) — CI/CD pipeline, staging/production deployment, troubleshooting

- [Developer Onboarding Playbook](docs/DEVELOPER_ONBOARDING_PLAYBOOK.md) — top-down architecture, feature flows, dev/ops runbooks, and implementation templates.
- [Architecture Visual Guide](docs/ARCHITECTURE_VISUAL_GUIDE.md) — visual runtime and delivery maps.

---

## TL;DR - Quick Start

### Prerequisites

```bash
# Required
java -version    # Java 21+
clj --version    # Clojure CLI 1.11+
node -v          # Node.js 18+
```

### 1. Install Dependencies

```bash
# Clone and enter project
git clone https://github.com/4coders-com-br/little-trader
cd little-trader

# Install npm packages (React, TradingView charts)
npm install
```

### 2. Environment Setup

Development is **containerized first**. The Docker dev container is the **primary and recommended** way to work — it runs the exact same image topology as CI/CD and cloud deployments. "Works in my container" = "works in CI" = "works in staging".

| What you run locally | What CI/CD runs | What cloud runs |
|----------------------|-----------------|-----------------|
| `docker compose -f docker-compose.yml --profile dev up` | `Dockerfile` multi-stage build | Same image on Cloud Run / k8s |
| `./scripts/local-ci.sh` | GitHub Actions `ci.yml` pipeline | — |
| `./scripts/ci-api-smoke.sh` | Same script in CI test job | Health check on deploy |

#### 2.1 Hosts File

Add entries to `/etc/hosts` so that every environment resolves through a consistent hostname. The proxy connector switches targets without code changes:

```
# /etc/hosts — Little Trader environments
127.0.0.1   local.littletrader.dev
# Cloud entries (IPs come from your infra provider)
# <staging-ip>   staging.littletrader.dev
# <prod-ip>      prod.littletrader.dev
```

#### 2.2 Credentials (.env)

Copy and fill the env template **before** starting any container:

```bash
cp .env.example .env
# Edit .env — set API keys, secrets, and provider toggles
```

> **LLM safety**: `.env` is git-ignored and **never** mounted into MCP tool contexts.
> API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DERIBIT_PRIVATE_KEY`, etc.) live only
> inside the running container's environment. Claude Code / Claude Desktop sees config
> shapes and defaults (via `config.clj`) but never raw credential values.

#### 2.3 Start Development (Docker)

```bash
# App core stack (Postgres + Datomic transactor + dev container)
docker compose -f docker-compose.yml --profile dev up --build

# Optional long-lived market stack (Pulsar + fs-worker)
docker compose -f docker-compose.fs.yml up -d --build
```

Once the container prints **"Dev Container Ready!"**, you have:

| Port | Service | Purpose |
|------|---------|---------|
| `7888` | Clojure nREPL | Editor connection (Calva, CIDER, Cursive) |
| `9000` | shadow-cljs nREPL | ClojureScript evaluation |
| `3000` | shadow-cljs HTTP | Frontend dev server (proxies API → 8080) |
| `8080` | Ring HTTP | Backend API (available after `(go)` in REPL) |

Connect your editor to nREPL on `localhost:7888`, then in the REPL:

```clojure
user=> (go)        ;; Start server on http://local.littletrader.dev:8080
user=> (reset)     ;; Reload code + restart
user=> (stop)      ;; Stop server
```

Open **http://local.littletrader.dev:3000** — you should see the trading dashboard.

#### 2.4 Local CI Pipeline — Verify Before You Push

Run the same pipeline that GitHub Actions runs, entirely on your machine:

```bash
# Full pipeline: test → lint → docker build → run container → smoke test
./scripts/local-ci.sh

# Or run individual stages
./scripts/local-ci.sh test      # Kaocha tests (same as CI test job)
./scripts/local-ci.sh lint      # clj-kondo (non-blocking, same as CI)
./scripts/local-ci.sh docker    # Multi-stage Docker build (same Dockerfile as CI/Cloud Run)
./scripts/local-ci.sh run       # Start container + health check
./scripts/local-ci.sh smoke     # API smoke tests (health + auth + EQL + UI)
./scripts/local-ci.sh quick     # Skip local CLJS — test → docker → run → smoke
./scripts/local-ci.sh stop      # Tear down
```

The `local-ci.sh` script mirrors the GitHub Actions workflow stage by stage:

| Local stage | CI equivalent (`ci.yml`) |
|-------------|--------------------------|
| `test` | **Test** job: `clojure -M:test` + domain tests + `ci-api-smoke.sh` |
| `lint` | **Lint** job: `clj-kondo --lint src test` (non-blocking) |
| `docker` | **Build** job: `docker build` with multi-stage Dockerfile |
| `run` + `smoke` | **Deploy** job: Cloud Run deploy + health check |

> If `./scripts/local-ci.sh` passes, CI will pass. Fix issues locally, not in PR review.

#### 2.5 Start Development (bare-metal — no Docker)

If you prefer running processes directly on your host, open **3 terminals**:

```bash
# Terminal 1: Backend nREPL
clj -M:dev
# → nREPL on port 7888; then (go) in the REPL

# Terminal 2: Frontend
npm run dev
# → shadow-cljs dev server on port 3000

# Terminal 3 (optional): ClojureScript REPL
npx shadow-cljs cljs-repl app
```

> Bare-metal mode still requires Postgres + Datomic transactor running somewhere.
> You can start just the infra services: `docker compose up postgres transactor`

### 3. REPL, MCP & LLM Access

#### 3.1 REPL Access

The nREPL ports are exposed from every environment:

| Environment | Clojure nREPL | CLJS nREPL | How to reach |
|-------------|---------------|------------|--------------|
| **Local (Docker)** | `localhost:7888` | `localhost:9000` | Direct — ports forwarded from container |
| **Local (bare-metal)** | `localhost:7888` | `localhost:9000` | Direct — processes on host |
| **Cloud Staging** | `staging.littletrader.dev:7888` | — | `kubectl -n staging port-forward svc/nrepl 7888:7888` |
| **Cloud Prod** | Not exposed | — | Emergency only via bastion + audit |

#### 3.2 LLM MCP Access (Claude Code / Claude Desktop)

With [clojure-mcp](https://github.com/bhauman/clojure-mcp) in **dual mode**, Claude connects to both Clojure and ClojureScript REPLs:

```bash
# After the dev container (or bare-metal REPLs) is running:
clojure -X:mcp-shadow-dual
```

This bridges `localhost:7888` (Clojure) and `localhost:9000` (ClojureScript) into a single MCP server. See the [Claude Desktop + Clojure MCP](#claude-desktop--clojure-mcp) section for full setup.

#### 3.3 Proxy Connector — Plug into Remote Environments

The same MCP bridge can target any environment by tunneling through the hosts entries:

```bash
# Point nREPL at staging
kubectl -n staging port-forward svc/nrepl 7888:7888 &

# Now clojure-mcp connects to staging as if it were local
clojure -X:mcp-shadow-dual
```

This lets Claude Code evaluate code, query Datomic, and inspect state against real staging data without any config changes.

#### 3.4 Repository Knowledge Graph (Noumenon)

[Noumenon](https://noumenon.leifericf.com/) builds a queryable knowledge graph from this repository's git history, file structure, and optional LLM annotations. Little Trader includes a pinned `:noumenon` alias plus a project-local wrapper at `./scripts/noumenon.sh`, which always targets this repo and stores its graph in `data/noumenon/`.

##### Dev Env Setup Session

1. Add the Noumenon settings to your local `.env`.
   The wrapper auto-loads `.env`, and `.env` is gitignored, so this is the preferred place to keep `ANTHROPIC_API_KEY` for local development.

```bash
ANTHROPIC_API_KEY=your-real-key
NOUMENON_PROVIDER=claude-api
NOUMENON_MODEL=sonnet
NOUMENON_DB_DIR=data/noumenon

# Optional alternative provider (not needed when using Anthropic)
# NOUMENON_ZAI_TOKEN=your-z-ai-token
```

2. Avoid passing secrets inline on the command line.
   `ANTHROPIC_API_KEY=... ./scripts/noumenon.sh analyze` can leak into shell history and process listings.

3. If you want a one-off session without writing the key to disk, use a masked prompt:

```bash
read -s ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY
export NOUMENON_PROVIDER=claude-api
export NOUMENON_MODEL=sonnet
./scripts/noumenon.sh analyze
unset ANTHROPIC_API_KEY
```

4. Bootstrap the repository graph:

```bash
# See the built-in queries
./scripts/noumenon.sh query list

# First sync: import git history + files + deterministic import graph
./scripts/noumenon.sh update

# Inspect the graph
./scripts/noumenon.sh status
./scripts/noumenon.sh query hotspots
```

5. Run semantic analysis and grounded questions:

```bash
./scripts/noumenon.sh analyze --model sonnet
./scripts/noumenon.sh update --analyze --model sonnet
./scripts/noumenon.sh ask -q "Which namespaces are the biggest risk hotspots?"
```

Configuration notes:

- `ANTHROPIC_API_KEY`: used when `NOUMENON_PROVIDER=claude-api`
- `NOUMENON_PROVIDER`: defaults the wrapper for LLM-backed commands
- `NOUMENON_MODEL`: short model alias forwarded to Noumenon, e.g. `sonnet`
- `NOUMENON_DB_DIR`: overrides the local graph storage path, default `data/noumenon`
- `NOUMENON_ZAI_TOKEN`: only needed if you switch to `NOUMENON_PROVIDER=glm`

Use `clj -M:noumenon --help` for the raw CLI, or `./scripts/noumenon.sh --help` for the repo-aware wrapper. The generated Noumenon database stays local under `data/noumenon/`, which is gitignored.

### 4. Logging

Logging is configured per environment via `APP_ENV` and `LOG_LEVEL` env vars. The `config.clj` logging section drives [Timbre](https://github.com/taoensso/timbre):

| Environment | `APP_ENV` | Default Target | Tenant Isolation |
|-------------|-----------|----------------|------------------|
| **Local dev** | `dev` | stdio (console) | N/A |
| **CI** | `ci` | stdio (captured by GitHub Actions) | N/A |
| **Cloud Staging** | `staging` | stdout → Cloud Logging | Single tenant |
| **Cloud Production** | `production` | stdout → Cloud Logging | Per-tenant labels via `X-Tenant-ID` header |

Override at runtime:

```bash
# Verbose logging in dev
LOG_LEVEL=debug docker compose -f docker-compose.yml --profile dev up

# Quiet CI
LOG_LEVEL=warn clj -M:test
```

Production and staging logs flow through stdout into Google Cloud Logging (or any log collector that reads container stdout). Tenant-scoped queries use structured labels attached by the middleware.

### 5. Runtime Context & Documentation Sessions

The running application exposes contextualized data for debugging, documentation, and LLM-assisted sessions. Query these from the REPL or via EQL:

#### 5.1 Current Environment Info (REPL)

```clojure
;; What environment am I connected to?
user=> (System/getenv "APP_ENV")        ;; => "dev" | "staging" | "production"

;; Full config (credentials redacted)
user=> (require '[com.little-trader.config :as cfg])
user=> (select-keys cfg/config [:server :database :trading :logging])
;; => {:server {:port 8080, :host "0.0.0.0"},
;;     :database {:uri "datomic:sql://..."},
;;     :trading {:symbol "BTC/USD", :brick-size 100.0, :mode :paper},
;;     :logging {:level :info, :console true, :file nil}}
```

#### 5.2 App-Aware State Queries (REPL)

```clojure
;; Active feature flags
user=> (select-keys cfg/config [:pulsar :deribit :mt5 :news-crawlers])
;; => {:pulsar {:enabled? false, ...}, :deribit {:enabled? false, ...}, ...}

;; Mount component status
user=> (mount.core/running-states)
;; => #{#'com.little-trader.config/config #'com.little-trader.data.db/conn ...}

;; Datomic connection health
user=> (require '[datomic.api :as d])
user=> (d/db @com.little-trader.data.db/conn)
;; => datomic.db.Db@...
```

#### 5.3 EQL Introspection (HTTP)

```bash
# Health check — works on any environment
curl http://local.littletrader.dev:8080/health

# Query app state via EQL endpoint (requires auth)
curl -X POST http://local.littletrader.dev:8080/api/eql \
  -H "Content-Type: application/json" \
  -d '{"query": "[{:deribit-fetcher-status [:deribit/fetcher-running? :deribit/fetcher-stats]}]"}'
```

#### 5.4 Contextualized LLM Session

When starting a Claude Code or MCP session, Claude can introspect the environment to tailor its responses:

```
Claude (via MCP): evaluates (System/getenv "APP_ENV")
→ "staging"

Claude: evaluates (mount.core/running-states)
→ Shows which components are active

Claude: evaluates (com.little-trader.config/pulsar-config)
→ {:enabled? true, :service-url "pulsar://pulsar:6650", ...}

Claude now knows: "I'm connected to staging, Pulsar is active,
Deribit is disabled — I'll focus on price projection features."
```

### 6. Open the App

Navigate to **http://local.littletrader.dev:3000** — you should see the trading dashboard with a BTC/USD chart.

### Quick Commands Reference

| Task | Command |
|------|---------|
| **App core (Docker)** | `docker compose -f docker-compose.yml --profile dev up --build` |
| **App full (Docker)** | `docker compose -f docker-compose.yml --profile dev --profile app up --build` |
| **Market stack (Docker)** | `docker compose -f docker-compose.fs.yml up -d --build` |
| **Local CI (full pipeline)** | `./scripts/local-ci.sh` |
| **Local CI (tests only)** | `./scripts/local-ci.sh test` |
| **Local CI (quick)** | `./scripts/local-ci.sh quick` |
| **Infra only** | `docker compose -f docker-compose.yml up postgres transactor` |
| MCP bridge (LLM access) | `clojure -X:mcp-shadow-dual` |
| Noumenon graph sync | `./scripts/noumenon.sh update` |
| Noumenon semantic analysis | `./scripts/noumenon.sh analyze --model sonnet` |
| Noumenon grounded query | `./scripts/noumenon.sh ask -q "Which namespaces are hotspots?"` |
| API smoke tests | `bash ./scripts/ci-api-smoke.sh` |
| Container logs | `docker compose -f docker-compose.yml --profile dev logs -f dev` |
| Build production JS | `npm run release` |
| Build uberjar | `clj -T:build uber` |
| Check outdated deps | `clj -M:outdated` |
| Start backend REPL (bare-metal) | `clj -M:dev` |
| Start frontend (bare-metal) | `npm run dev` |
| CLJS REPL (bare-metal) | `npx shadow-cljs cljs-repl app` |

---

## Claude Desktop + Clojure MCP

Use [clojure-mcp](https://github.com/bhauman/clojure-mcp) to enable AI-assisted REPL-driven development with Claude Desktop. The **dual mode** connects to both Clojure (backend) and ClojureScript (frontend) REPLs simultaneously!

### Step 1: Install clojure-mcp (Dual Mode)

Add to your `~/.clojure/deps.edn`:

```clojure
{:aliases
 {:mcp-shadow-dual
  {:deps {org.slf4j/slf4j-nop {:mvn/version "2.0.16"}
          com.bhauman/clojure-mcp {:git/url "https://github.com/bhauman/clojure-mcp.git"
                                   :git/tag "v0.1.11-alpha"
                                   :git/sha "7739dba"}}
   :exec-fn clojure-mcp.main-examples.shadow-main/start-mcp-server
   :exec-args {:port 7888          ;; Backend nREPL port
               :shadow-port 9000   ;; Shadow-cljs nREPL port
               :shadow-build "app" ;; Shadow-cljs build ID
               }}}}
```

> **Key**: Uses `shadow-main/start-mcp-server` for dual Clojure + ClojureScript support in a single MCP server!

### Step 2: Configure Claude Desktop

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "little-trader": {
      "command": "/bin/bash",
      "args": [
        "-c",
        "cd /path/to/little-trader && clojure -X:mcp-shadow-dual"
      ]
    }
  }
}
```

> **Note**: Replace `/path/to/little-trader` with your actual project path. On macOS with Homebrew, use `/opt/homebrew/bin/bash`.

### Step 3: Start Both REPLs

Open **3 terminals**:

```bash
# Terminal 1: Backend nREPL (Clojure server)
clj -M:dev
# → Starts nREPL on port 7888
# → In REPL: (go) to start HTTP server on :8080

# Terminal 2: Frontend shadow-cljs (ClojureScript)
npm run dev
# → Starts shadow-cljs with nREPL on port 9000
# → Serves frontend at http://localhost:3000

# Terminal 3: Open browser
open http://localhost:3000
# → Required for ClojureScript REPL to connect to browser runtime
```

### Step 4: Restart Claude Desktop

After configuring, restart Claude Desktop. Click the **🔌 icon** or type `/mcp` to see tools from `little-trader`.

**Claude now has access to BOTH REPLs** - it can evaluate Clojure on the server and ClojureScript in the browser!

---

## Clojure MCP Session Guide

### What Claude Can Do via MCP

With clojure-mcp in **dual mode**, Claude Desktop can work with both backend and frontend:

| Capability | Clojure (Backend) | ClojureScript (Frontend) |
|------------|-------------------|--------------------------|
| **Evaluate code** | Server-side logic | Browser runtime |
| **Read files** | `.clj` files | `.cljs` / `.cljc` files |
| **Edit files** | Resolvers, domain | UI components |
| **Inspect state** | Datomic, atoms | Fulcro app-db |
| **Run tests** | `clj -M:test` | Browser console |

### Example MCP Sessions

#### Session 1: Dual REPL Demonstration

```
You: "Evaluate (+ 1 2 3) in Clojure"

Claude: [Evaluates in Clojure REPL]
;; => 6
The expression evaluates to 6 in Clojure.

You: "Now evaluate the same in ClojureScript and log to browser console"

Claude: [Evaluates in ClojureScript REPL]
(js/console.log (+ 1 2 3))
;; => nil (but 6 appears in browser console)

Check your browser's developer console - you should see 6 printed there!
```

#### Session 2: Backend - Exploring Datomic Schema

```
You: "What's the current Datomic schema for trades?"

Claude: [Evaluates in Clojure]
(require '[datomic.api :as d])
(require '[com.little-trader.data.db :as db])

(d/q '[:find ?ident ?type
       :where
       [?e :db/ident ?ident]
       [?e :db/valueType ?t]
       [?t :db/ident ?type]
       [(clojure.string/starts-with? (str ?ident) ":trade")]]
     (d/db @db/conn))

;; Returns: #{[:trade/id :db.type/uuid] [:trade/side :db.type/keyword] ...}
```

#### Session 3: Backend - Testing Signal Detection

```
You: "Test the one-brick signal detection with sample data"

Claude: [Evaluates in Clojure]
(require '[com.little-trader.domain.signals :as signals])

(def test-bricks
  [{:brick/direction -1 :brick/close 42000}
   {:brick/direction 1 :brick/close 42100}])

(signals/detect-signal test-bricks signals/default-config false)
;; => {:action "one_brick_start_long", :side :long}
```

#### Session 4: Frontend - Inspecting Fulcro App State

```
You: "What's in the Fulcro app state for the trading dashboard?"

Claude: [Evaluates in ClojureScript - browser REPL]
(require '[com.fulcrologic.fulcro.application :as app])
(require '[com.little-trader.ui.client :as client])

;; Get current normalized app state
(-> client/app app/current-state keys)
;; => (:trading-dashboard :bars :bricks :signals :trades ...)

;; Inspect specific data
(get-in (app/current-state client/app) [:trading-dashboard :open-trade])
;; => nil (or current trade if one is open)
```

#### Session 5: Frontend - Live UI Debugging

```
You: "Log the current bars count to browser console"

Claude: [Evaluates in ClojureScript]
(require '[com.little-trader.ui.state :as state])

(js/console.log "Current bars:" (count (:bars @state/app-state)))
;; Browser console shows: "Current bars: 150"
```

#### Session 6: Full-Stack - Creating a New Resolver

```
You: "Add a resolver that calculates total P&L for an account"

Claude: [Uses MCP to edit and test across both REPLs]

;; 1. Edits src/com/little_trader/components/resolvers.clj (file edit)

;; 2. Tests in Clojure REPL:
(require '[com.little-trader.components.resolvers :as r] :reload)
;; Verify resolver compiles

;; 3. Reloads system:
(user/reset)

;; 4. Tests from ClojureScript (frontend query):
(require '[com.fulcrologic.fulcro.data-fetch :as df])
(df/load! client/app [:account/id #uuid "..."] Account {:target [:ui/account]})
;; Verify data loads correctly
```

### MCP Configuration for Fulcro RAD

For optimal Fulcro development, give Claude these instructions in your chat:

```markdown
## Fulcro RAD Development Context

I'm working on Little Trader, a Fulcro RAD application.

**Key namespaces:**
- `com.little-trader.ui.client` - Main Fulcro app
- `com.little-trader.model.*` - RAD attribute definitions
- `com.little-trader.components.resolvers` - Pathom resolvers
- `com.little-trader.domain.*` - Pure business logic

**Development commands:**
- `(user/go)` - Start system
- `(user/reset)` - Reload and restart
- `(user/stop)` - Stop system

**RAD patterns:**
- Attributes defined with `defattr`
- Forms generated with `form/defsc-form`
- Reports generated with `report/defsc-report`
- Resolvers use Pathom 3

When editing code, always:
1. Make the edit
2. Evaluate in REPL to test
3. Run (reset) if changing defstate or routes
```

### Troubleshooting MCP Connection

| Issue | Solution |
|-------|----------|
| "Connection refused" | Ensure **both** nREPLs are running before starting Claude Desktop |
| "Command not found" | Set full path to `bash` and `clojure` in config |
| "No tools available" | Restart Claude Desktop after config changes |
| "CLJS REPL not connecting" | Ensure browser has the app open at localhost:3000 |
| "ClojureScript eval fails" | Check shadow-cljs compilation succeeded (no errors in terminal) |
| "Only Clojure works" | Verify `:shadow-port` and `:shadow-build` in deps.edn match your setup |

**Debug MCP connection (dual mode):**
```bash
# Test clojure-mcp dual mode manually
clojure -X:mcp-shadow-dual

# Should output something like:
# "Starting MCP server..."
# "Connected to Clojure nREPL on port 7888"
# "Connected to ClojureScript nREPL on port 9000 (build: app)"
```

**Verify shadow-cljs nREPL port:**
```bash
# Check shadow-cljs.edn for nREPL config
cat shadow-cljs.edn | grep -A2 nrepl

# Or check running processes
lsof -i :9000
```

---

## Project Structure

```
little-trader/
├── src/com/little_trader/
│   ├── domain/           # Pure business logic (renko, signals, trades, risk)
│   ├── model/            # Fulcro RAD attributes (*.cljc)
│   ├── components/       # RAD components (database, parser, resolvers)
│   ├── server/           # HTTP server, routes, WebSocket
│   ├── data/             # Datomic schema and database
│   ├── ui/               # ClojureScript frontend (Fulcro)
│   ├── config.clj        # Configuration management
│   └── main.clj          # Application entry point
├── dev/user.clj          # REPL utilities (go, stop, reset)
├── test/                 # Unit and property-based tests
├── resources/public/     # Static assets, compiled JS
├── deps.edn              # Clojure dependencies
├── shadow-cljs.edn       # ClojureScript build config
└── package.json          # NPM dependencies
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Clojure 1.11 / ClojureScript |
| Frontend | Fulcro 3.7 + Fulcro RAD + Semantic UI |
| Backend | Ring + Reitit + HTTP-Kit |
| Database | Datomic (in-memory/file) |
| Charts | TradingView lightweight-charts |
| Build | deps.edn + Shadow-cljs |
| Rules Engine | Clara Rules (forward-chaining) |
| Crypto Auth | BouncyCastle Ed25519 |
| Exchange | Deribit API (crypto derivatives) |

---

## Development Workflow

### REPL-Driven Development

The recommended workflow:

1. Start REPL with `clj -M:dev`
2. Connect editor to nREPL port 7888
3. Run `(go)` to start system
4. Edit code in your editor
5. Evaluate changes directly in REPL
6. Run `(reset)` when you need full reload

### Fulcro RAD Development

RAD auto-generates CRUD forms from attribute definitions:

```clojure
;; Define attributes in src/com/little_trader/model/trade.cljc
(defattr side :trade/side :keyword
  {ao/identities #{:trade/id}
   ao/enumerated-values #{:long :short}})

;; Forms and reports are generated automatically
```

### Running Tests

```bash
# All tests
clj -M:test

# Watch mode
clj -M:test --watch

# Specific namespace
clj -M:test --focus com.little-trader.domain.renko-test
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [CHANGELOG.md](CHANGELOG.md) | Version history and roadmap |
| [CLAUDE.md](CLAUDE.md) | AI-assisted development guide |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and design patterns |
| [FEATURES.md](FEATURES.md) | Feature specifications and requirements |
| [DEVOPS.md](DEVOPS.md) | Infrastructure and deployment |
| [MCP_DEVELOPMENT.md](MCP_DEVELOPMENT.md) | MCP integration for AI-assisted development |
| [CLOUD_MCP_STAGING.md](CLOUD_MCP_STAGING.md) | Cloud staging with Claude Code/Desktop MCP |
| [docs/LLM_STRATEGY_ADVISOR.md](docs/LLM_STRATEGY_ADVISOR.md) | LLM advisor behavior, guardrails, and config |
| [docs/LLM_CONNECTORS_LOCAL_NOJ.md](docs/LLM_CONNECTORS_LOCAL_NOJ.md) | Provider connector contract and Noj/local-model notes |
| [docs/EXCHANGES_AND_FEEDS.md](docs/EXCHANGES_AND_FEEDS.md) | Deribit, MT5, and feed-layer responsibilities |
| [docs/UI_COPILOT_AND_RULES.md](docs/UI_COPILOT_AND_RULES.md) | Copilot UX and rules-builder guide |
| [docs/CLOJURE_REPL_FIRST_CLASS.md](docs/CLOJURE_REPL_FIRST_CLASS.md) | REPL-first product and workflow guide |
| [docs/DEVELOPER_ERGONOMICS.md](docs/DEVELOPER_ERGONOMICS.md) | DX, MCP, cloud/local parity, and CI/CD |
| [docs/EMBEDDED_COURSE_AND_MANUAL.md](docs/EMBEDDED_COURSE_AND_MANUAL.md) | Embedded course and user manual |
| [docs/ARCHITECTURE_VISUAL_GUIDE.md](docs/ARCHITECTURE_VISUAL_GUIDE.md) | Visual architecture walkthrough |
| [docs/NEWS_AND_DATA_CRAWLERS.md](docs/NEWS_AND_DATA_CRAWLERS.md) | News/data crawler model and source policy |
| [docs/PULSAR_PRICE_LAYER.md](docs/PULSAR_PRICE_LAYER.md) | Pulsar-only price storage and projection layer |
| [docs/COURSE_CURRICULUM.md](docs/COURSE_CURRICULUM.md) | Clojure course (52 weeks) |
| [docs/LUPII_MVP_SCOPE.md](docs/LUPII_MVP_SCOPE.md) | Current MVP boundary and deferred items |
| [README_COMPLETE.md](README_COMPLETE.md) | Full documentation index |

---

## Cloud Staging with MCP

Connect Claude Code or Claude Desktop to a live staging environment:

```bash
# Connect to staging nREPL
kubectl -n staging port-forward svc/nrepl 7888:7888 &

# Start Claude Code
claude
```

See [CLOUD_MCP_STAGING.md](CLOUD_MCP_STAGING.md) for full setup instructions.

---

## Docker

### Production

```bash
docker build -t little-trader .
docker run -p 8080:8080 little-trader
```

### Development Container

The dev container runs both Clojure nREPL and shadow-cljs in a single container with all ports exposed for editor and MCP connectivity.

```bash
# Build and start the dev container
docker compose -f docker-compose.yml --profile dev build dev
docker compose -f docker-compose.yml --profile dev up dev

# Ports exposed:
#   7888 - Clojure nREPL (CIDER/Calva/clojure-mcp)
#   9000 - shadow-cljs nREPL
#   3000 - shadow-cljs dev HTTP server
#   8080 - Ring HTTP server (after (go) in REPL)
```

Once the container is running, connect to the REPL and start the app:

```bash
# Connect to the container's nREPL from your editor on port 7888, then:
user=> (go)     ;; Start server on http://localhost:8080
user=> (reset)  ;; Reload code + restart
```

#### Connecting Claude Code / Claude Desktop via MCP

With the dev container running, start the clojure-mcp bridge locally — it connects to the container's nREPL ports:

```bash
clojure -X:mcp-shadow-dual
```

This requires the `:mcp-shadow-dual` alias in your `~/.clojure/deps.edn` (see [Claude Desktop + Clojure MCP](#claude-desktop--clojure-mcp) above). The bridge connects to `localhost:7888` (Clojure) and `localhost:9000` (ClojureScript) which are forwarded from the container.

#### Useful Commands

```bash
docker compose -f docker-compose.yml --profile dev logs -f dev   # Follow app logs
docker compose -f docker-compose.yml --profile dev down          # Stop app stack
docker compose -f docker-compose.yml --profile dev build dev     # Rebuild after Dockerfile changes
docker compose -f docker-compose.fs.yml logs -f                  # Follow market logs
```

### Optional: Long-Lived Market Stack

Run the Pulsar-backed FastStreaming stack independently from the app/REPL stack:

```bash
# Start Pulsar + topic bootstrap + fs-worker
docker compose -f docker-compose.fs.yml up -d --build

# Start app stack with Pulsar features enabled
PULSAR_ENABLED=true docker compose -f docker-compose.yml --profile dev up -d
```

Topic pattern used by the projection service:

- Raw ticks input: `persistent://public/default/prices.raw.ticks`
- Projected output per timeframe: `persistent://public/default/prices.projection.<timeframe>`
  Example: `...projection.1s`, `...projection.1m`, `...projection.5m`

### Cloud Pulsar Stack (GCP VM + Cloud Run)

The cloud infra compose (`docker-compose.infra.yml`) now provisions:

- Pulsar broker (`6650`) for raw + projected price topics
- Datomic transactor (`4334`)
- PostgreSQL (`5432`)

`cloud-run/setup-infra.sh` outputs `PULSAR_SERVICE_URL_STAGING` so you can add it as a GitHub Actions secret.  
Cloud Run deploy workflow enables Pulsar projection automatically when `PULSAR_SERVICE_URL_STAGING` (or production equivalent) is set.

### Deribit Testnet Options Fetch + Simulation

Start Deribit ingestion (testnet) and run options simulation through EQL mutations.

1) Start fetcher:

```clojure
[(start-deribit-testnet-fetcher
  {:options-currencies ["BTC"]
   :max-option-instruments 30
   :option-trades-count 40
   :options-interval-ms 30000})
 [:deribit/fetcher-running? :deribit/testnet? :deribit/message]]
```

2) Check fetch status:

```clojure
[{:deribit-fetcher-status [:deribit/fetcher-running? :deribit/fetcher-stats]}]
```

3) Run options simulation:

```clojure
[(simulate-deribit-options-strategy
  {:underlying-instrument "BTC-PERPETUAL"
   :currency "BTC"
   :resolution "60"
   :days-back 7
   :brick-size 100.0})
 [:simulation/status :simulation/message
  :simulation/underlying :simulation/option-instrument
  :simulation/bar-count :simulation/ticker-count
  :simulation/metrics :simulation/trades]]
```

4) Stop fetcher when done:

```clojure
[(stop-deribit-fetcher {}) [:deribit/fetcher-running? :deribit/message]]
```

5) List predefined options strategy packs:

```clojure
[{:options/strategy-packs
  [:pack/id :pack/name :pack/description :pack/market-style :pack/defaults]}]
```

6) Run a pack backtest:

```clojure
[(simulate-deribit-options-pack
  {:pack-id :renko-swing-weekly
   :underlying-instrument "BTC-PERPETUAL"
   :currency "BTC"
   :resolution "15"
   :days-back 14
   :brick-size 75.0})
 [:pack/id :pack/name
  :simulation/status :simulation/message
  :simulation/metrics :simulation/trades]]
```

7) Evaluate live signal from latest testnet snapshots:

```clojure
[(evaluate-deribit-options-pack-live
  {:pack-id :renko-swing-weekly
   :underlying-instrument "BTC-PERPETUAL"
   :currency "BTC"
   :resolution "15"
   :lookback-hours 24})
 [:pack/id :pack/name
  :live/status :live/message :live/signal
  :live/current-premium]]
```

### Trading Dashboard UI Usage

The dashboard route (`/dashboard`) now includes:

- Pulsar market data controls (symbol/timeframe/limit) using `bars-for-symbol`.
- Pulsar runtime stats (`:pulsar/running?`, `:pulsar/stats`) for projection health.
- Deribit testnet fetcher controls (start/stop/status).
- Strategy pack controls for both backtesting and live signal evaluation.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |
| `DATOMIC_URI` | `datomic:mem://little-trader` | Database connection |
| `LOG_LEVEL` | `info` | Logging level |
| `APP_ENV` | `dev` | Runtime environment label (`dev`, `ci`, `staging`, `production`) |
| `REPL_EVAL_ENABLED` | `false` | Enables `/api/repl/eval` outside production; admin role required |
| `LLM_PROVIDER` | `anthropic` | Provider selector: `anthropic`, `openai`, `local`, `mock` |
| `LLM_MODEL` | `claude-sonnet-4-20250514` | Default model for `/api/chat` |
| `LLM_TEMPERATURE` | `0.2` | Shared sampling temperature for the connector layer |
| `LLM_MAX_TOKENS` | `2048` | Shared max output token budget |
| `LLM_TIMEOUT_MS` | `30000` | HTTP timeout for provider calls |
| `ANTHROPIC_API_KEY` | unset | Enables Anthropic-backed chat responses |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Optional Anthropic-specific model override |
| `OPENAI_API_KEY` | unset | Enables OpenAI-compatible chat responses |
| `OPENAI_MODEL` | `gpt-4.1` | Optional OpenAI-specific model override |
| `OPENAI_API_BASE` | `https://api.openai.com/v1/responses` | Optional OpenAI endpoint override; legacy `/v1/chat/completions` still works |
| `LOCAL_LLM_API_BASE` | `http://127.0.0.1:8081/v1/chat/completions` | Local OpenAI-compatible endpoint, e.g. `llama.cpp` server |
| `LOCAL_LLM_MODEL` | `local-model` | Model name sent to the local backend |
| `LOCAL_LLM_API_KEY` | unset | Optional bearer token for secured local gateways |
| `PULSAR_ENABLED` | `false` | Enable Pulsar price projection service |
| `PULSAR_SERVICE_URL` | `pulsar://localhost:6650` | Pulsar broker URL |
| `PULSAR_TICKS_TOPIC` | `persistent://public/default/prices.raw.ticks` | Raw tick topic consumed by projection service |
| `PULSAR_PROJECTION_TOPIC_PREFIX` | `persistent://public/default/prices.projection` | Prefix for projected OHLC topics |
| `PULSAR_PROJECTION_TIMEFRAMES` | `1s,5s,15s,1m,5m` | Timeframes projected from raw ticks |
| `DERIBIT_ENABLED` | `false` | Auto-start Deribit fetcher on app startup |
| `DERIBIT_TESTNET` | `true` | Run Deribit connector against testnet |
| `DERIBIT_CLIENT_ID` | unset | Deribit API client ID (optional for public data) |
| `DERIBIT_PRIVATE_KEY` | unset | Ed25519 private key PEM (optional for private endpoints) |

---

## CI Smoke

Run local API smoke checks (health + auth + EQL + UI):

```bash
bash ./scripts/ci-api-smoke.sh
```

---

## License

MIT
