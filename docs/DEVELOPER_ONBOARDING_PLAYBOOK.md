# Developer Onboarding Playbook (Top-Down + Feature-Wise)

> Audience: engineers joining Little Trader who need to bootstrap, understand architecture, run operations, and implement features safely.

## 0) First 90 Minutes (Fast Ramp)

### 0.1 Environment bootstrap

```bash
# 1) install JS deps
npm install

# 2) bring up full dev topology
docker compose --profile dev up --build

# 3) attach REPL and boot app in Clojure terminal
clj -M:dev
# in REPL:
(go)
```

Open:
- UI: `http://local.littletrader.dev:3000`
- API: `http://local.littletrader.dev:8080`
- nREPL: `localhost:7888`

### 0.2 Verify "known good" path

```bash
./scripts/local-ci.sh quick
```

This mirrors CI flow (test → docker build → run → smoke).

---

## 1) System Top-Down Map

```mermaid
flowchart TD
    subgraph UX[Client + UI]
      A[Fulcro UI Screens\nDashboard / Strategy Editor / Docs Drawer]
    end

    subgraph API[Application Layer]
      B[Pathom Parser]
      C[Resolvers\nAuth, Strategy, Deribit, Fast Streaming]
      D[EQL Queries / Mutations]
    end

    subgraph CORE[Domain + Services]
      E[Domain Engines\nRenko, Signals, Risk, Options, Rules]
      F[Service Connectors\nDeribit, News Crawler, Pulsar Sources]
      G[Async Pipelines\ncore.async channels]
    end

    subgraph DATA[Persistence + Streams]
      H[Datomic / SQL Models]
      I[Pulsar Topics + Projection Store]
      J[Backfill + Blob Archive + History]
    end

    A --> D
    D --> B
    B --> C
    C --> E
    C --> F
    F --> G
    G --> I
    E --> H
    C --> H
    I --> C
    J --> I
```

### Design intent
- **Fulcro + EQL** keeps frontend data needs explicit.
- **Pathom resolvers** isolate integration and composition logic.
- **Domain layer** holds deterministic trading logic.
- **Pulsar + async pipelines** decouple ingestion from query serving.
- **Datomic** keeps source-of-truth state and queryable history.

---

## 2) Feature-Wise Capability Map

```mermaid
mindmap
  root((Little Trader Features))
    Trading Execution
      Renko bricks
      Signal detection
      Trade lifecycle
      Risk rules
    Options / Deribit
      Options chain ingestion
      Near-expiry strategy
      Options backtest
    Fast Streaming
      Topic bus
      Pulsar projections
      Knowledge graph context
      Archiver / history replay
    Learning + AI
      Embedded docs/course
      LLM connector
      MEL assistant
      Learn Studio
    Platform
      Auth + RBAC
      Docs API/Drawer
      Cloud Run + k8s staging
      Local-CI parity
```

---

## 3) Core Developer Workflow (Understand → Implement → Validate)

```mermaid
flowchart LR
    A[Read feature docs + resolver + domain code] --> B[Run scenario in REPL]
    B --> C[Add/adjust domain function]
    C --> D[Wire resolver + EQL shape]
    D --> E[Update Fulcro UI component query]
    E --> F[Run tests + smoke]
    F --> G[Document behavior + rollback plan]
```

### Practical checklist
1. Start from **use case** and target UI state.
2. Identify EQL query/mutation contract.
3. Find owning resolver namespace.
4. Trace domain call graph from resolver into domain/services.
5. Add tests at the lowest deterministic layer first.
6. Validate end-to-end with smoke or REPL scenario.

---

## 4) Fulcro + Pathom + EQL (Simple-Made-Easy Mental Model)

### 4.1 Fulcro
- UI components declare data requirements (`:query`) and identity (`:ident`).
- Mutations are explicit state transitions.
- Data-driven rendering avoids hidden fetch chains.

### 4.2 EQL
- EQL is a **shape request language**: frontend asks for exact graph shape.
- Queries are compositional and nest naturally with UI trees.

### 4.3 Pathom resolvers
- Resolver = unit that can produce attributes from inputs.
- Parser composes multiple resolvers to satisfy an EQL graph.
- Keep resolvers thin; move business math/decisions to domain namespaces.

```mermaid
sequenceDiagram
    participant UI as Fulcro Component
    participant P as Pathom Parser
    participant R1 as Resolver A
    participant R2 as Resolver B
    participant D as Domain Service
    participant DB as Datomic

    UI->>P: EQL query/mutation
    P->>R1: Need attr set A
    R1->>DB: fetch entities
    DB-->>R1: records
    P->>R2: Need attr set B (depends on A)
    R2->>D: compute strategy/risk
    D-->>R2: computed attrs
    R1-->>P: partial graph
    R2-->>P: partial graph
    P-->>UI: merged normalized response
```

---

## 5) Async Pipelines (core.async + Stream-first Ops)

Use channels for non-blocking, stage-oriented flow where latency and burst handling matter.

```mermaid
flowchart LR
    M[Market/Event Input] --> C1[ch-ingest]
    C1 --> N[Normalize + Validate]
    N --> C2[ch-enriched]
    C2 --> S[Signal/Projection Workers]
    S --> C3[ch-output]
    C3 --> P[Pulsar topic + materialized cache]
    P --> Q[Pathom resolvers/UI queries]
```

### Channel patterns to keep
- Small, composable transforms per stage.
- Explicit close/error semantics.
- Bounded buffering at burst boundaries.
- Deterministic test harness around stage functions.

---

## 6) Datomic in this system

### Why Datomic here
- Immutable facts + history for auditability.
- Temporal queries for strategy retrospectives.
- Rich pull-based reads for graph-shaped API responses.

### Operating model
- Write canonical domain events / entities.
- Read through resolvers with pull patterns.
- Keep projection/read-model workloads offloaded when high-frequency (Pulsar/materialized caches).

```mermaid
flowchart TD
    A[Domain decision] --> B[Tx data map]
    B --> C[Datomic transactor]
    C --> D[(Immutable log)]
    D --> E[Current db value]
    E --> F[Pathom pull queries]
    D --> G[Historical analysis / replay]
```

---

## 7) Dev/Ops: Day-2 Playbook

### 7.1 Build/test/deploy lanes

```mermaid
flowchart TB
    Dev[Local code + REPL] --> LCI[./scripts/local-ci.sh]
    LCI --> GH[GitHub CI pipeline]
    GH --> CR[Cloud Run / k8s staging]
    CR --> Obs[Health checks + smoke + logs]
    Obs --> Dev
```

### 7.2 Required operational habits
- Always run local CI mirror before pushing.
- Treat smoke tests as release gate.
- Keep staging parity with local container topology.
- Add runbook notes when introducing new external dependencies (exchange, LLM provider, queue).

### 7.3 Incident-first diagnostics flow

```mermaid
flowchart LR
    A[Alert: API/UI drift] --> B{Scope?}
    B -->|Data stale| C[Check Pulsar lag + worker health]
    B -->|Bad response shape| D[Inspect resolver chain + EQL request]
    B -->|Trade anomaly| E[Trace domain decisions + risk guards]
    C --> F[Replay/backfill if needed]
    D --> G[Patch resolver contract]
    E --> H[Hotfix + tests + rollback note]
```

---

## 8) New Feature Implementation Template

### 8.1 Contract-first skeleton
1. Define user story and acceptance criteria.
2. Define EQL contract (query/mutation shape).
3. Implement/extend resolver(s).
4. Implement domain function(s).
5. Add persistence/stream touchpoints.
6. Wire Fulcro components.
7. Add tests (domain + resolver + e2e/smoke).
8. Update docs tab docs + runbook.

### 8.2 Ready-to-fill spec card

```md
Feature:
User outcome:
Input signals/data:
EQL contract:
Resolvers touched:
Domain modules touched:
Persistence impact (Datomic/Pulsar):
Failure modes:
Metrics/logging:
Rollout plan:
Rollback plan:
```

---

## 9) Learning Path for New Engineers

```mermaid
graph TD
    A[Day 1: Run app + REPL] --> B[Day 2: Read feature + resolver paths]
    B --> C[Day 3: Ship doc-only or UI-safe change]
    C --> D[Day 4: Ship resolver+domain change]
    D --> E[Day 5: Handle incident simulation]
    E --> F[Week 2: Own one feature vertical end-to-end]
```

Recommended reading sequence:
1. `README.md`
2. `FEATURES.md`
3. `docs/ARCHITECTURE_VISUAL_GUIDE.md`
4. `docs/SRE_OPERATIONS.md`
5. `docs/CLOJURE_REPL_FIRST_CLASS.md`
6. `docs/PULSAR_PRICE_LAYER.md`
7. `docs/EQL_ONLY_MIGRATION.md`

---

## 10) Glossary (for onboarding speed)
- **Fulcro**: Clojure(Script) app model for normalized client state + declarative data queries.
- **Pathom**: Graph parser that composes resolvers to fulfill EQL.
- **EQL**: Data graph query language used by Fulcro/Pathom.
- **Resolver**: Function that provides attributes based on available inputs.
- **core.async channel**: Queue-like primitive for asynchronous data flow.
- **Datomic**: Immutable, temporal database with pull-based graph querying.
- **Projection**: Derived read model for low-latency consumption.

---

## 11) What "Good" Looks Like for Contributions
- Small, reversible commits.
- Clear EQL contract and resolver ownership.
- Domain behavior proven with tests.
- Operational notes updated with rollout/rollback.
- Docs updated with at least one flow diagram when architecture changes.
